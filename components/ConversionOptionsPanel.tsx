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
    annotateGenes: false,
    generateIgvSnapshot: false,
};

const ConversionOptionsPanel: React.FC<ConversionOptionsPanelProps> = ({ onGenerate, isLoading }) => {
    // Input type is fixed to VCF for this version as the core logic is VCF-based
    const inputType: InputFileType = 'vcf'; 
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

    const renderToggle = (id: string, label: string, description: React.ReactNode, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => (
         <div className="flex items-center justify-between">
            <label htmlFor={id} className="text-sm font-medium text-gray-300 cursor-pointer">
                {label}
                <p className="text-xs text-gray-500 font-normal">{description}</p>
            </label>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input 
                    type="checkbox" 
                    name={id}
                    id={id}
                    checked={checked}
                    onChange={onChange}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label htmlFor={id} className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"></label>
            </div>
        </div>
    );


    return (
        <div className="space-y-6 pt-6 border-t border-gray-700">
            <style>{`
                .toggle-checkbox:checked { right: 0; border-color: #4f46e5; }
                .toggle-checkbox:checked + .toggle-label { background-color: #4f46e5; }
            `}</style>
            <div>
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Step 2: Configure Outputs</h2>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Desired Output Format(s)</label>
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

            {outputTypes.includes('fastq') && (
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-indigo-400 mb-3">FASTQ Simulation Options (via wgsim)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        {renderOptionInput("Number of Reads", "numReads", fastqOptions.numReads, setFastqOptions, 1, 1000)}
                        {renderOptionInput("Read 1 Length", "readLength1", fastqOptions.readLength1, setFastqOptions)}
                        {renderOptionInput("Read 2 Length", "readLength2", fastqOptions.readLength2, setFastqOptions)}
                        {renderOptionInput("Insert Size", "insertSize", fastqOptions.insertSize, setFastqOptions)}
                        {renderOptionInput("Insert Std Dev", "insertStdDev", fastqOptions.insertStdDev, setFastqOptions)}
                    </div>
                </div>
            )}

            {outputTypes.includes('bed') && (
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-indigo-400 mb-3">BED Generation Options</h3>
                    <div className="space-y-4">
                         {renderOptionInput("Window Size (vcfR fallback)", "windowSize", bedOptions.windowSize, setBedOptions, 1)}
                        <div className="border-t border-gray-700 pt-4 space-y-4">
                           {renderToggle(
                                "annotate-genes",
                                "Annotate with Genes",
                                <>Maps variants to genes using a GENCODE annotation file. Requires <code className="font-mono">bedtools</code>.</>,
                                bedOptions.annotateGenes,
                                (e) => setBedOptions(prev => ({...prev, annotateGenes: e.target.checked}))
                           )}
                           {renderToggle(
                                "igv-snapshot",
                                "Generate IGV Snapshot",
                                <>Requires <code className="font-mono">IGV</code> to be installed and in your PATH.</>,
                                bedOptions.generateIgvSnapshot,
                                (e) => setBedOptions(prev => ({...prev, generateIgvSnapshot: e.target.checked}))
                           )}
                        </div>
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