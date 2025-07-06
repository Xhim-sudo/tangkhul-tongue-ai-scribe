
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useWhatsApp = () => {
  const [isSending, setIsSending] = useState(false);

  const sendWhatsAppInvitation = async (phoneNumber: string, inviterName: string, role: string) => {
    setIsSending(true);
    try {
      const message = `Hello! You've been invited by ${inviterName} to join our Tangkhul AI Training Platform as a ${role}. This is an important project to preserve and digitize our language. Please visit our platform to get started and help us reach 99% accuracy for our AI model. Your contributions matter!`;

      // Log the WhatsApp message
      const { error } = await (supabase as any)
        .from('whatsapp_logs')
        .insert({
          recipient_phone: phoneNumber,
          message_type: 'invitation',
          message_content: message,
          status: 'sent'
        });

      if (error) throw error;

      // In production, you would integrate with WhatsApp Business API or Twilio
      // For now, we'll simulate the message sending
      console.log(`WhatsApp invitation sent to ${phoneNumber}: ${message}`);

      toast({
        title: "Invitation sent via WhatsApp",
        description: `Message sent to ${phoneNumber}`,
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Failed to send WhatsApp invitation",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const sendApprovalNotification = async (phoneNumber: string, userName: string, approved: boolean) => {
    const status = approved ? 'approved' : 'rejected';
    const message = approved 
      ? `Great news ${userName}! Your account has been approved. You can now start contributing to the Tangkhul AI Training Platform. Let's work together to reach 99% accuracy!`
      : `Hello ${userName}, unfortunately your account application was not approved at this time. Please contact the administrator if you have questions.`;

    try {
      await (supabase as any)
        .from('whatsapp_logs')
        .insert({
          recipient_phone: phoneNumber,
          message_type: 'approval',
          message_content: message,
          status: 'sent'
        });

      console.log(`WhatsApp ${status} notification sent to ${phoneNumber}`);
    } catch (error) {
      console.error('Failed to log WhatsApp notification:', error);
    }
  };

  return {
    sendWhatsAppInvitation,
    sendApprovalNotification,
    isSending
  };
};
