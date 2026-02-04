import React from 'react';

const Input = ({ label, error, icon, className = '', ...props }) => {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-surface-700 mb-1.5 ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400 group-focus-within:text-primary-500 transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    className={`
            w-full bg-surface-50 border border-surface-200 text-surface-900 text-sm rounded-xl 
            focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 block p-2.5 
            transition-all duration-200 outline-none
            placeholder:text-surface-400
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'hover:border-surface-300'}
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-500 ml-1 animate-slide-up">{error}</p>
            )}
        </div>
    );
};

export default Input;
