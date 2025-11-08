import { GoogleGenAI } from "@google/genai";
import { ConversionOptions, InputFileType, OutputFileType, InputSource } from '../types';

function buildPrompt(inputSource: InputSource, inputType: InputFileType, outputTypes: OutputFileType[], options: ConversionOptions): string {
  
  const inputFileName = inputSource.type === 'local' && inputSource.file ? `"${inputSource.file.name}"` : '""';
  
  let sourceBlock: string;
  if (inputSource.type === 'public' && inputSource.dataset) {
      sourceBlock = `
# --- Data Source: Public Dataset ---
# This script will download the required VCF file from a public repository.
# Dataset: ${inputSource.dataset.name}
# Sample ID: ${inputSource.dataset.sampleId}
vcf_url <- "${inputSource.dataset.url}"
input_vcf_file <- basename(vcf_url)

# Download the VCF and its index if they don't exist locally
if (!file.exists(input_vcf_file)) {
  cat("Downloading VCF file:", input_vcf_file, "\\n")
  download.file(vcf_url, destfile = input_vcf_file, mode = "wb")
}
if (!file.exists(paste0(input_vcf_file, ".tbi"))) {
  cat("Downloading VCF index file...\\n")
  # Index file URL might need .tbi or .csi extension, we'll assume .tbi for VCF.gz
  index_url <- paste0(vcf_url, ".tbi")
  tryCatch({
    download.file(index_url, destfile = paste0(input_vcf_file, ".tbi"), mode = "wb")
  }, error = function(e) {
    cat("Warning: Could not download index file at", index_url, ". Some tools might require it.\\n")
  })
}
cat("Using VCF file:", input_vcf_file, "\\n")
`;
  } else {
      sourceBlock = `
# --- Data Source: Local File ---
# Define the input file name.
# Please ensure this file is in the same directory as the script, or provide a full path.
input_vcf_file <- ${inputFileName}
if (!file.exists(input_vcf_file)) {
  stop("Input file not found: ", input_vcf_file)
}
cat("Using VCF file:", input_vcf_file, "\\n")
`;
  }
    
  let prompt = `
You are an expert bioinformatician tasked with generating a professional-grade, runnable R script. The user wants to convert a genomic data file.

**User Request:**
- **Input Data Source:** ${inputSource.type === 'public' && inputSource.dataset ? `Public Dataset (${inputSource.dataset.name} - ${inputSource.dataset.sampleId})` : `Local file named ${inputFileName}`}
- **Input File Type:** ${inputType}
- **Desired Outputs:** ${outputTypes.join(', ')}

**Instructions for R Script Generation:**

1.  **Header and Dependencies:**
    *   Start with a clear header explaining the script's purpose.
    *   Create a dedicated section to list ALL required R packages (e.g., vcfR, readr) and command-line tools (e.g., wgsim, bedtools, bcftools, IGV).
    *   For each dependency, provide commented-out installation commands (using \`install.packages()\`, \`BiocManager::install()\`, and a note on using conda for CLI tools like \`conda install -c bioconda wgsim bedtools\` and instructions for downloading IGV).

2.  **Tool Verification:**
    *   Before executing any command-line operations, include an R function \`check_tool(tool_name)\` that uses \`Sys.which()\` to verify that the required command-line tools are available in the system's PATH. If a tool is not found, the script should stop with an informative error message.
    *   Call this function for every required CLI tool (wgsim, bedtools, bcftools, etc.).

3.  **Input File Handling:**
    *   Use the following R code block to handle the input data source. This is MANDATORY.
    \`\`\`r
    ${sourceBlock}
    \`\`\`
    *   Base all output file names on this \`input_vcf_file\` variable.

4.  **Modular Functions:**
    *   Encapsulate the logic for each file conversion (\`vcf_to_fastq\`, \`vcf_to_bed\`) inside its own R function. This is crucial for readability and reusability.
    *   These functions should take the input file path and relevant options as arguments.

5.  **Conversion Logic & Parameters:**

`;

  if (outputTypes.includes('fastq')) {
    const { numReads, readLength1, readLength2, errorRate, mutationRate, insertSize, insertStdDev } = options.fastq;
    prompt += `
    **FASTQ Generation (from VCF):**
    *   The \`vcf_to_fastq\` function must generate synthetic paired-end reads by creating and executing a \`wgsim\` command.
    *   The command must be built programmatically within R using \`paste()\` or \`sprintf()\` and executed with \`system()\`.
    *   Use these user-defined parameters for the \`wgsim\` command:
        *   Number of read pairs (-N): ${numReads}
        *   Read 1 length (-1): ${readLength1}
        *   Read 2 length (-2): ${readLength2}
        *   Base error rate (-e): ${errorRate}
        *   Mutation rate (-r): ${mutationRate}
        *   Outer distance (-d): ${insertSize}
        *   Standard deviation (-s): ${insertStdDev}
    *   The R script must call the \`check_tool("wgsim")\` function before attempting to run the command.
`;
  }

  if (outputTypes.includes('bed')) {
    const { windowSize, annotateGenes, generateIgvSnapshot } = options.bed;
    prompt += `
    **BED Generation (from VCF):**
    *   The \`vcf_to_bed\` function should provide two methods, with the \`bcftools\` method being the default.
    *   **Method 1 (Recommended): Using \`bcftools\`:**
        *   This is efficient for large files.
        *   Construct a command like: \`bcftools query -f '%CHROM\\t%POS0\\t%END\\n' <input_vcf> > <output.bed>\`.
        *   Execute it using \`system()\`. Call \`check_tool("bcftools")\` first.
    *   **Method 2 (Alternative): Using R's \`vcfR\` package:**
        *   Provide this as a commented-out alternative within the function.
        *   The code should read the VCF with \`vcfR::read.vcfR()\`, extract chromosome and position, calculate the end position (POS + ${windowSize}), and write to a BED file using \`readr::write_tsv()\`.
`;
    if (annotateGenes) {
        prompt += `
    *   **Gene Annotation (Optional Step):**
        *   Implement this logic in a dedicated function: \`annotate_bed_with_genes(bed_file_path)\`.
        *   **Download Annotation Data:**
            *   Define the URL for a gene annotation file: \`http://hgdownload.cse.ucsc.edu/goldenpath/hg38/database/knownGene.txt.gz\`.
            *   The script must first check if the uncompressed version of this file ("knownGene.txt") already exists.
            *   If it doesn't exist, it should download the gzipped file. Add a clear message to the user, e.g., \`cat("Downloading gene annotation file (approx. 30MB), this may take a moment...\\n")\`.
            *   Wrap the download in a \`tryCatch\` block to handle potential network errors gracefully. If download fails, stop with an error.
            *   After a successful download, decompress the file using R's R.utils or by calling \`gunzip\` via system command.
        *   **Perform Intersection:**
            *   Call \`check_tool("bedtools")\` before proceeding.
            *   Construct and execute a \`bedtools intersect\` command. The command should be: \`bedtools intersect -a <input_bed_file> -b knownGene.txt -wa -wb > <output_annotated.bed>\`.
            *   The output file name must be derived from the input BED file name with an \`_annotated\` suffix.
        *   **Integration:**
            *   In the \`main()\` function, call this annotation function right after the BED file is successfully created.
`;
    }

    if (generateIgvSnapshot) {
        prompt += `
    *   **IGV Snapshot Generation (Optional Step):**
        *   Create a separate R function \`create_igv_snapshot(bed_file_path)\`. This function takes the path to a BED file.
        *   The function must first read the first line of the BED file to get the chromosome and start position for the snapshot. If the file is empty, it should print a warning and skip snapshot generation.
        *   It should then dynamically create an IGV batch script file (e.g., "igv_batch.txt").
        *   The batch script must contain these commands:
            - \`new\`
            - \`genome hg38\`
            - \`load \${normalizePath(bed_file_path)}\` (use R's normalizePath to get the absolute path)
            - \`goto \${chromosome}:\${start_pos}\` (using the coordinates from the first line of the BED)
            - \`snapshotDirectory \${getwd()}/igv_snapshots\` (ensure this directory is created using \`dir.create\`)
            - \`snapshot \${basename(bed_file_path)}.png\`
            - \`exit\`
        *   The R script must then execute the IGV command-line tool, passing the batch script as an argument (e.g., \`igv.sh -b igv_batch.txt\`). Provide checks for both \`igv.sh\` (for Linux/macOS) and \`igv.bat\` (for Windows) in the tool verification step.
        *   In the \`main()\` function, call this snapshot function after the BED file is created. If gene annotation is also enabled, create snapshots for BOTH the original and the annotated BED files.
`;
    }
  }

  prompt += `
6.  **Main Execution Block:**
    *   At the end of the script, create a \`main()\` function.
    *   Inside \`main()\`, call the conversion functions based on the user's selected outputs.
    *   Add print/cat statements to show progress (e.g., "Generating FASTQ files...", "Generating BED file...", "Script finished.").
    *   Call \`main()\` to run the script.

7.  **Final Output:**
    *   The entire response must be ONLY the R script code, enclosed in a single markdown block for R. Do not add any extra explanations or text outside of the code block.
`;

  return prompt;
}

export async function generateConversionScript(
    inputSource: InputSource,
    inputType: InputFileType,
    outputTypes: OutputFileType[],
    options: ConversionOptions
): Promise<string> {

  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
      throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const model = "gemini-2.5-flash";
  const prompt = buildPrompt(inputSource, inputType, outputTypes, options);

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt
    });
    
    const rawText = response.text;
    const scriptMatch = rawText.match(/```(?:r|R)?\s*([\s\S]*?)```/);
    if (scriptMatch && scriptMatch[1]) {
        return scriptMatch[1].trim();
    }
    return rawText.replace(/^```(r|R)?\s*/, '').replace(/```$/, '').trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`The AI model failed to generate a response. Details: ${errorMessage}`);
  }
}