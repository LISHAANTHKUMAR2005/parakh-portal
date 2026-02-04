import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('assessments');
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [assessments, setAssessments] = useState([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${user?.token}` };
    try {
      if (activeTab === 'classes') {
        const res = await fetch('http://localhost:8081/api/student/classes', { headers });
        if (res.ok) setClasses(await res.json());
      } else if (activeTab === 'assessments') {
        const res = await fetch('http://localhost:8081/api/student/assessments', { headers });
        if (res.ok) setAssessments(await res.json());
      }
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (assessmentId) => {
    try {
      const res = await fetch(`http://localhost:8081/api/student/assessments/${assessmentId}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/student/exam/${data.examId}`);
      } else {
        alert("Unable to start exam: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResumeExam = (examId) => {
    navigate(`/student/exam/${examId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-blue-400">PARAKH STUDENT</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('assessments')} className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'assessments' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>📝 My Exams</button>
          <button onClick={() => setActiveTab('classes')} className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'classes' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>🏫 My Classes</button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="mb-4">
            <p className="font-bold">{user?.name}</p>
            <p className="text-xs opacity-70">Student</p>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">Sign Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800 uppercase">{activeTab === 'assessments' ? 'Upcoming & Active Exams' : 'Enrolled Classes'}</h1>
        </header>

        {loading ? (
          <div className="flex justify-center h-64 items-center"><div className="animate-spin text-4xl text-blue-600">🌀</div></div>
        ) : (
          <>
            {activeTab === 'classes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.length === 0 ? <p className="text-gray-500">No classes enrolled.</p> : classes.map(c => (
                  <div key={c.id} className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-500">
                    <h3 className="text-xl font-bold text-gray-800">{c.name}</h3>
                    <p className="text-gray-600">{c.subject}</p>
                    <p className="text-sm text-gray-500 mt-2">{c.teacher?.name}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'assessments' && (
              <div className="space-y-4">
                {assessments.length === 0 ? <p className="text-gray-500">No exams scheduled.</p> : assessments.map(a => (
                  <div key={a.id} className="bg-white p-6 rounded-xl shadow-md flex justify-between items-center hover:shadow-lg transition-shadow">
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-800">{a.title}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded font-bold ${a.type === 'TOPIC' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>{a.type}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{a.subject} • {a.classroom} • {a.durationMinutes} mins</p>
                    </div>
                    <div>
                      {a.status === 'PENDING' && (
                        <button onClick={() => handleStartExam(a.id)} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/30">Start Exam</button>
                      )}
                      {a.status === 'IN_PROGRESS' && (
                        <button onClick={() => handleResumeExam(a.examId)} className="px-6 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 shadow-lg shadow-yellow-500/30">Resume</button>
                      )}
                      {a.status === 'COMPLETED' && (
                        <div className="text-center">
                          <span className="block text-xs text-gray-500 uppercase font-bold">Score</span>
                          <span className="text-xl font-bold text-green-600">{a.score !== undefined ? a.score : 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
