import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Mail, Shield, Award, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnhancedUserManagement from './EnhancedUserManagement';
import ManagementPortal from './ManagementPortal';
import AccuracyDashboard from './AccuracyDashboard';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'expert' | 'contributor' | 'reviewer';
  contributions: number;
  accuracy: number;
  joinDate: Date;
  status: 'active' | 'pending' | 'inactive';
}

const UserManagement = () => {
  const { hasRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("contributor");

  const [users] = useState<User[]>([
    {
      id: "1",
      name: "Dr. Sarah Tangkhul",
      email: "sarah.tangkhul@email.com",
      role: "expert",
      contributions: 234,
      accuracy: 96,
      joinDate: new Date("2024-01-15"),
      status: "active"
    },
    {
      id: "2",
      name: "Community Elder John",
      email: "john.elder@email.com",
      role: "expert",
      contributions: 189,
      accuracy: 94,
      joinDate: new Date("2024-02-01"),
      status: "active"
    },
    {
      id: "3",
      name: "Language Teacher Mary",
      email: "mary.teacher@email.com",
      role: "reviewer",
      contributions: 156,
      accuracy: 92,
      joinDate: new Date("2024-02-15"),
      status: "active"
    },
    {
      id: "4",
      name: "Student Volunteer Alex",
      email: "alex.student@email.com",
      role: "contributor",
      contributions: 134,
      accuracy: 89,
      joinDate: new Date("2024-03-01"),
      status: "active"
    },
    {
      id: "5",
      name: "Researcher David",
      email: "david.research@email.com",
      role: "contributor",
      contributions: 112,
      accuracy: 91,
      joinDate: new Date("2024-03-10"),
      status: "pending"
    }
  ]);

  const handleInviteUser = () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address to send invitation.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Invitation sent",
      description: `Invitation sent to ${inviteEmail} as ${inviteRole}.`,
    });

    setInviteEmail("");
    setInviteRole("contributor");
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'expert': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'reviewer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contributor': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-orange-800 mb-2">AI Training Platform Management</h1>
        <p className="text-gray-600">Advanced contributor management and accuracy tracking system</p>
      </div>

      <Tabs defaultValue="contributors" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/50 border border-orange-200">
          <TabsTrigger value="contributors" className="data-[state=active]:bg-orange-100">
            Contributors
          </TabsTrigger>
          <TabsTrigger value="accuracy" className="data-[state=active]:bg-orange-100">
            Accuracy Dashboard
          </TabsTrigger>
          {hasRole('admin') && (
            <TabsTrigger value="management" className="data-[state=active]:bg-orange-100">
              Management Portal
            </TabsTrigger>
          )}
          <TabsTrigger value="legacy" className="data-[state=active]:bg-orange-100">
            Legacy View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contributors" className="mt-6">
          <EnhancedUserManagement />
        </TabsContent>

        <TabsContent value="accuracy" className="mt-6">
          <AccuracyDashboard />
        </TabsContent>

        {hasRole('admin') && (
          <TabsContent value="management" className="mt-6">
            <ManagementPortal />
          </TabsContent>
        )}

        <TabsContent value="legacy" className="mt-6">
          <div className="space-y-6">
            {/* Invite New User */}
            <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <UserPlus className="w-5 h-5" />
                  Invite New Contributor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="w-40 border-orange-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contributor">Contributor</SelectItem>
                      <SelectItem value="reviewer">Reviewer</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleInviteUser}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invite
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* User Management */}
            <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Users className="w-5 h-5" />
                  Manage Contributors ({users.length} total)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-40 border-orange-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                      <SelectItem value="reviewer">Reviewer</SelectItem>
                      <SelectItem value="contributor">Contributor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* User List */}
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="border border-orange-200 rounded-lg p-4 bg-white/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <h3 className="font-medium">{user.name}</h3>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge className={getRoleColor(user.role)}>
                              <Shield className="w-3 h-3 mr-1" />
                              {user.role}
                            </Badge>
                            <Badge className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                            <Badge variant="outline" className="border-green-200 text-green-700">
                              <Award className="w-3 h-3 mr-1" />
                              {user.accuracy}% accuracy
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Contributions:</span>
                              <span className="ml-2 font-medium">{user.contributions}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Joined:</span>
                              <span className="ml-2 font-medium">{user.joinDate.toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Last Active:</span>
                              <span className="ml-2 font-medium">2 hours ago</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Status:</span>
                              <span className="ml-2 font-medium capitalize">{user.status}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="border-orange-200 hover:bg-orange-50">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="border-blue-200 hover:bg-blue-50">
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Role Permissions */}
            <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
              <CardHeader>
                <CardTitle className="text-orange-800">Role Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      role: "Admin",
                      color: "red",
                      permissions: ["Full system access", "User management", "Export data", "System settings"]
                    },
                    {
                      role: "Expert",
                      color: "purple", 
                      permissions: ["Add entries", "Verify translations", "Review submissions", "Mentor contributors"]
                    },
                    {
                      role: "Reviewer",
                      color: "blue",
                      permissions: ["Review entries", "Approve translations", "Quality control", "Provide feedback"]
                    },
                    {
                      role: "Contributor",
                      color: "green",
                      permissions: ["Add entries", "Submit translations", "Edit own entries", "View progress"]
                    }
                  ].map((roleInfo) => (
                    <div key={roleInfo.role} className="border border-orange-200 rounded-lg p-4 bg-white/30">
                      <Badge className={`mb-3 ${getRoleColor(roleInfo.role.toLowerCase())}`}>
                        {roleInfo.role}
                      </Badge>
                      <ul className="space-y-1 text-sm">
                        {roleInfo.permissions.map((permission, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            {permission}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
