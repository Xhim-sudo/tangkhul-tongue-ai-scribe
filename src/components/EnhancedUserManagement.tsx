
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Phone, Download, MessageCircle, TrendingUp, Copy, CheckCircle } from "lucide-react";
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { useDataExport } from '@/hooks/useDataExport';
import { useAuth } from '@/contexts/AuthContext';
import { useError } from '@/contexts/ErrorContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['app_role'];

const EnhancedUserManagement = () => {
  const { userProfile } = useAuth();
  const { sendWhatsAppInvitation, isSending } = useWhatsApp();
  const { exportIndividualData, isExporting } = useDataExport();
  const { logError } = useError();
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("contributor");
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedStaffId, setCopiedStaffId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          accuracy_metrics(accuracy_percentage, total_contributions, golden_data_count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      logError(error, 'EnhancedUserManagement.loadUsers');
    }
  };

  const handleWhatsAppInvite = async () => {
    if (!invitePhone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter a phone number to send WhatsApp invitation.",
        variant: "destructive",
      });
      return;
    }

    if (!inviteEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address for the invitation.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create invitation record with auto-generated staff ID
      const { data: invitationData, error } = await supabase
        .from('invitations')
        .insert({
          email: inviteEmail,
          phone_number: invitePhone,
          role: inviteRole,
          invited_by: userProfile?.id,
          token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (error) throw error;

      // Send WhatsApp invitation with staff ID
      await sendWhatsAppInvitation(
        invitePhone,
        userProfile?.full_name || 'Admin',
        inviteRole,
        invitationData.staff_id // Pass the generated staff ID
      );

      toast({
        title: "Invitation sent successfully",
        description: `WhatsApp invitation sent to ${invitePhone} with Staff ID: ${invitationData.staff_id}`,
      });

      setInvitePhone("");
      setInviteEmail("");
      setInviteRole("contributor");
    } catch (error: any) {
      logError(error, 'EnhancedUserManagement.handleWhatsAppInvite');
      toast({
        title: "Invitation failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExportUserData = async (userId: string, userName: string) => {
    try {
      await exportIndividualData(userId, 'json');
      toast({
        title: "Export initiated",
        description: `${userName}'s data is being exported`,
      });
    } catch (error: any) {
      logError(error, 'EnhancedUserManagement.handleExportUserData');
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyStaffId = async (staffId: string) => {
    try {
      await navigator.clipboard.writeText(staffId);
      setCopiedStaffId(staffId);
      toast({
        title: "Staff ID copied",
        description: `Staff ID ${staffId} copied to clipboard`,
      });
      setTimeout(() => setCopiedStaffId(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy staff ID to clipboard",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.staff_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Invite Section */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <UserPlus className="w-5 h-5" />
            Invite New Contributor via WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="border-orange-200 focus:border-orange-400"
              type="email"
            />
            <Input
              placeholder="Enter phone number (e.g., +1234567890)"
              value={invitePhone}
              onChange={(e) => setInvitePhone(e.target.value)}
              className="border-orange-200 focus:border-orange-400"
            />
            <Select value={inviteRole} onValueChange={(value: UserRole) => setInviteRole(value)}>
              <SelectTrigger className="border-orange-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contributor">Contributor</SelectItem>
                <SelectItem value="reviewer">Reviewer</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleWhatsAppInvite}
              disabled={isSending}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Phone className="w-4 h-4 mr-2" />
              {isSending ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            A unique Staff ID will be automatically generated and sent with the invitation.
          </p>
        </CardContent>
      </Card>

      {/* Enhanced User Management */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Users className="w-5 h-5" />
            Contributors & Performance ({filteredUsers.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search contributors by name, email, or staff ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-orange-200 focus:border-orange-400"
          />

          {/* User List with Enhanced Metrics */}
          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const metrics = user.accuracy_metrics?.[0];
              return (
                <div key={user.id} className="border border-orange-200 rounded-lg p-4 bg-white/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold">
                          {user.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                        </div>
                        <div>
                          <h3 className="font-medium">{user.full_name || 'Unknown User'}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {user.phone_number && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Phone className="w-3 h-3" />
                                {user.phone_number}
                              </div>
                            )}
                            {user.staff_id && (
                              <button
                                onClick={() => copyStaffId(user.staff_id)}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                title="Click to copy Staff ID"
                              >
                                {copiedStaffId === user.staff_id ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                ID: {user.staff_id}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          {user.role}
                        </Badge>
                        {metrics && (
                          <>
                            <Badge className={
                              metrics.accuracy_percentage >= 95 ? "bg-green-100 text-green-800 border-green-200" :
                              metrics.accuracy_percentage >= 90 ? "bg-blue-100 text-blue-800 border-blue-200" :
                              "bg-yellow-100 text-yellow-800 border-yellow-200"
                            }>
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {metrics.accuracy_percentage}% accuracy
                            </Badge>
                            <Badge variant="outline" className="border-orange-200 text-orange-700">
                              {metrics.total_contributions} contributions
                            </Badge>
                            <Badge variant="outline" className="border-green-200 text-green-700">
                              {metrics.golden_data_count} golden entries
                            </Badge>
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Joined:</span>
                          <span className="ml-2 font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Contributions:</span>
                          <span className="ml-2 font-medium">{metrics?.total_contributions || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Accuracy:</span>
                          <span className="ml-2 font-medium">{metrics?.accuracy_percentage || 0}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Golden Data:</span>
                          <span className="ml-2 font-medium">{metrics?.golden_data_count || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Staff ID:</span>
                          <span className="ml-2 font-medium">{user.staff_id || 'Not assigned'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-orange-200 hover:bg-orange-50"
                        onClick={() => handleExportUserData(user.id, user.full_name)}
                        disabled={isExporting}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Export Data
                      </Button>
                      {user.phone_number && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-green-200 hover:bg-green-50"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedUserManagement;
