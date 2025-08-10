# Habit Tracker - Full Stack Contracts

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/webauthn/register` - Register biometric credentials  
- `POST /api/auth/webauthn/authenticate` - Biometric login
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Habits Management
- `GET /api/habits` - Get user's habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit

### Completions
- `GET /api/habits/:id/completions` - Get habit completions
- `POST /api/habits/:id/completions` - Toggle completion for date
- `GET /api/habits/stats` - Get overall stats (completion rates, streaks)

### Notifications
- `POST /api/notifications/subscribe` - Subscribe to push notifications
- `PUT /api/habits/:id/notification` - Update habit notification settings
- `POST /api/notifications/test` - Send test notification

## Data Models

### User
```javascript
{
  _id: ObjectId,
  googleId: String,
  email: String,
  name: String,
  picture: String,
  webauthnCredentials: [{
    credentialId: String,
    publicKey: String,
    counter: Number
  }],
  notificationSubscription: {
    endpoint: String,
    keys: {
      auth: String,
      p256dh: String
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Habit
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  name: String,
  category: String,
  notification: {
    enabled: Boolean,
    time: String, // "09:00"
    days: [Number] // [1,2,3,4,5,6,0] for Mon-Sun
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Completion
```javascript
{
  _id: ObjectId,
  habitId: ObjectId,
  userId: ObjectId,
  date: Date, // YYYY-MM-DD format
  completed: Boolean,
  createdAt: Date
}
```

## Frontend Integration Points

### Mock Data to Replace
- `getMockHabits()` → API call to `/api/habits`
- `getMockCompletions()` → API call to `/api/habits/:id/completions`
- `addMockHabit()` → API call to `POST /api/habits`
- `toggleMockCompletion()` → API call to `POST /api/habits/:id/completions`
- `deleteMockHabit()` → API call to `DELETE /api/habits/:id`

### New Components to Add
- `LoginScreen.jsx` - Google OAuth + WebAuthn login
- `NotificationSettings.jsx` - Configure habit notifications
- `AuthContext.jsx` - React context for user authentication
- Service Worker for push notifications

### Features to Implement

#### Authentication Flow
1. User sees login screen with Google OAuth button
2. After Google login, optionally set up biometric authentication
3. Subsequent logins can use biometric (WebAuthn) or Google OAuth
4. JWT token stored in localStorage for session management

#### Notifications
1. When adding/editing habit, show notification time picker
2. Register service worker for background notifications
3. Request notification permission from user
4. Schedule notifications based on habit settings
5. Handle notification clicks to open app

#### Data Persistence
1. All habit data synced with MongoDB
2. Real-time completion tracking
3. Streak calculations server-side
4. User-specific data isolation

## Security Considerations
- JWT tokens with expiration
- CORS configuration for production
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure WebAuthn implementation
- HTTPS required for WebAuthn and notifications

## Push Notification Implementation
- Service Worker registration
- VAPID keys for push service
- Background sync for offline actions
- Notification scheduling based on user timezone