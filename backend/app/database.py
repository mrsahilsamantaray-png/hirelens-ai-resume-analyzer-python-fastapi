from pymongo import MongoClient

from app.config import get_settings

settings = get_settings()
client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=2500)
database = client[settings.mongodb_database]
users = database["users"]
analyses = database["analyses"]


def ensure_indexes() -> None:
    users.create_index("email", unique=True)
    analyses.create_index([("user_id", 1), ("created_at", -1)])
