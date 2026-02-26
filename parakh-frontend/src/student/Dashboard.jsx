import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8081';

const badge = (status) => {
  const map = {
    PENDING: 'bg-blue-50 text-blue-800 border border-blue-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-800 border border-amber-200',
    COMPLETED: 'bg-green-50 text-green-800 border border-green-200',
    TERMINATED: 'bg-red-50 text-red-800 border border-red-200',
  };
  return map[status] || 'bg-gray-100 text-gray-600 border border-gray-200';
};

const diffBadge = (d) => {
  const map = { Easy: 'text-green-700 bg-green-50', Medium: 'text-amber-700 bg-amber-50', Hard: 'text-red-700 bg-red-50' };
  return map[d] || 'text-gray-600 bg-gray-50';
};

const integrityColor = (score) => {
  if (score == null) return 'text-gray-400';
  if (score >= 90) return 'text-green-700';
  if (score >= 70) return 'text-amber-600';
  return 'text-red-600';
};

const riskColor = (r) => {
  if (!r) return 'text-gray-400';
  if (r === 'LOW') return 'text-green-700';
  if (r === 'MEDIUM') return 'text-amber-600';
  return 'text-red-600';
};

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }) => (
  <div className={`bg-white border border-gray-200 p-4 flex flex-col gap-1 border-l-4 ${accent}`}>
    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
    <span className="text-2xl font-bold text-gray-900 font-mono">{value ?? '—'}</span>
    {sub && <span className="text-xs text-gray-500">{sub}</span>}
  </div>
);

// ── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, sub }) => (
  <div className="border-b border-gray-200 pb-2 mb-4">
    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-800">{title}</h2>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ── Table ────────────────────────────────────────────────────────────────────
const Table = ({ heads, rows, empty }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          {heads.map(h => (
            <th key={h} className="px-4 py-2 text-left font-bold uppercase tracking-wider text-gray-500">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={heads.length} className="px-4 py-8 text-center text-gray-400 italic">{empty}</td></tr>
          : rows}
      </tbody>
    </table>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [cognitiveProfile, setCognitive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [starting, setStarting] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  const [reassessment, setReassessment] = useState(null);
  const [systemNotice, setSystemNotice] = useState(null);

  const h = { Authorization: `Bearer ${user?.token}` };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/student/assessments`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/student/classes`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/student/my/intelligence-report`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/student/my/learning-path`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/student/my/cognitive-profile`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/student/my/notifications`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/student/my/reassessment-status`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/public/config/notice`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([a, cls, i, l, c, notif, ra, notice]) => {
      setAssessments(a);
      setClasses(cls);
      setIntelligence(i);
      setLearningPath(l);
      setCognitive(c);
      if (notif?.unreadCount) setNotifCount(notif.unreadCount);
      setReassessment(ra);
      setSystemNotice(notice);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleStart = async (assessmentId) => {
    setStarting(assessmentId);
    try {
      const res = await fetch(`${API}/api/exam/start`, {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId }),
      });
      const data = await res.json();
      if (res.ok) navigate(`/student/exam/${data.examId}`);
      else alert('Unable to start exam: ' + (data.message || 'Unknown error'));
    } catch (e) { console.error(e); }
    finally { setStarting(null); }
  };

  const pending = assessments.filter(a => a.status === 'PENDING');
  const inProgress = assessments.filter(a => a.status === 'IN_PROGRESS');
  const completed = assessments.filter(a => ['COMPLETED', 'TERMINATED'].includes(a.status));

  const predictive = intelligence?.predictive || {};
  const avgIntegrity = completed.length
    ? Math.round(completed.reduce((s, a) => s + (a.integrityScore ?? 100), 0) / completed.length)
    : null;

  const navItems = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'classes', label: 'My Classes' },
    { id: 'exams', label: 'My Examinations' },
    { id: 'history', label: 'Exam History' },
    { id: 'intel', label: 'Intelligence Report' },
    { id: 'path', label: 'Learning Path' },
  ];

  const externalNavItems = [
    { label: 'Academic Profile', path: '/student/profile', icon: '👤' },
    { label: 'Competency Transcript', path: '/student/competency', icon: '📜' },
    { label: 'Progress Timeline', path: '/student/timeline', icon: '📈' },
    { label: 'Notifications', path: '/student/notifications', icon: '🔔', badge: notifCount > 0 ? notifCount : null },
  ];

  return (
    <div className="h-screen bg-gray-50 flex font-sans overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="w-60 bg-[#1a237e] text-white flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 bg-white/20 text-white flex items-center justify-center font-black text-xs rounded">P</div>
            <span className="text-base font-bold tracking-tight">PARAKH</span>
          </div>
          <p className="text-[10px] text-blue-200 uppercase tracking-widest">National Assessment Portal</p>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-blue-400/70 px-3 py-1 mt-1">Dashboard</p>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setActiveNav(n.id)}
              className={`w-full text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wide rounded transition-all
                ${activeNav === n.id ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'}`}>
              {n.label}
            </button>
          ))}

          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-blue-400/70 px-3 py-1 mt-3">Analytics</p>
          {externalNavItems.map(n => (
            <button key={n.path} onClick={() => navigate(n.path)}
              className="w-full text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wide rounded transition-all text-blue-200 hover:bg-white/10 hover:text-white flex items-center justify-between">
              <span>{n.icon} {n.label}</span>
              {n.badge && <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{n.badge}</span>}
            </button>
          ))}

          {reassessment?.foundationRequired && (
            <div className="mx-2 mt-3 p-2.5 bg-red-900/40 border border-red-500/40 rounded">
              <p className="text-[9px] font-bold uppercase text-red-300 mb-1">⚠ Foundation Mode</p>
              <p className="text-[9px] text-red-200 leading-snug">Advanced exams blocked. Complete a remedial session first.</p>
            </div>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 bg-black/20">
          <p className="text-xs font-bold text-white truncate">{user?.name}</p>
          <p className="text-[10px] text-blue-300 mb-3">Student · Candidate</p>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full py-1.5 bg-red-700 hover:bg-red-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm transition">
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-base font-bold uppercase tracking-widest text-gray-900">
              {navItems.find(n => n.id === activeNav)?.label}
            </h1>
            <p className="text-xs text-gray-400">Welcome back, {user?.name} · {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
          </div>
          <div className="flex items-center gap-3">
            {reassessment?.foundationRequired && (
              <span className="flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-300 px-3 py-1 text-xs font-bold uppercase">
                🚫 Foundation Required
              </span>
            )}
            {inProgress.length > 0 && (
              <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold uppercase">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                {inProgress.length} Exam In Progress
              </span>
            )}
            <button onClick={() => navigate('/student/notifications')}
              className="relative px-3 py-1.5 border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              🔔
              {notifCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{notifCount}</span>
              )}
            </button>
          </div>
        </header>

        {/* Global System Notice */}
        {systemNotice?.enabled && (
          <div className={`px-8 py-3 flex items-center justify-between gap-4 border-b animate-in fade-in duration-500 
            ${systemNotice.priority === 'CRITICAL' ? 'bg-red-600 text-white' :
              systemNotice.priority === 'HIGH' ? 'bg-orange-500 text-white' :
                systemNotice.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                  'bg-blue-600 text-white'}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {systemNotice.priority === 'CRITICAL' ? '🚨' : systemNotice.priority === 'HIGH' ? '⚠️' : 'ℹ️'}
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-widest">{systemNotice.title}</p>
                <p className="text-sm font-medium">{systemNotice.message}</p>
              </div>
            </div>
            <button onClick={() => setSystemNotice({ ...systemNotice, enabled: false })} className="text-white/70 hover:text-white transition-colors">
              ✕
            </button>
          </div>
        )}

        {/* Reassessment Enforcement Banner */}
        {reassessment?.foundationRequired && (
          <div className="mx-8 mt-4 bg-red-50 border border-red-400 p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚫</span>
              <div>
                <p className="text-xs font-bold text-red-800 uppercase mb-1">Foundation Reassessment Required — Advanced Exams Blocked</p>
                <p className="text-xs text-red-700">{reassessment.message}</p>
              </div>
            </div>
            <button onClick={async () => {
              try {
                const res = await fetch(`${API}/api/student/start-remedial`, { method: 'POST', headers: h });
                const d = await res.json();
                if (d.examId) navigate(`/student/exam/${d.examId}`);
                else alert(d.error || 'No remedial session available.');
              } catch { alert('Failed.'); }
            }} className="flex-shrink-0 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider transition">
              Start Remedial →
            </button>
          </div>
        )}

        <div className="p-8 space-y-8">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <>
              {/* ══════════════════════════════════════════════
                  OVERVIEW TAB
              ══════════════════════════════════════════════ */}
              {activeNav === 'dashboard' && (
                <div className="space-y-6">
                  {/* Welcome Banner */}
                  <div className="bg-[#1a237e] text-white p-6 rounded flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}.</h2>
                      <p className="text-blue-200 text-sm">
                        {pending.length} pending examination{pending.length !== 1 ? 's' : ''} · {completed.length} completed
                        {inProgress.length > 0 && ` · ${inProgress.length} in progress`}
                      </p>
                    </div>
                    {inProgress.length > 0 && (
                      <button onClick={() => navigate(`/student/exam/${inProgress[0].examId}`)}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest px-5 py-2 rounded transition">
                        Resume Active Exam →
                      </button>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Pending Exams" value={pending.length} accent="border-blue-500" />
                    <StatCard label="Completed Exams" value={completed.length} accent="border-green-500" />
                    <StatCard label="Risk Level" value={predictive?.riskCategory || '—'} accent={`border-${predictive?.riskCategory === 'LOW' ? 'green' : predictive?.riskCategory === 'MEDIUM' ? 'amber' : 'red'}-500`} />
                    <StatCard label="Confidence Score" value={predictive?.confidenceScore != null ? Math.round(predictive.confidenceScore) + '%' : '—'} accent="border-indigo-500" />
                  </div>

                  {/* In-Progress Alert Card */}
                  {inProgress.length > 0 && (
                    <div className="bg-amber-50 border border-amber-300 p-4 rounded flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase text-amber-800 mb-0.5">⚠ Active Examination Session</p>
                        <p className="text-sm font-semibold text-amber-900">{inProgress[0].title} — {inProgress[0].subject}</p>
                      </div>
                      <button onClick={() => navigate(`/student/exam/${inProgress[0].examId}`)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wide px-4 py-2 rounded transition">
                        Continue Exam
                      </button>
                    </div>
                  )}

                  {/* Intelligence Snapshot */}
                  {intelligence && (
                    <div>
                      <SectionHeader title="Intelligence Snapshot" sub="Real-time academic intelligence metrics" />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="bg-white border border-gray-200 p-4">
                          <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Risk Indicator</p>
                          <p className={`text-xl font-bold ${riskColor(predictive?.riskCategory)}`}>{predictive?.riskCategory || '—'}</p>
                          <p className="text-xs text-gray-400 mt-1">Score: {predictive?.riskScore != null ? Math.round(predictive.riskScore) : '—'}/100</p>
                        </div>
                        <div className="bg-white border border-gray-200 p-4">
                          <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Growth Index</p>
                          <p className={`text-xl font-bold ${(predictive?.growthIndex ?? 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {predictive?.growthIndex != null ? (predictive.growthIndex >= 0 ? '+' : '') + predictive.growthIndex.toFixed(1) : '—'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Difficulty progression</p>
                        </div>
                        <div className="bg-white border border-gray-200 p-4">
                          <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Weakest Topic</p>
                          <p className="text-sm font-bold text-red-700 truncate">{predictive?.weakestTopicPrediction?.topic || '—'}</p>
                          <p className="text-xs text-gray-400 mt-1">{predictive?.weakestTopicPrediction?.advice || 'No data yet'}</p>
                        </div>
                        <div className="bg-white border border-gray-200 p-4">
                          <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Confidence Score</p>
                          <p className="text-xl font-bold text-indigo-700">{predictive?.confidenceScore != null ? Math.round(predictive.confidenceScore) + '%' : '—'}</p>
                        </div>
                        <div className="bg-white border border-gray-200 p-4">
                          <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Consistency Index</p>
                          <p className="text-xl font-bold text-teal-700">{predictive?.consistencyIndex != null ? Math.round(predictive.consistencyIndex) + '%' : '—'}</p>
                        </div>
                        <div className="bg-white border border-gray-200 p-4">
                          <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Avg Integrity Score</p>
                          <p className={`text-xl font-bold ${integrityColor(avgIntegrity)}`}>{avgIntegrity != null ? avgIntegrity + '/100' : '—'}</p>
                          <p className="text-xs text-gray-400 mt-1">Across {completed.length} exams</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Learning Path Preview */}
                  {learningPath && (
                    <div>
                      <SectionHeader title="Learning Path Preview" sub="Adaptive 4-week intervention plan" />
                      <div className="bg-white border border-gray-200 p-5">
                        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-400 mb-1">Active Strategy</p>
                            <p className="text-sm font-semibold text-gray-800 max-w-xl">{learningPath.overallStrategy}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Weakest Topic</p>
                            <p className="text-sm font-bold text-red-700">{learningPath.weakestTopic}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${learningPath.riskCategory === 'HIGH' ? 'bg-red-100 text-red-700' : learningPath.riskCategory === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                              {learningPath.riskCategory} RISK
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {(learningPath.weekPlans || []).map(w => (
                            <div key={w.week} className="border border-gray-200 p-3 bg-gray-50">
                              <p className="text-[10px] font-bold uppercase text-blue-700 mb-1">Week {w.week}</p>
                              <p className="text-xs font-semibold text-gray-800 mb-1">{w.focus}</p>
                              <p className="text-[10px] text-gray-500">{w.bloomTransition}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{w.recommendedHours}h · {w.questionTarget} Qs</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  EXAMS TAB
              ══════════════════════════════════════════════ */}
              {/* ══════════════════════════════════════════════
                  CLASSES TAB
              ══════════════════════════════════════════════ */}
              {activeNav === 'classes' && (
                <div className="space-y-6">
                  <SectionHeader title="Enrolled Classrooms" sub="Your active academic groups" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-gray-400 italic bg-white border border-gray-100">
                        You are not enrolled in any classes yet.
                      </div>
                    ) : (
                      classes.map(c => (
                        <div key={c.id} className="bg-white border-l-4 border-l-blue-600 border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-tight">{c.name}</h3>
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">{c.subject}</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-4 line-clamp-2">{c.description}</p>
                          <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Teacher: {c.teacher?.name || 'Assigned'}</span>
                            <button className="text-[10px] font-black text-blue-600 uppercase hover:underline">View Stream →</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  EXAMS TAB
              ══════════════════════════════════════════════ */}
              {activeNav === 'exams' && (
                <div className="space-y-6">
                  <div>
                    <SectionHeader title="Available Examinations" sub="Scheduled assessments for your enrolled classes" />
                    <Table
                      heads={['Title', 'Subject', 'Class', 'Duration', 'Attempts', 'Status', 'Action']}
                      empty="No examinations available for your enrolled classes."
                      rows={assessments.map(a => (
                        <tr key={a.id} className="border-b border-gray-100 hover:bg-blue-50/10 transition-colors">
                          <td className="px-4 py-4 font-bold text-gray-900">
                            {a.title}
                            {a.availableUntil && (
                              <p className="text-[9px] text-red-500 font-bold mt-1 uppercase">Closes: {new Date(a.availableUntil).toLocaleString()}</p>
                            )}
                          </td>
                          <td className="px-4 py-4 text-gray-600">{a.subject}</td>
                          <td className="px-4 py-4">
                            <span className="text-[10px] font-bold uppercase text-gray-500">{a.classroom}</span>
                          </td>
                          <td className="px-4 py-4 text-gray-600 font-mono italic">{a.durationMinutes}m</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-gray-700">{a.attemptCount}/{a.maxAttempts}</span>
                                <div className="w-12 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full ${a.attemptCount >= a.maxAttempts ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(100, (a.attemptCount / a.maxAttempts) * 100)}%` }} />
                                </div>
                              </div>
                              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">Used Attempts</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${a.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                a.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                                  'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <button onClick={() => handleStart(a.id)}
                              disabled={starting === a.id || (a.status !== 'IN_PROGRESS' && !a.canAttempt)}
                              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded transition-all shadow-sm
                                ${a.status === 'IN_PROGRESS' ? 'bg-amber-600 hover:bg-amber-700 text-white' :
                                  a.canAttempt ? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                              {starting === a.id ? 'Starting...' : a.status === 'IN_PROGRESS' ? 'Resume →' : 'Attempt Test'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    />
                  </div>

                  {/* In Progress */}
                  {inProgress.length > 0 && (
                    <div>
                      <SectionHeader title="Active Sessions" sub="Examinations currently underway" />
                      <Table
                        heads={['Title', 'Subject', 'Class', 'Status', 'Action']}
                        empty=""
                        rows={inProgress.map(a => (
                          <tr key={a.id} className="border-b border-gray-100 bg-amber-50/30">
                            <td className="px-4 py-3 font-semibold text-gray-900">{a.title}</td>
                            <td className="px-4 py-3 text-gray-600">{a.subject}</td>
                            <td className="px-4 py-3 text-gray-600">{a.classroom}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${badge('IN_PROGRESS')}`}>In Progress</span>
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => navigate(`/student/exam/${a.examId}`)}
                                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wide rounded transition">
                                Resume
                              </button>
                            </td>
                          </tr>
                        ))}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  HISTORY TAB
              ══════════════════════════════════════════════ */}
              {activeNav === 'history' && (
                <div>
                  <SectionHeader title="Examination History" sub="All attempted and completed examinations" />
                  <Table
                    heads={['Title', 'Subject', 'Score', 'Status', 'Integrity', '']}
                    empty="No completed examinations yet."
                    rows={completed.map(a => (
                      <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900">{a.title}</td>
                        <td className="px-4 py-3 text-gray-600">{a.subject}</td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-900">{a.score ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${badge(a.status)}`}>{a.status}</span>
                        </td>
                        <td className={`px-4 py-3 font-mono font-bold ${integrityColor(a.integrityScore)}`}>
                          {a.integrityScore != null ? Math.round(a.integrityScore) + '/100' : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => navigate(`/student/result/${a.examId}`)}
                            className="text-blue-700 font-bold text-[10px] uppercase hover:underline">
                            View Result →
                          </button>
                        </td>
                      </tr>
                    ))}
                  />
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  INTELLIGENCE TAB
              ══════════════════════════════════════════════ */}
              {activeNav === 'intel' && (
                <div className="space-y-6">
                  {!intelligence ? (
                    <div className="bg-white border border-gray-200 p-12 text-center text-gray-400 text-sm">
                      No intelligence data yet. Complete at least one exam to generate your report.
                    </div>
                  ) : (
                    <>
                      <SectionHeader title="Predictive Intelligence" sub="AI-generated academic intelligence score" />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { label: 'Risk Score', val: predictive?.riskScore != null ? Math.round(predictive.riskScore) + '/100' : '—', accent: 'border-red-500' },
                          { label: 'Risk Category', val: predictive?.riskCategory || '—', accent: 'border-red-400' },
                          { label: 'Growth Index', val: predictive?.growthIndex != null ? predictive.growthIndex.toFixed(2) : '—', accent: 'border-green-500' },
                          { label: 'Confidence Score', val: predictive?.confidenceScore != null ? Math.round(predictive.confidenceScore) + '%' : '—', accent: 'border-indigo-500' },
                          { label: 'Consistency Index', val: predictive?.consistencyIndex != null ? Math.round(predictive.consistencyIndex) + '%' : '—', accent: 'border-teal-500' },
                          { label: 'Retention Score', val: cognitiveProfile?.retentionScore != null ? cognitiveProfile.retentionScore.toFixed(1) + '%' : '—', accent: 'border-purple-500' },
                        ].map(s => <StatCard key={s.label} {...s} value={s.val} />)}
                      </div>

                      {/* Topic Mastery */}
                      {intelligence.topicMastery && Object.keys(intelligence.topicMastery).length > 0 && (
                        <div>
                          <SectionHeader title="Topic Mastery Breakdown" />
                          <div className="bg-white border border-gray-200 p-4 space-y-2">
                            {Object.entries(intelligence.topicMastery).map(([topic, pct]) => (
                              <div key={topic} className="flex items-center gap-3">
                                <span className="text-xs text-gray-600 w-36 flex-shrink-0 truncate">{topic}</span>
                                <div className="flex-1 bg-gray-100 h-3 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.round(pct * 100)}%` }} />
                                </div>
                                <span className="text-xs font-mono font-bold text-gray-700 w-10 text-right">{Math.round(pct * 100)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bloom Distribution */}
                      {intelligence.bloomDistribution && (
                        <div>
                          <SectionHeader title="Bloom's Taxonomy Distribution" />
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(intelligence.bloomDistribution).map(([level, val]) => (
                              <div key={level} className="bg-white border border-gray-200 p-3 text-center">
                                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">{level}</p>
                                <p className="text-xl font-bold text-indigo-700 font-mono">{Math.round((val || 0) * 100)}%</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  LEARNING PATH TAB
              ══════════════════════════════════════════════ */}
              {activeNav === 'path' && (
                <div className="space-y-6">
                  {!learningPath ? (
                    <div className="bg-white border border-gray-200 p-12 text-center text-gray-400 text-sm">
                      No learning path available yet. Complete at least one exam to generate your personalised plan.
                    </div>
                  ) : (
                    <>
                      <div className="bg-[#1a237e] text-white p-6 rounded">
                        <p className="text-[10px] uppercase tracking-widest text-blue-300 mb-1">Adaptive Learning Plan</p>
                        <p className="text-base font-bold mb-2">{learningPath.overallStrategy}</p>
                        <div className="flex gap-4 text-xs text-blue-200">
                          <span>Weakest Topic: <strong className="text-white">{learningPath.weakestTopic}</strong></span>
                          <span>·</span>
                          <span>Risk: <strong className="text-white">{learningPath.riskCategory}</strong></span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(learningPath.weekPlans || []).map(w => (
                          <div key={w.week} className="bg-white border border-gray-200 p-5">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-xs font-bold uppercase text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">Week {w.week}</span>
                              <span className="text-[10px] text-gray-400 font-mono">{w.recommendedHours}h · {w.questionTarget} Questions</span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-sm mb-1">{w.focus}</h3>
                            <p className="text-xs text-gray-500 mb-2">{w.difficultyMix}</p>
                            <p className="text-[10px] text-indigo-600 font-semibold uppercase">{w.bloomTransition}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
