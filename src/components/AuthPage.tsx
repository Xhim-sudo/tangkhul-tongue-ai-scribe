
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Languages, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useError } from '@/contexts/ErrorContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const { logError } = useError();
  const [activeTab, setActiveTab] = useState('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Sign In Form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // Sign Up Form
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Validation states
  const [staffIdValidation, setStaffIdValidation] = useState<{
    isValid: boolean;
    isChecking: boolean;
    message: string;
  }>({ isValid: false, isChecking: false, message: '' });

  const validateStaffId = async (id: string) => {
    if (!id.trim()) {
      setStaffIdValidation({ isValid: false, isChecking: false, message: '' });
      return;
    }

    setStaffIdValidation({ isValid: false, isChecking: true, message: 'Checking staff ID...' });

    try {
      // Check if staff ID exists in invitations table
      const { data: invitation, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('staff_id', id.toUpperCase())
        .eq('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;

      if (invitation) {
        setStaffIdValidation({
          isValid: true,
          isChecking: false,
          message: 'Valid staff ID found!'
        });
        // Auto-fill email if it matches the invitation
        if (invitation.email && !signUpEmail) {
          setSignUpEmail(invitation.email);
        }
      } else {
        setStaffIdValidation({
          isValid: false,
          isChecking: false,
          message: 'Invalid or expired staff ID. Please contact your administrator.'
        });
      }
    } catch (error: any) {
      logError(error, 'AuthPage.validateStaffId');
      setStaffIdValidation({
        isValid: false,
        isChecking: false,
        message: 'Error validating staff ID. Please try again.'
      });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(signInEmail, signInPassword);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error: any) {
      logError(error, 'AuthPage.handleSignIn');
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!staffIdValidation.isValid) {
      toast({
        title: "Invalid Staff ID",
        description: "Please enter a valid staff ID to continue.",
        variant: "destructive",
      });
      return;
    }

    if (signUpPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    if (signUpPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Sign up the user
      await signUp(signUpEmail, signUpPassword, {
        full_name: fullName,
        phone_number: phoneNumber,
        staff_id: staffId.toUpperCase()
      });

      // Mark the invitation as used
      await supabase
        .from('invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('staff_id', staffId.toUpperCase());

      toast({
        title: "Account created successfully!",
        description: "Welcome to Tangkhul AI Translation Platform.",
      });
    } catch (error: any) {
      logError(error, 'AuthPage.handleSignUp');
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Languages className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tangkhul AI</h1>
          <p className="text-gray-600">Translation Platform</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2 bg-orange-50">
                <TabsTrigger value="signin" className="data-[state=active]:bg-white">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="border-orange-200 focus:border-orange-400"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="border-orange-200 focus:border-orange-400 pr-10"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-id">Staff ID *</Label>
                    <div className="relative">
                      <Input
                        id="staff-id"
                        type="text"
                        placeholder="Enter your staff ID"
                        value={staffId}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          setStaffId(value);
                          if (value) {
                            validateStaffId(value);
                          } else {
                            setStaffIdValidation({ isValid: false, isChecking: false, message: '' });
                          }
                        }}
                        className={`border-orange-200 focus:border-orange-400 pr-10 ${
                          staffIdValidation.isValid ? 'border-green-300' :
                          staffIdValidation.message && !staffIdValidation.isValid ? 'border-red-300' : ''
                        }`}
                        required
                        disabled={isLoading}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {staffIdValidation.isChecking ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                        ) : staffIdValidation.isValid ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : staffIdValidation.message ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : null}
                      </div>
                    </div>
                    {staffIdValidation.message && (
                      <Alert className={staffIdValidation.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                        <AlertDescription className={staffIdValidation.isValid ? "text-green-700" : "text-red-700"}>
                          {staffIdValidation.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name *</Label>
                    <Input
                      id="full-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="border-orange-200 focus:border-orange-400"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="border-orange-200 focus:border-orange-400"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone-number">Phone Number</Label>
                    <Input
                      id="phone-number"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="border-orange-200 focus:border-orange-400"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="border-orange-200 focus:border-orange-400 pr-10"
                        required
                        minLength={6}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="border-orange-200 focus:border-orange-400 pr-10"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    disabled={isLoading || !staffIdValidation.isValid}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-6">
          Need help? Contact your administrator for a staff ID.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
