import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "src"))

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database import Base, engine, get_db
from app.models import User
from app.auth import hash_password, verify_password, create_access_token, decode_access_token
from controllers.ProcessController import ProcessController

Base.metadata.create_all(bind=engine)

load_dotenv()

from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

# --- Build the RAG controller once ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROMA_PATH = os.path.join(BASE_DIR, "src", "chroma_db")

rag_config = {
    "GROQ_API_KEY": os.getenv("GROQ_API_KEY"),
    "GENERATION_MODEL": "openai/gpt-oss-120b",
    "EMBEDDING_MODEL": "BAAI/bge-small-en-v1.5",
    "VECTOR_DB_PATH": CHROMA_PATH, # <--- التعديل السحري هنا
}
controller = ProcessController(rag_config)

controller.vectordb.create_collection(
    collection_name="hypertension_clinical_kb",
    embedding_function=controller.embedding_model,
    distance_method="cosine",
)

app = FastAPI(title="EmbedMed-RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------------- Schemas ----------------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AskRequest(BaseModel):
    question: str


# ---------------- Auth routes ----------------
@app.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=request.email, hashed_password=hash_password(request.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email}


@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


# ---------------- RAG route ----------------
@app.post("/api/ask")
def ask(request: AskRequest, current_user: User = Depends(get_current_user)):
    return controller.ask(request.question)


@app.get("/health")
def health():
    return {"status": "ok"}