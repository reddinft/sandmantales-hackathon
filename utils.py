from typing import Optional
from pydantic import BaseModel

# Utility functions for the Sandman Tales backend
def validate_story_data(title: str, content: str) -> bool:
    """Validate story data before insertion."""
    return bool(title.strip()) and bool(content.strip())
