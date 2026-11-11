from datetime import datetime, timezone
from io import BytesIO
from bson import ObjectId
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pypdf import PdfReader

from app.analyzer import analyze
from app.config import get_settings
from app.database import analyses, ensure_indexes, users
from app.schemas import AnalysisPublic, AnalysisResult, AuthResponse, LoginRequest, UserCreate, UserPublic
from app.security import create_access_token, decode_access_token, hash_password, verify_password

settings = get_settings()
app = FastAPI(title="HireLens AI API", version="1.0.0", description="Resume to job description analysis")
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_origin], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
bearer = HTTPBearer(auto_error=False)


@app.on_event("startup")
def startup() -> None:
    try:
        ensure_indexes()
    except Exception:
        # MongoDB may be starting separately; requests will report a clear database error.
        pass


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Sign in to continue", headers={"WWW-Authenticate": "Bearer"})
    user_id = decode_access_token(credentials.credentials)
    if not user_id or not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=401, detail="Your session expired. Please sign in again.")
    user = users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="Account not found")
    return user


def auth_response(user: dict) -> AuthResponse:
    return AuthResponse(access_token=create_access_token(str(user["_id"])), user=UserPublic(id=str(user["_id"]), name=user["name"], email=user["email"]))


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "hirelens-api"}


@app.post("/api/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate) -> AuthResponse:
    email = payload.email.lower()
    if users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = {"name": payload.name.strip(), "email": email, "password_hash": hash_password(payload.password), "created_at": datetime.now(timezone.utc)}
    try:
        result = users.insert_one(user)
        user["_id"] = result.inserted_id
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Could not save your account. Check the database connection.") from exc
    return auth_response(user)


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    user = users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    return auth_response(user)


@app.get("/api/auth/me", response_model=UserPublic)
def me(user: dict = Depends(current_user)) -> UserPublic:
    return UserPublic(id=str(user["_id"]), name=user["name"], email=user["email"])


@app.post("/api/analyses", response_model=AnalysisResult, status_code=status.HTTP_201_CREATED)
async def create_analysis(
    resume: UploadFile = File(...),
    job_description: str = Form(..., min_length=30, max_length=20000),
    job_title: str = Form(default="", max_length=120),
    company: str = Form(default="", max_length=120),
    user: dict = Depends(current_user),
) -> AnalysisResult:
    if resume.content_type != "application/pdf" and not (resume.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Please upload a PDF resume")
    contents = await resume.read(settings.max_upload_mb * 1024 * 1024 + 1)
    if len(contents) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File must be smaller than {settings.max_upload_mb} MB")
    try:
        reader = PdfReader(BytesIO(contents))
        resume_text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="We couldn't read this PDF. Try exporting it again.") from exc
    if not resume_text:
        raise HTTPException(status_code=422, detail="No selectable text found. This analyzer needs a text-based PDF.")
    result = analyze(resume_text, job_description)
    document = {"user_id": user["_id"], "resume_name": (resume.filename or "Resume.pdf")[:180], "job_title": job_title.strip() or "Untitled role", "company": company.strip(), "job_description": job_description, "resume_text": resume_text, **result, "created_at": datetime.now(timezone.utc)}
    try:
        inserted = analyses.insert_one(document)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Could not save analysis. Check the database connection.") from exc
    return AnalysisResult(id=str(inserted.inserted_id), **{key: value for key, value in document.items() if key not in ("_id", "user_id")})


@app.get("/api/analyses", response_model=list[AnalysisPublic])
def list_analyses(user: dict = Depends(current_user)) -> list[AnalysisPublic]:
    documents = analyses.find({"user_id": user["_id"]}).sort("created_at", -1).limit(50)
    return [AnalysisPublic(id=str(item["_id"]), **{key: value for key, value in item.items() if key not in ("_id", "user_id", "resume_text", "job_description")}) for item in documents]


@app.get("/api/analyses/{analysis_id}", response_model=AnalysisResult)
def get_analysis(analysis_id: str, user: dict = Depends(current_user)) -> AnalysisResult:
    if not ObjectId.is_valid(analysis_id):
        raise HTTPException(status_code=404, detail="Analysis not found")
    item = analyses.find_one({"_id": ObjectId(analysis_id), "user_id": user["_id"]})
    if not item:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return AnalysisResult(id=str(item["_id"]), **{key: value for key, value in item.items() if key not in ("_id", "user_id")})
