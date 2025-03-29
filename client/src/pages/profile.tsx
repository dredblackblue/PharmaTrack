import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface TwoFactorStatus {
  enabled: boolean;
  verified: boolean;
}

interface TwoFactorSetupResponse {
  secret: string;
  url: string;
}

interface NotificationPreferences {
  lowStock: boolean;
  expiringMedicines: boolean;
  orderUpdates: boolean;
  prescriptionCreated: boolean;
  dailyReports: boolean;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [generatedEmailCode, setGeneratedEmailCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  
  // Fetch 2FA status
  const { 
    data: twoFactorStatus,
    isLoading: isLoadingStatus
  } = useQuery<TwoFactorStatus>({
    queryKey: ['/api/2fa/status'],
    enabled: !!user,
  });
  
  // Fetch notification preferences
  const { 
    data: notificationPreferences,
    isLoading: isLoadingPreferences
  } = useQuery<NotificationPreferences>({
    queryKey: ['/api/notifications/preferences'],
    enabled: !!user,
  });
  
  // Setup 2FA mutation
  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/2fa/enable');
      return await res.json() as TwoFactorSetupResponse;
    },
    onSuccess: () => {
      toast({
        title: "Two-factor authentication enabled",
        description: "Please verify with the code from your authenticator app",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/2fa/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to enable two-factor authentication",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Verify 2FA code mutation
  const verify2FAMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiRequest('POST', '/api/2fa/verify', { token });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Two-factor authentication verified",
        description: "Your account is now secured with 2FA",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/2fa/status'] });
      setTotpCode("");
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Disable 2FA mutation
  const disable2FAMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/2fa/disable');
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Two-factor authentication disabled",
        description: "Your account is no longer using 2FA",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/2fa/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to disable two-factor authentication",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Send email verification code mutation
  const sendEmailCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/2fa/email/send-code');
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Verification code sent",
        description: "Please check your email for the verification code",
      });
      // In a real application, the server wouldn't return the code
      // This is just for demonstration purposes
      setGeneratedEmailCode(data.code);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send verification code",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Verify email code mutation
  const verifyEmailCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest('POST', '/api/2fa/email/verify', { 
        code, 
        expectedCode: generatedEmailCode 
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email verified",
        description: "Your email has been successfully verified",
      });
      setEmailVerificationCode("");
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update notification preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: NotificationPreferences) => {
      const res = await apiRequest('POST', '/api/notifications/preferences', preferences);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/preferences'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update preferences",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Toggle notification preference
  const togglePreference = (key: keyof NotificationPreferences) => {
    if (!notificationPreferences) return;
    
    const updatedPreferences = {
      ...notificationPreferences,
      [key]: !notificationPreferences[key],
    };
    
    updatePreferencesMutation.mutate(updatedPreferences);
  };
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-4">Please log in to access this page</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View and manage your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={user.username} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={user.fullName} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={user.role} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingStatus ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-md font-medium">Authenticator App</h3>
                      <p className="text-sm text-muted-foreground">
                        Use an authenticator app to generate verification codes
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {twoFactorStatus?.enabled ? (
                        <div className="flex items-center">
                          {twoFactorStatus.verified ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                          )}
                          <span className="text-sm font-medium">
                            {twoFactorStatus.verified ? 'Enabled & Verified' : 'Enabled (Not Verified)'}
                          </span>
                        </div>
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground mr-2" />
                      )}
                      
                      {twoFactorStatus?.enabled ? (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => disable2FAMutation.mutate()}
                          disabled={disable2FAMutation.isPending}
                        >
                          {disable2FAMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Disable
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => setup2FAMutation.mutate()} 
                          disabled={setup2FAMutation.isPending}
                        >
                          {setup2FAMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Enable
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {setup2FAMutation.data && (
                    <div className="rounded-md border p-4 mt-4">
                      <h4 className="text-sm font-medium mb-2">Setup Instructions</h4>
                      <ol className="text-sm space-y-2 mb-4">
                        <li>1. Scan the QR code with your authenticator app</li>
                        <li>2. Enter the verification code from the app below</li>
                      </ol>
                      <div className="flex justify-center mb-4">
                        <img 
                          src={setup2FAMutation.data.url} 
                          alt="QR Code" 
                          className="h-48 w-48" 
                        />
                      </div>
                      <div className="text-xs text-center mb-4">
                        <p className="font-medium mb-1">Manual Entry Code:</p>
                        <code className="bg-muted rounded px-2 py-1">{setup2FAMutation.data.secret}</code>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit code"
                          value={totpCode}
                          onChange={(e) => setTotpCode(e.target.value)}
                        />
                        <Button 
                          onClick={() => verify2FAMutation.mutate(totpCode)}
                          disabled={verify2FAMutation.isPending || totpCode.length !== 6}
                        >
                          {verify2FAMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Verify
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <h3 className="text-md font-medium">Email Verification</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive a one-time verification code to your email
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => sendEmailCodeMutation.mutate()}
                      disabled={sendEmailCodeMutation.isPending}
                    >
                      {sendEmailCodeMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Send Code
                    </Button>
                  </div>
                  
                  {generatedEmailCode && (
                    <div className="flex space-x-2 pt-2">
                      <Input
                        type="text"
                        maxLength={6}
                        placeholder="Enter email verification code"
                        value={emailVerificationCode}
                        onChange={(e) => setEmailVerificationCode(e.target.value)}
                      />
                      <Button 
                        onClick={() => verifyEmailCodeMutation.mutate(emailVerificationCode)}
                        disabled={verifyEmailCodeMutation.isPending || emailVerificationCode.length !== 6}
                      >
                        {verifyEmailCodeMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Verify
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage what notifications you receive from the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingPreferences ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : notificationPreferences ? (
                <>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h3 className="text-sm font-medium">Low Stock Alerts</h3>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications when medicines are running low
                      </p>
                    </div>
                    <Switch 
                      checked={notificationPreferences.lowStock}
                      onCheckedChange={() => togglePreference('lowStock')}
                      disabled={updatePreferencesMutation.isPending}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h3 className="text-sm font-medium">Expiring Medicines</h3>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications for medicines nearing expiry date
                      </p>
                    </div>
                    <Switch 
                      checked={notificationPreferences.expiringMedicines}
                      onCheckedChange={() => togglePreference('expiringMedicines')}
                      disabled={updatePreferencesMutation.isPending}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h3 className="text-sm font-medium">Order Updates</h3>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications when order status changes
                      </p>
                    </div>
                    <Switch 
                      checked={notificationPreferences.orderUpdates}
                      onCheckedChange={() => togglePreference('orderUpdates')}
                      disabled={updatePreferencesMutation.isPending}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h3 className="text-sm font-medium">New Prescriptions</h3>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications when new prescriptions are created
                      </p>
                    </div>
                    <Switch 
                      checked={notificationPreferences.prescriptionCreated}
                      onCheckedChange={() => togglePreference('prescriptionCreated')}
                      disabled={updatePreferencesMutation.isPending}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h3 className="text-sm font-medium">Daily Reports</h3>
                      <p className="text-xs text-muted-foreground">
                        Receive daily summary reports
                      </p>
                    </div>
                    <Switch 
                      checked={notificationPreferences.dailyReports}
                      onCheckedChange={() => togglePreference('dailyReports')}
                      disabled={updatePreferencesMutation.isPending}
                    />
                  </div>
                </>
              ) : (
                <p>Failed to load notification preferences</p>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                All notifications will be sent to your registered email address: {user.email}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}