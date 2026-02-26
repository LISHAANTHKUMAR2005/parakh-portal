import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ClassManagement from './ClassManagement';
import QuestionManager from './QuestionManager';
import TestBuilder from './TestBuilder';
import TeacherAnalytics from './TeacherAnalytics';
import DashboardOverview from './DashboardOverview';
import LiveMonitor from './LiveMonitor';

// --- Main Component ---

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Data
  const [classes, setClasses] = useState([]); // Needed for Assessment creation
  const [assessments, setAssessments] = useState([]);
  const [systemNotice, setSystemNotice] = useState(null);

  // Modals
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${user?.token}`, 'Content-Type': 'application/json' };
    try {
      if (activeTab === 'assessments') {
        const resClasses = await fetch('http://localhost:8081/api/teacher/classes', { headers });
        if (resClasses.ok) setClasses(await resClasses.json());

        const res = await fetch('http://localhost:8081/api/teacher/assessments', { headers });
        if (res.ok) setAssessments(await res.json());
      }

      // Always fetch system notice
      const resNotice = await fetch('http://localhost:8081/api/public/config/notice');
      if (resNotice.ok) setSystemNotice(await resNotice.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = async (data) => {
    await fetch('http://localhost:8081/api/teacher/assessments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    setIsAssessmentModalOpen(false);
    fetchData();
  };

  const handleDeleteAssessment = async (id) => {
    if (!window.confirm("Delete this assessment?")) return;
    try {
      const res = await fetch(`http://localhost:8081/api/teacher/assessments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      if (res.ok) fetchData();
      else {
        const txt = await res.text();
        alert("Failed: " + txt);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen w-screen flex bg-accent-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-primary-900 text-white flex flex-col flex-shrink-0 h-screen overflow-y-auto">
        <div className="p-5 border-b border-primary-800 bg-primary-950">
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">PARAKH</h2>
          <p className="text-xs text-primary-200 uppercase tracking-widest">Academic Portal</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-2.5 text-sm font-medium border-l-4 ${activeTab === 'overview' ? 'bg-primary-800 border-white text-white' : 'border-transparent text-primary-100 hover:bg-primary-800 hover:text-white'}`}>Overview</button>
          <button onClick={() => setActiveTab('classes')} className={`w-full text-left px-4 py-2.5 text-sm font-medium border-l-4 ${activeTab === 'classes' ? 'bg-primary-800 border-white text-white' : 'border-transparent text-primary-100 hover:bg-primary-800 hover:text-white'}`}>My Classes</button>
          <button onClick={() => setActiveTab('questions')} className={`w-full text-left px-4 py-2.5 text-sm font-medium border-l-4 ${activeTab === 'questions' ? 'bg-primary-800 border-white text-white' : 'border-transparent text-primary-100 hover:bg-primary-800 hover:text-white'}`}>Question Bank</button>
          <button onClick={() => setActiveTab('assessments')} className={`w-full text-left px-4 py-2.5 text-sm font-medium border-l-4 ${activeTab === 'assessments' ? 'bg-primary-800 border-white text-white' : 'border-transparent text-primary-100 hover:bg-primary-800 hover:text-white'}`}>Assessments</button>
          <button onClick={() => setActiveTab('live')} className={`w-full text-left px-4 py-2.5 text-sm font-medium border-l-4 ${activeTab === 'live' ? 'bg-primary-800 border-white text-white' : 'border-transparent text-primary-100 hover:bg-primary-800 hover:text-white'}`}>Live Monitor</button>
          <button onClick={() => setActiveTab('reports')} className={`w-full text-left px-4 py-2.5 text-sm font-medium border-l-4 ${activeTab === 'reports' ? 'bg-primary-800 border-white text-white' : 'border-transparent text-primary-100 hover:bg-primary-800 hover:text-white'}`}>Student Performance</button>
        </nav>
        <div className="p-4 border-t border-primary-800 bg-primary-950">
          <div className="mb-3">
            <p className="text-sm font-semibold text-white">{user?.name}</p>
            <p className="text-xs text-primary-300">Teacher Account</p>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full px-3 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wide rounded-sm transition-colors text-center">Sign Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Global System Notice */}
        {systemNotice?.enabled && (
          <div className={`px-8 py-2.5 flex items-center justify-between gap-4 border-b animate-in fade-in duration-500 shadow-sm
            ${systemNotice.priority === 'CRITICAL' ? 'bg-red-600 text-white' :
              systemNotice.priority === 'HIGH' ? 'bg-orange-500 text-white' :
                systemNotice.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                  'bg-blue-600 text-white'}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {systemNotice.priority === 'CRITICAL' ? '🚨' : systemNotice.priority === 'HIGH' ? '⚠️' : 'ℹ️'}
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{systemNotice.title}</p>
                <p className="text-sm font-bold">{systemNotice.message}</p>
              </div>
            </div>
            <button onClick={() => setSystemNotice({ ...systemNotice, enabled: false })} className="text-white/70 hover:text-white transition-colors">
              ✕
            </button>
          </div>
        )}
        {activeTab === 'overview' ? (
          <DashboardOverview user={user} setActiveTab={setActiveTab} onOpenCreateAssessment={() => setIsAssessmentModalOpen(true)} />
        ) : (
          <>
            {/* Dynamic Header based on Tab */}
            <header className="bg-white shadow-sm border-b border-surface-200 py-4 px-6 flex justify-between items-center flex-shrink-0">
              <h1 className="text-xl font-bold text-primary-900 uppercase tracking-tight">
                {activeTab === 'classes' ? 'Classroom Management' :
                  activeTab === 'questions' ? 'Question Bank Repository' :
                    activeTab === 'assessments' ? 'Examination Control Center' :
                      activeTab === 'live' ? 'Live Monitoring' :
                        activeTab === 'reports' ? 'Student Performance Analytics' : 'Dashboard'}
              </h1>
              {activeTab === 'assessments' && <button onClick={() => setIsAssessmentModalOpen(true)} className="bg-primary-700 text-white px-4 py-2 rounded-sm text-sm font-bold uppercase hover:bg-primary-800 shadow-sm">+ New Assessment</button>}
            </header>

            <main className="flex-1 overflow-auto bg-surface-50 p-6">
              {activeTab === 'classes' && <ClassManagement user={user} />}
              {activeTab === 'questions' && <QuestionManager user={user} />}
              {activeTab === 'live' && <LiveMonitor user={user} />}

              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <span className="text-primary-600 font-medium animate-pulse">Loading data...</span>
                </div>
              ) : (
                <>
                  {activeTab === 'assessments' && (
                    <>
                      {assessments.length === 0 ? <div className="bg-white p-6 border border-surface-200 text-surface-500 text-center italic">No assessments created.</div> : (
                        <div className="bg-white border border-surface-200 shadow-sm">
                          <table className="min-w-full divide-y divide-surface-200">
                            <thead className="bg-surface-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Assessment Title</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Class</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Created Date</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-surface-600 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-surface-200">
                              {assessments.map(a => (
                                <tr key={a.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-900">{a.title}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600">{a.classroom?.name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-bold uppercase border ${a.type === 'TOPIC' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-orange-50 text-orange-800 border-orange-200'}`}>{a.type}</span></td>
                                  <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-green-50 text-green-800 border border-green-200 text-xs font-bold uppercase">Active</span></td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button onClick={() => handleDeleteAssessment(a.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase border border-red-200 px-2 py-1 rounded bg-red-50 hover:bg-red-100">Delete</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'reports' && <TeacherAnalytics user={user} />}
                </>
              )}
            </main>
          </>
        )}
      </div>

      <TestBuilder isOpen={isAssessmentModalOpen} onClose={() => setIsAssessmentModalOpen(false)} onSave={handleCreateAssessment} classes={classes} user={user} />
    </div>
  );
};

export default TeacherDashboard;