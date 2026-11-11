# HireLens AI

An ATS-style resume analyzer built with FastAPI, React, MongoDB, JWT, and PyPDF. Upload a PDF resume, paste a job description, and get a transparent match score, matched skills, skill gaps, and practical suggestions.

## Run locally

### API

1. Create a Python virtual environment and install the API requirements:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   Copy-Item .env.example .env
   ```

2. Set `MONGODB_URI` and a private `JWT_SECRET` in `backend/.env`, then start the API:

   ```powershell
   uvicorn app.main:app --reload
   ```

   API docs: http://localhost:8000/docs

### Web app

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite. The frontend expects the API at `http://localhost:8000`; set `VITE_API_URL` to override it.

## Features

- Email and password registration/sign-in with hashed passwords and JWT-protected endpoints.
- PDF resume upload and text extraction with PyPDF.
- ATS-style score based on job description skill coverage and relevant-term overlap.
- Matched skills, missing skills, actionable suggestions, and saved analysis history.
- MongoDB persistence for users and analyses.

## Notes

This is a heuristic coaching tool, not an employment decision system. It does not rank or reject candidates. Uploaded resume text is stored with the analysis history in your MongoDB database. Set `MAX_UPLOAD_MB` and configure appropriate retention and access controls before deploying with real resumes.
