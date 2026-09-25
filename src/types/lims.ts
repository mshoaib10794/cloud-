export type Gender = 'Male' | 'Female' | 'Other';

export interface Patient {
  id: string; // e.g. PAT-2026-001
  name: string;
  age: number;
  gender: Gender;
  phone: string; // 0300-1234567
  cnic: string; // 35201-1234567-1
  address: string;
  referredBy?: string;
  createdAt: string;
}

export interface TestParameterDef {
  id: string;
  name: string;
  unit: string;
  normalRangeMin?: number;
  normalRangeMax?: number;
  normalRangeText: string;
  maleRangeText?: string;
  femaleRangeText?: string;
  defaultValue?: string;
}

export interface TestSubHeading {
  id: string;
  title: string;
  parameters: TestParameterDef[];
}

export interface TestCatalogItem {
  code: string; // e.g. CBC
  name: string; // Complete Blood Count
  category: string; // Hematology
  fee: number; // in PKR
  specimen: string; // EDTA Whole Blood, Serum, Urine, etc.
  turnaroundHours: number;
  subHeadings: TestSubHeading[];
}

export type SampleStatus = 'Sample Pending' | 'Sample Collected' | 'In Processing' | 'Completed' | 'Delivered';

export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';

export type PaymentMethod = 'Cash' | 'JazzCash' | 'EasyPaisa' | 'Bank Card / Transfer';

export interface LabOrder {
  id: string; // e.g. ORD-9401
  patientId: string;
  bookingDate: string; // ISO string
  tests: string[]; // Test codes, e.g. ['CBC', 'LFT']
  sampleBarcode: string; // Barcode e.g. BC-849102
  sampleType: string;
  sampleStatus: SampleStatus;
  collectedAt?: string;
  collectedBy?: string;
  totalAmount: number; // PKR
  discount: number; // PKR amount
  discountType: 'flat' | 'percentage';
  discountPercentage?: number;
  netAmount: number; // Total - Discount
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  referredByDoctor: string;
  notes?: string;
}

export type ResultFlag = 'Normal' | 'High' | 'Low' | 'Critical';

export interface ParameterResult {
  testCode: string;
  subHeadingId: string;
  subHeadingTitle: string;
  parameterId: string;
  parameterName: string;
  value: string;
  unit: string;
  normalRangeText: string;
  flag: ResultFlag;
  notes?: string;
}

export interface OrderResultReport {
  orderId: string;
  results: ParameterResult[];
  approvedBy: string;
  approvedAt?: string;
  pathologistRemarks?: string;
  isApproved: boolean;
}

export interface LabProfile {
  labName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  registrationNumber: string; // PHC/SHC reg
  chiefPathologist: string;
  pathologistQualification: string;
  // Manual Logo & Header Customization Options
  logoUrl?: string; // Base64 data URL or external image URL
  logoPosition?: 'left' | 'center' | 'right';
  logoWidth?: number; // Custom display width in px (e.g. 80, 100, 130)
  headerType?: 'standard' | 'custom_banner'; // Standard letterhead with logo OR full-width graphic banner
  headerBannerUrl?: string; // Full-width graphic banner image (base64 or URL)
  headerSubtitle?: string; // Optional supplementary subtitle
  websiteUrl?: string; // e.g. www.lab-portal-app.pk
}

export type UserRole = 'admin' | 'receptionist' | 'technologist';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password: string;
  email?: string;
  phone?: string;
  designation?: string;
  isActive: boolean;
  lastLogin?: string;
}

export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No Show';

export type VisitType = 'Lab Visit / Walk-in' | 'Home Sample Collection';

export interface LabAppointment {
  id: string; // e.g. APT-2026-001
  patientId: string; // Links directly to Patient.id
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "09:00 AM"
  visitType: VisitType;
  requestedTests: string[]; // Test codes, e.g. ['CBC', 'LFT']
  fastingRequired: boolean;
  status: AppointmentStatus;
  notes?: string;
  convertedToOrderId?: string;
  createdAt: string;
  createdBy?: string;
}

export const INITIAL_STAFF_ACCOUNTS: UserAccount[] = [
  {
    id: 'USR-001',
    username: 'admin',
    name: 'Prof. Dr. Tariq Mahmood',
    role: 'admin',
    password: 'admin123',
    email: 'admin@lab-portal-app.pk',
    phone: '0300-9876543',
    designation: 'Lab Director & Chief Administrator',
    isActive: true,
    lastLogin: '2026-09-23T08:30:00Z'
  },
  {
    id: 'USR-002',
    username: 'reception',
    name: 'Ayesha Khan',
    role: 'receptionist',
    password: 'rec123',
    email: 'ayesha.k@lab-portal-app.pk',
    phone: '0333-1122334',
    designation: 'Front Desk Officer & Billing Cashier',
    isActive: true,
    lastLogin: '2026-09-23T08:00:00Z'
  },
  {
    id: 'USR-003',
    username: 'technologist',
    name: 'Muhammad Bilal',
    role: 'technologist',
    password: 'tech123',
    email: 'bilal.mlt@lab-portal-app.pk',
    phone: '0345-5566778',
    designation: 'Senior Laboratory Technologist (MLT)',
    isActive: true,
    lastLogin: '2026-09-23T08:10:00Z'
  }
];
