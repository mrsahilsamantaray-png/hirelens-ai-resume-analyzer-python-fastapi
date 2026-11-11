import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BriefcaseBusiness, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, FileText, Gauge, History, KeyRound, LoaderCircle, LockKeyhole, LogOut, Menu, Plus, Radar, ScanSearch, ShieldCheck, Sparkles, Target, UploadCloud, UserRound, X, Zap } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function api(path, options = {}) {
  const token = localStorage.getItem('hirelens_token');
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Something went wrong. Please try again.');
  return data;
}

const dateLabel = (value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('hirelens_token'));
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => {
    if (!token) { setUser(null); return; }
    Promise.all([api('/api/auth/me'), api('/api/analyses')]).then(([me, rows]) => { setUser(me); setHistory(rows); }).catch(() => signOut());
  }, [token]);

  function signOut() { localStorage.removeItem('hirelens_token'); setToken(null); setUser(null); setHistory([]); setResult(null); }
  function pickFile(file) { setError(''); if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) { setError('Please choose a PDF file.'); return; } setResume(file || null); }

  async function submitAnalysis(event) {
    event.preventDefault(); setError('');
    if (!resume) return setError('Add your resume PDF to get started.');
    if (jobDescription.trim().length < 30) return setError('Add a little more detail to the job description (at least 30 characters).');
    if (!token) { setAuthMode('login'); setAuthOpen(true); return; }
    setBusy(true);
    try {
      const form = new FormData(); form.append('resume', resume); form.append('job_description', jobDescription); form.append('job_title', jobTitle); form.append('company', company);
      const data = await api('/api/analyses', { method: 'POST', body: form });
      setResult(data); setHistory((items) => [data, ...items.filter((item) => item.id !== data.id)]);
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function openHistory(item) {
    setError('');
    try { const full = await api(`/api/analyses/${item.id}`); setResult(full); document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }); }
    catch (err) { setError(err.message); }
  }

  async function submitAuth(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const data = await api(authMode === 'login' ? '/api/auth/login' : '/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      localStorage.setItem('hirelens_token', data.access_token); setToken(data.access_token); setAuthOpen(false); setError('');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="HireLens home"><span className="brand-mark"><Radar size={21} strokeWidth={2.2}/></span><span>hirelens<span className="brand-dot">.</span></span></a>
      <nav className={`nav-links ${mobileMenu ? 'nav-open' : ''}`}><a href="#how-it-works" onClick={() => setMobileMenu(false)}>How it works</a><a href="#about" onClick={() => setMobileMenu(false)}>About</a><a href="#history" onClick={() => setMobileMenu(false)}>History</a></nav>
      <div className="top-actions">{user ? <div className="account-chip"><span className="avatar">{user.name?.[0]?.toUpperCase()}</span><span className="account-name">{user.name.split(' ')[0]}</span><button className="icon-button" title="Sign out" onClick={signOut}><LogOut size={16}/></button></div> : <button className="btn btn-dark btn-small" onClick={() => { setError(''); setAuthMode('login'); setAuthOpen(true); }}>Sign in <ArrowUpRight size={15}/></button>}<button className="mobile-toggle icon-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu">{mobileMenu ? <X size={20}/> : <Menu size={20}/>}</button></div>
    </header>

    <main id="top">
      <section className="hero section-wrap">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-icon"><Sparkles size={13}/></span> YOUR NEXT MOVE, MADE CLEAR</div><h1>Make your resume<br/>work <span className="serif-accent">smarter.</span></h1><p className="hero-intro">A clearer picture of how your experience lines up with the role you want. Get a thoughtful match score and practical ways to stand out.</p><div className="hero-trust"><span><ShieldCheck size={16}/> Private by design</span><i/><span><Zap size={15}/> Results in seconds</span></div></div>
        <div className="hero-visual" aria-label="Illustration of resume analysis"><div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/><div className="visual-card"><div className="visual-card-top"><span className="doc-icon"><FileText size={19}/></span><span className="tiny-pill">LIVE ANALYSIS</span></div><div className="visual-lines"><b/><b/><b/><b/></div><div className="visual-divider"/><div className="visual-meter"><div className="meter-copy"><span>ROLE FIT</span><strong>86%</strong></div><div className="meter-track"><i/></div></div><div className="visual-tags"><i>React</i><i>Product</i><i>Strategy</i></div></div><div className="float-badge badge-match"><span className="float-check"><Check size={14}/></span><span><b>Strong match</b><small>Experience aligned</small></span></div><div className="float-badge badge-skill"><span className="skill-dot"/><span><b>3 key strengths</b><small>Found in your resume</small></span></div><div className="hero-spark spark-a">✳</div><div className="hero-spark spark-b">✦</div><span className="visual-caption">A better fit starts with a better read.</span></div>
        <div className="hero-bottom"><a href="#analyzer" className="scroll-link">LET’S FIND YOUR FIT <span><ArrowDown size={14}/></span></a><span className="hero-index">01 <i/> 03</span></div>
      </section>

      <section className="analyzer-section" id="analyzer"><div className="section-wrap analyzer-grid"><div className="analyzer-heading"><div className="eyebrow"><span className="eyebrow-icon"><ScanSearch size={13}/></span> THE ANALYZER</div><h2>Bring the role.<br/><span className="serif-accent">We’ll read between the lines.</span></h2><p>Drop in your resume and the job description. We’ll connect the dots, surface the gaps, and help you take the next step with confidence.</p><div className="step-list"><div className="step"><span>01</span><p><b>Share your resume</b><small>PDF format, up to 8 MB</small></p></div><div className="step"><span>02</span><p><b>Tell us about the role</b><small>Paste the job description</small></p></div><div className="step"><span>03</span><p><b>Get your readout</b><small>Clear insights, real next steps</small></p></div></div></div>
        <form className="analyzer-card" onSubmit={submitAnalysis}>
          <div className="card-header"><div><span className="card-kicker">START A NEW ANALYSIS</span><h3>Let’s get started</h3></div><span className="card-icon"><ScanSearch size={19}/></span></div>
          <button className={`upload-zone ${dragging ? 'is-dragging' : ''} ${resume ? 'has-file' : ''}`} type="button" onClick={() => fileInput.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]); }}><input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => pickFile(e.target.files[0])}/><span className="upload-icon">{resume ? <CheckCircle2 size={21}/> : <UploadCloud size={21}/>}</span><span className="upload-text"><b>{resume ? resume.name : 'Drop your resume here'}</b><small>{resume ? `${(resume.size / 1024 / 1024).toFixed(2)} MB · Ready to analyze` : <>or <u>browse files</u> · PDF only · Max 8 MB</>}</small></span>{resume && <span className="remove-file" onClick={(e) => { e.stopPropagation(); setResume(null); }}><X size={16}/></span>}</button>
          <div className="field-grid"><label className="field"><span>ROLE TITLE <em>OPTIONAL</em></span><div className="input-wrap"><BriefcaseBusiness size={16}/><input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Product Designer" maxLength="120"/></div></label><label className="field"><span>COMPANY <em>OPTIONAL</em></span><div className="input-wrap"><Target size={16}/><input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Studio" maxLength="120"/></div></label></div>
          <label className="field job-field"><span>JOB DESCRIPTION <i>Required</i></span><textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the role description here. Include the responsibilities, requirements, and the skills they’re looking for..." maxLength="20000"/><small className="char-count">{jobDescription.length.toLocaleString()} / 20,000</small></label>
          {error && <div className="error-message" role="alert"><CircleHelp size={15}/>{error}</div>}
          <div className="submit-row"><span className="privacy-note"><LockKeyhole size={14}/> Your resume stays private</span><button className="btn btn-green" type="submit" disabled={busy}>{busy ? <>Analyzing <LoaderCircle className="spin" size={16}/></> : <>Analyze my fit <ArrowRight size={16}/></>}</button></div>
          {!token && <p className="signin-hint">You’ll need a free account to save your results. <button type="button" onClick={() => { setAuthMode('register'); setAuthOpen(true); }}>Create one</button></p>}
        </form></div></section>

      {result && <section className="results-section section-wrap" id="results"><div className="results-top"><div><div className="eyebrow"><span className="eyebrow-icon"><Gauge size={13}/></span> YOUR READOUT</div><h2>A clearer picture of <span className="serif-accent">your fit.</span></h2><p>{result.job_title}{result.company ? ` at ${result.company}` : ''} · {result.resume_name}</p></div><button className="btn btn-outline" onClick={() => setResult(null)}><Plus size={16}/> New analysis</button></div><div className="result-grid"><article className="score-card"><div className="score-ring" style={{'--score': `${result.score * 3.6}deg`}}><div><b>{result.score}</b><small>FIT SCORE</small></div></div><h3>{result.score >= 75 ? 'Strong alignment' : result.score >= 50 ? 'Good foundation' : 'Room to grow'}</h3><p>A practical snapshot of how your resume maps to this role.</p><div className="score-foot"><span><CheckCircle2 size={15}/> {result.matched_skills.length} matched</span><span><Clock3 size={15}/> {dateLabel(result.created_at)}</span></div></article><article className="insight-card"><div className="insight-head"><span className="insight-icon green"><Check size={17}/></span><div><h3>Skills in your corner</h3><p>What your resume already demonstrates</p></div></div><div className="tag-list">{result.matched_skills.length ? result.matched_skills.map((s) => <span className="skill-tag matched" key={s}>{s}</span>) : <span className="empty-copy">No direct skill matches detected yet.</span>}</div><div className="insight-separator"/><div className="insight-head"><span className="insight-icon amber"><Target size={17}/></span><div><h3>Room to strengthen</h3><p>Skills mentioned in the role, not your resume</p></div></div><div className="tag-list">{result.missing_skills.length ? result.missing_skills.map((s) => <span className="skill-tag missing" key={s}>{s}</span>) : <span className="empty-copy">No skill gaps detected from our keyword scan.</span>}</div></article><article className="suggestions-card"><div className="suggestions-title"><span className="insight-icon purple"><Sparkles size={17}/></span><div><h3>Thoughtful next steps</h3><p>Small edits can make your experience clearer</p></div></div><ol>{result.suggestions.map((s, i) => <li key={i}><span>{String(i + 1).padStart(2, '0')}</span>{s}</li>)}</ol><div className="readout-note"><CircleHelp size={14}/> This is a keyword-based coaching snapshot, not a hiring decision.</div></article></div></section>}

      <section className="how-section" id="how-it-works"><div className="section-wrap"><div className="how-intro"><div><div className="eyebrow"><span className="eyebrow-icon"><Sparkles size={13}/></span> A BETTER WAY TO PREPARE</div><h2>Clarity looks good <span className="serif-accent">on you.</span></h2></div><p>We believe your next opportunity should feel exciting, not like guesswork. HireLens gives you a grounded, useful starting point.</p></div><div className="value-grid"><article className="value-card"><span className="value-number">01</span><div className="value-icon icon-cream"><Gauge size={19}/></div><h3>See the whole picture</h3><p>Get a simple fit score based on the skills and language in the role, with details you can actually act on.</p><ArrowUpRight className="value-arrow" size={18}/></article><article className="value-card"><span className="value-number">02</span><div className="value-icon icon-mint"><ScanSearch size={19}/></div><h3>Find the right words</h3><p>See which relevant strengths are coming through and where your resume could tell a fuller story.</p><ArrowUpRight className="value-arrow" size={18}/></article><article className="value-card"><span className="value-number">03</span><div className="value-icon icon-lilac"><Sparkles size={19}/></div><h3>Move forward, thoughtfully</h3><p>Leave with realistic suggestions that help you present your real experience with more intention.</p><ArrowUpRight className="value-arrow" size={18}/></article></div><div className="principle-strip"><div className="principle-mark"><Radar size={22}/></div><p><b>Built to be useful. Designed to be human.</b><span>HireLens helps you prepare; it never makes decisions about candidates.</span></p><span className="principle-rule"/><span className="principle-tag">PEOPLE FIRST, ALWAYS</span></div></div></section>

      <section className="history-section section-wrap" id="history"><div className="history-head"><div><div className="eyebrow"><span className="eyebrow-icon"><History size={13}/></span> YOUR WORKSPACE</div><h2>Keep your momentum.</h2><p>Pick up where you left off and revisit a previous role.</p></div><span className="history-count">{history.length} {history.length === 1 ? 'ANALYSIS' : 'ANALYSES'}</span></div>{!token ? <div className="history-empty"><span><UserRound size={20}/></span><div><b>Your history lives here.</b><p>Sign in to keep your analysis close and come back whenever you need.</p></div><button className="text-action" onClick={() => { setAuthMode('login'); setAuthOpen(true); }}>Sign in <ArrowRight size={15}/></button></div> : history.length === 0 ? <div className="history-empty"><span><FileText size={20}/></span><div><b>Your next opportunity starts here.</b><p>Your saved analyses will show up in this space.</p></div><a className="text-action" href="#analyzer">Start your first analysis <ArrowRight size={15}/></a></div> : <div className="history-table"><div className="history-row history-labels"><span>ROLE & COMPANY</span><span>RESUME</span><span>DATE</span><span>FIT</span><span/></div>{history.map((item) => <button className="history-row" key={item.id} onClick={() => openHistory(item)}><span className="role-cell"><span className="history-file"><FileText size={17}/></span><span><b>{item.job_title}</b><small>{item.company || 'Company not specified'}</small></span></span><span className="resume-cell">{item.resume_name}</span><span className="date-cell">{dateLabel(item.created_at)}</span><span className="history-score">{item.score}<small>%</small></span><span className="history-open"><ArrowUpRight size={16}/></span></button>)}</div>}</section>
      <section className="about-section" id="about"><div className="section-wrap about-inner"><div><div className="eyebrow"><span className="eyebrow-icon"><CircleHelp size={13}/></span> A NOTE ON YOUR DATA</div><h2>Your story stays <span className="serif-accent">yours.</span></h2></div><p>HireLens processes text from your PDF to create your results. Your resume text is saved with your analysis history in your account’s database, so you can revisit it later. We never use your results to make hiring decisions.</p><a href="#analyzer">Start with care <ArrowRight size={15}/></a></div></section>
    </main>

    <footer className="footer"><div className="section-wrap footer-inner"><a className="brand footer-brand" href="#top"><span className="brand-mark"><Radar size={19}/></span><span>hirelens<span className="brand-dot">.</span></span></a><span className="footer-copy">A little more clarity for the road ahead.</span><span className="footer-right">© 2025 HireLens · Made for your next move <a href="#top" aria-label="Back to top"><ArrowUpRight size={15}/></a></span></div></footer>

    {authOpen && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setAuthOpen(false); }}><div className="auth-modal"><button className="modal-close icon-button" onClick={() => setAuthOpen(false)} aria-label="Close"><X size={19}/></button><div className="auth-brand"><span className="brand-mark"><Radar size={20}/></span><span>hirelens<span className="brand-dot">.</span></span></div><div className="eyebrow">{authMode === 'login' ? 'WELCOME BACK' : 'YOUR NEXT MOVE STARTS HERE'}</div><h2>{authMode === 'login' ? 'Good to see you.' : 'Make room for what’s next.'}</h2><p>{authMode === 'login' ? 'Sign in to pick up where you left off.' : 'Create an account to save your analysis and revisit it anytime.'}</p><form onSubmit={submitAuth} className="auth-form">{authMode === 'register' && <label className="field"><span>YOUR NAME</span><div className="input-wrap"><UserRound size={16}/><input name="name" placeholder="Full name" required minLength="2" maxLength="80"/></div></label>}<label className="field"><span>EMAIL ADDRESS</span><div className="input-wrap"><UserRound size={16}/><input name="email" type="email" placeholder="you@example.com" required/></div></label><label className="field"><span>PASSWORD</span><div className="input-wrap"><KeyRound size={16}/><input name="password" type="password" placeholder="At least 8 characters" required minLength="8" maxLength="128"/></div></label>{error && <div className="error-message"><CircleHelp size={15}/>{error}</div>}<button className="btn btn-green auth-submit" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={16}/> One moment</> : <>{authMode === 'login' ? 'Sign in' : 'Create my account'} <ArrowRight size={16}/></>}</button></form><div className="auth-switch">{authMode === 'login' ? 'New to HireLens?' : 'Already have an account?'} <button onClick={() => { setError(''); setAuthMode(authMode === 'login' ? 'register' : 'login'); }}>{authMode === 'login' ? 'Create an account' : 'Sign in'}</button></div><div className="auth-security"><LockKeyhole size={13}/> Your information is encrypted in transit and private to your account.</div></div></div>}
  </div>;
}

export default App;
