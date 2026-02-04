import React from 'react';

const Card = ({ children, className = '', glass = false, hoverEffect = false, ...props }) => {
    const baseStyles = "rounded-2xl p-6 transition-all duration-300 border";

    const glassStyles = "bg-white/70 backdrop-blur-xl border-white/20 shadow-glass";
    const solidStyles = "bg-white border-surface-100 shadow-xl shadow-surface-200/50";

    const hoverStyles = hoverEffect ? "hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-500/10" : "";

    return (
        <div
            className={`${baseStyles} ${glass ? glassStyles : solidStyles} ${hoverStyles} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
