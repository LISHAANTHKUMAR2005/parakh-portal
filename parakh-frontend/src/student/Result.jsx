import React from 'react';
import { useAuth } from '../context/AuthContext';

const Result = () => {
  const { user } = useAuth();

  // Mock Data for display
  const results = [
    { id: 'EX-2023-001', subject: 'Science', topic: 'Thermodynamics', date: '2023-10-15', score: 85, total: 100, status: 'PASS' },
    { id: 'EX-2023-002', subject: 'Mathematics', topic: 'Calculus', date: '2023-11-02', score: 72, total: 100, status: 'PASS' },
    { id: 'EX-2023-003', subject: 'English', topic: 'Grammar', date: '2023-12-10', score: 90, total: 100, status: 'PASS' },
  ];

  return (
    <div className="min-h-screen bg-surface-100 p-8 flex justify-center font-sans">
      <div className="bg-white w-full max-w-4xl shadow-lg border border-surface-300 p-10 min-h-[800px] relative">
        {/* Header */}
        <div className="text-center border-b-2 border-primary-900 pb-6 mb-8">
          <h1 className="text-3xl font-bold text-primary-900 tracking-tight uppercase mb-1">PARAKH NATIONAL ASSESSMENT CENTRE</h1>
          <p className="text-sm font-bold text-surface-600 uppercase tracking-widest">Government of India</p>
          <div className="mt-4 inline-block px-4 py-1 bg-primary-900 text-white font-bold uppercase text-sm">Statement of Marks</div>
        </div>

        {/* Candidate Info */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
          <div className="flex">
            <span className="w-32 font-bold text-surface-600 uppercase">Candidate Name:</span>
            <span className="font-bold text-primary-900">{user?.name || 'STUDENT NAME'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-surface-600 uppercase">Roll Number:</span>
            <span className="font-mono text-surface-900">2023-ST-{(user?.id || 1001).toString().padStart(4, '0')}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-surface-600 uppercase">Institution:</span>
            <span className="text-surface-900">{user?.institution || 'Kendriya Vidyalaya, Delhi'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-surface-600 uppercase">Date of Issue:</span>
            <span className="text-surface-900">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Results Table */}
        <table className="w-full border-collapse border border-surface-900 mb-8">
          <thead>
            <tr className="bg-surface-100">
              <th className="border border-surface-900 px-4 py-2 text-left text-xs font-bold text-surface-900 uppercase">Exam ID</th>
              <th className="border border-surface-900 px-4 py-2 text-left text-xs font-bold text-surface-900 uppercase">Subject / Topic</th>
              <th className="border border-surface-900 px-4 py-2 text-center text-xs font-bold text-surface-900 uppercase">Date</th>
              <th className="border border-surface-900 px-4 py-2 text-center text-xs font-bold text-surface-900 uppercase">Max Marks</th>
              <th className="border border-surface-900 px-4 py-2 text-center text-xs font-bold text-surface-900 uppercase">Obtained</th>
              <th className="border border-surface-900 px-4 py-2 text-center text-xs font-bold text-surface-900 uppercase">Result</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id}>
                <td className="border border-surface-900 px-4 py-2 text-sm font-mono text-surface-700">{r.id}</td>
                <td className="border border-surface-900 px-4 py-2 text-sm text-surface-900 font-bold">
                  {r.subject} <span className="font-normal text-surface-600">- {r.topic}</span>
                </td>
                <td className="border border-surface-900 px-4 py-2 text-center text-sm text-surface-700">{r.date}</td>
                <td className="border border-surface-900 px-4 py-2 text-center text-sm text-surface-900">{r.total}</td>
                <td className="border border-surface-900 px-4 py-2 text-center text-sm font-bold text-primary-800">{r.score}</td>
                <td className="border border-surface-900 px-4 py-2 text-center text-sm font-bold text-green-700">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Notes */}
        <div className="mt-12 pt-4 border-t border-surface-400 text-xs text-surface-600 text-justify">
          <p className="mb-2"><strong>Disclaimer:</strong> This is an electronically generated statement of marks. The actual grade card issued by the authority shall be treated as final.</p>
          <p><strong>Grading System:</strong> A+ (90-100), A (80-89), B (70-79), C (60-69), D (50-59), F (Below 50).</p>
        </div>

        {/* Signature Block */}
        <div className="absolute bottom-10 right-10 text-center">
          <div className="h-12 mb-2 w-32 mx-auto"></div> {/* Spacer for signature */}
          <p className="text-sm font-bold text-primary-900 uppercase">Controller of Examinations</p>
          <p className="text-xs text-surface-500">PARAKH Centre</p>
        </div>

        {/* Print Button (Hidden in Print) */}
        <div className="absolute top-10 right-10 print:hidden">
          <button onClick={() => window.print()} className="px-4 py-2 bg-surface-800 text-white text-xs font-bold uppercase hover:bg-black shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default Result;