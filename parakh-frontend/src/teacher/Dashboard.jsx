import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// --- Modals ---

const CreateClassModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', subject: '', description: '' });
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Create New Class</h3>
        <div className="space-y-4">
          <input className="w-full p-2 border rounded" placeholder="Class Name (e.g. Class 10-A)" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <input className="w-full p-2 border rounded" placeholder="Subject" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
          <textarea className="w-full p-2 border rounded" placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          <button onClick={() => onSave(formData)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Create Class</button>
        </div>
      </div>
    </div>
  );
};

const AddStudentModal = ({ isOpen, onClose, onSave }) => {
  const [email, setEmail] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Add Student to Class</h3>
        <input className="w-full p-2 border rounded mb-4" placeholder="Student Email" value={email} onChange={e => setEmail(e.target.value)} />
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          <button onClick={() => onSave(email)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Student</button>
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
    pdfUrl: '' // In real app, this would be file upload
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Create New Assessment</h3>

        {step === 1 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 border-b pb-2">Step 1: Basic Info</h4>
            <input className="w-full p-2 border rounded" placeholder="Assessment Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            <select className="w-full p-2 border rounded" value={formData.classroomId} onChange={e => setFormData({ ...formData, classroomId: e.target.value })}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.subject})</option>)}
            </select>
            <div className="flex items-center space-x-2">
              <label className="w-24 text-sm font-medium">Duration (mins):</label>
              <input type="number" className="p-2 border rounded w-24" value={formData.durationMinutes} onChange={e => setFormData({ ...formData, durationMinutes: e.target.value })} />
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded mr-2">Cancel</button>
              <button onClick={() => setStep(2)} disabled={!formData.title || !formData.classroomId} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 border-b pb-2">Step 2: Configuration</h4>
            <div className="flex space-x-4 mb-4">
              <button onClick={() => setFormData({ ...formData, type: 'TOPIC' })} className={`flex-1 py-2 rounded border ${formData.type === 'TOPIC' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'hover:bg-gray-50'}`}>Topic Based</button>
              <button onClick={() => setFormData({ ...formData, type: 'PDF' })} className={`flex-1 py-2 rounded border ${formData.type === 'PDF' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'hover:bg-gray-50'}`}>PDF Upload</button>
            </div>

            {formData.type === 'TOPIC' ? (
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <input className="w-full p-2 border rounded" placeholder="Subject" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                <input className="w-full p-2 border rounded" placeholder="Topic (e.g. Thermodynamics)" value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-2 border rounded" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm">Questions:</label>
                    <input type="number" className="p-2 border rounded w-full" value={formData.questionCount} onChange={e => setFormData({ ...formData, questionCount: e.target.value })} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Questions will be auto-generated from the question bank based on these criteria.</p>
              </div>
            ) : (
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg text-center border-2 border-dashed border-gray-300">
                <div className="py-8">
                  <p className="text-gray-600 font-medium">📄 Upload Question Paper PDF</p>
                  <p className="text-xs text-blue-500 mt-2">AI Parking Lot: Content will be parsed later</p>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded mr-2">Back</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Create Assessment</button>
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
        // Fetch classes too for the dropdown
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-emerald-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold">TEACHER PORTAL</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('classes')} className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'classes' ? 'bg-emerald-600' : 'hover:bg-emerald-800'}`}>🏫 My Classes</button>
          <button onClick={() => setActiveTab('assessments')} className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'assessments' ? 'bg-emerald-600' : 'hover:bg-emerald-800'}`}>📝 Assessments</button>
        </nav>
        <div className="p-4 border-t border-emerald-800">
          <div className="mb-4">
            <p className="font-bold">{user?.name}</p>
            <p className="text-xs opacity-70">Teacher</p>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">Sign Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 uppercase">{activeTab}</h1>
          {activeTab === 'classes' && <button onClick={() => setIsClassModalOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">+ New Class</button>}
          {activeTab === 'assessments' && <button onClick={() => setIsAssessmentModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ New Assessment</button>}
        </header>

        {loading ? (
          <div className="flex justify-center h-64 items-center"><div className="animate-spin text-4xl text-emerald-600">🌀</div></div>
        ) : (
          <>
            {activeTab === 'classes' && (
              <>
                {classes.length === 0 ? <p className="text-gray-500 italic">No classes found. Create one to get started.</p> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map(c => (
                      <div key={c.id} className="bg-white rounded-xl shadow-lg border-l-4 border-emerald-500 p-6 hover:shadow-xl transition-shadow">
                        <h3 className="text-xl font-bold text-gray-800">{c.name}</h3>
                        <p className="text-emerald-700 font-medium mb-2">{c.subject}</p>
                        <p className="text-gray-500 text-sm mb-4">{c.description || 'No description'}</p>
                        <div className="border-t pt-4 flex justify-between items-center">
                          <span className="text-xs text-gray-500">{c.students ? c.students.length : 0} Students</span>
                          <button onClick={() => openAddStudent(c.id)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Student</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'assessments' && (
              <>
                {assessments.length === 0 ? <p className="text-gray-500 italic">No assessments created yet.</p> : (
                  <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {assessments.map(a => (
                          <tr key={a.id}>
                            <td className="px-6 py-4 font-medium text-gray-900">{a.title}</td>
                            <td className="px-6 py-4 text-gray-600">{a.classroom?.name}</td>
                            <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${a.type === 'TOPIC' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>{a.type}</span></td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{a.status}</span></td>
                            <td className="px-6 py-4 text-sm text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <CreateClassModal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} onSave={handleCreateClass} />
      <AddStudentModal isOpen={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)} onSave={handleAddStudent} />
      <CreateAssessmentModal isOpen={isAssessmentModalOpen} onClose={() => setIsAssessmentModalOpen(false)} onSave={handleCreateAssessment} classes={classes} />
    </div>
  );
};

export default TeacherDashboard;