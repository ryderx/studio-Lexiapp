
'use server';
/**
 * @fileOverview A flow for parsing files and extracting terms.
 *
 * - parseFile - A function that handles parsing different file types.
 * - ParseFileInput - The input type for the parseFile function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import mammoth from 'mammoth';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const ParseFileInputSchema = z.object({
    fileName: z.string().describe("The name of the file."),
    fileType: z.string().describe("The MIME type of the file."),
    fileDataUri: z.string().describe("The file content as a data URI."),
});

export type ParseFileInput = z.infer<typeof ParseFileInputSchema>;

export async function parseFile(input: ParseFileInput): Promise<string[]> {
    return parseFileFlow(input);
}

const parseFileFlow = ai.defineFlow(
    {
        name: 'parseFileFlow',
        inputSchema: ParseFileInputSchema,
        outputSchema: z.array(z.string()),
    },
    async ({ fileType, fileDataUri }) => {
        let content = '';
        const base64Data = fileDataUri.split(',')[1];
        if (!base64Data) {
            console.error("Invalid data URI provided.");
            return [];
        }
        const buffer = Buffer.from(base64Data, 'base64');

        try {
            if (fileType.includes('json')) {
                content = buffer.toString('utf-8');
            } else if (fileType.includes('csv') || fileType.includes('plain')) {
                content = buffer.toString('utf-8');
            } else if (fileType.includes('pdf')) {
                const arrayBuffer = new ArrayBuffer(buffer.length);
                const uint8Array = new Uint8Array(arrayBuffer);
                buffer.copy(uint8Array);

                const pdfDoc = await getDocument({ data: uint8Array }).promise;
                const numPages = pdfDoc.numPages;
                let pdfText = '';

                for (let i = 1; i <= numPages; i++) {
                    const page = await pdfDoc.getPage(i);
                    const textContent = await page.getTextContent();
                    pdfText += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
                }
                content = pdfText;
            } else if (fileType.includes('msword') || fileType.includes('wordprocessingml.document')) {
                const result = await mammoth.extractRawText({ buffer });
                content = result.value;
            }

            let terms: string[] = [];
            if (fileType.includes('json')) {
                try {
                    const jsonData = JSON.parse(content);
                    const extractStrings = (obj: any) => {
                        for (const key in obj) {
                            if (typeof obj[key] === 'string') {
                                terms.push(...obj[key].split(/[\s,.;:()"]+/));
                            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                                extractStrings(obj[key]);
                            }
                        }
                    };
                    extractStrings(jsonData);
                } catch (e) {
                    console.error("Failed to parse JSON, falling back to text split", e);
                    terms = content.split(/[\s,.;:()"]+/);
                }
            } else {
                terms = content.split(/[\s,.;:()"]+/);
            }

            const cleanedTerms = terms
                .map(term => term.trim())
                .filter(term => term.length > 2)
                .filter(term => !/^\d+$/.test(term));

            return Array.from(new Set(cleanedTerms)).sort();
        } catch (error) {
            console.error("Failed to parse file content:", error);
            // Fallback for plain text if structured parsing fails
            if (content) {
                return Array.from(new Set(content.split(/[\s,.;:()"]+/).map(t => t.trim()).filter(Boolean))).sort();
            }
            return [];
        }
    }
);

    