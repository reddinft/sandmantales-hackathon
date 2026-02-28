import os

class Config:
    DATABASE_URL = "stories.db"
    DEBUG = os.getenv("DEBUG", False)

config = Config()
