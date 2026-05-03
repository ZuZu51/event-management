/**
 * Format date string to DD/MM/YYYY format
 * @param dateStr - Date string in any format
 * @returns Formatted date string as DD/MM/YYYY
 */
export const formatDateToDDMMYYYY = (dateStr: string | Date | undefined): string => {
  if (!dateStr) return '-';
  
  try {
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
};

/**
 * Format date to DD/MM/YYYY HH:mm format
 * @param dateStr - Date string
 * @returns Formatted date string as DD/MM/YYYY HH:mm
 */
export const formatDateTimeToDDMMYYYYHHmm = (dateStr: string | Date | undefined): string => {
  if (!dateStr) return '-';
  
  try {
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '-';
  }
};

/**
 * Convert toLocaleDateString output to DD/MM/YYYY
 * Ensures consistent DD/MM/YYYY format regardless of locale
 */
export const ensureDDMMYYYYFormat = (dateStr: string): string => {
  if (!dateStr) return '-';
  
  try {
    // If already in DD/MM/YYYY format, return as is
    const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      return `${String(ddmmyyyyMatch[1]).padStart(2, '0')}/${String(ddmmyyyyMatch[2]).padStart(2, '0')}/${ddmmyyyyMatch[3]}`;
    }
    
    // Try to parse and reformat
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    return formatDateToDDMMYYYY(date);
  } catch {
    return dateStr || '-';
  }
};
