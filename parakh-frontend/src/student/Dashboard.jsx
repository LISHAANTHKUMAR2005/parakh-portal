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
    <div className="h-full bg-accent-100 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-primary-900 text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-primary-800 bg-primary-950">
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">PARAKH</h2>
          <p className="text-xs text-primary-200 uppercase tracking-widest">Student Portal</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button onClick={() => setActiveTab('assessments')} className={`w-full text-left px-4 py-2.5 text-sm font-medium border-l-4 ${activeTab === 'assessments' ? 'bg-primary-800 border-white text-white' : 'border-transparent text-primary-100 hover:bg-primary-800 hover:text-white'}`}>My Examinations</button>
          <button onClick={() => setActiveTab('classes')} className={`w-full text-left px-4 py-2.5 text-sm font-medium border-l-4 ${activeTab === 'classes' ? 'bg-primary-800 border-white text-white' : 'border-transparent text-primary-100 hover:bg-primary-800 hover:text-white'}`}>Enrolled Classes</button>
        </nav>
        <div className="p-4 border-t border-primary-800 bg-primary-950">
          <div className="mb-3">
            <p className="text-sm font-semibold text-white">{user?.name}</p>
            <p className="text-xs text-primary-300">Candidate / Student</p>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full px-3 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wide rounded-sm transition-colors text-center">Sign Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <header className="mb-6 border-b border-surface-200 pb-4 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-primary-900 uppercase tracking-tight">{activeTab === 'assessments' ? 'Examination Dashboard' : 'Classroom Enrollments'}</h1>
        </header>

        {loading ? (
          <div className="flex justify-center h-40 items-center">
            <span className="text-primary-600 font-medium">Loading data...</span>
          </div>
        ) : (
          <>
            {activeTab === 'classes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.length === 0 ? <div className="col-span-3 bg-white p-6 border border-surface-200 text-surface-500 text-center italic">No confirmed enrollments found.</div> : classes.map(c => (
                  <div key={c.id} className="bg-white p-5 border border-surface-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="border-b border-surface-100 pb-2 mb-3">
                      <h3 className="text-lg font-bold text-primary-900">{c.name}</h3>
                      <p className="text-xs font-bold text-surface-500 uppercase tracking-wide">{c.subject}</p>
                    </div>
                    <p className="text-sm text-surface-600 mb-3"><span className="font-semibold">Instructor:</span> {c.teacher?.name}</p>
                    <div className="mt-4 pt-2 border-t border-surface-100 text-xs text-primary-600 font-bold uppercase cursor-pointer hover:underline text-right">
                      View Details &rarr;
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'assessments' && (
              <div className="space-y-4">
                {assessments.length === 0 ? <div className="bg-white p-6 border border-surface-200 text-surface-500 text-center italic">No examinations scheduled.</div> : assessments.map(a => (
                  <div key={a.id} className="bg-white p-5 border border-surface-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center hover:border-primary-200 transition-colors">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-bold text-primary-900">{a.title}</h3>
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold border ${a.type === 'TOPIC' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-orange-50 text-orange-800 border-orange-200'}`}>{a.type} Assessment</span>
                      </div>
                      <p className="text-surface-600 text-sm font-medium">{a.subject} <span className="mx-2 text-surface-300">|</span> Class: {a.classroom} <span className="mx-2 text-surface-300">|</span> Duration: {a.durationMinutes} Mins</p>
                    </div>
                    <div>
                      {a.status === 'PENDING' && (
                        <button onClick={() => handleStartExam(a.id)} className="px-6 py-2 bg-primary-700 text-white rounded-sm font-bold uppercase text-sm hover:bg-primary-800 shadow-sm">Start Attempt</button>
                      )}
                      {a.status === 'IN_PROGRESS' && (
                        <button onClick={() => handleResumeExam(a.examId)} className="px-6 py-2 bg-yellow-600 text-white rounded-sm font-bold uppercase text-sm hover:bg-yellow-700 shadow-sm">Resume Attempt</button>
                      )}
                      {a.status === 'COMPLETED' && (
                        <div className="bg-surface-50 border border-surface-200 px-4 py-2 text-center min-w-[120px]">
                          <span className="block text-[10px] text-surface-500 uppercase font-bold tracking-wider">Score Obtained</span>
                          <span className="text-lg font-bold text-green-700">{a.score !== undefined ? a.score : 'Pending'}</span>
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
