<img src="poster_final.webp" alt="poster">

## AI Exam Preparation Assistant

A full-stack AI-powered exam preparation assistant with a modern, responsive UI and FastAPI backend.

### Tech Stack

- **Frontend**: React + TypeScript (Vite), Tailwind CSS, `lucide-react`
- **Backend**: FastAPI, Pydantic, `python-dotenv`

---

## Setup Instructions

### 1. Backend (FastAPI)

From the project root:

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:

```bash
gem=your_real_ai_key_optional
```

Run the backend on port **8000**:

```bash
uvicorn main:app --reload --port 8000
```

---

### 2. Frontend (React + Vite)

From the project root:

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend` (optional, only if backend URL differs):

```bash
VITE_API_BASE_URL=http://localhost:8000
```

Run the frontend on port **5173**:

```bash
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

### API Overview

- `POST /generate-question`
  - Input: `{ "subject": string, "difficulty": "easy" | "medium" | "hard" }`
  - Output: Question object with type, options (for MCQ), correct answer, and explanation.

- `POST /evaluate-answer`
  - Input: `{ "question": string, "correctAnswer": string, "studentAnswer": string }`
  - Output: Evaluation with `isCorrect`, `score`, `feedback`, `strengths`, and `improvements`.

The backend includes a pluggable AI service that can be wired to a real LLM; when no key is set, it uses deterministic rule-based questions and evaluation.


