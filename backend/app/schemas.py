from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class AnalysisPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    resume_name: str
    job_title: str
    company: str
    score: int
    matched_skills: list[str]
    missing_skills: list[str]
    suggestions: list[str]
    created_at: datetime


class AnalysisResult(AnalysisPublic):
    resume_text: str
    job_description: str
