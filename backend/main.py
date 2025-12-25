from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from ai_service import AIService, AIServiceError
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()
import os
from pymongo import MongoClient
from passlib.context import CryptContext
from jose import jwt
from models import QuestionRequest, EvaluationRequest, AuthRequest

client = MongoClient(os.getenv("MONGO_URI"))
db = client["prufung"]
users = db["users"]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET")

app = FastAPI(title="DSARG_8 AI Exam Assistant")

# ENABLE CORS: Essential so your React App (App.tsx) can talk to this Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In a hackathon, allow all; in production, restrict this
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_service = AIService()

@app.post("/signup")
async def signup(data: AuthRequest):
    if users.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="User already exists")

    hashed = pwd_context.hash(data.password)
    users.insert_one({"email": data.email, "password": hashed})

    return {"message": "User created"}


@app.post("/login")
async def login(data: AuthRequest):
    user = users.find_one({"email": data.email})
    if not user or not pwd_context.verify(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode({"email": data.email}, JWT_SECRET, algorithm="HS256")
    return {"access_token": token}


@app.post("/generate-question")
async def generate_q(request: QuestionRequest):
    """
    Fulfills Prototype Objective: Generate practice questions.
    Uses Gemini-based generation.
    """
    try:
        return ai_service.generate_question(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate-answer")
async def evaluate_a(payload: dict = Body(...)):
    """
    Fulfills Prototype Objective: Evaluate student responses.
    Expects JSON keys: 'question', 'correctAnswer', 'studentAnswer'.
    """
    try:
        # Manual mapping ensures compatibility with App.tsx
        request_data = EvaluationRequest(
            question=payload.get("question"),
            correctAnswer=payload.get("correctAnswer"),
            studentAnswer=payload.get("studentAnswer"),
        )
        return ai_service.evaluate_answer(request_data)
    except Exception as e:
        print(f"Evaluation failed: {e}")
        # Return 422 if data is missing, 500 if AI fails
        raise HTTPException(status_code=422, detail="Missing fields or AI error")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
