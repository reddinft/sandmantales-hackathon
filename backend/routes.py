from fastapi import APIRouter, HTTPException
from schemas import StoryCreate, StoryResponse
from services import generate_story, generate_voice, generate_illustration
from db import save_story, get_story, get_all_stories
import uuid

router = APIRouter()

@router.post("/story", response_model=StoryResponse)
async def create_story(story_data: StoryCreate):
    # Generate story
    story_text = await generate_story(story_data.prompt)
    
    # Generate voice
    voice_url = await generate_voice(story_text)
    
    # Generate illustration
    illustration_url = await generate_illustration(story_data.prompt)
    
    # Save to database
    story_id = str(uuid.uuid4())
    await save_story({
        "id": story_id,
        "prompt": story_data.prompt,
        "story_text": story_text,
        "voice_url": voice_url,
        "illustration_url": illustration_url
    })
    
    return {
        "id": story_id,
        "prompt": story_data.prompt,
        "story_text": story_text,
        "voice_url": voice_url,
        "illustration_url": illustration_url,
        "created_at": datetime.utcnow().isoformat()
    }

@router.get("/story/{story_id}", response_model=StoryResponse)
async def get_story(story_id: str):
    story = await get_story(story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    return story

@router.get("/stories", response_model=list[StoryResponse])
async def get_all_stories():
    stories = await get_all_stories()
    return stories