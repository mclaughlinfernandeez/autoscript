
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
    onFileChange: (file: File | null) => void;
    currentFile: File | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, currentFile }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileChange(e.dataTransfer.files[0]);
        }
    }, [onFileChange]);
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileChange(e.target.files[0]);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Step 1: Upload Your Data File</h2>
            <label
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-indigo-500 bg-gray-700' : 'border-gray-600 bg-gray-800 hover:bg-gray-700'}`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
                    {currentFile ? (
                        <>
                           <p className="mb-2 text-sm text-green-400"><span className="font-semibold">File Selected:</span> {currentFile.name}</p>
                           <p className="text-xs text-gray-500">{`Size: ${(currentFile.size / 1024).toFixed(2)} KB`}</p>
                           <p className="text-xs text-gray-500 mt-2">Click or drag to replace</p>
                        </>
                    ) : (
                       <>
                           <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                           <p className="text-xs text-gray-500">VCF, CSV, or TXT files</p>
                       </>
                    )}
                </div>
                <input id="dropzone-file" type="file" className="hidden" onChange={handleFileSelect} accept=".vcf,.csv,.txt" />
            </label>
        </div>
    );
};

export default FileUpload;
