# **App Name**: LexiCompare

## Core Features:

- File Upload and Management: Enable users to upload and manage multiple files, designating one as the master file for term extraction and reference.
- Master File Parsing and Term Extraction: Automatically parse the master file (txt, CSV, JSON) to extract potential search terms, allowing users to preview and select specific terms for cross-comparison.
- Automated Cross-File Text Search: Perform case-insensitive text searches across all uploaded files using terms extracted from the master file or manually entered keywords.
- Comparison Matrix Visualization: Display a visual matrix summarizing which terms from the master file were found in each comparison file, using color-coding to indicate match status (found, not found).
- Contextual Result Highlighting: Highlight search terms within the context of the surrounding text in each file, with options to display line numbers for easy reference.
- Results Export: Enable exporting the comparison matrix to a CSV or Excel file for further analysis and reporting.

## Style Guidelines:

- Primary color: Moderate blue (#5DADE2) to convey trust and precision in handling data.
- Background color: Light grayish-blue (#F4F8FA), providing a clean, neutral backdrop for detailed data presentation.
- Accent color: Muted purple (#A98DCE), offering a contrasting highlight for key actions and interactive elements, without being distracting.
- Body and headline font: 'PT Sans', a humanist sans-serif for clear, readable text suitable for data-heavy applications.
- Use a consistent set of minimalistic icons to represent file types and actions, ensuring clarity and ease of use.
- Implement a clean, grid-based layout to organize file lists, search settings, and the comparison matrix, ensuring responsive adaptability across devices.
- Subtle transitions and progress indicators will acknowledge file processing and search operations without disrupting the user's workflow.