
import React, { useState, useEffect } from 'react';
import { CodeIcon } from './icons/CodeIcon';
import { CopyIcon } from './icons/CopyIcon';

interface ResultDisplayProps {
    script: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ script }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const handleCopy = () => {
        navigator.clipboard.writeText(script);
        setCopied(true);
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
            <div className="p-4 sm:p-6">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <CodeIcon className="w-6 h-6 text-indigo-400" />
                        <h2 className="text-xl font-semibold text-gray-200">Generated Shell Script</h2>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                        <CopyIcon className="w-5 h-5" />
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                </div>
                 <p className="text-sm text-gray-400 mb-4">
                    Save this script to a file (e.g., <code className="bg-gray-900 px-1 py-0.5 rounded">convert.sh</code>), make it executable with <code className="bg-gray-900 px-1 py-0.5 rounded">chmod +x convert.sh</code>, and run it in your terminal. Ensure you have the required dependencies installed.
                </p>
            </div>
            <div className="bg-black/50">
                <pre className="p-4 sm:p-6 text-sm text-gray-200 overflow-x-auto">
                    <code className="language-shell font-mono">{script}</code>
                </pre>
            </div>
        </div>
    );
};

export default ResultDisplay;
