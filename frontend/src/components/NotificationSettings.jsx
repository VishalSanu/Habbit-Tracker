import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';
import { Bell, BellOff, Smartphone, AlertCircle } from 'lucide-react';

const NotificationSettings = ({ open, onOpenChange }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState('default');

  const { toast } = useToast();
  const { subscribeToNotifications } = useAuth();

  useEffect(() => {
    checkNotificationStatus();
  }, [open]);

  const checkNotificationStatus = () => {
    // Check browser notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Check if already subscribed to push notifications
    setIsSubscribed(notificationService.getSubscriptionStatus());
    setNotificationsEnabled(notificationService.getSubscriptionStatus());
  };

  const handleEnableNotifications = async () => {
    if (!notificationsEnabled) {
      try {
        setLoading(true);

        // Request permission first
        const hasPermission = await notificationService.requestPermission();
        if (!hasPermission) {
          toast({
            title: "Permission Denied",
            description: "Please enable notifications in your browser settings.",
            variant: "destructive",
          });
          return;
        }

        // Subscribe to push notifications
        const subscription = await notificationService.subscribe();
        
        // Send subscription to backend
        const result = await subscribeToNotifications(subscription);
        if (result.success) {
          setIsSubscribed(true);
          setNotificationsEnabled(true);
          setPermission('granted');
          
          toast({
            title: "Notifications Enabled!",
            description: "You'll now receive habit reminders.",
          });
        } else {
          throw new Error(result.error);
        }

      } catch (error) {
        console.error('Failed to enable notifications:', error);
        toast({
          title: "Setup Failed",
          description: error.message || "Failed to enable notifications. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Disable notifications
      try {
        setLoading(true);
        await notificationService.unsubscribe();
        setIsSubscribed(false);
        setNotificationsEnabled(false);
        
        toast({
          title: "Notifications Disabled",
          description: "You won't receive habit reminders anymore.",
        });
      } catch (error) {
        console.error('Failed to disable notifications:', error);
        toast({
          title: "Error",
          description: "Failed to disable notifications.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const sendTestNotification = async () => {
    try {
      if (!isSubscribed) {
        toast({
          title: "Not Subscribed",
          description: "Please enable notifications first.",
          variant: "destructive",
        });
        return;
      }

      // Send a test notification
      notificationService.showNotification('Test Notification', {
        body: 'This is a test notification from your Habit Tracker!',
        tag: 'test-notification',
        requireInteraction: false
      });

      toast({
        title: "Test Sent!",
        description: "Check your notifications to see if it worked.",
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast({
        title: "Test Failed",
        description: "Could not send test notification.",
        variant: "destructive",
      });
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Granted</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="secondary">Not Asked</Badge>;
    }
  };

  const getNotificationSupport = () => {
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotifications = 'Notification' in window;

    return {
      supported: hasServiceWorker && hasPushManager && hasNotifications,
      serviceWorker: hasServiceWorker,
      pushManager: hasPushManager,
      notifications: hasNotifications
    };
  };

  const support = getNotificationSupport();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Support Check */}
          {!support.supported && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Limited Support</span>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
                  Your browser has limited notification support. Some features may not work.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Browser Permission</span>
                {getPermissionBadge()}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Push Notifications</span>
                <Badge variant={isSubscribed ? "default" : "secondary"}>
                  {isSubscribed ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {notificationsEnabled ? (
                <Bell className="h-5 w-5 text-green-600" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label className="font-medium">
                  {notificationsEnabled ? "Notifications Enabled" : "Enable Notifications"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get reminders for your daily habits
                </p>
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleEnableNotifications}
              disabled={loading || !support.supported}
            />
          </div>

          {/* Test Notification */}
          {isSubscribed && (
            <div className="space-y-3">
              <Button
                onClick={sendTestNotification}
                variant="outline"
                className="w-full"
              >
                Send Test Notification
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Use this to verify notifications are working on your device
              </p>
            </div>
          )}

          {/* Information */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">How it works:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Notifications work even when the app is closed</li>
              <li>• You can set custom reminder times for each habit</li>
              <li>• Tap notifications to quickly mark habits complete</li>
              <li>• You can disable notifications anytime in settings</li>
            </ul>
          </div>

          {permission === 'denied' && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">
                Notifications are blocked. Please enable them in your browser settings to receive habit reminders.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettings;