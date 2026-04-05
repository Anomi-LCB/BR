"use client";

import { useState } from "react";

export default function ChurchLogo() {
    const [isError, setIsError] = useState(false);

    return (
        <div className="flex justify-center items-center py-4">
            <div className="flex items-center justify-center transition-all duration-500 hover:scale-105">
                {!isError ? (
                    <a
                        href="http://mokposarang.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative flex items-center justify-center group cursor-pointer"
                    >
                        <img
                            src="/BR/logo-final.png?v=11"
                            alt="사랑의교회"
                            className="h-11 w-auto object-contain transition-opacity group-hover:opacity-80 drop-shadow-sm"
                            style={{
                                filter: 'brightness(0) saturate(100%) invert(20%) sepia(85%) saturate(3000%) hue-rotate(345deg) brightness(95%) contrast(100%)' // Forces red color via CSS filter
                            }}
                            onError={() => setIsError(true)}
                        />
                    </a>
                ) : (
                    <a
                        href="http://mokposarang.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 font-bold text-sm tracking-tight hover:opacity-10 transition-opacity cursor-pointer"
                    >
                        사랑의교회
                    </a>
                )}
            </div>
        </div>
    );
}
