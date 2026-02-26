import React, { useState, useEffect, useRef } from 'react';

const LazyRender = ({ children, height = 300, threshold = 0.1 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(containerRef.current);
                }
            },
            { threshold }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        };
    }, [threshold]);

    return (
        <div ref={containerRef} style={{ minHeight: isVisible ? 'auto' : height }}>
            {isVisible ? (
                children
            ) : (
                <div className="flex items-center justify-center bg-surface-50 border border-surface-200" style={{ height }}>
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="w-10 h-10 bg-surface-200 rounded-full mb-2"></div>
                        <div className="w-24 h-2 bg-surface-200 rounded"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LazyRender;
