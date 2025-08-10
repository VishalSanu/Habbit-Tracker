from datetime import datetime, date, timedelta
from typing import List, Dict, Any
import calendar

def calculate_current_streak(completions: List[Dict[str, Any]], today_date: date = None) -> int:
    """Calculate current streak from completions list"""
    if not completions:
        return 0
    
    if today_date is None:
        today_date = date.today()
    
    # Sort completions by date descending
    sorted_completions = sorted(completions, key=lambda x: x["date"], reverse=True)
    
    streak = 0
    current_date = today_date
    
    # Check if we need to start from yesterday if today is not completed
    today_completed = any(
        comp["date"] == today_date.isoformat() and comp["completed"] 
        for comp in completions
    )
    
    if not today_completed:
        current_date = today_date - timedelta(days=1)
    
    # Count consecutive days
    for i in range(len(sorted_completions)):
        date_str = current_date.isoformat()
        
        # Find completion for current date
        completion = next(
            (comp for comp in sorted_completions if comp["date"] == date_str),
            None
        )
        
        if completion and completion["completed"]:
            streak += 1
            current_date -= timedelta(days=1)
        else:
            break
    
    return streak

def calculate_completion_rate(completions: List[Dict[str, Any]], days: int = 30) -> float:
    """Calculate completion rate percentage for given number of days"""
    if not completions or days <= 0:
        return 0.0
    
    today = date.today()
    completed_count = 0
    
    for i in range(days):
        check_date = today - timedelta(days=i)
        date_str = check_date.isoformat()
        
        # Check if this date was completed
        completed = any(
            comp["date"] == date_str and comp["completed"] 
            for comp in completions
        )
        
        if completed:
            completed_count += 1
    
    return round((completed_count / days) * 100, 1)

def get_date_range(days: int) -> List[str]:
    """Get list of date strings for the last N days"""
    today = date.today()
    dates = []
    
    for i in range(days):
        check_date = today - timedelta(days=i)
        dates.append(check_date.isoformat())
    
    return dates

def is_notification_time(notification_settings: Dict[str, Any]) -> bool:
    """Check if current time matches notification settings"""
    if not notification_settings.get("enabled", False):
        return False
    
    now = datetime.now()
    current_weekday = now.weekday()  # Monday = 0
    
    # Check if today is in notification days
    if current_weekday not in notification_settings.get("days", []):
        return False
    
    # Parse notification time
    try:
        time_parts = notification_settings.get("time", "09:00").split(":")
        notification_hour = int(time_parts[0])
        notification_minute = int(time_parts[1])
        
        # Check if current time matches (with 1 minute tolerance)
        return (
            now.hour == notification_hour and 
            abs(now.minute - notification_minute) <= 1
        )
    except (ValueError, IndexError):
        return False

def format_habit_stats(habit: Dict[str, Any], completions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Format habit with calculated stats"""
    current_streak = calculate_current_streak(completions)
    completion_rate = calculate_completion_rate(completions, 30)
    
    return {
        "id": habit["_id"],
        "name": habit["name"],
        "category": habit["category"],
        "notification": habit.get("notification", {}),
        "created_at": habit["created_at"],
        "stats": {
            "current_streak": current_streak,
            "completion_rate": completion_rate
        }
    }