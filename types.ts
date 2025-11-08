
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
}

export interface ConversionOptions {
  fastq: FastqOptions;
  bed: BedOptions;
}
