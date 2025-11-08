
export type InputFileType = 'vcf' | 'csv' | 'txt';
export type OutputFileType = 'fastq' | 'bed';

export interface FastqOptions {
  numReads: number;
  readLength1: number;
  readLength2: number;
  errorRate: number;
  mutationRate: number;
  insertSize: number;
  insertStdDev: number;
}

export interface BedOptions {
  useEndTag: boolean;
  windowSize: number;
  annotateGenes: boolean;
  generateIgvSnapshot: boolean;
}

export interface ConversionOptions {
  fastq: FastqOptions;
  bed: BedOptions;
}

export interface PublicDataset {
  name: string;
  sampleId: string;
  url: string;
}

export type InputSource = 
  | { type: 'local'; file: File | null; }
  | { type: 'public'; dataset: PublicDataset | null; file?: never; };