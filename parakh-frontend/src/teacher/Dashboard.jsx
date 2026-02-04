import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// --- Modals (Government Style) ---

const CreateClassModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', subject: '', description: '' });
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center z-50">
      <div className="bg-white border border-surface-300 shadow-lg p-6 w-full max-w-md">
        <div className="border-b border-surface-200 pb-2 mb-4">
          <h3 className="text-lg font-bold text-primary-900 uppercase">Create New Class</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Class Name</label>
            <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder="e.g. Class 10-A" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Subject</label>
            <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder="e.g. Science" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Description</label>
            <textarea className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" rows="3" placeholder="Enter class description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-surface-200">
          <button onClick={onClose} className="px-4 py-2 border border-surface-300 text-surface-700 bg-surface-50 hover:bg-surface-100 text-sm font-bold uppercase">Cancel</button>
          <button onClick={() => onSave(formData)} className="px-4 py-2 bg-primary-700 text-white hover:bg-primary-800 text-sm font-bold uppercase">Create Class</button>
        </div>
      </div>
    </div>
  );
};

const AddStudentModal = ({ isOpen, onClose, onSave }) => {
  const [email, setEmail] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center z-50">
      <div className="bg-white border border-surface-300 shadow-lg p-6 w-full max-w-md">
        <div className="border-b border-surface-200 pb-2 mb-4">
          <h3 className="text-lg font-bold text-primary-900 uppercase">Add Student</h3>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Student Email ID</label>
          <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder="student@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-surface-200">
          <button onClick={onClose} className="px-4 py-2 border border-surface-300 text-surface-700 bg-surface-50 hover:bg-surface-100 text-sm font-bold uppercase">Cancel</button>
          <button onClick={() => onSave(email)} className="px-4 py-2 bg-primary-700 text-white hover:bg-primary-800 text-sm font-bold uppercase">Add Student</button>
        </div>
      </div>
    </div>
  );
};

const CreateAssessmentModal = ({ isOpen, onClose, onSave, classes }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '', classroomId: '', durationMinutes: 60, type: 'TOPIC',
    subject: 'Science', topic: '', difficulty: 'Medium', questionCount: 10,
    pdfUrl: ''
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center z-50">
      <div className="bg-white border border-surface-300 shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-surface-200 pb-2 mb-4">
          <h3 className="text-lg font-bold text-primary-900 uppercase">Create New Assessment</h3>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-surface-800 uppercase border-l-4 border-accent-400 pl-2">Step 1: Basic Information</h4>
            <div>
              <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Assessment Title</label>
              <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder="e.g. Unit Test 1" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Class</label>
              <select className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm bg-white" value={formData.classroomId} onChange={e => setFormData({ ...formData, classroomId: e.target.value })}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.subject})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Duration (Minutes)</label>
              <input type="number" className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" value={formData.durationMinutes} onChange={e => setFormData({ ...formData, durationMinutes: e.target.value })} />
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-surface-200">
              <button onClick={onClose} className="px-4 py-2 border border-surface-300 text-surface-700 bg-surface-50 hover:bg-surface-100 text-sm font-bold uppercase mr-3">Cancel</button>
              <button onClick={() => setStep(2)} disabled={!formData.title || !formData.classroomId} className="px-4 py-2 bg-primary-700 text-white hover:bg-primary-800 disabled:bg-surface-300 text-sm font-bold uppercase">Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-surface-800 uppercase border-l-4 border-accent-400 pl-2">Step 2: Configuration</h4>
            <div className="flex space-x-4 mb-4">
              <button onClick={() => setFormData({ ...formData, type: 'TOPIC' })} className={`flex-1 py-2 border text-sm font-bold uppercase ${formData.type === 'TOPIC' ? 'bg-primary-50 border-primary-600 text-primary-800' : 'bg-white border-surface-300 text-surface-600'}`}>Topic Based</button>
              <button onClick={() => setFormData({ ...formData, type: 'PDF' })} className={`flex-1 py-2 border text-sm font-bold uppercase ${formData.type === 'PDF' ? 'bg-primary-50 border-primary-600 text-primary-800' : 'bg-white border-surface-300 text-surface-600'}`}>PDF Upload</button>
            </div>

            {formData.type === 'TOPIC' ? (
              <div className="space-y-4 p-4 border border-surface-200 bg-surface-50">
                <div>
                  <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Subject</label>
                  <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder="Subject" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Topic</label>
                  <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder="e.g. Algebra" value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Difficulty</label>
                    <select className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm bg-white" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">No. of Questions</label>
                    <input type="number" className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" value={formData.questionCount} onChange={e => setFormData({ ...formData, questionCount: e.target.value })} />
                  </div>
                </div>
                <p className="text-xs text-surface-500 mt-2 italic">* Questions will be automatically selected from the question bank.</p>
              </div>
            ) : (
              <div className="space-y-3 bg-surface-50 p-8 border border-dashed border-surface-300 flex flex-col items-center justify-center">
                <svg className="w-12 h-12 text-surface-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p className="text-surface-700 font-medium">Upload Question Paper (PDF)</p>
                <p className="text-xs text-surface-500">Official document format required</p>
                <button className="mt-2 px-4 py-2 bg-surface-200 hover:bg-surface-300 text-surface-800 text-xs font-bold uppercase">Choose File</button>
              </div>
            )}

            <div className="flex justify-end mt-6 pt-4 border-t border-surface-200">
              <button onClick={() => setStep(1)} className="px-4 py-2 border border-surface-300 text-surface-700 bg-surface-50 hover:bg-surface-100 text-sm font-bold uppercase mr-3">Back</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-primary-700 text-white hover:bg-primary-800 text-sm font-bold uppercase">Create Assessment</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('classes');
  const [loading, setLoading] = useState(false);

  // Data
  const [classes, setClasses] = useState([]);
  const [assessments, setAssessments] = useState([]);

  // Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${user?.token}`, 'Content-Type': 'application/json' };
    try {
      if (activeTab === 'classes') {
        const res = await fetch('http://localhost:8081/api/teacher/classes', { headers });
        if (res.ok) setClasses(await res.json());
      } else if (activeTab === 'assessments') {
        const resClasses = await fetch('http://localhost:8081/api/teacher/classes', { headers });
        if (resClasses.ok) setClasses(await resClasses.json());

        const res = await fetch('http://localhost:8081/api/teacher/assessments', { headers });
        if (res.ok) setAssessments(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (data) => {
    await fetch('http://localhost:8081/api/teacher/classes', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    setIsClassModalOpen(false);
    fetchData();
  };

  const handleAddStudent = async (email) => {
    const res = await fetch(`http://localhost:8081/api/teacher/classes/${selectedClassId}/students`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (res.ok) {
      alert("Student added successfully");
    } else {
      alert("Failed to add student. Ensure email is correct and student is registered.");
    }
    setIsStudentModalOpen(false);
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

  const openAddStudent = (classId) => {
    setSelectedClassId(classId);
    setIsStudentModalOpen(true);
  };

  return (
    <div className="h-full bg-accent-100 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-primary-900 text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-primary-800 bg-primary-950">
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">PARAKH</h2>
          <p className="text-xs text-primary-200 uppercase tracking-widest">Academic Portal</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button onClick={() => setActiveTab('classes')} className={`w-full text-left px-4 py-2.5 text-sm font-medium border-l-4 ${activeTab === 'classes' ? 'bg-primary-800 border-white text-white' : 'border-transparent text-primary-100 hover:bg-primary-800 hover:text-white'}`}>My Classes</button>
          <button onClick={() => setActiveTab('assessments')} className={`w-full text-left px-4 py-2.5 text-sm font-medium border-l-4 ${activeTab === 'assessments' ? 'bg-primary-800 border-white text-white' : 'border-transparent text-primary-100 hover:bg-primary-800 hover:text-white'}`}>Assessments</button>
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
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b border-surface-200 py-5 px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-900 uppercase tracking-tight">{activeTab === 'classes' ? 'Classroom Management' : activeTab === 'assessments' ? 'Examination Control' : 'Reports & Analytics'}</h1>
          {activeTab === 'classes' && <button onClick={() => setIsClassModalOpen(true)} className="bg-primary-700 text-white px-4 py-2 rounded-sm text-sm font-bold uppercase hover:bg-primary-800">+ New Class</button>}
          {activeTab === 'assessments' && <button onClick={() => setIsAssessmentModalOpen(true)} className="bg-primary-700 text-white px-4 py-2 rounded-sm text-sm font-bold uppercase hover:bg-primary-800">+ New Assessment</button>}
        </header>

        <main className="p-8">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <span className="text-primary-600 font-medium">Loading data...</span>
            </div>
          ) : (
            <>
              {activeTab === 'classes' && (
                <>
                  {classes.length === 0 ? <div className="bg-white p-6 border border-surface-200 text-surface-500 text-center italic">No classes found. Create a class to proceed.</div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {classes.map(c => (
                        <div key={c.id} className="bg-white border border-surface-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                          <div className="border-b border-surface-100 pb-3 mb-3">
                            <h3 className="text-lg font-bold text-primary-900">{c.name}</h3>
                            <p className="text-xs font-bold text-surface-500 uppercase tracking-wide">{c.subject}</p>
                          </div>
                          <p className="text-surface-600 text-sm mb-4 min-h-[40px]">{c.description || 'No description provided.'}</p>
                          <div className="bg-surface-50 p-3 flex justify-between items-center border border-surface-100">
                            <span className="text-xs font-bold text-surface-600 uppercase">{c.students ? c.students.length : 0} Enrolled</span>
                            <button onClick={() => openAddStudent(c.id)} className="text-xs text-primary-700 hover:text-primary-900 font-bold uppercase">+ Add Student</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'reports' && (
                <div className="bg-white p-12 border border-surface-200 text-center">
                  <h3 className="text-xl font-bold text-surface-400 uppercase">Performance Reports Module</h3>
                  <p className="text-surface-500 mt-2">Analytical reports will be displayed here.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <CreateClassModal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} onSave={handleCreateClass} />
      <AddStudentModal isOpen={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)} onSave={handleAddStudent} />
      <CreateAssessmentModal isOpen={isAssessmentModalOpen} onClose={() => setIsAssessmentModalOpen(false)} onSave={handleCreateAssessment} classes={classes} />
    </div>
  );
};

export default TeacherDashboard;