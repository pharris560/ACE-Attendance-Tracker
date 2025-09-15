/**
 * Robust CSV parsing and generation utilities
 * Handles quoted fields, embedded commas, escaped quotes, and various line endings
 */

/**
 * Parse CSV content into an array of objects
 * @param content The CSV string content
 * @returns An object containing headers, data rows, and any errors
 */
export function parseCSV(content: string): {
  headers: string[];
  data: Record<string, string>[];
  errors: string[];
} {
  const errors: string[] = [];
  const rows: string[][] = [];
  
  // Normalize line endings and handle CRLF
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  
  if (!normalizedContent) {
    errors.push('CSV file is empty');
    return { headers: [], data: [], errors };
  }

  // Parse CSV rows properly handling quoted fields
  const lines = normalizedContent.split('\n');
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const row: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (!inQuotes) {
          // Starting a quoted field
          inQuotes = true;
        } else if (nextChar === '"') {
          // Escaped quote within quoted field
          currentField += '"';
          i++; // Skip the next quote
        } else {
          // Ending a quoted field
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        row.push(currentField.trim());
        currentField = '';
      } else {
        // Regular character
        currentField += char;
      }
      
      i++;
    }
    
    // Handle case where we're still in quotes (multi-line field)
    if (inQuotes && lineIndex < lines.length - 1) {
      // Continue reading the next line as part of the same field
      currentField += '\n';
      lines[lineIndex + 1] = currentField + lines[lineIndex + 1];
      continue;
    } else if (inQuotes) {
      errors.push(`Row ${lineIndex + 1}: Unclosed quote`);
    }
    
    // Add the last field
    row.push(currentField.trim());
    
    // Only add non-empty rows
    if (row.some(field => field !== '')) {
      rows.push(row);
    }
  }
  
  if (rows.length === 0) {
    errors.push('No data found in CSV');
    return { headers: [], data: [], errors };
  }
  
  // Extract headers and data
  const headers = rows[0];
  const data: Record<string, string>[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowData: Record<string, string> = {};
    
    // Handle missing trailing columns
    for (let j = 0; j < headers.length; j++) {
      rowData[headers[j]] = row[j] || '';
    }
    
    // Check for extra columns
    if (row.length > headers.length) {
      errors.push(`Row ${i + 1}: Has ${row.length} columns but expected ${headers.length}`);
    }
    
    data.push(rowData);
  }
  
  return { headers, data, errors };
}

/**
 * Generate CSV content from data
 * @param headers Array of header names
 * @param data Array of data objects
 * @returns CSV string with properly escaped fields
 */
export function generateCSV(headers: string[], data: any[]): string {
  const rows: string[] = [];
  
  // Add headers
  rows.push(headers.map(escapeCSVField).join(','));
  
  // Add data rows
  for (const row of data) {
    const rowValues = headers.map(header => {
      const value = row[header];
      return escapeCSVField(value != null ? String(value) : '');
    });
    rows.push(rowValues.join(','));
  }
  
  return rows.join('\n');
}

/**
 * Escape a CSV field value
 * @param field The field value to escape
 * @returns Properly escaped CSV field
 */
function escapeCSVField(field: string): string {
  // Check if field needs quoting
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    // Escape quotes by doubling them
    const escaped = field.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return field;
}

/**
 * Validate required CSV headers
 * @param headers The headers found in the CSV
 * @param required The required header names
 * @returns Array of missing headers
 */
export function validateHeaders(headers: string[], required: string[]): string[] {
  return required.filter(h => !headers.includes(h));
}

/**
 * Download CSV file
 * @param filename The name of the file to download
 * @param csvContent The CSV content
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}