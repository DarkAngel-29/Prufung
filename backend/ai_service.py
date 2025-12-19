import os
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel
from models import QuestionRequest, QuestionResponse, EvaluationRequest, EvaluationResponse
load_dotenv()

class AIServiceError(Exception):
    """Custom exception for AI service related issues."""

class AIService:
    def __init__(self) -> None:
        self.client = genai.Client(api_key=os.getenv("gem"))
        self.model_id = "gemini-2.5-flash" 

    def generate_question(self, payload: QuestionRequest) -> QuestionResponse:
	    try:
	        prompt = f"Generate a {payload.difficulty} question about {payload.subject}. Which is supposed to be unique!"
	        
	        response = self.client.models.generate_content(
	            model=self.model_id,
	            contents=prompt,
	            config={
	                "response_mime_type": "application/json",
	                "response_schema": QuestionResponse,
	            },
	        )
	        return response.parsed
	    except Exception as e:
	        print(f"!!! GEMINI ERROR: {e}")
	        raise e
    def evaluate_answer(self, payload: EvaluationRequest) -> EvaluationResponse:
    # Use a prompt focused on grading the student's specific answer
	    prompt = f"""
	    You are an expert academic grader. 
	    Compare the student's answer to the correct reference and provide a score.
	    
	    Question: {payload.questionText}
	    Correct Answer: {payload.correctAnswer}
	    Student's Answer: {payload.studentAnswer}
	    """
	    
	    try:
	        response = self.client.models.generate_content(
	            model=self.model_id,
	            contents=prompt,
	            config={
	                "response_mime_type": "application/json",
	                "response_schema": EvaluationResponse,
	            },
	        )
	        return response.parsed
	    except Exception as e:
	        # Check your console/terminal for this print statement to see the exact error!
	        print(f"!!! EVALUATION CRASH: {e}")
	        raise e
