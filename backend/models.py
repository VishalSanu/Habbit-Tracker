from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import uuid

# User Models
class WebAuthnCredential(BaseModel):
    credential_id: str
    public_key: str
    counter: int

class NotificationSubscription(BaseModel):
    endpoint: str
    keys: Dict[str, str]

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    google_id: Optional[str] = None
    email: EmailStr
    name: str
    picture: Optional[str] = None
    webauthn_credentials: List[WebAuthnCredential] = []
    notification_subscription: Optional[NotificationSubscription] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    google_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None

# Habit Models
class NotificationSettings(BaseModel):
    enabled: bool = False
    time: str = "09:00"  # HH:MM format
    days: List[int] = [1, 2, 3, 4, 5]  # Monday to Friday by default

class Habit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: str
    name: str
    category: str
    notification: NotificationSettings = NotificationSettings()
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class HabitCreate(BaseModel):
    name: str
    category: str
    notification: Optional[NotificationSettings] = NotificationSettings()

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    notification: Optional[NotificationSettings] = None

class HabitResponse(BaseModel):
    id: str
    name: str
    category: str
    notification: NotificationSettings
    created_at: datetime

# Completion Models
class Completion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    habit_id: str
    user_id: str
    date: date
    completed: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CompletionToggle(BaseModel):
    date: str  # YYYY-MM-DD format

class CompletionResponse(BaseModel):
    date: str
    completed: bool

# Stats Models
class HabitStats(BaseModel):
    habit_id: str
    current_streak: int
    completion_rate: float  # percentage

class OverallStats(BaseModel):
    total_habits: int
    completed_today: int
    today_completion_rate: float
    habits_stats: List[HabitStats]

# Authentication Models
class GoogleAuthRequest(BaseModel):
    token: str

class WebAuthnRegisterRequest(BaseModel):
    credential_id: str
    public_key: str
    counter: int = 0

class WebAuthnAuthRequest(BaseModel):
    credential_id: str
    signature: str
    counter: int

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Notification Models
class NotificationSubscribeRequest(BaseModel):
    subscription: NotificationSubscription

class TestNotificationRequest(BaseModel):
    message: str = "Test notification from Habit Tracker!"