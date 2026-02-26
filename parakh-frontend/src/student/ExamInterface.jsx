/**
 * ExamInterface.jsx — PARAKH Secure Computer-Based Testing (CBT) Portal
 *
 * Security layers implemented:
 *  1. Fullscreen hard enforcement (3-exit termination)
 *  2. Tab/window visibility lock (3-switch termination)
 *  3. Keyboard & copy block (Ctrl+C/V/A, F12, Ctrl+Shift+I, PrintScreen)
 *  4. Right-click context menu disabled
 *  5. Webcam presence monitoring (10s heartbeat)
 *  6. Live integrity panel (Green/Amber/Red)
 *  7. Auto-termination on 3 violations or score < 60
 *  8. All violations reported to IntegrityController
 *  9. Question navigation grid (CBT-style)
 * 10. AI monitoring extension hook (AI_FACE_MONITOR_ENABLED)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8081';
const MAX_VIOLATIONS = 3;
const FULLSCREEN_TOLERANCE = 3;
const TABSWITCH_TOLERANCE = 3;
const WEBCAM_INTERVAL_MS = 10000;
const WEBCAM_ABSENCE_LIMIT = 3;

// Feature flags are now dynamic via system configuration

// ── Integrity colour helper ──────────────────────────────────────────────────
const integrityStyle = (score) => {
    if (score == null) return { color: '#6b7280', label: 'Initialising', bg: 'bg-gray-100', dot: 'bg-gray-400' };
    if (score >= 90) return { color: '#15803d', label: 'Secure', bg: 'bg-green-50', dot: 'bg-green-500' };
    if (score >= 70) return { color: '#d97706', label: 'Under Review', bg: 'bg-amber-50', dot: 'bg-amber-500' };
    return { color: '#dc2626', label: 'Flagged', bg: 'bg-red-50', dot: 'bg-red-500' };
};

const diffStyle = (d) => {
    const m = { Easy: 'text-green-700 bg-green-50 border-green-200', Medium: 'text-amber-700 bg-amber-50 border-amber-200', Hard: 'text-red-700 bg-red-50 border-red-200' };
    return m[d] || 'text-gray-600 bg-gray-100 border-gray-200';
};

const bloomStyle = (b) => {
    const m = { Remember: 'text-blue-700 bg-blue-50 border-blue-200', Understand: 'text-purple-700 bg-purple-50 border-purple-200', Apply: 'text-indigo-700 bg-indigo-50 border-indigo-200', Analyse: 'text-teal-700 bg-teal-50 border-teal-200', Evaluate: 'text-orange-700 bg-orange-50 border-orange-200', Create: 'text-pink-700 bg-pink-50 border-pink-200' };
    return m[b] || 'text-gray-600 bg-gray-100 border-gray-200';
};

// ── Toast Queue ──────────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {toasts.map(t => (
            <div key={t.id} className={`px-4 py-3 rounded shadow-lg text-sm font-semibold flex items-center gap-2 animate-slide-in
        ${t.type === 'error' ? 'bg-red-600 text-white' : t.type === 'warn' ? 'bg-amber-500 text-white' : 'bg-gray-900 text-white'}`}>
                {t.type === 'error' ? '🚨' : t.type === 'warn' ? '⚠' : 'ℹ'} {t.msg}
            </div>
        ))}
    </div>
);

// ════════════════════════════════════════════════════════════════════════════
const ExamInterface = () => {
    const { examId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    // ── Core state ─────────────────────────────────────────────────────────────
    const [examState, setExamState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // ── Security state ─────────────────────────────────────────────────────────
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fsExits, setFsExits] = useState(0);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [webcamChecks, setWebcamChecks] = useState(0);  // consecutive failures
    const [webcamGranted, setWebcamGranted] = useState(null); // null=unknown, true/false
    const [integrityScore, setIntegrityScore] = useState(100);
    const [violationCount, setViolationCount] = useState(0);
    const [terminated, setTerminated] = useState(false);
    const [showTermModal, setShowTermModal] = useState(false);
    const [showFsModal, setShowFsModal] = useState(false);
    const [showTabModal, setShowTabModal] = useState(false);
    const [secureBrowserMode, setSecureBrowserMode] = useState(true);
    const [aiProctoringEnabled, setAiProctoringEnabled] = useState(true);

    // ── UI state ───────────────────────────────────────────────────────────────
    const [toasts, setToasts] = useState([]);
    const [timer, setTimer] = useState(0);
    const [questionTimer, setQuestionTimer] = useState(0);
    const [answeredMap, setAnsweredMap] = useState({});   // qNum → option
    const [flaggedSet, setFlaggedSet] = useState(new Set());
    const [currentQNum, setCurrentQNum] = useState(1);
    const [totalExpected, setTotalExpected] = useState(20);
    const [examStarted, setExamStarted] = useState(false);
    const webcamStreamRef = useRef(null);
    const toastIdRef = useRef(0);

    const headers = { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'application/json' };

    // ── Toast helper ───────────────────────────────────────────────────────────
    const addToast = useCallback((msg, type = 'warn', duration = 4000) => {
        const id = ++toastIdRef.current;
        setToasts(t => [...t.slice(-3), { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
    }, []);

    // ── Report to IntegrityController ──────────────────────────────────────────
    const reportEvent = useCallback(async (eventType) => {
        try {
            await fetch(`${API}/api/exam/report-integrity-event`, {
                method: 'POST', headers,
                body: JSON.stringify({ examId: Number(examId), eventType }),
            });
        } catch { /* non-critical */ }
    }, [examId, headers]);

    // ── Report violation (terminatable) ───────────────────────────────────────
    const reportViolation = useCallback(async (details, eventType) => {
        if (terminated) return;
        const newCount = violationCount + 1;
        setViolationCount(newCount);
        // Decay integrity: each violation costs points
        setIntegrityScore(prev => Math.max(0, prev - 12));
        try {
            await fetch(`${API}/api/exam/violation`, {
                method: 'POST', headers,
                body: JSON.stringify({ examId: Number(examId), details }),
            });
        } catch { /* non-critical */ }
        if (eventType) reportEvent(eventType);
        if (newCount >= MAX_VIOLATIONS || integrityScore - 12 < 60) {
            triggerTermination('Security policy exceeded. Auto-submit initiated.');
        }
    }, [terminated, violationCount, integrityScore, examId, headers, reportEvent]);

    // ── Termination ────────────────────────────────────────────────────────────
    const triggerTermination = useCallback(async (reason) => {
        if (terminated) return;
        setTerminated(true);
        setShowTermModal(false);
        addToast('Exam terminated: ' + reason, 'error', 8000);
        try {
            await fetch(`${API}/api/exam/violation`, {
                method: 'POST', headers,
                body: JSON.stringify({ examId: Number(examId), details: 'AUTO_TERMINATE: ' + reason }),
            });
        } catch { /* best-effort */ }
        setTimeout(() => {
            setExamState(s => ({ ...s, examCompleted: true, status: 'TERMINATED' }));
        }, 2000);
    }, [terminated, examId, headers, addToast]);

    // ── Explicit Finish ────────────────────────────────────────────────────────
    const handleFinish = useCallback(async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/api/exam/finish`, {
                method: 'POST', headers,
                body: JSON.stringify({ examId: Number(examId) }),
            });
            if (res.ok) {
                const data = await res.json();
                setExamState(data);
                if (data.totalQuestions) setTotalExpected(data.totalQuestions);
                addToast('Examination finalised.', 'info');
                setTimeout(() => navigate(`/student/result/${examId}`), 1500);
            }
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    }, [examId, headers, navigate, submitting]);

    // ── Webcam initialisation ──────────────────────────────────────────────────
    const initWebcam = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            webcamStreamRef.current = stream;
            setWebcamGranted(true);
            return true;
        } catch {
            setWebcamGranted(false);
            return false;
        }
    }, []);

    // ── Fullscreen enter ───────────────────────────────────────────────────────
    const enterFullscreen = useCallback(() => {
        document.documentElement.requestFullscreen().catch(() => { });
    }, []);

    // ── Start exam (after pre-checks cleared) ─────────────────────────────────
    const handleBeginExam = useCallback(async () => {
        const camOk = await initWebcam();
        if (!camOk) {
            addToast('Webcam required for this examination. Please grant camera permission.', 'error', 8000);
            return;
        }
        enterFullscreen();
        setExamStarted(true);
    }, [initWebcam, enterFullscreen, addToast]);

    // ── Security event listeners ───────────────────────────────────────────────
    useEffect(() => {
        if (!examStarted || terminated) return;

        // Fullscreen change
        const onFsChange = () => {
            if (!secureBrowserMode) return;
            const isFs = !!document.fullscreenElement;
            setIsFullscreen(isFs);
            if (!isFs) {
                setFsExits(prev => {
                    const n = prev + 1;
                    reportEvent('FULLSCREEN_EXIT');
                    if (n >= FULLSCREEN_TOLERANCE) {
                        triggerTermination(`${FULLSCREEN_TOLERANCE} fullscreen exits detected`);
                    } else {
                        setShowFsModal(true);
                        addToast(`⚠ Fullscreen exit detected (${n}/${FULLSCREEN_TOLERANCE})`, 'error');
                    }
                    return n;
                });
            }
        };

        // Visibility / tab switch
        const onVisible = () => {
            if (document.hidden) {
                setTabSwitches(prev => {
                    const n = prev + 1;
                    reportEvent('TAB_SWITCH');
                    reportViolation(`Tab switch #${n}`, null);
                    if (n >= TABSWITCH_TOLERANCE) {
                        triggerTermination(`${TABSWITCH_TOLERANCE} tab switches detected`);
                    } else {
                        setShowTabModal(true);
                        addToast(`⚠ Tab switch detected (${n}/${TABSWITCH_TOLERANCE})`, 'error');
                    }
                    return n;
                });
            }
        };

        // Window blur
        const onBlur = () => {
            if (!document.hidden) {
                reportEvent('WINDOW_BLUR');
                addToast('Focus lost from exam window', 'warn', 2500);
            }
        };
        // Keyboard blocks
        const onKey = (e) => {
            if (!secureBrowserMode) return;
            const blocked = [
                e.key === 'F12',
                e.key === 'PrintScreen',
                (e.ctrlKey && ['c', 'v', 'a', 'x', 'p'].includes(e.key.toLowerCase())),
                (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())),
                e.altKey && e.key === 'Tab',
            ];
            if (blocked.some(Boolean)) {
                e.preventDefault();
                e.stopPropagation();
                const evtType = e.key === 'PrintScreen' ? 'SCREENSHOT_ATTEMPT' : 'KEYBOARD_BLOCK';
                reportEvent(evtType);
                addToast(`Blocked: ${e.key} is disabled during examination`, 'warn', 2000);
            }
        };

        // Copy/paste block
        const onCopy = (e) => { if (!secureBrowserMode) return; e.preventDefault(); reportEvent('COPY_ATTEMPT'); addToast('Copy is disabled during examination', 'warn', 2000); };
        const onPaste = (e) => { if (!secureBrowserMode) return; e.preventDefault(); reportEvent('PASTE_ATTEMPT'); };
        const onCut = (e) => { if (!secureBrowserMode) return; e.preventDefault(); };
        const onCtxMenu = (e) => { if (!secureBrowserMode) return; e.preventDefault(); };

        document.addEventListener('fullscreenchange', onFsChange);
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('blur', onBlur);
        document.addEventListener('keydown', onKey, true);
        document.addEventListener('copy', onCopy, true);
        document.addEventListener('paste', onPaste, true);
        document.addEventListener('cut', onCut, true);
        document.addEventListener('contextmenu', onCtxMenu, true);

        // Webcam heartbeat (10s)
        const webcamHb = setInterval(async () => {
            if (!webcamStreamRef.current) return;
            const tracks = webcamStreamRef.current.getVideoTracks();
            const active = tracks.some(t => t.readyState === 'live');
            if (!active) {
                setWebcamChecks(prev => {
                    const n = prev + 1;
                    reportEvent('WEBCAM_ABSENCE');
                    setIntegrityScore(s => Math.max(0, s - 5));
                    if (n >= WEBCAM_ABSENCE_LIMIT) {
                        reportViolation('Webcam stream lost.', 'WEBCAM_ABSENCE');
                    } else {
                        addToast(`Camera signal lost (${n}/${WEBCAM_ABSENCE_LIMIT})`, 'warn');
                    }
                    return n;
                });
            } else {
                setWebcamChecks(0);
            }

            // aiProctoringEnabled hook — kept as stub for future integration
            if (aiProctoringEnabled) {
                // TODO: POST frame to /api/ai/face-detect and parse presence confidence
            }
        }, WEBCAM_INTERVAL_MS);

        return () => {
            document.removeEventListener('fullscreenchange', onFsChange);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('keydown', onKey, true);
            document.removeEventListener('copy', onCopy, true);
            document.removeEventListener('paste', onPaste, true);
            document.removeEventListener('cut', onCut, true);
            document.removeEventListener('contextmenu', onCtxMenu, true);
            clearInterval(webcamHb);
        };
    }, [examStarted, terminated, reportEvent, reportViolation, triggerTermination, addToast]);

    // ── Load exam state & configs ──────────────────────────────────────────────
    useEffect(() => {
        Promise.all([
            fetch(`${API}/api/exam/${examId}`, { headers: { Authorization: `Bearer ${user?.token}` } }).then(r => r.ok ? r.json() : Promise.reject()),
            fetch(`${API}/api/public/config/notice`).then(r => r.ok ? r.json() : null).catch(() => null), // We can use this to get public config if we want, or add another endpoint
        ]).then(([data, notice]) => {
            setExamState(data);
            if (data.totalQuestions) setTotalExpected(data.totalQuestions);
            setLoading(false);
        })
            .catch(() => { navigate('/student/dashboard'); setLoading(false); });

        // Fetch operational controls
        fetch(`${API}/api/public/config`)
            .then(r => r.ok ? r.json() : [])
            .then(configs => {
                const secure = configs.find(c => c.configKey === 'SECURE_BROWSER_MODE')?.configValue !== 'false';
                const proctor = configs.find(c => c.configKey === 'AI_PROCTORING_ENABLED')?.configValue !== 'false';
                setSecureBrowserMode(secure);
                setAiProctoringEnabled(proctor);
            }).catch(() => { });
    }, [examId]);

    // ── Clocks ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        const t = setInterval(() => {
            setTimer(s => {
                const elapsed = s + 1;
                // Auto-finish on time expiry
                const limit = (examState?.durationMinutes || 30) * 60;
                if (limit > 0 && elapsed >= limit && !examState?.examCompleted && !terminated) {
                    addToast('Time has expired. Finalising session...', 'error');
                    handleFinish();
                }
                return elapsed;
            });
            setQuestionTimer(s => s + 1);
        }, 1000);
        return () => clearInterval(t);
    }, [examState?.durationMinutes, examState?.examCompleted, terminated, handleFinish]);

    useEffect(() => { setQuestionTimer(0); }, [examState?.nextQuestion?.id]);

    // ── Mark isFullscreen on enter ─────────────────────────────────────────────
    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    // ── Cleanup webcam on unmount ──────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (webcamStreamRef.current) {
                webcamStreamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    // ── Submit Answer ──────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!selectedOption || submitting || terminated) return;
        setSubmitting(true);
        const prevQ = examState?.nextQuestion;
        const prevQNum = (examState?.totalQuestionsAnswered ?? 0) + 1;

        try {
            const res = await fetch(`${API}/api/exam/submit`, {
                method: 'POST', headers,
                body: JSON.stringify({
                    examId: Number(examId),
                    questionId: prevQ.id,
                    selectedOption,
                    timeTakenSeconds: questionTimer,
                }),
            });
            if (res.ok) {
                const newState = await res.json();
                // Track answered questions
                setAnsweredMap(m => ({ ...m, [prevQNum]: selectedOption }));
                setCurrentQNum(prevQNum + 1);

                // Adaptive console log
                if (!newState.examCompleted && newState.nextQuestion) {
                    const nq = newState.nextQuestion;
                    const dc = prevQ?.difficulty !== nq.difficulty;
                    const bc = prevQ?.bloomLevel !== nq.bloomLevel;
                    const tc = prevQ?.topic !== nq.topic;
                    console.group(`[ADAPTIVE] Q${prevQNum} → Q${prevQNum + 1}`);
                    console.log(`  Difficulty: ${prevQ?.difficulty} → ${nq.difficulty}${dc ? ' ◀ CHANGED' : ''}`);
                    console.log(`  Bloom:      ${prevQ?.bloomLevel} → ${nq.bloomLevel}${bc ? ' ◀ CHANGED' : ''}`);
                    console.log(`  Topic:      ${prevQ?.topic} → ${nq.topic}${tc ? ' ◀ CHANGED' : ''}`);
                    console.log(`  Score:      ${newState.currentScore}/${newState.totalQuestionsAnswered}`);
                    console.groupEnd();
                }

                setExamState(newState);
                setSelectedOption('');

                if (newState.examCompleted) {
                    addToast('All questions completed.', 'info');
                    setTimeout(() => navigate(`/student/result/${examId}`), 2000);
                }
            } else {
                addToast('Submission failed. Please try again.', 'error');
            }
        } catch { addToast('Network error during submission.', 'error'); }
        finally { setSubmitting(false); }
    };

    // ── Flag question toggle ───────────────────────────────────────────────────
    const toggleFlag = (qNum) => {
        setFlaggedSet(prev => {
            const n = new Set(prev);
            n.has(qNum) ? n.delete(qNum) : n.add(qNum);
            return n;
        });
    };

    const fmt = (s) => new Date(s * 1000).toISOString().substr(11, 8);
    const is = integrityStyle(integrityScore);
    const totalQ = examState?.totalQuestionsAnswered ?? 0;

    // ══════════════════════════════════════════════════════════════════════════
    // RENDER GUARDS
    // ══════════════════════════════════════════════════════════════════════════

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
                <div className="h-10 w-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-semibold uppercase tracking-widest">Loading Secure Environment...</p>
            </div>
        </div>
    );

    // ── EXAM COMPLETE / TERMINATED ─────────────────────────────────────────────
    if (examState?.examCompleted) {
        const isTerminated = examState?.status === 'TERMINATED';
        return (
            <div className={`h-screen flex flex-col items-center justify-center p-8 ${isTerminated ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div className={`bg-white p-10 w-full max-w-xl shadow-xl border-t-8 ${isTerminated ? 'border-red-600' : 'border-green-600'}`}>
                    <div className={`h-16 w-16 mx-auto flex items-center justify-center rounded-full mb-6 ${isTerminated ? 'bg-red-100' : 'bg-green-100'}`}>
                        <span className="text-3xl">{isTerminated ? '🚫' : '✅'}</span>
                    </div>
                    <h1 className={`text-2xl font-bold text-center uppercase tracking-widest mb-2 ${isTerminated ? 'text-red-700' : 'text-gray-900'}`}>
                        {isTerminated ? 'Examination Terminated' : 'Examination Completed'}
                    </h1>
                    <p className="text-center text-gray-500 text-sm mb-8">
                        {isTerminated ? 'Maximum security violations reached. Your session has been flagged.' : 'Your responses have been securely recorded and submitted.'}
                    </p>

                    {/* Result Summary */}
                    <div className="border border-gray-200 divide-y divide-gray-100 mb-6">
                        <div className="flex justify-between items-center px-5 py-3">
                            <span className="text-xs font-bold uppercase text-gray-500">Final Score</span>
                            <span className="text-xl font-mono font-bold text-gray-900">{examState.currentScore ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center px-5 py-3">
                            <span className="text-xs font-bold uppercase text-gray-500">Questions Attempted</span>
                            <span className="text-lg font-mono font-bold text-gray-900">{examState.totalQuestionsAnswered ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center px-5 py-3">
                            <span className="text-xs font-bold uppercase text-gray-500">Integrity Score</span>
                            <span className={`text-lg font-mono font-bold ${integrityStyle(integrityScore).color !== '#6b7280' ? '' : ''}`}
                                style={{ color: integrityStyle(integrityScore).color }}>
                                {integrityScore}/100
                            </span>
                        </div>
                        <div className="flex justify-between items-center px-5 py-3">
                            <span className="text-xs font-bold uppercase text-gray-500">Security Violations</span>
                            <span className="text-lg font-mono font-bold text-gray-900">{violationCount}</span>
                        </div>
                        <div className="flex justify-between items-center px-5 py-3">
                            <span className="text-xs font-bold uppercase text-gray-500">Fullscreen Exits</span>
                            <span className="text-lg font-mono font-bold text-gray-900">{fsExits}</span>
                        </div>
                        <div className="flex justify-between items-center px-5 py-3">
                            <span className="text-xs font-bold uppercase text-gray-500">Tab Switches</span>
                            <span className="text-lg font-mono font-bold text-gray-900">{tabSwitches}</span>
                        </div>
                        <div className="flex justify-between items-center px-5 py-3">
                            <span className="text-xs font-bold uppercase text-gray-500">Session Duration</span>
                            <span className="font-mono text-gray-900">{fmt(timer)}</span>
                        </div>
                        {(violationCount > 0 || isTerminated) && (
                            <div className="flex justify-between items-center px-5 py-3 bg-red-50">
                                <span className="text-xs font-bold uppercase text-red-700">Session Flag</span>
                                <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded uppercase">
                                    {isTerminated ? '🚩 Flagged — Terminated' : '⚠ Under Review'}
                                </span>
                            </div>
                        )}
                    </div>

                    {isTerminated && (
                        <div className="bg-red-50 border border-red-200 p-4 mb-6 text-xs text-red-700 rounded">
                            <strong className="block mb-1 uppercase">Action Required</strong>
                            Please contact your invigilator or examination administrator immediately.
                        </div>
                    )}

                    <button onClick={() => navigate(`/student/result/${examId}`)}
                        className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold uppercase tracking-widest text-sm transition">
                        View Detailed Result
                    </button>
                    <button onClick={() => navigate('/student/dashboard')}
                        className="w-full py-2 text-gray-400 hover:text-gray-600 font-bold uppercase tracking-widest text-[10px] transition mt-2">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ── PRE-EXAM SECURITY CHECK (Webcam + Fullscreen) ─────────────────────────
    if (!examStarted) {
        return (
            <div className="h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-8 text-center">
                <div className="max-w-md w-full bg-gray-800 rounded-xl p-8 border border-gray-700">
                    <div className="h-16 w-16 mx-auto flex items-center justify-center bg-yellow-500/20 rounded-full mb-6">
                        <span className="text-3xl">🔐</span>
                    </div>
                    <h1 className="text-xl font-bold uppercase tracking-widest mb-2">Pre-Examination Security Check</h1>
                    <p className="text-gray-400 text-sm mb-8">
                        This examination requires fullscreen mode and webcam access. Violations will result in automatic termination.
                    </p>

                    <div className="text-left space-y-3 mb-8 text-sm">
                        {[
                            { label: 'Fullscreen enforcement', icon: '🖥', desc: 'Exam runs in fullscreen. Exiting 3 times terminates.' },
                            { label: 'Webcam monitoring', icon: '📷', desc: 'Camera must remain active throughout.' },
                            { label: 'Tab switch detection', icon: '🔍', desc: '3 tab switches trigger auto-submission.' },
                            { label: 'Keyboard shortcut blocking', icon: '⌨', desc: 'Ctrl+C/V, F12, Ctrl+Shift+I are disabled.' },
                            { label: 'Copy/paste disabled', icon: '🚫', desc: 'Clipboard access is blocked.' },
                        ].map(r => (
                            <div key={r.label} className="flex items-start gap-3 bg-gray-700/50 p-3 rounded">
                                <span className="text-lg flex-shrink-0">{r.icon}</span>
                                <div>
                                    <p className="font-semibold text-white text-xs uppercase tracking-wide">{r.label}</p>
                                    <p className="text-gray-400 text-xs">{r.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {webcamGranted === false && (
                        <div className="bg-red-900/50 border border-red-500 text-red-300 text-xs p-3 rounded mb-4">
                            ⚠ Camera permission denied. Please allow camera access and reload.
                        </div>
                    )}

                    <button onClick={handleBeginExam}
                        className="w-full py-3.5 bg-[#1a237e] hover:bg-[#283593] text-white font-bold uppercase tracking-widest text-sm rounded transition">
                        Proceed to Examination
                    </button>

                    <p className="text-gray-500 text-[10px] mt-4">
                        By proceeding, you consent to activity monitoring for the duration of this examination.
                    </p>
                </div>
            </div>
        );
    }

    // ── FULLSCREEN WALL (if not in FS while exam running) ─────────────────────
    if (!isFullscreen && examStarted && !examState?.examCompleted) {
        return (
            <div className="h-screen bg-gray-900 flex flex-col items-center justify-center text-white text-center p-8">
                <span className="text-6xl mb-6">⚠️</span>
                <h1 className="text-2xl font-bold uppercase tracking-widest mb-3">Fullscreen Required</h1>
                <p className="text-gray-400 text-sm mb-2">You exited fullscreen mode. This is a security violation.</p>
                <p className="text-red-400 text-sm font-semibold mb-8">
                    Violations: {fsExits}/{FULLSCREEN_TOLERANCE} (exit {FULLSCREEN_TOLERANCE} times = auto-termination)
                </p>
                <button onClick={enterFullscreen}
                    className="px-8 py-3 bg-[#1a237e] hover:bg-[#283593] text-white font-bold uppercase tracking-widest rounded transition">
                    Re-enter Fullscreen
                </button>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MAIN CBT LAYOUT
    // ══════════════════════════════════════════════════════════════════════════
    const q = examState?.nextQuestion;
    const qNum = totalQ + 1;

    return (
        <div className="h-screen flex flex-col bg-[#f0f2f5] select-none overflow-hidden"
            onContextMenu={e => e.preventDefault()}
            id="cbt-exam-container">

            <Toast toasts={toasts} />

            {/* ── Fullscreen Exit Modal ──────────────────────────────────────── */}
            {showFsModal && (
                <div className="fixed inset-0 bg-black/80 z-[9998] flex items-center justify-center">
                    <div className="bg-white p-8 max-w-sm w-full text-center shadow-2xl">
                        <span className="text-5xl mb-4 block">⚠️</span>
                        <h2 className="text-lg font-bold text-gray-900 uppercase mb-2">Fullscreen Exit Detected</h2>
                        <p className="text-gray-500 text-sm mb-1">This is violation <strong className="text-red-600">{fsExits}</strong> of {FULLSCREEN_TOLERANCE}.</p>
                        <p className="text-gray-500 text-sm mb-6">Attempting to exit fullscreen {FULLSCREEN_TOLERANCE} times will auto-terminate your examination.</p>
                        <button onClick={() => { setShowFsModal(false); enterFullscreen(); }}
                            className="w-full py-3 bg-[#1a237e] text-white font-bold uppercase tracking-widest text-sm">
                            Return to Exam
                        </button>
                    </div>
                </div>
            )}

            {/* ── Tab Switch Modal ────────────────────────────────────────────── */}
            {showTabModal && (
                <div className="fixed inset-0 bg-black/80 z-[9998] flex items-center justify-center">
                    <div className="bg-white p-8 max-w-sm w-full text-center shadow-2xl">
                        <span className="text-5xl mb-4 block">🔍</span>
                        <h2 className="text-lg font-bold text-gray-900 uppercase mb-2">Tab Switch Detected</h2>
                        <p className="text-gray-500 text-sm mb-1">You switched tabs or minimised the window ({tabSwitches}/{TABSWITCH_TOLERANCE}).</p>
                        <p className="text-gray-500 text-sm mb-6">This activity has been recorded. Further switches may terminate your session.</p>
                        <button onClick={() => setShowTabModal(false)}
                            className="w-full py-3 bg-red-700 text-white font-bold uppercase tracking-widest text-sm">
                            I Understand — Continue Exam
                        </button>
                    </div>
                </div>
            )}

            {/* ── Termination Modal ───────────────────────────────────────────── */}
            {showTermModal && (
                <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center">
                    <div className="bg-white p-8 max-w-sm w-full text-center shadow-2xl border-t-8 border-red-600">
                        <span className="text-5xl mb-4 block">🚫</span>
                        <h2 className="text-lg font-bold text-red-700 uppercase mb-2">Examination Terminated</h2>
                        <p className="text-gray-500 text-sm mb-6">Security violations exceeded the allowed threshold. Your session has been auto-submitted and flagged.</p>
                        <button onClick={() => navigate('/student/dashboard')}
                            className="w-full py-3 bg-gray-900 text-white font-bold uppercase tracking-widest text-sm">
                            Exit
                        </button>
                    </div>
                </div>
            )}

            {/* ── HEADER BAR ──────────────────────────────────────────────────── */}
            {/* ── LIVE MONITORING PANEL (TOP RIGHT) ─────────────────────────── */}
            <div className="fixed top-20 right-6 z-[50] pointer-events-none">
                <div className="w-56 bg-white border-2 border-slate-300 shadow-2xl p-4 pointer-events-auto">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Live Monitor</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full animate-pulse ${webcamGranted ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                            <span className={`text-[10px] font-bold uppercase ${webcamGranted ? 'text-green-700' : 'text-red-700'}`}>
                                {webcamGranted ? 'Webcam Active' : 'Webcam Lost'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Timer Card */}
                        <div className="text-center bg-slate-50 p-2 border border-slate-200">
                            <p className="text-[9px] font-bold uppercase text-slate-400">Time Remaining</p>
                            <p className={`text-2xl font-mono font-black ${examState?.durationMinutes && (examState.durationMinutes * 60 - timer < 300) ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                                {examState?.durationMinutes
                                    ? fmt(Math.max(0, examState.durationMinutes * 60 - timer))
                                    : fmt(timer)
                                }
                            </p>
                        </div>

                        {/* Integrity Score */}
                        <div>
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-[9px] font-bold uppercase text-slate-500">Integrity Score</span>
                                <span className="text-[10px] font-black" style={{ color: is.color }}>{is.label}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div className="h-full transition-all duration-1000"
                                    style={{ width: `${integrityScore}%`, backgroundColor: is.color }} />
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-[11px] font-mono font-black" style={{ color: is.color }}>{integrityScore}%</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Min Req: 70%</span>
                            </div>
                        </div>

                        {/* Adaptive Engine Status */}
                        <div className="bg-blue-50 p-2 border border-blue-100 space-y-2">
                            <p className="text-[9px] font-bold uppercase text-blue-500 mb-1 flex items-center gap-1">
                                <span className="h-1 w-1 bg-blue-500 rounded-full animate-ping" />
                                Adaptive Engine Status
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-[8px] text-blue-400 uppercase font-bold">Difficulty</p>
                                    <p className="text-[11px] font-black text-blue-900">{examState?.currentDifficulty || 'Medium'}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] text-blue-400 uppercase font-bold">Bloom Level</p>
                                    <p className="text-[11px] font-black text-blue-900">{examState?.currentBloomLevel || 'Remember'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[8px] text-blue-400 uppercase font-bold">Current Topic focus</p>
                                <p className="text-[11px] font-black text-blue-900 truncate">{examState?.currentTopic || 'General'}</p>
                            </div>
                        </div>

                        {/* Violation Badge */}
                        <div className={`flex items-center justify-between p-2 border-2 ${violationCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                            <span className="text-[10px] font-bold uppercase text-slate-600">Violations</span>
                            <span className={`text-sm font-black ${violationCount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                {violationCount} / {MAX_VIOLATIONS}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-100 text-center">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                            Government of India<br />Secure Examination Portal
                        </p>
                    </div>
                </div>
            </div>

            <header className="bg-[#1a237e] text-white px-4 py-2 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-white/20 flex items-center justify-center font-black text-xs rounded">P</div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest leading-none">PARAKH — Secure CBT</p>
                        <p className="text-[10px] text-blue-300">Session #{examId}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Timer */}
                    <div className="text-center border border-white/20 px-3 py-1">
                        <p className="text-[9px] uppercase tracking-widest text-blue-300">
                            {examState?.durationMinutes ? 'Time Remaining' : 'Elapsed'}
                        </p>
                        <p className={`font-mono font-bold text-sm ${examState?.durationMinutes && (examState.durationMinutes * 60 - timer < 300) ? 'text-red-400 animate-pulse' : ''}`}>
                            {examState?.durationMinutes
                                ? fmt(Math.max(0, examState.durationMinutes * 60 - timer))
                                : fmt(timer)
                            }
                        </p>
                    </div>
                    {/* Integrity Widget */}
                    <div className={`flex items-center gap-2 px-3 py-1 border ${integrityScore >= 90 ? 'border-green-400/50 bg-green-900/30 text-green-300'
                        : integrityScore >= 70 ? 'border-amber-400/50 bg-amber-900/30 text-amber-300'
                            : 'border-red-400/50 bg-red-900/30 text-red-300'
                        }`}>
                        <span className={`h-2 w-2 rounded-full animate-pulse ${integrityScore >= 90 ? 'bg-green-400' : integrityScore >= 70 ? 'bg-amber-400' : 'bg-red-400'
                            }`} />
                        <div>
                            <p className="text-[9px] uppercase tracking-widest">Integrity</p>
                            <p className="font-mono font-bold text-sm leading-none">{integrityScore}/100</p>
                        </div>
                    </div>
                    {/* Violations */}
                    <div className={`px-3 py-1 border ${violationCount > 0 ? 'border-red-400/50 bg-red-900/30 text-red-300' : 'border-white/20 text-blue-300'}`}>
                        <p className="text-[9px] uppercase tracking-widest">Warnings</p>
                        <p className="font-mono font-bold text-sm">{violationCount}/{MAX_VIOLATIONS}</p>
                    </div>
                    {/* Webcam indicator */}
                    <div className={`px-2 py-1 text-[10px] font-bold uppercase flex items-center gap-1 ${webcamGranted ? 'text-green-300' : 'text-red-300'}`}>
                        <span>📷</span>
                        {webcamGranted ? 'Live' : 'Off'}
                    </div>
                </div>
            </header>

            {/* ── BODY: LEFT | CENTER | RIGHT ─────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT PANEL — Question Navigator */}
                <aside className="w-52 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-auto">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Question Navigator</p>
                        <div className="flex gap-2 mt-2 flex-wrap text-[9px]">
                            <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-green-500 inline-block" />Answered</div>
                            <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-gray-200 inline-block" />Not Visited</div>
                            <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400 inline-block" />Flagged</div>
                            <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-[#1a237e] inline-block" />Current</div>
                        </div>
                    </div>
                    <div className="p-3 grid grid-cols-4 gap-1.5 flex-1 content-start">
                        {Array.from({ length: totalExpected }, (_, i) => {
                            const n = i + 1;
                            const done = n < qNum || answeredMap[n];
                            const flag = flaggedSet.has(n);
                            const curr = n === qNum;
                            return (
                                <button key={n}
                                    className={`h-8 w-full text-[11px] font-bold rounded-sm transition
                    ${curr ? 'bg-[#1a237e] text-white ring-2 ring-blue-300'
                                            : flag ? 'bg-amber-400 text-white'
                                                : done ? 'bg-green-500 text-white'
                                                    : n > qNum ? 'bg-gray-100 text-gray-400 cursor-default'
                                                        : 'bg-gray-200 text-gray-700'}`}>
                                    {n}
                                </button>
                            );
                        })}
                    </div>
                    <div className="p-3 border-t border-gray-200 space-y-1.5 text-[10px] text-gray-500">
                        <div className="flex justify-between"><span>Answered</span><span className="font-bold text-green-700">{Object.keys(answeredMap).length}</span></div>
                        <div className="flex justify-between"><span>Unanswered</span><span className="font-bold text-gray-700">{totalExpected - Object.keys(answeredMap).length}</span></div>
                        <div className="flex justify-between"><span>Flagged</span><span className="font-bold text-amber-600">{flaggedSet.size}</span></div>
                    </div>
                </aside>

                {/* CENTER PANEL — Question */}
                <main className="flex-1 flex flex-col overflow-auto bg-[#f0f2f5]">
                    <div className="flex-1 p-6">
                        <div className="bg-white border border-gray-200 shadow-sm h-full flex flex-col">
                            {/* Question Meta */}
                            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-bold uppercase bg-[#1a237e] text-white px-2.5 py-1 rounded-sm">
                                        Q {qNum} of {totalExpected}
                                    </span>
                                    {q?.topic && (
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 border rounded bg-gray-100 text-gray-700 border-gray-300">
                                            📚 {q.topic}
                                        </span>
                                    )}
                                    {q?.difficulty && (
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border rounded ${diffStyle(q.difficulty)}`}>
                                            {q.difficulty}
                                        </span>
                                    )}
                                    {q?.bloomLevel && (
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border rounded ${bloomStyle(q.bloomLevel)}`}>
                                            🧠 {q.bloomLevel}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => toggleFlag(qNum)}
                                        className={`text-[10px] font-bold uppercase px-2 py-0.5 border rounded transition
                      ${flaggedSet.has(qNum) ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-gray-500 border-gray-300 hover:border-amber-300'}`}>
                                        {flaggedSet.has(qNum) ? '🚩 Flagged' : '⚑ Flag'}
                                    </button>
                                    <span className="text-[10px] font-mono text-gray-400">Q-time: {questionTimer}s</span>
                                </div>
                            </div>

                            {/* Question Body */}
                            <div className="p-6 flex-1 flex flex-col">
                                <p className="text-base font-medium text-gray-900 leading-relaxed mb-6">{q?.content}</p>

                                <div className="space-y-3 flex-1">
                                    {['A', 'B', 'C', 'D'].map(opt => (
                                        <button key={opt} onClick={() => setSelectedOption(opt)}
                                            disabled={submitting}
                                            id={`option-${opt}`}
                                            className={`w-full text-left px-5 py-3.5 border-2 rounded flex items-center gap-4 transition group disabled:opacity-60
                        ${selectedOption === opt
                                                    ? 'border-[#1a237e] bg-blue-50 ring-1 ring-blue-300'
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}>
                                            <span className={`h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold border-2 transition
                        ${selectedOption === opt ? 'bg-[#1a237e] text-white border-[#1a237e]' : 'text-gray-500 border-gray-300 group-hover:border-gray-400'}`}>
                                                {opt}
                                            </span>
                                            <span className="text-sm text-gray-800">{q?.[`option${opt}`]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                                <span className="text-xs text-gray-400">
                                    Score: <span className="font-mono font-bold text-gray-700">{examState?.currentScore ?? 0}</span> correct
                                </span>
                                <button onClick={handleSubmit} disabled={!selectedOption || submitting || terminated}
                                    id="submit-answer-btn"
                                    className={`px-8 py-2.5 bg-[#1a237e] text-white text-xs font-bold uppercase tracking-widest rounded transition
                    ${(!selectedOption || submitting || terminated) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#283593] hover:-translate-y-0.5'}`}>
                                    {submitting ? 'Submitting…' : 'Save & Next →'}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                {/* RIGHT PANEL — Live Integrity + Status */}
                <aside className="w-52 bg-white border-l border-gray-200 flex-shrink-0 flex flex-col overflow-auto">
                    {/* Integrity Score */}
                    <div className={`p-4 border-b border-gray-200 ${is.bg}`}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Live Integrity</p>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`h-3 w-3 rounded-full animate-pulse ${is.dot}`} />
                            <span className="text-[10px] font-bold uppercase" style={{ color: is.color }}>{is.label}</span>
                        </div>
                        <p className="text-2xl font-mono font-bold" style={{ color: is.color }}>{integrityScore}</p>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${is.dot.replace('bg-', 'bg-')}`}
                                style={{ width: `${integrityScore}%`, backgroundColor: is.color }} />
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1">out of 100</p>
                    </div>

                    {/* Violation Counts */}
                    <div className="p-4 border-b border-gray-200 space-y-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Security Metrics</p>
                        {[
                            { label: 'Total Warnings', val: `${violationCount}/${MAX_VIOLATIONS}`, warn: violationCount > 0 },
                            { label: 'FS Exits', val: `${fsExits}/${FULLSCREEN_TOLERANCE}`, warn: fsExits > 0 },
                            { label: 'Tab Switches', val: `${tabSwitches}/${TABSWITCH_TOLERANCE}`, warn: tabSwitches > 0 },
                            { label: 'Camera', val: webcamGranted ? 'Active' : 'Inactive', warn: !webcamGranted },
                        ].map(m => (
                            <div key={m.label} className="flex justify-between items-center">
                                <span className="text-[10px] text-gray-500">{m.label}</span>
                                <span className={`text-[10px] font-bold font-mono ${m.warn ? 'text-red-600' : 'text-green-700'}`}>{m.val}</span>
                            </div>
                        ))}
                    </div>

                    {/* Session Info */}
                    <div className="p-4 border-b border-gray-200 space-y-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Session Info</p>
                        {[
                            { label: 'Elapsed', val: fmt(timer) },
                            { label: 'Q Time', val: `${questionTimer}s` },
                            { label: 'Answered', val: `${Object.keys(answeredMap).length}/${totalExpected}` },
                            { label: 'Flagged', val: flaggedSet.size },
                        ].map(m => (
                            <div key={m.label} className="flex justify-between items-center">
                                <span className="text-[10px] text-gray-500">{m.label}</span>
                                <span className="text-[10px] font-bold font-mono text-gray-800">{m.val}</span>
                            </div>
                        ))}
                    </div>

                    {/* AI Monitor placeholder */}
                    <div className="p-4 border-b border-gray-200">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">AI Monitor</p>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${AI_FACE_MONITOR_ENABLED ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {AI_FACE_MONITOR_ENABLED ? 'ENABLED' : 'STANDBY'}
                        </span>
                        <p className="text-[9px] text-gray-400 mt-1">Face presence detection module</p>
                    </div>

                    {/* Spacer + help text */}
                    <div className="p-4 flex-1">
                        <p className="text-[9px] text-gray-400 leading-relaxed">
                            All activities in this session are monitored and recorded. Suspicious behaviour is automatically flagged for review.
                        </p>
                    </div>
                </aside>
            </div>

            <style>{`
        @keyframes slide-in {
          from { transform: translateX(100px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.25s ease-out; }
      `}</style>
        </div>
    );
};

export default ExamInterface;
