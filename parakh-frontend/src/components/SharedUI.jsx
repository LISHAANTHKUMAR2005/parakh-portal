import React from 'react';
import { FileSearch, Loader2 } from 'lucide-react';

export const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

export const LoadingOverlay = ({ message = "Processing..." }) => (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-sm">
        <Loader2 className="animate-spin text-primary-600 mb-2" size={32} />
        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{message}</span>
    </div>
);

export const EmptyState = ({ title, message, icon: Icon = FileSearch }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50 rounded-sm">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4 text-slate-400">
            <Icon size={40} />
        </div>
        <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">{message}</p>
    </div>
);

export const CardHeader = ({ title, subtitle, badge }) => (
    <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
        <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{title}</h2>
            {subtitle && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{subtitle}</p>}
        </div>
        {badge && (
            <span className="px-2 py-1 bg-primary-100 text-primary-700 text-[10px] font-black rounded-sm uppercase">
                {badge}
            </span>
        )}
    </div>
);
