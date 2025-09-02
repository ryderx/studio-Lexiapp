import mammoth from 'mammoth';
import pdf from 'pdf-parse/lib/pdf-parse.entry';

const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const data = await pdf(Buffer.from(arrayBuffer));
  return data.text;
};

const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export const parseFileContent = async (file: File): Promise<string[]> => {
  let content = '';
  const fileType = file.type;

  try {
    if (fileType.includes('json') || fileType.includes('csv') || fileType.includes('plain')) {
      content = await file.text();
    } else if (fileType.includes('pdf')) {
      content = await extractTextFromPdf(file);
    } else if (fileType.includes('msword') || fileType.includes('wordprocessingml.document')) {
      content = await extractTextFromDocx(file);
    }

    let terms: string[] = [];
    if (fileType.includes('json')) {
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
    if(content) {
        return Array.from(new Set(content.split(/[\s,.;:()"]+/).map(t => t.trim()).filter(Boolean))).sort();
    }
    return [];
  }
};
