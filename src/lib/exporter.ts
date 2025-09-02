import type { ComparisonResult } from "@/types";

export const exportToCsv = (results: ComparisonResult) => {
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Header row
  const headers = ["Term", ...results.files.map(file => `"${file.file.name}"`)];
  csvContent += headers.join(",") + "\r\n";
  
  // Data rows
  results.terms.forEach(term => {
    const row = [`"${term}"`];
    results.files.forEach(file => {
      const key = `${term}-${file.id}`;
      const cellData = results.matrix.get(key);
      const value = cellData?.found ? "Found" : "Not Found";
      row.push(value);
    });
    csvContent += row.join(",") + "\r\n";
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "lexicompare_results.csv");
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
};
