from fastapi import FastAPI
from app.api import routes

app = FastAPI(title="AI Exam Assistant MVP")

# Include the routes you'll build
app.include_router(routes.router)

@app.get("/")
def health_check():
    return {"status": "20th Hour: Operational", "team": "DSARG_8"}
