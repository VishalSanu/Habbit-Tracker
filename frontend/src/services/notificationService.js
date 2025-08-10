// Service Worker registration and notification management
class NotificationService {
  constructor() {
    this.swRegistration = null;
    this.isSubscribed = false;
    this.applicationServerKey = null; // Will be fetched from backend
  }

  // Initialize service worker and notifications
  async initialize() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Service Worker or Push Manager not supported');
      return false;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');

      // Check if already subscribed
      const subscription = await this.swRegistration.pushManager.getSubscription();
      this.isSubscribed = subscription !== null;

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Subscribe to push notifications
  async subscribe() {
    try {
      if (!this.swRegistration) {
        throw new Error('Service Worker not registered');
      }

      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Notification permission denied');
      }

      // For demo purposes, using a mock VAPID key
      const vapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLKUGnBCd-0LMH5cL_nWqgFVjjd3J0n9l5-d0rVwrKJLqE4ZRo8O5MjI';
      
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey)
      });

      this.isSubscribed = true;
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        this.isSubscribed = false;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }

  // Schedule a local notification for habit reminder
  scheduleHabitReminder(habitName, time) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Habit Reminder', {
          body: `Time to complete: ${habitName}`,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'habit-reminder',
          requireInteraction: true,
          actions: [
            {
              action: 'complete',
              title: 'Mark Complete'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        });
      });
    }
  }

  // Show immediate notification
  showNotification(title, options = {}) {
    if (this.swRegistration) {
      return this.swRegistration.showNotification(title, {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        ...options
      });
    }
  }

  // Utility function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get subscription status
  getSubscriptionStatus() {
    return this.isSubscribed;
  }
}

// Create singleton instance
const notificationService = new NotificationService();
export default notificationService;