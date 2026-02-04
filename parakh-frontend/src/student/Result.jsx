import React from 'react';

const Result = () => {
  return (
    <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <div className="glass max-w-2xl w-full p-10 rounded-3xl text-center animate-slide-up">
        <div className="w-20 h-20 bg-secondary-50 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
          📊
        </div>
        <h1 className="text-3xl font-bold font-display text-surface-900 mb-2">Performance Analytics</h1>
        <p className="text-surface-500 max-w-md mx-auto mb-8">
          Detailed breakdown of your strengths, weaknesses, and improvement areas will appear here after your first assessment.
        </p>
        <div className="flex justify-center gap-4">
          <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-secondary-500 to-primary-600 text-white font-medium shadow-lg shadow-secondary-500/30 hover:shadow-secondary-500/50 transition-all transform hover:-translate-y-1">
            View Sample Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Result;