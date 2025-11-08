
import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                Bioinformatics Script Generator
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                Generate command-line scripts to convert genomic data files. Upload your file, select your desired output, and let AI build the script for you.
            </p>
        </header>
    );
};

export default Header;
