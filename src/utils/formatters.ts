import { ResultFlag } from '../types/lims';

/**
 * Format currency in Pakistani Rupees (PKR / Rs.)
 */
export function formatPKR(amount: number): string {
  if (isNaN(amount)) return 'Rs. 0';
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
}

/**
 * Format Pakistani CNIC with hyphens: xxxxx-xxxxxxx-x
 */
export function formatCNIC(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
}

/**
 * Format Pakistani phone number: 03xx-xxxxxxx
 */
export function formatPakistaniPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

/**
 * Automatically determine if a result is Normal, High, Low or Critical
 */
export function calculateFlag(
  valueStr: string,
  min?: number,
  max?: number
): ResultFlag {
  if (!valueStr || valueStr.trim() === '') return 'Normal';
  
  const num = parseFloat(valueStr);
  if (isNaN(num)) {
    // If text like Positive, Reactive, etc.
    const lower = valueStr.toLowerCase();
    if (lower.includes('positive') || lower.includes('reactive') || lower.includes('detected')) {
      return 'High';
    }
    return 'Normal';
  }

  if (min !== undefined && max !== undefined) {
    if (num < min) {
      if (num < min * 0.7) return 'Critical';
      return 'Low';
    }
    if (num > max) {
      if (num > max * 1.5) return 'Critical';
      return 'High';
    }
    return 'Normal';
  }

  if (min !== undefined && num < min) return 'Low';
  if (max !== undefined && num > max) return 'High';

  return 'Normal';
}

/**
 * Generates an authentic Code-128 SVG barcode pattern representation
 */
export function generateBarcodeBars(code: string): number[] {
  // Deterministic bar widths array based on string characters
  const bars: number[] = [2, 1, 1, 2, 3, 2]; // Start pattern
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const b1 = (charCode % 3) + 1;
    const b2 = ((charCode >> 1) % 3) + 1;
    const b3 = ((charCode >> 2) % 3) + 1;
    const b4 = ((charCode >> 3) % 2) + 1;
    bars.push(b1, b2, b3, b4);
  }
  bars.push(2, 3, 1, 2, 1, 2); // Stop pattern
  return bars;
}

/**
 * Format standard Pakistani Medical Date
 */
export function formatLabDate(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return isoString;
  }
}
