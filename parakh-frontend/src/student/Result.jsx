import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line
} from 'recharts';
import { Download, Brain, HelpCircle, Calendar, Trophy, Zap } from 'lucide-react';
import { Skeleton, EmptyState, LoadingOverlay } from '../components/SharedUI';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API = 'http://localhost:8081';

const riskColor = { LOW: '#16a34a', MEDIUM: '#d97706', HIGH: '#dc2626' };
const riskBg = { LOW: '#f0fdf4', MEDIUM: '#fffbeb', HIGH: '#fef2f2' };
const riskBorder = { LOW: '#86efac', MEDIUM: '#fcd34d', HIGH: '#fca5a5' };

const interventionLabel = {
  INTENSIVE_REMEDIATION: { label: 'Intensive Remediation', color: '#dc2626', bg: '#fef2f2' },
  TARGETED_REMEDIATION: { label: 'Targeted Remediation', color: '#d97706', bg: '#fffbeb' },
  FOUNDATIONAL_REVIEW: { label: 'Foundational Review', color: '#d97706', bg: '#fffbeb' },
  SUPPLEMENTAL_PRACTICE: { label: 'Supplemental Practice', color: '#0891b2', bg: '#f0f9ff' },
  ENRICHMENT_CHALLENGE: { label: 'Enrichment Challenge', color: '#16a34a', bg: '#f0fdf4' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ConfidenceGauge = ({ value }) => {
  const pct = Math.min(100, Math.max(0, value || 0));
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
  const label = pct >= 70 ? 'High Confidence' : pct >= 40 ? 'Moderate' : 'Low Confidence';
  const total = 20;
  const filled = Math.round((pct / 100) * total);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1 flex-wrap justify-center" style={{ maxWidth: 180 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            width: 7, height: 18, borderRadius: 2,
            background: i < filled ? color : '#e2e8f0', transition: 'background 0.4s'
          }} />
        ))}
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold" style={{ color }}>{pct.toFixed(1)}%</div>
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{label}</div>
      </div>
    </div>
  );
};

const GrowthIndicator = ({ direction, index }) => {
  const cfg = {
    UP: { icon: '↑', color: '#16a34a', label: 'Improving', bg: '#f0fdf4' },
    DOWN: { icon: '↓', color: '#dc2626', label: 'Declining', bg: '#fef2f2' },
    STABLE: { icon: '→', color: '#0891b2', label: 'Stable', bg: '#f0f9ff' },
  };
  const c = cfg[direction] || cfg.STABLE;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold"
        style={{ background: c.bg, color: c.color, border: `2px solid ${c.color}` }}>
        {c.icon}
      </div>
      <div className="text-center">
        <div className="text-xl font-bold" style={{ color: c.color }}>
          {index > 0 ? '+' : ''}{(index || 0).toFixed(1)}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{c.label}</div>
      </div>
    </div>
  );
};

const ConsistencyMeter = ({ value }) => {
  const pct = Math.min(100, Math.max(0, value || 0));
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
  const label = pct >= 70 ? 'Consistent' : pct >= 40 ? 'Variable' : 'Erratic';
  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-bold uppercase text-slate-600">Learning Consistency</span>
        <span className="text-xs font-bold" style={{ color }}>{label} — {pct.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
        <div className="h-3 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
      </div>
      <div className="flex justify-between mt-0.5 text-[10px] text-slate-400">
        <span>Erratic</span><span>Variable</span><span>Consistent</span>
      </div>
    </div>
  );
};

const RiskBreakdown = ({ breakdown }) => {
  const [open, setOpen] = useState(false);
  if (!breakdown) return null;
  const signals = [
    { key: 'topicMasteryRisk', label: 'Topic Mastery Gap', icon: '📚' },
    { key: 'slowWrongRisk', label: 'Slow + Wrong Frequency', icon: '⏱' },
    { key: 'bloomRegressionRisk', label: 'Bloom Regression', icon: '📉' },
    { key: 'difficultyRegressionRisk', label: 'Difficulty Regression', icon: '🎯' },
  ];
  return (
    <div className="border border-slate-200 rounded-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-4 py-2.5 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-700 hover:bg-slate-100 transition-colors">
        <span>Risk Signal Breakdown</span><span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-4 space-y-3">
          {signals.map(({ key, label, icon }) => {
            const v = breakdown[key] || 0;
            const c = v >= 60 ? '#dc2626' : v >= 35 ? '#d97706' : '#16a34a';
            return (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{icon} {label}</span>
                  <span className="font-bold" style={{ color: c }}>{v.toFixed(1)} / 100</span>
                </div>
                <div className="w-full bg-slate-100 rounded h-2">
                  <div className="h-2 rounded transition-all" style={{ width: `${v}%`, background: c }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

const MixBar = ({ data, label, unit = '%' }) => {
  const colors = {
    Easy: '#16a34a', Medium: '#d97706', Hard: '#dc2626',
    Remember: '#6366f1', Understand: '#0891b2', Apply: '#d97706', Analyze: '#dc2626'
  };
  const entries = Object.entries(data || {});
  if (!entries.length) return null;
  return (
    <div>
      <p className="text-xs font-bold text-slate-700 uppercase mb-2">{label}</p>
      <div className="flex rounded overflow-hidden h-7 w-full">
        {entries.map(([key, val]) => (
          <div key={key}
            style={{ width: `${val}%`, background: colors[key] || '#64748b' }}
            title={`${key}: ${val}${unit}`}
            className="flex items-center justify-center text-[9px] font-bold text-white overflow-hidden whitespace-nowrap px-0.5">
            {val >= 15 ? `${key} ${val}%` : val >= 8 ? `${val}%` : ''}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-1.5 flex-wrap">
        {entries.map(([key, val]) => (
          <span key={key} className="text-[10px] text-slate-600">
            <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: colors[key] || '#64748b' }} />
            {key}: <strong>{val}%</strong>
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Result = () => {
  const { user } = useAuth();
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const [report, setReport] = useState(null);
  const [remedial, setRemedial] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remLoading, setRemLoading] = useState(false);
  const [remError, setRemError] = useState(null);
  const [started, setStarted] = useState(null); // {examId, topic}
  const [activeTab, setActiveTab] = useState('overview');
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [learningPath, setLearningPath] = useState(null);
  const [pathLoading, setPathLoading] = useState(false);
  const [trajectoryData, setTrajectoryData] = useState([]);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (activeTab === 'roadmap' && !learningPath) {
      fetchLearningPath();
    }
  }, [activeTab]);

  const fetchLearningPath = async () => {
    setPathLoading(true);
    try {
      const res = await fetch(`${API}/api/student/my/learning-path`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.ok) setLearningPath(await res.json());
    } catch (e) { console.error(e); }
    finally { setPathLoading(false); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const hdrs = { Authorization: `Bearer ${user?.token}` };
      const [reportRes, examsRes, remRes] = await Promise.all([
        fetch(`${API}/api/student/my/intelligence-report`, { headers: hdrs }),
        fetch(`${API}/api/student/assessments`, { headers: hdrs }),
        fetch(`${API}/api/student/my/remediation-plan`, { headers: hdrs }),
      ]);
      if (reportRes.ok) {
        const data = await reportRes.json();
        setReport(data);
        if (data.latestProgressCard) {
          const card = data.latestProgressCard;
          const diffs = card.difficultyHistory || [];
          const blooms = card.bloomHistory || [];
          const topics = card.topicHistory || [];
          const integrity = card.integrityEvents || [];

          const trajectory = diffs.map((d, i) => ({
            index: i + 1,
            difficulty: d,
            difficultyVal: d === 'HARD' ? 3 : d === 'MEDIUM' ? 2 : 1,
            bloom: blooms[i] || 'Remember',
            bloomVal: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].indexOf(blooms[i] || 'Remember') + 1,
            topic: topics[i] || 'General',
            hasViolation: integrity.some(v => v.includes(`Q${i + 1}:`))
          }));
          setTrajectoryData(trajectory);
        }
      }
      if (examsRes.ok) {
        const data = await examsRes.json();
        setExams(data.filter(a => a.status === 'COMPLETED' || a.status === 'TERMINATED'));
      }
      if (remRes.ok) setRemedial(await remRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }

    // Fetch AI Summary (separate for feature isolation)
    setAiLoading(true);
    try {
      const aiRes = await fetch(`${API}/api/student/my/ai-summary`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setAiSummary(aiData.summary);
      }
    } catch (e) { console.error("AI Summary toggle is off or failed", e); }
    finally { setAiLoading(false); }
  };

  const handleStartRemedial = async () => {
    setRemLoading(true); setRemError(null);
    try {
      const res = await fetch(`${API}/api/student/start-remedial`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStarted({ examId: data.examId, topic: data.topic || data.recommendedTopic });
      } else {
        const err = await res.json();
        setRemError(err.error || 'Failed to start remedial session.');
      }
    } catch (e) { setRemError('Network error. Please try again.'); }
    finally { setRemLoading(false); }
  };

  const handleDownloadPDF = async () => {
    const input = document.getElementById('report-content');
    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Parakh_Report_${user?.name?.replace(/\s+/g, '_')}.pdf`);
  };

  const card = report?.latestProgressCard || {};
  const predictive = report?.predictive || {};
  const riskInd = predictive.riskCategory || card.riskIndicator || 'LOW';

  const bloomData = Object.entries(report?.bloomLevelDistribution || {}).map(([name, value]) => ({ name, value }));
  const topicData = Object.entries(report?.topicMasteryIndex || {}).map(([topic, mastery]) => ({
    topic: topic.length > 12 ? topic.substring(0, 10) + '..' : topic, mastery
  }));
  const diffData = Object.entries(report?.difficultySuccessRate || {}).map(([name, value]) => ({ name, value }));
  const growthData = (report?.growthTrend || []).map(g => ({
    date: g.date, score: g.academicScore, competency: g.competencyIndex
  }));

  const intConfig = interventionLabel[remedial?.interventionType] || interventionLabel.SUPPLEMENTAL_PRACTICE;

  const tabs = [
    { id: 'overview', label: 'Progress Card' },
    { id: 'trajectory', label: '🌊 Adaptive Trajectory' },
    { id: 'predictive', label: '🔮 Predictive' },
    { id: 'remedial', label: '🎯 Remediation' },
    { id: 'topics', label: 'Topic Mastery' },
    { id: 'bloom', label: 'Bloom Analysis' },
    { id: 'roadmap', label: '📅 Roadmap' },
    { id: 'cognitive', label: '📈 Cognitive Growth' },
    { id: 'history', label: 'Exam History' },
    { id: 'integrity', label: '🔒 Integrity Report' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-800 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-slate-600 font-bold uppercase text-sm">Loading Intelligence Report...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-white border border-slate-300 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">PARAKH National Assessment Centre</p>
              <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-tight mt-1">Educational Intelligence Report</h1>
              <p className="text-sm text-slate-600 mt-1">
                Candidate: <strong>{user?.name}</strong> &nbsp;|&nbsp;
                Roll No: <span className="font-mono">2024-ST-{String(user?.id || '001').padStart(4, '0')}</span> &nbsp;|&nbsp;
                Exams Taken: <strong>{report?.totalExamsTaken || 0}</strong>
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase rounded-sm hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Download size={14} /> Download Official Report
              </button>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm font-bold text-sm uppercase"
                style={{ background: riskBg[riskInd], color: riskColor[riskInd], border: `2px solid ${riskBorder[riskInd]}` }}>
                <span className="text-base">{riskInd === 'HIGH' ? '🔴' : riskInd === 'MEDIUM' ? '🟡' : '🟢'}</span>
                Risk Profile: {riskInd}
                {predictive.riskScore != null && <span className="font-mono text-xs opacity-75">({predictive.riskScore}/100)</span>}
              </div>
              <p className="text-xs text-slate-500">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div id="report-content">

          {/* Tab Navigation */}
          <div className="flex bg-white border border-slate-200 mb-6 overflow-hidden shadow-sm overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wide transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-800 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Overview Tab ────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div>
              {/* STATUS BANNER & FLAG BADGE */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pt-2">
                <div className="flex items-center gap-3">
                  <div className="bg-[#1a237e] text-white p-3 rounded shadow-lg">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">
                      {examId ? `Assessment Result: #${examId}` : 'Intelligence Quotient Report'}
                    </h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {examId ? 'Specific Session Analysis' : 'Historical Performance Summary'}
                    </p>
                  </div>
                </div>

                {((examId && exams.find(e => String(e.id) === String(examId))?.integrityScore < 70) || (card.integrityScore < 70) || (report.avgIntegrityScore < 70)) && (
                  <div className="flex items-center gap-2 bg-red-100 border-2 border-red-200 px-4 py-2 rounded-sm shadow-sm animate-pulse">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="text-[10px] font-black text-red-700 uppercase leading-none mb-1">Session Flagged</p>
                      <p className="text-[9px] font-bold text-red-600 uppercase tracking-tighter">Integrity Violation Detected</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
                {[
                  { label: 'Raw Score', value: (examId ? (exams.find(e => String(e.id) === String(examId))?.score + "/" + (exams.find(e => String(e.id) === String(examId))?.totalQuestions || 0)) : (exams[0] ? (exams[0].score + "/" + (exams[0].totalQuestions || 0)) : "0/0")), color: '#1a237e' },
                  { label: 'Academic Score', value: `${card.academicScore ?? 0}%`, color: '#1e40af' },
                  { label: 'Competency Index', value: `${card.competencyIndex ?? 0}%`, color: '#7c3aed' },
                  { label: 'Growth Score', value: `${card.growthScore ?? 0}%`, color: '#059669' },
                  { label: 'Confidence', value: `${(predictive.confidenceScore ?? card.confidenceScore ?? 0).toFixed(1)}%`, color: '#d97706' },
                  { label: 'Risk Score', value: `${predictive.riskScore ?? card.riskScore ?? 0}`, color: riskColor[riskInd] },
                  { label: 'Consistency', value: `${(predictive.consistencyIndex ?? card.learningConsistency ?? 0).toFixed(1)}%`, color: '#0891b2' },
                  { label: 'Integrity Index', value: `${report.avgIntegrityScore ?? 100}%`, color: (report.avgIntegrityScore ?? 100) >= 90 ? '#16a34a' : (report.avgIntegrityScore ?? 100) >= 70 ? '#d97706' : '#dc2626' },
                ].map((item, i) => (
                  <div key={i} className="bg-white border border-slate-200 p-4 shadow-sm text-center">
                    <div className="text-2xl font-bold mb-1" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</div>
                  </div>
                ))}
              </div>
              {card.aiExplanation && (
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
                  <p className="text-xs font-bold text-blue-700 uppercase mb-1 tracking-wider">🤖 Rule-Based Assessment</p>
                  <p className="text-sm text-blue-900">{card.aiExplanation}</p>
                </div>
              )}

              {/* AI Progress Narrative */}
              <div className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white p-6 shadow-xl mb-6 flex items-start gap-4">
                <div className="text-4xl">🧠</div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300 mb-1">AI-Powered Progress Narrative</p>
                  {aiLoading ? (
                    <div className="animate-pulse flex space-y-2 flex-col">
                      <div className="h-2 bg-blue-700 rounded w-3/4"></div>
                      <div className="h-2 bg-blue-700 rounded w-1/2"></div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed opacity-90 italic">
                      {aiSummary || "Complete more assessments to generate a personalized AI growth narrative."}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">Learning Growth Trend</h3>
                  {growthData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={growthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="score" name="Academic Score" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="competency" name="Competency Index" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-slate-400 italic text-sm">Complete more exams to see growth trend</div>
                  )}
                </div>
                <div className="bg-white border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">Difficulty Success Rate</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={diffData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={v => `${v}%`} />
                      <Bar dataKey="value" name="Success %" fill="#1d4ed8" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Adaptive Trajectory */}
              {(card.difficultyHistory || card.bloomHistory) && (
                <div className="bg-white border border-slate-200 p-5 shadow-sm mt-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">Latest Session Adaptive Trajectory</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {card.difficultyHistory && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Difficulty Transitions</p>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={card.difficultyHistory.map((v, i) => ({ q: i + 1, level: v === 'Easy' ? 1 : v === 'Medium' ? 2 : 3, name: v }))}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis dataKey="q" tick={{ fontSize: 10 }} label={{ value: 'Question #', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                              <YAxis domain={[0.5, 3.5]} ticks={[1, 2, 3]} tickFormatter={v => v === 1 ? 'Easy' : v === 2 ? 'Med' : 'Hard'} tick={{ fontSize: 10 }} />
                              <Tooltip labelFormatter={q => `Question ${q}`} formatter={(v, name, props) => [props.payload.name, 'Level']} />
                              <Line type="stepAfter" dataKey="level" stroke="#1e40af" strokeWidth={3} dot={{ r: 4, fill: '#1e40af' }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                    {card.bloomHistory && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Cognitive (Bloom) Transitions</p>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={card.bloomHistory.map((v, i) => ({ q: i + 1, level: v === 'Remember' ? 1 : v === 'Understand' ? 2 : v === 'Apply' ? 3 : 4, name: v }))}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis dataKey="q" tick={{ fontSize: 10 }} label={{ value: 'Question #', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                              <YAxis domain={[0.5, 4.5]} ticks={[1, 2, 3, 4]} tickFormatter={v => v === 1 ? 'Rem' : v === 2 ? 'Und' : v === 3 ? 'App' : 'Ana'} tick={{ fontSize: 10 }} />
                              <Tooltip labelFormatter={q => `Question ${q}`} formatter={(v, name, props) => [props.payload.name, 'Level']} />
                              <Line type="stepAfter" dataKey="level" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4, fill: '#7c3aed' }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Predictive Tab ──────────────────────────────────────── */}
          {activeTab === 'predictive' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col items-center justify-center gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Risk Profile</p>
                  <div className="w-24 h-24 rounded-full flex flex-col items-center justify-center font-bold"
                    style={{ background: riskBg[riskInd], border: `3px solid ${riskColor[riskInd]}`, color: riskColor[riskInd] }}>
                    <span className="text-2xl">{riskInd === 'HIGH' ? '🔴' : riskInd === 'MEDIUM' ? '🟡' : '🟢'}</span>
                    <span className="text-xs uppercase mt-1">{riskInd}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold" style={{ color: riskColor[riskInd] }}>{predictive.riskScore ?? 0} / 100</div>
                    <div className="text-[10px] text-slate-500">Composite Risk Score</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col items-center justify-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Growth Index</p>
                  <GrowthIndicator direction={predictive.growthDirection || 'STABLE'} index={predictive.growthIndex || 0} />
                  <p className="text-[10px] text-slate-400 text-center">Compares early vs late-session difficulty</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col items-center justify-center gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Confidence Score</p>
                  <ConfidenceGauge value={predictive.confidenceScore ?? card.confidenceScore ?? 0} />
                  <p className="text-[10px] text-slate-400 text-center">Fast+correct · Hard accuracy · Bloom advancement</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col justify-center gap-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Consistency Index</p>
                  <ConsistencyMeter value={predictive.consistencyIndex ?? card.learningConsistency ?? 0} />
                  <p className="text-[10px] text-slate-400">Measures score variance across exam sessions</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">Risk Signal Analysis</h3>
                  <RiskBreakdown breakdown={predictive.riskBreakdown} />
                  {!predictive.riskBreakdown && <p className="text-slate-400 italic text-sm">Complete exams to generate risk signals.</p>}
                  <div className="mt-4 p-3 rounded-sm text-xs border-l-4"
                    style={{ borderColor: riskColor[riskInd], background: riskBg[riskInd], color: riskColor[riskInd] }}>
                    {riskInd === 'HIGH' && '⚠ HIGH RISK: Immediate attention required. See Remediation tab for your personalized plan.'}
                    {riskInd === 'MEDIUM' && '🔔 MODERATE RISK: Targeted practice in weak topics recommended. Check Remediation tab.'}
                    {riskInd === 'LOW' && '✅ LOW RISK: Performing well. Continue advancing to higher difficulty and Bloom levels.'}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">Weakest Topic — AI Prediction</h3>
                  {predictive.weakestTopicPrediction ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-base font-bold text-slate-900">{predictive.weakestTopicPrediction.topic}</span>
                          <span className="text-sm font-bold" style={{ color: (predictive.weakestTopicPrediction.mastery || 0) < 50 ? '#dc2626' : '#d97706' }}>
                            {(predictive.weakestTopicPrediction.mastery || 0).toFixed(1)}% Mastery
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded h-3 overflow-hidden">
                          <div className="h-3 rounded transition-all duration-700"
                            style={{
                              width: `${predictive.weakestTopicPrediction.mastery || 0}%`,
                              background: (predictive.weakestTopicPrediction.mastery || 0) < 50 ? '#dc2626' : '#d97706'
                            }} />
                        </div>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm">
                        <p className="text-[10px] font-bold uppercase text-amber-700 mb-1 tracking-wider">💡 Remediation Advice</p>
                        <p className="text-xs text-amber-900 leading-relaxed">{predictive.weakestTopicPrediction.advice}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-sm">Complete more exams to generate topic predictions.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Trajectory Tab ─────────────────────────────────────── */}
          {activeTab === 'trajectory' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Adaptive Transition Timeline</h3>
                    <p className="text-xs text-slate-500 mt-1">Difficulty progression and Bloom level transitions across your latest attempt.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-600" /> Difficulty (1-3)
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Bloom Level (1-6)
                    </div>
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trajectoryData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="index" label={{ value: 'Question Number', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 'bold' }} tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 6]} tick={{ fontSize: 10 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded shadow-xl text-xs border border-slate-700">
                                <p className="font-bold border-b border-slate-700 pb-1 mb-1 font-mono uppercase text-[10px]">Question #{data.index}</p>
                                <p className="flex justify-between gap-4"><span>Topic:</span> <strong className="text-blue-400">{data.topic}</strong></p>
                                <p className="flex justify-between gap-4"><span>Difficulty:</span> <strong className="text-blue-400">{data.difficulty}</strong></p>
                                <p className="flex justify-between gap-4"><span>Bloom:</span> <strong className="text-indigo-400">{data.bloom}</strong></p>
                                {data.hasViolation && <p className="mt-1 text-red-400 font-bold uppercase italic text-[9px]">⚠️ Integrity Incident Reported</p>}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line type="stepAfter" dataKey="difficultyVal" name="Difficulty" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 4, fill: '#1d4ed8' }} />
                      <Line type="stepAfter" dataKey="bloomVal" name="Bloom Level" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#6366f1' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-800 uppercase mb-4 tracking-wider">Topic Rotation Sequence</h3>
                  <div className="flex flex-col gap-2">
                    {trajectoryData.map((step, i) => (
                      <div key={i} className="flex items-center gap-4 text-xs group">
                        <div className="w-8 text-[10px] font-mono text-slate-400">Q{step.index}</div>
                        <div className="flex-1 h-8 bg-slate-50 flex items-center px-4 border border-transparent group-hover:border-slate-200 transition-all rounded-sm">
                          <span className="font-bold text-slate-700">{step.topic}</span>
                        </div>
                        <div className={`text-[9px] font-bold px-2 py-0.5 rounded shadow-sm ${step.difficulty === 'HARD' ? 'bg-red-50 text-red-700 border border-red-100' : step.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                          {step.difficulty}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-800 uppercase mb-4 tracking-wider">Integrity Event Markers</h3>
                  <div className="space-y-3">
                    {report?.latestProgressCard?.integrityEvents?.length > 0 ? (
                      report.latestProgressCard.integrityEvents.map((evt, i) => (
                        <div key={i} className="flex gap-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-sm">
                          <span className="text-base text-red-600 scale-110">⚠️</span>
                          <div>
                            <p className="text-xs font-bold text-red-900 border-b border-red-200 pb-0.5 mb-1 inline-block">Violation Incident</p>
                            <p className="text-[11px] text-red-700 leading-snug">{evt}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-slate-400 italic">
                        <p className="text-3xl mb-3">🛡️</p>
                        <p className="text-xs font-bold">100% Integrity Score Maintained</p>
                        <p className="text-[10px] mt-1">No violations detected during this session.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Remediation Tab ─────────────────────────────────────── */}
          {activeTab === 'remedial' && (
            <div className="space-y-5">

              {/* Intervention type banner */}
              {remedial && (
                <div className="p-4 border-l-4 flex items-center justify-between flex-wrap gap-3"
                  style={{ borderColor: intConfig.color, background: intConfig.bg }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: intConfig.color }}>
                      Recommended Intervention
                    </p>
                    <p className="text-base font-bold" style={{ color: intConfig.color }}>{intConfig.label}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Risk Level: <strong>{remedial.riskLevel}</strong> &nbsp;|&nbsp;
                      Topic: <strong>{remedial.recommendedTopic}</strong> &nbsp;|&nbsp;
                      Mastery: <strong>{remedial.topicMastery}%</strong>
                    </p>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold" style={{ color: intConfig.color }}>{remedial.recommendedPracticeCount}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Questions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" style={{ color: intConfig.color }}>{remedial.estimatedRemediationTime}m</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Est. Time</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan details + Start button */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div className="bg-white border border-slate-200 p-5 shadow-sm space-y-5">
                  <h3 className="text-sm font-bold text-slate-800 uppercase">📋 Practice Plan Details</h3>

                  {remedial ? (
                    <>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Starting Bloom Level</p>
                        <span className="inline-block px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-sm">
                          {remedial.startingBloomLevel}
                        </span>
                      </div>
                      <MixBar data={remedial.recommendedDifficultyMix} label="Difficulty Mix" />
                      <MixBar data={remedial.recommendedBloomMix} label="Bloom Level Mix" />
                    </>
                  ) : (
                    <p className="text-slate-400 italic text-sm">Complete at least one exam to generate a remediation plan.</p>
                  )}
                </div>

                {/* Start Remedial Card */}
                <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase mb-3">🎯 Recommended Practice</h3>
                    {remedial && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Target Topic</span>
                          <strong className="text-slate-900">{remedial.recommendedTopic}</strong>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Questions</span>
                          <strong className="text-slate-900">{remedial.recommendedPracticeCount} adaptive questions</strong>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Estimated Time</span>
                          <strong className="text-slate-900">{remedial.estimatedRemediationTime} minutes</strong>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Starting Difficulty</span>
                          <strong className="text-slate-900">{remedial.riskLevel === 'HIGH' ? 'Easy' : remedial.riskLevel === 'MEDIUM' ? 'Easy' : 'Medium'}</strong>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Bloom Entry</span>
                          <strong className="text-slate-900">{remedial.startingBloomLevel}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 space-y-3">
                    {started ? (
                      <div className="bg-green-50 border border-green-200 p-4 rounded-sm text-center">
                        <p className="text-green-800 font-bold text-sm mb-1">✅ Remedial Session Created!</p>
                        <p className="text-xs text-green-700 mb-2">
                          Topic: <strong>{started.topic}</strong> — Exam ID: <strong>{started.examId}</strong>
                        </p>
                        <p className="text-[10px] text-green-600">
                          Go to Student Dashboard → Resume exam #{started.examId} to begin your remedial session.
                        </p>
                      </div>
                    ) : (
                      <>
                        {remError && (
                          <div className="bg-red-50 border border-red-200 p-3 text-xs text-red-700 rounded-sm">{remError}</div>
                        )}
                        <button
                          onClick={handleStartRemedial}
                          disabled={remLoading || !remedial}
                          className="w-full py-3 font-bold text-sm uppercase tracking-wide text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: remedial ? intConfig.color : '#94a3b8' }}
                        >
                          {remLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                              Creating session...
                            </span>
                          ) : (
                            `▶ Start Remedial Practice — ${remedial?.recommendedPracticeCount || '?'} Questions`
                          )}
                        </button>
                        <p className="text-[10px] text-slate-400 text-center">
                          The adaptive engine will auto-adjust difficulty based on your responses.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Sample practice questions preview */}
              {remedial?.practiceQuestions?.length > 0 && (
                <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase">Sample Practice Questions Preview</h3>
                    <span className="text-[10px] text-slate-500 font-bold">{remedial.practiceQuestions.length} questions selected</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {remedial.practiceQuestions.slice(0, 3).map((q, i) => (
                      <div key={i} className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0">{i + 1}</span>
                          <div className="flex-1">
                            <p className="text-sm text-slate-900 font-medium">{q.content}</p>
                            <div className="flex gap-3 mt-1.5 flex-wrap">
                              {q.difficulty && <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{q.difficulty}</span>}
                              {q.bloomLevel && <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">{q.bloomLevel}</span>}
                              {q.topic && <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{q.topic}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {remedial.practiceQuestions.length > 3 && (
                      <div className="p-4 text-center text-xs text-slate-400 italic">
                        + {remedial.practiceQuestions.length - 3} more questions will be presented during the adaptive session
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Topics Tab ──────────────────────────────────────────── */}
          {activeTab === 'topics' && (
            <div className="bg-white border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase mb-6">Topic Mastery Index</h3>
              {topicData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topicData} layout="vertical" barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                      <YAxis type="category" dataKey="topic" tick={{ fontSize: 11 }} width={90} />
                      <Tooltip formatter={v => `${v}%`} />
                      <Bar dataKey="mastery" name="Mastery %" fill="#1d4ed8" radius={[0, 3, 3, 0]}
                        label={{ position: 'right', fontSize: 11, formatter: v => `${v}%` }} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(report?.topicMasteryIndex || {}).map(([topic, mastery]) => {
                      const level = mastery >= 80 ? 'Mastered' : mastery >= 60 ? 'Proficient' : mastery >= 40 ? 'Developing' : 'Needs Work';
                      const color = mastery >= 80 ? '#16a34a' : mastery >= 60 ? '#0891b2' : mastery >= 40 ? '#d97706' : '#dc2626';
                      const isWeakest = predictive.weakestTopicPrediction?.topic === topic || remedial?.recommendedTopic === topic;
                      return (
                        <div key={topic} className={`border p-3 ${isWeakest ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-bold text-slate-900">{topic} {isWeakest && <span className="text-xs">⚠</span>}</span>
                            <span className="text-xs font-bold" style={{ color }}>{level}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="h-2 rounded-full transition-all" style={{ width: `${mastery}%`, background: color }} />
                          </div>
                          <div className="text-right text-xs font-mono text-slate-600 mt-1">{mastery}%</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 italic">
                  No topic data yet. Complete exams with topic-tagged questions.
                </div>
              )}
            </div>
          )}

          {/* ── Bloom Tab ───────────────────────────────────────────── */}
          {activeTab === 'bloom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase mb-6">Bloom's Taxonomy Performance</h3>
                {bloomData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={bloomData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <Radar name="Score %" dataKey="value" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.2} />
                      <Tooltip formatter={v => `${v}%`} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400 italic text-sm">No bloom-level data yet.</div>
                )}
              </div>
              <div className="bg-white border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase mb-6">Bloom Level Breakdown</h3>
                <div className="space-y-4">
                  {[
                    { bloom: 'Remember', desc: 'Recall facts and basic concepts', weight: 1 },
                    { bloom: 'Understand', desc: 'Explain ideas or concepts', weight: 2 },
                    { bloom: 'Apply', desc: 'Use information in new situations', weight: 3 },
                    { bloom: 'Analyze', desc: 'Break down into parts and relationships', weight: 4 },
                  ].map(({ bloom, desc, weight }) => {
                    const val = report?.bloomLevelDistribution?.[bloom] || 0;
                    const color = val >= 75 ? '#16a34a' : val >= 50 ? '#0891b2' : val >= 25 ? '#d97706' : '#dc2626';
                    return (
                      <div key={bloom}>
                        <div className="flex justify-between items-baseline mb-1">
                          <div>
                            <span className="text-sm font-bold text-slate-900">{bloom}</span>
                            <span className="text-xs text-slate-500 ml-2">— {desc}</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color }}>{val}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3">
                          <div className="h-3 rounded-full transition-all duration-700" style={{ width: `${val}%`, background: color }} />
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">Cognitive Weight: L{weight}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Learning Roadmap Tab ────────────────────────────────── */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              {pathLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" />
                </div>
              )}

              {!pathLoading && learningPath && (
                <>
                  {/* Summary Header */}
                  <div className="bg-white border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Personalized Learning Roadmap</p>
                        <h2 className="text-xl font-bold text-slate-900 uppercase">Strategic Intervention Plan</h2>
                      </div>
                      <div className="px-3 py-1 rounded-sm font-bold text-xs uppercase"
                        style={{ background: riskBg[riskInd], color: riskColor[riskInd], border: `1px solid ${riskBorder[riskInd]}` }}>
                        {riskInd} Priority Intervention
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 p-4 border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Primary Objective</p>
                        <p className="text-lg font-bold text-slate-800">Mastery of <span className="text-blue-800">{learningPath.weakestTopic}</span></p>
                        <p className="text-xs text-slate-500 mt-2 italic leading-relaxed">
                          Based on your cognitive profile, the system has identified this topic as the critical bottleneck for your progress.
                        </p>
                      </div>
                      <div className="bg-blue-900 p-4 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl">🧠</div>
                        <p className="text-xs font-bold text-blue-300 uppercase mb-2">AI-Generated Strategy</p>
                        <p className="text-sm italic leading-relaxed relative z-10">
                          "{learningPath.overallStrategy}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Plan Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {learningPath.weekPlans.map((week, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col h-full relative overflow-hidden group hover:border-blue-400 transition-colors">
                        <div className="absolute top-0 right-0 p-2 opacity-5 text-4xl font-bold group-hover:opacity-10 transition-opacity">{week.weekNumber}</div>
                        <div className="mb-4">
                          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-sm">Week {week.weekNumber}</span>
                          <h4 className="text-sm font-bold text-slate-800 mt-2 leading-snug">{week.focusObjective}</h4>
                        </div>

                        <div className="space-y-3 flex-1">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Difficulty Mix</p>
                            <p className="text-xs font-medium text-slate-700">{week.difficultyMix}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Bloom Progression</p>
                            <p className="text-xs font-medium text-indigo-600">{week.bloomProgression}</p>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                          <div className="text-center">
                            <div className="text-sm font-bold text-slate-800">{week.practiceCount}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">Questions</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-bold text-slate-800">{week.estimatedHours}h</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">Est. Time</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-indigo-50 border border-indigo-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-600 p-2 text-white rounded-full"><Zap size={16} /></div>
                      <p className="text-sm font-medium text-indigo-900">This roadmap is dynamic and will adapt based on your performance in standard assessments.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('remedial')}
                      className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold uppercase rounded-sm hover:bg-indigo-700 transition-colors"
                    >
                      Start Practice
                    </button>
                  </div>
                </>
              )}

              {!pathLoading && !learningPath && (
                <EmptyState
                  title="Roadmap Not Available"
                  message="Complete your diagnostic assessments to generate your personalized learning roadmap."
                />
              )}
            </div>
          )}

          {/* ── Cognitive Growth Tab (Phase 11) ────────────────────── */}
          {activeTab === 'cognitive' && (
            <div className="space-y-6">
              {!report?.longitudinalProfile ? (
                <EmptyState title="Profile Under Construction" message="Complete at least 3 exams to generate a longitudinal cognitive profile." />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Stability Index', value: `${report.longitudinalProfile.stabilityIndex}%`, color: '#16a34a', desc: 'Consistency of performance' },
                      { label: 'Retention Score', value: `${report.longitudinalProfile.retentionScore}%`, color: '#0891b2', desc: 'Mastery over time' },
                      { label: 'Acceleration', value: `${report.longitudinalProfile.accelerationScore}%`, color: '#7c3aed', desc: 'Learning velocity' },
                      { label: 'Cognitive Trend', value: report.longitudinalProfile.trend, color: report.longitudinalProfile.trend === 'IMPROVING' ? '#16a34a' : report.longitudinalProfile.trend === 'DECLINING' ? '#dc2626' : '#1e40af', desc: 'Overall trajectory' },
                    ].map((kpi, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 p-5 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
                        <h3 className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</h3>
                        <p className="text-[10px] text-slate-400 mt-1">{kpi.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-slate-200 p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 uppercase mb-6">Longitudinal Performance Trend</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={report.growthTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="academicScore" name="Academic Score" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="competencyIndex" name="Competency Index" stroke="#7c3aed" strokeWidth={2} strokeDasharray="5 5" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-900 text-white p-6 shadow-xl h-full">
                        <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-4">Intelligence Insight</h4>
                        <p className="text-sm italic opacity-90 leading-relaxed mb-6">
                          "Your {report.longitudinalProfile.trend?.toLowerCase()} trend indicates a {report.longitudinalProfile.stabilityIndex > 70 ? 'high' : 'variable'} level of cognitive stability. Mastery retention is currently at {report.longitudinalProfile.retentionScore}%."
                        </p>

                        {report.longitudinalProfile.trend === 'DECLINING' && (
                          <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-sm">
                            <p className="text-xs font-bold text-red-200 mb-1 leading-tight uppercase">⚠️ Reassessment Alert Triggered</p>
                            <p className="text-[10px] text-red-100 opacity-80">
                              Significant regression detected. Immediate review of core competencies and foundational practice is mandated to stabilize performance.
                            </p>
                          </div>
                        )}

                        <div className="mt-8 space-y-4">
                          <div>
                            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                              <span>Stability Gauge</span>
                              <span>{report.longitudinalProfile.stabilityIndex}%</span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${report.longitudinalProfile.stabilityIndex}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                              <span>Retention bar</span>
                              <span>{report.longitudinalProfile.retentionScore}%</span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${report.longitudinalProfile.retentionScore}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── History Tab ─────────────────────────────────────────── */}
          {activeTab === 'history' && (
            <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase">Examination History</h3>
              </div>
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {['Assessment', 'Subject', 'Status', 'Score', 'Percentage'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exams.length === 0 ? (
                    <tr><td colSpan="5" className="p-12 text-center text-slate-400 italic">No completed exams yet.</td></tr>
                  ) : (
                    exams.map((exam, i) => {
                      const pct = exam.total ? Math.round((exam.score / exam.total) * 100) : (exam.score || 0);
                      const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : 'F';
                      const gradeColor = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
                      return (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">{exam.title}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{exam.subject || '—'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${exam.status === 'COMPLETED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {exam.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">{exam.score ?? '—'}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-sm" style={{ color: gradeColor }}>{pct}% ({grade})</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                <strong>Grading:</strong> A+ (≥90), A (≥80), B (≥70), C (≥60), F (&lt;60) &nbsp;|&nbsp; NEP 2020 Competency-Based Assessment
              </div>
            </div>
          )}

          {/* ── Integrity Report Tab ─────────────────────────────────── */}
          {activeTab === 'integrity' && (() => {
            const intColor = (s) => s >= 90 ? '#16a34a' : s >= 70 ? '#d97706' : '#dc2626';
            const intBg = (s) => s >= 90 ? '#f0fdf4' : s >= 70 ? '#fffbeb' : '#fef2f2';
            const intLabel = (s) => s >= 90 ? 'Secure' : s >= 70 ? 'Under Review' : 'Flagged';
            const intBadge = (s) => s >= 90
              ? 'bg-green-100 text-green-700 border-green-300'
              : s >= 70 ? 'bg-amber-100 text-amber-700 border-amber-300'
                : 'bg-red-100 text-red-700 border-red-300';

            const avgScore = exams.length
              ? Math.round(exams.reduce((s, e) => s + (e.integrityScore ?? 100), 0) / exams.length)
              : 100;
            const flagged = exams.filter(e => (e.integrityScore ?? 100) < 70 || e.status === 'TERMINATED');

            return (
              <div className="space-y-5">

                {/* Summary Banner */}
                <div className="p-6 border flex items-center justify-between flex-wrap gap-4"
                  style={{ background: intBg(avgScore), borderColor: intColor(avgScore) }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: intColor(avgScore) }}>Overall Integrity Standing</p>
                    <p className="text-3xl font-mono font-bold" style={{ color: intColor(avgScore) }}>{avgScore}/100</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: intColor(avgScore) }}>{intLabel(avgScore)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Flagged Sessions</p>
                    <p className="text-2xl font-bold" style={{ color: flagged.length > 0 ? '#dc2626' : '#16a34a' }}>{flagged.length}</p>
                    <p className="text-[10px] text-gray-400">of {exams.length} completed exams</p>
                  </div>
                </div>

                {/* Per-Exam Integrity Table */}
                <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Session-by-Session Integrity Breakdown</h3>
                  </div>
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Assessment', 'Subject', 'Status', 'Integrity Score', 'Rating', 'Session Flag'].map(h => (
                          <th key={h} className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {exams.length === 0 ? (
                        <tr><td colSpan={6} className="p-10 text-center text-slate-400 italic text-sm">No completed exams yet.</td></tr>
                      ) : exams.map((exam, i) => {
                        const score = exam.integrityScore ?? 100;
                        const isTerminated = exam.status === 'TERMINATED';
                        const isSuspicious = score < 70 || isTerminated;
                        return (
                          <tr key={i} className={`${isSuspicious ? 'bg-red-50/40' : ''} hover:bg-slate-50 transition-colors`}>
                            <td className="px-5 py-3 text-sm font-semibold text-slate-900">{exam.title}</td>
                            <td className="px-5 py-3 text-xs text-slate-600">{exam.subject || '—'}</td>
                            <td className="px-5 py-3">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border
                                ${isTerminated ? 'bg-red-100 text-red-700 border-red-300' : 'bg-green-100 text-green-700 border-green-300'}`}>
                                {exam.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-mono font-bold text-sm" style={{ color: intColor(score) }}>
                              {Math.round(score)}/100
                            </td>
                            <td className="px-5 py-3">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${intBadge(score)}`}>
                                {intLabel(score)}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {isSuspicious
                                ? <span className="text-[10px] font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded uppercase">🚩 Flagged</span>
                                : <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-300 px-2 py-0.5 rounded uppercase">✓ Clear</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Flagged Sessions Detail */}
                {flagged.length > 0 && (
                  <div className="bg-red-50 border border-red-200 p-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-red-700 mb-3">⚠ Flagged Session Details</h3>
                    <div className="space-y-3">
                      {flagged.map((exam, i) => (
                        <div key={i} className="bg-white border border-red-200 p-4 flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{exam.title}</p>
                            <p className="text-xs text-gray-500">{exam.subject} · {exam.status}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-mono font-bold" style={{ color: intColor(exam.integrityScore ?? 0) }}>
                              {Math.round(exam.integrityScore ?? 0)}/100
                            </p>
                            <p className="text-[10px] text-red-600 font-semibold uppercase">Action Required</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-red-600 mt-3 font-medium">
                      These sessions have been flagged for administrative review. Please contact your examination centre.
                    </p>
                  </div>
                )}

                {/* Integrity Policy */}
                <div className="bg-gray-50 border border-gray-200 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">PARAKH Integrity Policy</p>
                  <div className="grid grid-cols-3 gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-green-500 flex-shrink-0" />
                      <span><strong>≥ 90</strong> — Secure: No violations detected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-amber-500 flex-shrink-0" />
                      <span><strong>70–89</strong> — Under Review: Minor violations logged</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-red-500 flex-shrink-0" />
                      <span><strong>&lt; 70</strong> — Flagged: Serious violations; admin notified</span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
};

export default Result;