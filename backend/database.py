from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, List
import os
from datetime import datetime, date

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
users_collection = db.users
habits_collection = db.habits
completions_collection = db.completions

class Database:
    
    # User operations
    @staticmethod
    async def create_user(user_data: dict) -> dict:
        user_data["created_at"] = datetime.utcnow()
        user_data["updated_at"] = datetime.utcnow()
        result = await users_collection.insert_one(user_data)
        user_data["_id"] = str(result.inserted_id)
        return user_data
    
    @staticmethod
    async def get_user_by_google_id(google_id: str) -> Optional[dict]:
        user = await users_collection.find_one({"google_id": google_id})
        if user:
            user["_id"] = str(user["_id"])
        return user
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[dict]:
        user = await users_collection.find_one({"_id": user_id})
        if user:
            user["_id"] = str(user["_id"])
        return user
    
    @staticmethod
    async def update_user(user_id: str, update_data: dict) -> bool:
        update_data["updated_at"] = datetime.utcnow()
        result = await users_collection.update_one(
            {"_id": user_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    # Habit operations
    @staticmethod
    async def create_habit(habit_data: dict) -> dict:
        habit_data["created_at"] = datetime.utcnow()
        habit_data["updated_at"] = datetime.utcnow()
        result = await habits_collection.insert_one(habit_data)
        habit_data["_id"] = str(result.inserted_id)
        return habit_data
    
    @staticmethod
    async def get_user_habits(user_id: str) -> List[dict]:
        cursor = habits_collection.find({"user_id": user_id})
        habits = []
        async for habit in cursor:
            habit["_id"] = str(habit["_id"])
            habits.append(habit)
        return habits
    
    @staticmethod
    async def get_habit_by_id(habit_id: str, user_id: str) -> Optional[dict]:
        habit = await habits_collection.find_one({
            "_id": habit_id,
            "user_id": user_id
        })
        if habit:
            habit["_id"] = str(habit["_id"])
        return habit
    
    @staticmethod
    async def update_habit(habit_id: str, user_id: str, update_data: dict) -> bool:
        update_data["updated_at"] = datetime.utcnow()
        result = await habits_collection.update_one(
            {"_id": habit_id, "user_id": user_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    async def delete_habit(habit_id: str, user_id: str) -> bool:
        # Delete habit
        habit_result = await habits_collection.delete_one({
            "_id": habit_id,
            "user_id": user_id
        })
        
        # Delete associated completions
        await completions_collection.delete_many({
            "habit_id": habit_id,
            "user_id": user_id
        })
        
        return habit_result.deleted_count > 0
    
    # Completion operations
    @staticmethod
    async def get_completion(habit_id: str, user_id: str, date_str: str) -> Optional[dict]:
        completion = await completions_collection.find_one({
            "habit_id": habit_id,
            "user_id": user_id,
            "date": date_str
        })
        if completion:
            completion["_id"] = str(completion["_id"])
        return completion
    
    @staticmethod
    async def create_completion(completion_data: dict) -> dict:
        completion_data["created_at"] = datetime.utcnow()
        result = await completions_collection.insert_one(completion_data)
        completion_data["_id"] = str(result.inserted_id)
        return completion_data
    
    @staticmethod
    async def update_completion(habit_id: str, user_id: str, date_str: str, completed: bool) -> bool:
        result = await completions_collection.update_one(
            {
                "habit_id": habit_id,
                "user_id": user_id,
                "date": date_str
            },
            {
                "$set": {
                    "completed": completed,
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        return result.modified_count > 0 or result.upserted_id is not None
    
    @staticmethod
    async def get_habit_completions(habit_id: str, user_id: str, days: int = 30) -> List[dict]:
        # Get completions for the last N days
        cursor = completions_collection.find({
            "habit_id": habit_id,
            "user_id": user_id
        }).sort("date", -1).limit(days * 2)  # Extra buffer for missed days
        
        completions = []
        async for completion in cursor:
            completion["_id"] = str(completion["_id"])
            completions.append(completion)
        
        return completions
    
    @staticmethod
    async def get_user_completions_for_date(user_id: str, date_str: str) -> List[dict]:
        cursor = completions_collection.find({
            "user_id": user_id,
            "date": date_str,
            "completed": True
        })
        
        completions = []
        async for completion in cursor:
            completion["_id"] = str(completion["_id"])
            completions.append(completion)
        
        return completions