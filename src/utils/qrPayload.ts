import { LabOrder, Patient } from '../types/lims';

export interface OrderQRPayloadData {
  portal: string;
  orderId: string;
  patientId: string;
  patientName: string;
  barcode: string;
  tests: string[];
  sampleType: string;
  status: string;
  bookingDate: string;
  netAmount?: number;
  paymentStatus?: string;
}

/**
 * Creates a clean JSON string representation for embedding into the 2D QR Code.
 */
export function createOrderQRPayload(order: LabOrder, patient?: Patient): string {
  const payload: OrderQRPayloadData = {
    portal: 'LAB_PORTAL',
    orderId: order.id,
    patientId: order.patientId,
    patientName: patient?.name || 'Patient',
    barcode: order.sampleBarcode,
    tests: order.tests,
    sampleType: order.sampleType,
    status: order.sampleStatus,
    bookingDate: order.bookingDate,
    netAmount: order.netAmount,
    paymentStatus: order.paymentStatus
  };

  return JSON.stringify(payload);
}

/**
 * Parses scanned scanner input (from USB barcode scanner, camera, or text paste).
 * Tolerates JSON, raw Order ID, Barcode, Patient ID, or URLs.
 */
export function parseScannedOrderInput(input: string): {
  orderId?: string;
  barcode?: string;
  patientId?: string;
  raw: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { raw: '' };
  }

  // 1. Try parsing JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const data = JSON.parse(trimmed);
      return {
        orderId: data.orderId || data.id,
        barcode: data.barcode || data.sampleBarcode,
        patientId: data.patientId,
        raw: trimmed
      };
    } catch {
      // Ignore JSON error and proceed to pattern checks
    }
  }

  // 2. Check for URI hash or param like #order-ORD-2026-001 or ?order=ORD-2026-001
  const orderUrlMatch = trimmed.match(/[#&?](?:orderId|order)=([A-Za-z0-9-_]+)/i);
  if (orderUrlMatch && orderUrlMatch[1]) {
    return {
      orderId: orderUrlMatch[1],
      raw: trimmed
    };
  }

  // 3. Check for ORDER:ORD-123 or similar delimiters
  const colonMatch = trimmed.match(/(?:ORDER|ORD|ID):?\s*([A-Za-z0-9-_]+)/i);
  if (colonMatch && colonMatch[1]) {
    return {
      orderId: colonMatch[1],
      raw: trimmed
    };
  }

  // 4. Check for Order ID pattern (e.g., ORD-2026-081 or ORD-...)
  if (/^ORD-[\w-]+$/i.test(trimmed)) {
    return {
      orderId: trimmed.toUpperCase(),
      raw: trimmed
    };
  }

  // 5. Check for Patient ID pattern (e.g., PAT-1001 or PAT-...)
  if (/^PAT-[\w-]+$/i.test(trimmed)) {
    return {
      patientId: trimmed.toUpperCase(),
      raw: trimmed
    };
  }

  // 6. Generic code fallback (could be barcode like CBC-88210, BC-123, or orderId)
  return {
    orderId: trimmed.toUpperCase(),
    barcode: trimmed.toUpperCase(),
    patientId: trimmed.toUpperCase(),
    raw: trimmed
  };
}
