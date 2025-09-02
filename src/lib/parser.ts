export const parseFileContent = (content: string, fileType: string): string[] => {
  let terms: string[] = [];
  
  try {
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
      // For TXT, CSV, and other text-based files
      // Split by common delimiters: space, comma, newline, semicolon, etc.
      terms = content.split(/[\s,.;:()"]+/);
    }

    // Clean up, filter, and deduplicate terms
    const cleanedTerms = terms
      .map(term => term.trim())
      .filter(term => term.length > 2) // Filter out very short strings
      .filter(term => !/^\d+$/.test(term)); // Filter out pure numbers

    return Array.from(new Set(cleanedTerms)).sort();
  } catch (error) {
    console.error("Failed to parse file content:", error);
    // Fallback for malformed files
    return Array.from(new Set(content.split(/[\s,.;:()"]+/).map(t => t.trim()).filter(Boolean))).sort();
  }
};
