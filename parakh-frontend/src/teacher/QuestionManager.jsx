import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Filter, FileText, CheckCircle, Upload, File, Edit } from 'lucide-react';

const QuestionManager = ({ user }) => {
  const [activeTab, setActiveTab] = useState('questions');

  // Questions State
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [filters, setFilters] = useState({ subject: '', difficulty: '', search: '' });
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  // Resources State
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'questions') fetchQuestions();
    else fetchResources();
  }, [activeTab, filters.subject, filters.difficulty]);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    let url = 'http://localhost:8081/api/teacher/questions';
    const params = new URLSearchParams();
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (params.toString()) url += `?${params.toString()}`;

    try {
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${user?.token}` } });
      if (res.ok) setQuestions(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingQuestions(false); }
  };

  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      const res = await fetch('http://localhost:8081/api/teacher/resources', { headers: { 'Authorization': `Bearer ${user?.token}` } });
      if (res.ok) setResources(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingResources(false); }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedQuestionIds(filteredQuestions.map(q => q.id));
    else setSelectedQuestionIds([]);
  };

  const handleSelectQuestion = (id) => {
    if (selectedQuestionIds.includes(id)) setSelectedQuestionIds(selectedQuestionIds.filter(i => i !== id));
    else setSelectedQuestionIds([...selectedQuestionIds, id]);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedQuestionIds.length} questions?`)) return;
    try {
      const res = await fetch('http://localhost:8081/api/teacher/questions/bulk-delete', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedQuestionIds)
      });
      if (res.ok) {
        setSelectedQuestionIds([]);
        fetchQuestions();
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      const res = await fetch(`http://localhost:8081/api/teacher/questions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      if (res.ok) fetchQuestions();
      else alert("Failed to delete. You may not own this question.");
    } catch (e) { alert("Error deleting question"); }
  };

  const handleSaveQuestion = async (data) => {
    const url = editingQuestion
      ? `http://localhost:8081/api/teacher/questions/${editingQuestion.id}`
      : 'http://localhost:8081/api/teacher/questions';
    const method = editingQuestion ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setIsQuestionModalOpen(false);
        setEditingQuestion(null);
        fetchQuestions();
      }
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = async (file) => {
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await fetch('http://localhost:8081/api/teacher/upload-pdf', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` },
        body: data
      });
      if (res.ok) {
        setIsUploadModalOpen(false);
        fetchResources();
      } else {
        alert('Upload failed');
      }
    } catch (err) { console.error(err); alert('Upload error'); }
  };

  // Filtered Questions (Client-side search)
  const filteredQuestions = questions.filter(q =>
    q.content.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 border-b border-surface-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 uppercase tracking-tight flex items-center gap-2">
            <FileText className="text-primary-700" /> Question Bank Repository
          </h2>
          <p className="text-sm text-surface-500">Manage questions and assessment documents.</p>
        </div>
        <div className="flex bg-surface-200 p-1 rounded-sm">
          <button onClick={() => setActiveTab('questions')} className={`px-4 py-1.5 text-sm font-bold uppercase rounded-sm transition-colors ${activeTab === 'questions' ? 'bg-white text-primary-900 shadow-sm' : 'text-surface-600 hover:text-surface-900'}`}>Questions</button>
          <button onClick={() => setActiveTab('documents')} className={`px-4 py-1.5 text-sm font-bold uppercase rounded-sm transition-colors ${activeTab === 'documents' ? 'bg-white text-primary-900 shadow-sm' : 'text-surface-600 hover:text-surface-900'}`}>Documents</button>
        </div>
      </div>

      {activeTab === 'questions' && (
        <>
          <div className="bg-white p-4 border border-surface-200 mb-6 flex gap-4 items-center shadow-sm flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-3 text-surface-400" />
              <input className="w-full pl-9 p-2 border border-surface-300 text-sm focus:border-primary-600 outline-none" placeholder="Search questions..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-surface-500" />
              <select className="p-2 border border-surface-300 text-sm focus:border-primary-600 bg-white" onChange={e => setFilters({ ...filters, subject: e.target.value })}>
                <option value="">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="History">History</option>
              </select>
              <select className="p-2 border border-surface-300 text-sm focus:border-primary-600 bg-white" onChange={e => setFilters({ ...filters, difficulty: e.target.value })}>
                <option value="">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            {selectedQuestionIds.length > 0 && (
              <button onClick={handleBulkDelete} className="bg-red-600 text-white px-4 py-2 rounded-sm text-sm font-bold uppercase hover:bg-red-700 flex items-center gap-2 shadow-sm ml-auto mr-2">
                <Trash2 size={16} /> Delete ({selectedQuestionIds.length})
              </button>
            )}
            <button onClick={() => { setEditingQuestion(null); setIsQuestionModalOpen(true); }} className={`bg-primary-700 text-white px-4 py-2 rounded-sm text-sm font-bold uppercase hover:bg-primary-800 flex items-center gap-2 shadow-sm ${selectedQuestionIds.length === 0 ? 'ml-auto' : ''}`}>
              <Plus size={16} /> Add Question
            </button>
          </div>

          <div className="flex-1 overflow-auto bg-white border border-surface-200 shadow-sm">
            <table className="min-w-full divide-y divide-surface-200">
              <thead className="bg-surface-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 w-10"><input type="checkbox" onChange={handleSelectAll} checked={filteredQuestions.length > 0 && selectedQuestionIds.length === filteredQuestions.length} /></th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider">Question Text</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider w-32">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider w-32">Topic</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-surface-600 uppercase tracking-wider w-32">Difficulty</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-surface-600 uppercase tracking-wider w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-surface-200">
                {loadingQuestions ? <tr><td colSpan="6" className="p-4 text-center text-surface-500">Loading...</td></tr> :
                  filteredQuestions.length === 0 ? <tr><td colSpan="6" className="p-12 text-center text-surface-500 italic">No questions found matching criteria.</td></tr> :
                    filteredQuestions.map(q => (
                      <tr key={q.id} className="hover:bg-surface-50 transition-colors">
                        <td className="px-6 py-4"><input type="checkbox" checked={selectedQuestionIds.includes(q.id)} onChange={() => handleSelectQuestion(q.id)} /></td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-surface-900 line-clamp-2" title={q.content}>{q.content}</p>
                          <p className="text-xs text-surface-500 mt-1">Ans: {q.correctOption}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-surface-600 uppercase">{q.subject}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-surface-600">{q.topic || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${q.difficulty === 'Hard' ? 'bg-red-50 text-red-700 border-red-200' : q.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            {q.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setEditingQuestion(q); setIsQuestionModalOpen(true); }} className="text-surface-400 hover:text-primary-600 transition-colors"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteQuestion(q.id)} className="text-surface-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'documents' && (
        <>
          <div className="bg-white p-4 border border-surface-200 mb-6 flex justify-between items-center shadow-sm">
            <p className="text-sm text-surface-600 font-bold uppercase">Stored Assessment Documents</p>
            <button onClick={() => setIsUploadModalOpen(true)} className="bg-primary-700 text-white px-4 py-2 rounded-sm text-sm font-bold uppercase hover:bg-primary-800 flex items-center gap-2 shadow-sm">
              <Upload size={16} /> Upload PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loadingResources ? <div className="col-span-full text-center p-8 text-surface-500">Loading resources...</div> :
              resources.length === 0 ? <div className="col-span-full p-12 text-center text-surface-500 italic bg-white border border-dashed border-surface-300">No documents uploaded yet.</div> :
                resources.map(r => (
                  <div key={r.id} className="bg-white border border-surface-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center relative group">
                    <div className="bg-red-50 p-4 rounded-full mb-3 text-red-600">
                      <File size={32} />
                    </div>
                    <h3 className="font-bold text-surface-900 text-sm mb-1 break-all line-clamp-2">{r.name}</h3>
                    <p className="text-xs text-surface-500 uppercase">{new Date(r.uploadedAt).toLocaleDateString()}</p>
                    <div className="mt-4 flex gap-2 w-full">
                      <a href={`http://localhost:8081/uploads/${r.url}`} target="_blank" rel="noopener noreferrer" className="flex-1 px-2 py-1 bg-surface-100 text-surface-700 text-xs font-bold uppercase hover:bg-surface-200 rounded-sm">View</a>
                    </div>
                  </div>
                ))
            }
          </div>
        </>
      )}

      <QuestionModal isOpen={isQuestionModalOpen} onClose={() => setIsQuestionModalOpen(false)} onSave={handleSaveQuestion} initialData={editingQuestion} />
      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleFileUpload} />
    </div>
  );
};

const QuestionModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    content: '', optionA: '', optionB: '', optionC: '', optionD: '',
    correctOption: 'A', subject: 'Mathematics', topic: '', difficulty: 'Medium',
    competencyCode: '', bloomLevel: 'Remember', learningOutcomeTag: ''
  });
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleAiGenerate = async () => {
    if (!formData.topic) {
      alert("Please enter a Topic first so AI knows what to generate.");
      return;
    }
    setAiGenerating(true);
    try {
      const res = await fetch('http://localhost:8081/api/teacher/ai-generate-question', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: formData.topic,
          difficulty: formData.difficulty,
          bloomLevel: formData.bloomLevel
        })
      });
      if (res.ok) {
        const data = await res.json();
        // The mock service returns a string JSON we need to parse if it's double wrapped
        const qData = typeof data.question === 'string' ? JSON.parse(data.question) : data.question;
        setFormData({ ...formData, ...qData });
      }
    } catch (e) {
      console.error(e);
      alert("AI Generation failed. Check if server is running.");
    } finally {
      setAiGenerating(false);
    }
  };

  useEffect(() => {
    if (initialData) setFormData({ competencyCode: '', bloomLevel: 'Remember', learningOutcomeTag: '', ...initialData });
    else setFormData({
      content: '', optionA: '', optionB: '', optionC: '', optionD: '',
      correctOption: 'A', subject: 'Mathematics', topic: '', difficulty: 'Medium',
      competencyCode: '', bloomLevel: 'Remember', learningOutcomeTag: ''
    });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl border border-surface-300 rounded-sm">
        <div className="bg-surface-100 p-4 border-b border-surface-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-primary-900 uppercase">{initialData ? 'Edit Question' : 'Add New Question'}</h3>
          <div className="flex gap-2">
            {!initialData && (
              <button
                onClick={handleAiGenerate}
                disabled={aiGenerating}
                className="text-[10px] font-bold uppercase px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm rounded-sm"
              >
                {aiGenerating ? <span className="animate-spin w-2 h-2 border-2 border-white border-t-transparent rounded-full" /> : '🤖'}
                {aiGenerating ? 'Generating...' : 'Generate with AI'}
              </button>
            )}
            <button onClick={onClose} className="text-surface-500 hover:text-surface-900">Close</button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Question Text</label>
            <textarea className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm transition-colors" rows="3" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Subject</label>
              <select className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm bg-white" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}>
                <option>Mathematics</option><option>Science</option><option>English</option><option>History</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Topic</label>
              <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder="e.g. Algebra" value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Difficulty</label>
              <select className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm bg-white" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Correct Answer</label>
              <select className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm bg-white" value={formData.correctOption} onChange={e => setFormData({ ...formData, correctOption: e.target.value })}>
                <option>A</option><option>B</option><option>C</option><option>D</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Bloom Level <span className="text-surface-400 font-normal normal-case">(Cognitive)</span></label>
              <select className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm bg-white" value={formData.bloomLevel} onChange={e => setFormData({ ...formData, bloomLevel: e.target.value })}>
                <option>Remember</option><option>Understand</option><option>Apply</option><option>Analyze</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Competency Code <span className="text-surface-400 font-normal normal-case">(optional)</span></label>
              <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder="e.g. MATH-ALG-01" value={formData.competencyCode} onChange={e => setFormData({ ...formData, competencyCode: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder="Option A" value={formData.optionA} onChange={e => setFormData({ ...formData, optionA: e.target.value })} />
            <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder="Option B" value={formData.optionB} onChange={e => setFormData({ ...formData, optionB: e.target.value })} />
            <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder="Option C" value={formData.optionC} onChange={e => setFormData({ ...formData, optionC: e.target.value })} />
            <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder="Option D" value={formData.optionD} onChange={e => setFormData({ ...formData, optionD: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-surface-600 mb-1 uppercase">Learning Outcome Tag <span className="text-surface-400 font-normal normal-case">(optional)</span></label>
            <input className="w-full p-2 border border-surface-300 focus:border-primary-600 outline-none text-sm" placeholder="e.g. Solve linear equations using substitution" value={formData.learningOutcomeTag} onChange={e => setFormData({ ...formData, learningOutcomeTag: e.target.value })} />
          </div>
        </div>
        <div className="p-4 border-t border-surface-200 bg-surface-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-5 py-2 border border-surface-300 text-surface-700 bg-white hover:bg-surface-50 text-sm font-bold uppercase transition-colors">Cancel</button>
          <button onClick={() => onSave(formData)} className="px-5 py-2 bg-primary-700 text-white hover:bg-primary-800 text-sm font-bold uppercase shadow-sm transition-colors">Save Question</button>
        </div>
      </div>
    </div>
  );
};

const UploadModal = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-surface-300 shadow-2xl p-6 w-full max-w-sm rounded-sm">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-primary-900 uppercase">Upload Document</h3>
        </div>
        <div className="border-2 border-dashed border-surface-300 p-8 flex flex-col items-center justify-center bg-surface-50 mb-4 cursor-pointer hover:bg-surface-100 transition-colors relative">
          <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files[0])} />
          {file ? (
            <>
              <File size={32} className="text-primary-600 mb-2" />
              <p className="text-sm font-bold text-surface-900">{file.name}</p>
            </>
          ) : (
            <>
              <Upload size={32} className="text-surface-400 mb-2" />
              <p className="text-sm font-bold text-surface-600">Click to Select PDF</p>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-surface-300 text-surface-700 bg-white hover:bg-surface-50 text-sm font-bold uppercase transition-colors">Cancel</button>
          <button onClick={() => { if (file) onUpload(file); }} disabled={!file} className="px-4 py-2 bg-primary-700 text-white hover:bg-primary-800 text-sm font-bold uppercase shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Upload</button>
        </div>
      </div>
    </div>
  );
};

export default QuestionManager;