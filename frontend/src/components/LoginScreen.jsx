import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { Target, Smartphone, Shield, Bell } from 'lucide-react';

const LoginScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [supportsWebAuthn, setSupportsWebAuthn] = useState(false);
  const { loginWithGoogle, registerWebAuthn } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if WebAuthn is supported
    setSupportsWebAuthn(
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential === 'function'
    );
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      // Initialize Google OAuth (mock implementation)
      // In a real app, you'd use the Google Sign-In SDK
      const mockGoogleToken = 'mock-google-token-for-demo';
      
      // For demo purposes, we'll skip the actual Google OAuth
      // and directly call our backend with mock data
      toast({
        title: "Demo Mode",
        description: "Google OAuth integration would be implemented here. Proceeding with demo login.",
      });
      
      // Mock successful login for demo
      setTimeout(() => {
        setIsLoading(false);
        toast({
          title: "Login Successful!",
          description: "Welcome to Habit Tracker",
        });
      }, 2000);
      
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleWebAuthnSetup = async () => {
    if (!supportsWebAuthn) {
      toast({
        title: "Not Supported",
        description: "Biometric authentication is not supported on this device",
        variant: "destructive",
      });
      return;
    }

    try {
      // Mock WebAuthn setup for demo
      toast({
        title: "Biometric Setup",
        description: "WebAuthn biometric authentication would be set up here",
      });
    } catch (error) {
      console.error('WebAuthn setup failed:', error);
      toast({
        title: "Setup Failed",
        description: "Could not set up biometric authentication",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
              <Target className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Habit Tracker
          </h1>
          <p className="text-muted-foreground">
            Build better habits, one day at a time
          </p>
        </div>

        {/* Features Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-center">Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Smart Tracking</p>
                <p className="text-sm text-muted-foreground">Daily checkboxes with streak tracking</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <Smartphone className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">Mobile Optimized</p>
                <p className="text-sm text-muted-foreground">Perfect for on-the-go tracking</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">Secure Login</p>
                <p className="text-sm text-muted-foreground">Google OAuth + biometric auth</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                <Bell className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-medium">Smart Reminders</p>
                <p className="text-sm text-muted-foreground">Custom notification scheduling</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Get Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </div>
              )}
            </Button>

            {supportsWebAuthn && (
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-muted-foreground/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>
                
                <Button
                  onClick={handleWebAuthnSetup}
                  variant="outline"
                  className="w-full"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Setup Biometric Login
                  <Badge variant="secondary" className="ml-2">Beta</Badge>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <p className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
          Your data is securely stored and never shared.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;