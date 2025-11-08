
import { GoogleGenAI } from "@google/genai";
import { ConversionOptions, InputFileType, OutputFileType } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

function buildPrompt(fileName: string, inputType: InputFileType, outputTypes: OutputFileType[], options: ConversionOptions): string {
  let prompt = `
You are an expert bioinformatician. Your task is to generate a comprehensive shell script based on the user's request.
The user has provided a file named "${fileName}" of type "${inputType}".
The user wants to generate the following output file types: ${outputTypes.join(', ')}.

Please generate a single, runnable shell script that performs the requested conversions.

Follow these instructions precisely:
1.  Add comments to explain each major step of the script.
2.  Start the script with '#!/bin/bash' and 'set -e' to ensure it's executable and exits on error.
3.  Mention the required dependencies (like wgsim, samtools, bcftools) in comments at the top of the script.
4.  Use the provided file name "${fileName}" in the commands.
5.  Base the output file names on the input file name (e.g., "${fileName.split('.')[0]}_sim_R1.fastq").
6.  For each requested output type, generate the appropriate command using the parameters below.

Parameters:
`;

  if (outputTypes.includes('fastq')) {
    const { numReads, readLength1, readLength2, errorRate, mutationRate, insertSize, insertStdDev } = options.fastq;
    prompt += `
---
FASTQ Generation (using wgsim for VCF input):
- If the input is a VCF, generate synthetic paired-end FASTQ reads.
- Number of read pairs: ${numReads}
- Read 1 length: ${readLength1}
- Read 2 length: ${readLength2}
- Base error rate: ${errorRate}
- Mutation rate: ${mutationRate}
- Outer distance between read ends: ${insertSize}
- Standard deviation of distance: ${insertStdDev}
- If the input is not a VCF (e.g., CSV or TXT), provide a commented-out 'awk' or Python script template showing how one might convert a structured text file to FASTQ, as a direct conversion is not standard. Explain what the user needs to modify.
`;
  }

  if (outputTypes.includes('bed')) {
    const { useEndTag, windowSize } = options.bed;
    prompt += `
---
BED Generation:
- If the input is a VCF, extract variant coordinates into a BED file.
- If the VCF has an END info tag, use it. Generate a bcftools command: 'bcftools query -f "%CHROM\\t%POS0\\t%END\\t%ID\\n"'.
- If the VCF might not have an END tag (provide a fallback), generate an 'awk' command to create a window of ${windowSize} base pair around the start position. The awk command should look like: 'awk 'BEGIN{OFS="\\t"} !/^#/ {start=\$2-1; if(start<0) start=0; print \$1, start, \$2+${windowSize-1}, \$3}'
- If the input is CSV or TXT, provide a commented-out 'awk' command template, assuming standard columns (e.g., chr, pos), and explain that the user must adjust column numbers ($1, $2, etc.) to match their file structure.
`;
  }

  prompt += `
---
Final Output:
- Combine all commands into one shell script.
- Ensure the script is well-formatted and easy to read.
- Do not include any explanations outside of the script's comments. The entire response should be the shell script itself, inside a markdown code block.
`;

  return prompt;
}

export async function generateConversionScript(
    fileName: string,
    inputType: InputFileType,
    outputTypes: OutputFileType[],
    options: ConversionOptions
): Promise<string> {
  const model = "gemini-2.5-flash";
  const prompt = buildPrompt(fileName, inputType, outputTypes, options);

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt
    });
    
    // Clean up the response to get only the code block
    const rawText = response.text;
    const scriptMatch = rawText.match(/```(?:bash|sh|shell)?\s*([\s\S]*?)```/);
    if (scriptMatch && scriptMatch[1]) {
        return scriptMatch[1].trim();
    }
    // Fallback if no markdown block is found
    return rawText.trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("The AI model failed to generate a response.");
  }
}
