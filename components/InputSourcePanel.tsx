import React from 'react';
import { InputSource, PublicDataset } from '../types';
import FileUpload from './FileUpload';

interface InputSourcePanelProps {
    value: InputSource;
    onChange: (value: InputSource) => void;
}

const publicDatasets: PublicDataset[] = [
    {
        name: "1000 Genomes",
        sampleId: "HG00096 (Chr 22)",
        url: "https://storage.googleapis.com/genomics-public-data/1000-genomes/vcf/ALL.chr22.phase3_shapeit2_mvncall_integrated_v5b.20130502.genotypes.vcf.gz"
    },
    {
        name: "1000 Genomes",
        sampleId: "NA12878 (Chr 1)",
        url: "https://storage.googleapis.com/genomics-public-data/1000-genomes/vcf/ALL.chr1.phase3_shapeit2_mvncall_integrated_v5b.20130502.genotypes.vcf.gz",
    },
     {
        name: "GIAB",
        sampleId: "HG001 (NA12878)",
        url: "https://ftp-trace.ncbi.nlm.nih.gov/ReferenceSamples/giab/release/NA12878_HG001/NISTv4.2.1/GRCh38/HG001_GRCh38_1_22_v4.2.1_benchmark.vcf.gz"
    }
];


const InputSourcePanel: React.FC<InputSourcePanelProps> = ({ value, onChange }) => {
    
    const handleSourceTypeChange = (type: 'local' | 'public') => {
        if (type === 'local') {
            onChange({ type: 'local', file: null });
        } else {
            onChange({ type: 'public', dataset: null });
        }
    };

    const handleFileChange = (file: File) => {
        onChange({ type: 'local', file });
    };

    const handleDatasetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedUrl = e.target.value;
        const dataset = publicDatasets.find(d => d.url === selectedUrl) || null;
        onChange({ type: 'public', dataset });
    };

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Step 1: Select Input Source</h2>
            <div className="flex bg-gray-700 rounded-lg p-1 mb-4">
                <button
                    onClick={() => handleSourceTypeChange('local')}
                    className={`w-1/2 py-2 rounded-md text-sm font-semibold transition-colors ${value.type === 'local' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                >
                    Upload Local File
                </button>
                <button
                    onClick={() => handleSourceTypeChange('public')}
                    className={`w-1/2 py-2 rounded-md text-sm font-semibold transition-colors ${value.type === 'public' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                >
                    Use Public Dataset
                </button>
            </div>

            {value.type === 'local' && (
                <FileUpload onFileChange={handleFileChange} currentFile={value.file} />
            )}

            {value.type === 'public' && (
                <div className="space-y-2">
                    <label htmlFor="dataset-select" className="block text-sm font-medium text-gray-300">Select a sample VCF:</label>
                    <select
                        id="dataset-select"
                        onChange={handleDatasetChange}
                        value={value.dataset?.url || ""}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="" disabled>-- Select a public dataset sample --</option>
                        {publicDatasets.map(ds => (
                            <option key={ds.url} value={ds.url}>
                                {ds.name} - {ds.sampleId}
                            </option>
                        ))}
                    </select>
                    {value.dataset && (
                         <p className="text-xs text-gray-400 pt-2">
                            The generated script will automatically download the VCF from: <a href={value.dataset.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{value.dataset.url}</a>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default InputSourcePanel;