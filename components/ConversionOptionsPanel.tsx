
import React, { useState } from 'react';
import { ConversionOptions, InputFileType, OutputFileType, FastqOptions, BedOptions } from '../types';

interface ConversionOptionsPanelProps {
    onGenerate: (options: ConversionOptions, inputType: InputFileType, outputTypes: OutputFileType[]) => void;
    isLoading: boolean;
}

const initialFastqOptions: FastqOptions = {
    numReads: 1000000,
    readLength1: 150,
    readLength2: 150,
    errorRate: 0.0,
    mutationRate: 0.0,
    insertSize: 500,
    insertStdDev: 50,
};

const initialBedOptions: BedOptions = {
    useEndTag: true,
    windowSize: 1,
};

const ConversionOptionsPanel: React.FC<ConversionOptionsPanelProps> = ({ onGenerate, isLoading }) => {
    const [inputType, setInputType] = useState<InputFileType>('vcf');
    const [outputTypes, setOutputTypes] = useState<OutputFileType[]>(['bed']);
    const [fastqOptions, setFastqOptions] = useState<FastqOptions>(initialFastqOptions);
    const [bedOptions, setBedOptions] = useState<BedOptions>(initialBedOptions);

    const handleOutputToggle = (type: OutputFileType) => {
        setOutputTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleGenerateClick = () => {
        if (outputTypes.length > 0) {
            onGenerate({ fastq: fastqOptions, bed: bedOptions }, inputType, outputTypes);
        }
    };
    
    const renderOptionInput = (label: string, key: keyof FastqOptions | keyof BedOptions, value: number, setter: React.Dispatch<React.SetStateAction<any>>, min: number = 0, step: number = 1) => (
        <div className="grid grid-cols-2 items-center gap-4">
            <label htmlFor={key} className="text-sm font-medium text-gray-300">{label}</label>
            <input
                type="number"
                id={key}
                name={key}
                value={value}
                min={min}
                step={step}
                onChange={(e) => setter((prev: any) => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-1.5 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Step 2: Configure Conversion</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Input Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Input File Type</label>
                        <select
                            value={inputType}
                            onChange={(e) => setInputType(e.target.value as InputFileType)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="vcf">VCF (Variant Call Format)</option>
                            <option value="csv">CSV (Comma-Separated Values)</option>
                            <option value="txt">TXT (Tab-Separated Text)</option>
                        </select>
                    </div>

                    {/* Output Types */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Desired Output(s)</label>
                        <div className="flex space-x-4">
                            {(['fastq', 'bed'] as OutputFileType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleOutputToggle(type)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${outputTypes.includes(type) ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                                >
                                    {type.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* FASTQ Options */}
            {outputTypes.includes('fastq') && (
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-indigo-400 mb-3">FASTQ Simulation Options</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        {renderOptionInput("Number of Reads", "numReads", fastqOptions.numReads, setFastqOptions, 1, 1000)}
                        {renderOptionInput("Read 1 Length", "readLength1", fastqOptions.readLength1, setFastqOptions)}
                        {renderOptionInput("Read 2 Length", "readLength2", fastqOptions.readLength2, setFastqOptions)}
                        {renderOptionInput("Insert Size", "insertSize", fastqOptions.insertSize, setFastqOptions)}
                        {renderOptionInput("Insert Std Dev", "insertStdDev", fastqOptions.insertStdDev, setFastqOptions)}
                    </div>
                </div>
            )}

            {/* BED Options */}
            {outputTypes.includes('bed') && (
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-indigo-400 mb-3">BED Generation Options</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                         {renderOptionInput("Window Size (for fallback)", "windowSize", bedOptions.windowSize, setBedOptions, 1)}
                    </div>
                </div>
            )}
            
            <div className="pt-4 text-center">
                 <button
                    onClick={handleGenerateClick}
                    disabled={isLoading || outputTypes.length === 0}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 text-lg shadow-lg hover:shadow-indigo-500/50"
                >
                    {isLoading ? 'Generating...' : 'Generate Script'}
                </button>
            </div>
        </div>
    );
};

export default ConversionOptionsPanel;
