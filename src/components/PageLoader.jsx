// src/components/PageLoader.jsx
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './PageLoader.css';

function PageLoader() {
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);

        // Ép ẩn loader sau 800ms dù trang có load xong hay chưa
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 600);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <div className={`page-loader ${isLoading ? 'active' : ''}`}>
            <div className="loader-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                    <path d="M7 2v20"></path>
                    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
                </svg>
                <span>L'Aura</span>
            </div>
        </div>
    );
}
export default PageLoader;