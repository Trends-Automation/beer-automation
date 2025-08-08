// src/components/Header.tsx
import React from 'react';

interface HeaderProps {
    companyName?: string;
    className?: string;
}

const Header: React.FC<HeaderProps> = ({
    companyName = "Beer Automation",
    className = ""
}) => {
    return (
        <header className={`w-full bg-slate-900 border-b border-slate-800 ${className}`}>
            <div className="container mx-auto px-6 py-8">
                <div className="flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-3xl font-light tracking-wide text-white mb-1">
                            {companyName}
                        </h1>
                        <div className="w-16 h-0.5 bg-amber-400 mx-auto"></div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;