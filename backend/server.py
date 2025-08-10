from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from typing import List
from datetime import datetime, date, timedelta

# Import our modules
from models import *
from database import Database
from auth import create_access_token, verify_google_token, get_current_user, get_or_create_user
from notifications import NotificationService
from utils import calculate_current_streak, calculate_completion_rate, format_habit_stats

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI(title="Habit Tracker API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Authentication endpoints
@api_router.post("/auth/google", response_model=AuthResponse)
async def google_auth(request: GoogleAuthRequest):
    """Authenticate user with Google OAuth token"""
    try:
        google_user_data = await verify_google_token(request.token)
        user = await get_or_create_user(google_user_data)
        
        # Create JWT token
        access_token = create_access_token(data={"sub": user["_id"]})
        
        return AuthResponse(
            access_token=access_token,
            user=UserResponse(
                id=user["_id"],
                email=user["email"],
                name=user["name"],
                picture=user.get("picture")
            )
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user["_id"],
        email=current_user["email"],
        name=current_user["name"],
        picture=current_user.get("picture")
    )

@api_router.post("/auth/webauthn/register")
async def register_webauthn(
    request: WebAuthnRegisterRequest,
    current_user: dict = Depends(get_current_user)
):
    """Register WebAuthn credentials for biometric auth"""
    try:
        credential = {
            "credential_id": request.credential_id,
            "public_key": request.public_key,
            "counter": request.counter
        }
        
        # Add to user's webauthn credentials
        current_credentials = current_user.get("webauthn_credentials", [])
        current_credentials.append(credential)
        
        await Database.update_user(current_user["_id"], {
            "webauthn_credentials": current_credentials
        })
        
        return {"message": "WebAuthn credentials registered successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to register WebAuthn credentials: {str(e)}"
        )

# Habit management endpoints
@api_router.get("/habits", response_model=List[HabitResponse])
async def get_habits(current_user: dict = Depends(get_current_user)):
    """Get all habits for the current user"""
    habits = await Database.get_user_habits(current_user["_id"])
    
    # Add stats to each habit
    habits_with_stats = []
    for habit in habits:
        completions = await Database.get_habit_completions(habit["_id"], current_user["_id"])
        habit_with_stats = format_habit_stats(habit, completions)
        habits_with_stats.append(HabitResponse(**habit_with_stats))
    
    return habits_with_stats

@api_router.post("/habits", response_model=HabitResponse)
async def create_habit(
    habit_create: HabitCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new habit"""
    habit_data = habit_create.dict()
    habit_data["user_id"] = current_user["_id"]
    habit_data["_id"] = str(uuid.uuid4())
    
    habit = await Database.create_habit(habit_data)
    
    return HabitResponse(
        id=habit["_id"],
        name=habit["name"],
        category=habit["category"],
        notification=habit["notification"],
        created_at=habit["created_at"]
    )

@api_router.put("/habits/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: str,
    habit_update: HabitUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a habit"""
    # Check if habit exists and belongs to user
    existing_habit = await Database.get_habit_by_id(habit_id, current_user["_id"])
    if not existing_habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    # Update habit
    update_data = {k: v for k, v in habit_update.dict().items() if v is not None}
    await Database.update_habit(habit_id, current_user["_id"], update_data)
    
    # Return updated habit
    updated_habit = await Database.get_habit_by_id(habit_id, current_user["_id"])
    return HabitResponse(**updated_habit)

@api_router.delete("/habits/{habit_id}")
async def delete_habit(
    habit_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a habit"""
    success = await Database.delete_habit(habit_id, current_user["_id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    return {"message": "Habit deleted successfully"}

# Completion endpoints
@api_router.post("/habits/{habit_id}/completions")
async def toggle_habit_completion(
    habit_id: str,
    completion_toggle: CompletionToggle,
    current_user: dict = Depends(get_current_user)
):
    """Toggle habit completion for a specific date"""
    # Check if habit exists and belongs to user
    habit = await Database.get_habit_by_id(habit_id, current_user["_id"])
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    # Get current completion status
    existing_completion = await Database.get_completion(
        habit_id, current_user["_id"], completion_toggle.date
    )
    
    # Toggle completion
    new_status = not (existing_completion and existing_completion.get("completed", False))
    await Database.update_completion(
        habit_id, current_user["_id"], completion_toggle.date, new_status
    )
    
    return {"date": completion_toggle.date, "completed": new_status}

@api_router.get("/habits/{habit_id}/completions")
async def get_habit_completions(
    habit_id: str,
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get completion history for a habit"""
    # Check if habit exists and belongs to user
    habit = await Database.get_habit_by_id(habit_id, current_user["_id"])
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    completions = await Database.get_habit_completions(habit_id, current_user["_id"], days)
    
    # Format completions as dict with date keys
    completions_dict = {}
    for completion in completions:
        completions_dict[completion["date"]] = completion["completed"]
    
    return {
        "habit_id": habit_id,
        "completions": completions_dict,
        "stats": {
            "current_streak": calculate_current_streak(completions),
            "completion_rate": calculate_completion_rate(completions, days)
        }
    }

@api_router.get("/habits/stats", response_model=OverallStats)
async def get_overall_stats(current_user: dict = Depends(get_current_user)):
    """Get overall statistics for all user habits"""
    habits = await Database.get_user_habits(current_user["_id"])
    today = date.today().isoformat()
    
    # Get today's completions
    today_completions = await Database.get_user_completions_for_date(
        current_user["_id"], today
    )
    completed_today = len(today_completions)
    total_habits = len(habits)
    
    # Calculate overall completion rate
    today_completion_rate = (
        (completed_today / total_habits * 100) if total_habits > 0 else 0
    )
    
    # Get stats for each habit
    habits_stats = []
    for habit in habits:
        completions = await Database.get_habit_completions(habit["_id"], current_user["_id"])
        stats = HabitStats(
            habit_id=habit["_id"],
            current_streak=calculate_current_streak(completions),
            completion_rate=calculate_completion_rate(completions)
        )
        habits_stats.append(stats)
    
    return OverallStats(
        total_habits=total_habits,
        completed_today=completed_today,
        today_completion_rate=round(today_completion_rate, 1),
        habits_stats=habits_stats
    )

# Notification endpoints
@api_router.post("/notifications/subscribe")
async def subscribe_to_notifications(
    request: NotificationSubscribeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Subscribe user to push notifications"""
    try:
        await Database.update_user(current_user["_id"], {
            "notification_subscription": request.subscription.dict()
        })
        return {"message": "Successfully subscribed to notifications"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to subscribe to notifications: {str(e)}"
        )

@api_router.post("/notifications/test")
async def send_test_notification(
    request: TestNotificationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send a test notification to user"""
    subscription = current_user.get("notification_subscription")
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not subscribed to notifications"
        )
    
    payload = NotificationService.create_test_notification_payload(request.message)
    success = await NotificationService.send_notification(subscription, payload)
    
    if success:
        return {"message": "Test notification sent successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send test notification"
        )

# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "Habit Tracker API is running"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
