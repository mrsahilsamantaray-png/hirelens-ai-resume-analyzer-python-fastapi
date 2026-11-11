import re

SKILLS = [
    "python", "java", "javascript", "typescript", "react", "node.js", "fastapi", "django",
    "flask", "sql", "postgresql", "mongodb", "mysql", "aws", "azure", "gcp", "docker",
    "kubernetes", "git", "ci/cd", "machine learning", "data analysis", "pandas", "numpy",
    "scikit-learn", "tensorflow", "pytorch", "rest api", "graphql", "html", "css", "figma",
    "project management", "agile", "leadership", "communication", "excel", "power bi", "tableau",
    "salesforce", "testing", "linux", "security", "terraform", "redis", "c++", "c#", ".net",
]


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def analyze(resume_text: str, job_description: str) -> dict:
    resume = normalize(resume_text)
    job = normalize(job_description)
    job_skills = [skill for skill in SKILLS if re.search(rf"(?<![\w]){re.escape(skill)}(?![\w])", job)]
    matched = [skill for skill in job_skills if re.search(rf"(?<![\w]){re.escape(skill)}(?![\w])", resume)]
    missing = [skill for skill in job_skills if skill not in matched]

    words = re.findall(r"[a-z][a-z0-9+#./-]{2,}", job)
    stop = {"the", "and", "for", "with", "you", "our", "are", "will", "your", "from", "that", "this", "have", "has", "who", "all", "can", "not", "job", "role", "team", "work"}
    keywords = list(dict.fromkeys(word for word in words if word not in stop and word not in SKILLS))[:40]
    overlap = sum(1 for word in keywords if re.search(rf"(?<![\w]){re.escape(word)}(?![\w])", resume))
    skill_score = (len(matched) / len(job_skills) * 75) if job_skills else 45
    keyword_score = (overlap / len(keywords) * 25) if keywords else 15
    score = round(min(100, skill_score + keyword_score))

    suggestions = []
    if missing:
        suggestions.append(f"If accurate, add evidence for {', '.join(missing[:4])} in your skills or experience sections.")
    if not re.search(r"\d+%?|\$\s?\d+", resume):
        suggestions.append("Add measurable outcomes, such as time saved, revenue influenced, or users supported.")
    if not any(term in resume for term in ("led", "built", "improved", "delivered", "owned", "launched")):
        suggestions.append("Start experience bullets with clear action verbs that describe your contribution.")
    if len(resume_text.split()) < 120:
        suggestions.append("Your resume text is brief; include more detail about relevant projects and results.")
    if not suggestions:
        suggestions.append("Your resume covers the detected skills well. Tailor the summary and top experience bullets to this role.")

    return {"score": score, "matched_skills": matched, "missing_skills": missing, "suggestions": suggestions}
