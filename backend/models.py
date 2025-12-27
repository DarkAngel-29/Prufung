from pydantic import BaseModel
from typing import List, Literal, Optional

class SignupRequest(BaseModel):
    email: str
    password: str
    fullName: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str
    
class QuestionRequest(BaseModel):
    subject: str
    difficulty: Literal["easy", "medium", "hard"]

class QuestionResponse(BaseModel):
    question: str
    type: Literal["multiple-choice", "short-answer"]
    options: List[str]
    correctAnswer: str
    explanation: str
    difficulty: Literal["easy", "medium", "hard"]

class EvaluationRequest(BaseModel):
    question: str  # FIXED: Matches export interface EvaluationRequest
    correctAnswer: str
    studentAnswer: str

class EvaluationResponse(BaseModel):
    isCorrect: bool
    score: int
    feedback: str
    strengths: List[str]
    improvements: List[str]
