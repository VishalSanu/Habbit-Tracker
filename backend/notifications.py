from pywebpush import webpush, WebPushException
import json
import os
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

# VAPID keys - In production, these should be environment variables
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "your-vapid-private-key")
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "your-vapid-public-key")
VAPID_CLAIMS = {
    "sub": "mailto:your-email@example.com"
}

class NotificationService:
    
    @staticmethod
    def get_vapid_public_key():
        return VAPID_PUBLIC_KEY
    
    @staticmethod
    async def send_notification(subscription_info: Dict[str, Any], payload: Dict[str, Any]) -> bool:
        """Send push notification to user"""
        try:
            response = webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS
            )
            
            logger.info(f"Notification sent successfully: {response.status_code}")
            return True
            
        except WebPushException as ex:
            logger.error(f"Failed to send notification: {ex}")
            return False
        except Exception as ex:
            logger.error(f"Unexpected error sending notification: {ex}")
            return False
    
    @staticmethod
    def create_habit_reminder_payload(habit_name: str) -> Dict[str, Any]:
        """Create notification payload for habit reminder"""
        return {
            "title": "Habit Reminder",
            "body": f"Time to complete: {habit_name}",
            "icon": "/icon-192x192.png",
            "badge": "/badge-72x72.png",
            "tag": "habit-reminder",
            "requireInteraction": True,
            "actions": [
                {
                    "action": "complete",
                    "title": "Mark Complete"
                },
                {
                    "action": "dismiss",
                    "title": "Dismiss"
                }
            ]
        }
    
    @staticmethod  
    def create_test_notification_payload(message: str) -> Dict[str, Any]:
        """Create test notification payload"""
        return {
            "title": "Test Notification",
            "body": message,
            "icon": "/icon-192x192.png",
            "tag": "test-notification"
        }