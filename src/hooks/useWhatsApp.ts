
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useWhatsApp = () => {
  const [isSending, setIsSending] = useState(false);

  const sendWhatsAppInvitation = async (
    phoneNumber: string,
    inviterName: string,
    role: string,
    staffId?: string,
    pinCode?: string
  ) => {
    setIsSending(true);
    try {
      const message = `🎉 You've been invited to join Tangkhul AI Translation Platform!

👋 Hi! ${inviterName} has invited you to contribute to our AI translation project as a ${role}.

🆔 Staff ID: ${staffId || 'Will be provided'}
🔐 Temporary Password (4-digit): ${pinCode || '[PIN]'}

🌐 To get started:
1. Visit our platform
2. Click "Sign Up"
3. Enter your Email + Staff ID
4. Use the 4-digit password above
5. After signup, you can login with Staff ID OR Email + this password

Thank you for helping preserve and digitize the Tangkhul language! 🙏

Best regards,
Tangkhul AI Team`;

      // Log WhatsApp message (in production, this would integrate with WhatsApp API)
      const { error } = await supabase
        .from('whatsapp_logs')
        .insert({
          recipient_phone: phoneNumber,
          message_text: message,
          status: 'sent'
        });

      if (error) throw error;

      // Simulate sending (in production, integrate with WhatsApp Business API)
      console.log('WhatsApp invitation sent:', { phoneNumber, message });
      
      return { success: true, message: 'Invitation sent successfully' };
    } catch (error: any) {
      console.error('WhatsApp invitation error:', error);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const sendApprovalNotification = async (
    phoneNumber: string,
    userName: string,
    approved: boolean
  ) => {
    setIsSending(true);
    try {
      const message = approved
        ? `✅ Great news ${userName}! Your Tangkhul AI account has been approved!

You can now access all platform features:
🔤 Translate text
📚 Contribute training data
📊 View accuracy metrics

Welcome to the team! 🎉`
        : `❌ Hi ${userName}, unfortunately your Tangkhul AI account application was not approved at this time.

Please contact your administrator for more information.

Thank you for your interest in our project.`;

      const { error } = await supabase
        .from('whatsapp_logs')
        .insert({
          recipient_phone: phoneNumber,
          message_text: message,
          status: 'sent'
        });

      if (error) throw error;

      console.log('WhatsApp approval notification sent:', { phoneNumber, approved });
      
      return { success: true };
    } catch (error: any) {
      console.error('WhatsApp approval notification error:', error);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendWhatsAppInvitation,
    sendApprovalNotification,
    isSending
  };
};
