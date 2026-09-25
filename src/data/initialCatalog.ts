import { Patient, TestCatalogItem, LabOrder, OrderResultReport } from '../types/lims';

export const INITIAL_TEST_CATALOG: TestCatalogItem[] = [
  {
    code: 'CBC',
    name: 'Complete Blood Count (CBC) with ESR',
    category: 'Hematology',
    fee: 850,
    specimen: 'Whole Blood (EDTA Purple Top)',
    turnaroundHours: 4,
    subHeadings: [
      {
        id: 'sh_rbc',
        title: 'Red Blood Cell (RBC) Profile',
        parameters: [
          {
            id: 'param_hb',
            name: 'Hemoglobin (Hb)',
            unit: 'g/dL',
            normalRangeMin: 13.0,
            normalRangeMax: 17.0,
            normalRangeText: '13.0 - 17.0',
            maleRangeText: '13.5 - 17.5 g/dL',
            femaleRangeText: '12.0 - 15.5 g/dL'
          },
          {
            id: 'param_rbc',
            name: 'Red Blood Cells (RBC Count)',
            unit: 'mil/uL',
            normalRangeMin: 4.5,
            normalRangeMax: 5.9,
            normalRangeText: '4.5 - 5.9'
          },
          {
            id: 'param_hct',
            name: 'Hematocrit (PCV / HCT)',
            unit: '%',
            normalRangeMin: 40.0,
            normalRangeMax: 50.0,
            normalRangeText: '40.0 - 50.0'
          },
          {
            id: 'param_mcv',
            name: 'Mean Corpuscular Volume (MCV)',
            unit: 'fL',
            normalRangeMin: 80.0,
            normalRangeMax: 98.0,
            normalRangeText: '80.0 - 98.0'
          },
          {
            id: 'param_mch',
            name: 'Mean Corpuscular Hemoglobin (MCH)',
            unit: 'pg',
            normalRangeMin: 27.0,
            normalRangeMax: 33.0,
            normalRangeText: '27.0 - 33.0'
          },
          {
            id: 'param_mchc',
            name: 'MCHC',
            unit: 'g/dL',
            normalRangeMin: 32.0,
            normalRangeMax: 36.0,
            normalRangeText: '32.0 - 36.0'
          }
        ]
      },
      {
        id: 'sh_wbc',
        title: 'White Blood Cells & Differential Count (DLC)',
        parameters: [
          {
            id: 'param_tlc',
            name: 'Total Leukocyte Count (TLC / WBC)',
            unit: '/cumm',
            normalRangeMin: 4000,
            normalRangeMax: 11000,
            normalRangeText: '4,000 - 11,000'
          },
          {
            id: 'param_neutro',
            name: 'Neutrophils',
            unit: '%',
            normalRangeMin: 40,
            normalRangeMax: 75,
            normalRangeText: '40 - 75'
          },
          {
            id: 'param_lympho',
            name: 'Lymphocytes',
            unit: '%',
            normalRangeMin: 20,
            normalRangeMax: 45,
            normalRangeText: '20 - 45'
          },
          {
            id: 'param_mono',
            name: 'Monocytes',
            unit: '%',
            normalRangeMin: 2,
            normalRangeMax: 10,
            normalRangeText: '2 - 10'
          },
          {
            id: 'param_eosino',
            name: 'Eosinophils',
            unit: '%',
            normalRangeMin: 1,
            normalRangeMax: 6,
            normalRangeText: '1 - 6'
          }
        ]
      },
      {
        id: 'sh_plt',
        title: 'Platelet Indices',
        parameters: [
          {
            id: 'param_plt',
            name: 'Platelet Count',
            unit: '/cumm',
            normalRangeMin: 150000,
            normalRangeMax: 450000,
            normalRangeText: '150,000 - 450,000'
          },
          {
            id: 'param_mpv',
            name: 'Mean Platelet Volume (MPV)',
            unit: 'fL',
            normalRangeMin: 7.5,
            normalRangeMax: 11.5,
            normalRangeText: '7.5 - 11.5'
          }
        ]
      },
      {
        id: 'sh_esr',
        title: 'Erythrocyte Sedimentation Rate',
        parameters: [
          {
            id: 'param_esr',
            name: 'ESR (Westergren Method - 1st Hr)',
            unit: 'mm/hr',
            normalRangeMin: 0,
            normalRangeMax: 20,
            normalRangeText: '0 - 20'
          }
        ]
      }
    ]
  },
  {
    code: 'LFT',
    name: 'Liver Function Tests (LFT)',
    category: 'Biochemistry',
    fee: 1600,
    specimen: 'Serum (Yellow / Red Gel Tube)',
    turnaroundHours: 6,
    subHeadings: [
      {
        id: 'sh_bili',
        title: 'Bilirubin Profile',
        parameters: [
          {
            id: 'param_tbili',
            name: 'Serum Bilirubin - Total',
            unit: 'mg/dL',
            normalRangeMin: 0.2,
            normalRangeMax: 1.2,
            normalRangeText: '0.2 - 1.2'
          },
          {
            id: 'param_dbili',
            name: 'Serum Bilirubin - Direct (Conjugated)',
            unit: 'mg/dL',
            normalRangeMin: 0.0,
            normalRangeMax: 0.3,
            normalRangeText: '0.0 - 0.3'
          },
          {
            id: 'param_ibili',
            name: 'Serum Bilirubin - Indirect (Unconjugated)',
            unit: 'mg/dL',
            normalRangeMin: 0.1,
            normalRangeMax: 0.8,
            normalRangeText: '0.1 - 0.8'
          }
        ]
      },
      {
        id: 'sh_enzymes',
        title: 'Hepatic Enzymes',
        parameters: [
          {
            id: 'param_sgpt',
            name: 'SGPT / ALT (Alanine Aminotransferase)',
            unit: 'U/L',
            normalRangeMin: 0,
            normalRangeMax: 45,
            normalRangeText: 'Up to 45'
          },
          {
            id: 'param_sgot',
            name: 'SGOT / AST (Aspartate Aminotransferase)',
            unit: 'U/L',
            normalRangeMin: 0,
            normalRangeMax: 35,
            normalRangeText: 'Up to 35'
          },
          {
            id: 'param_alp',
            name: 'Alkaline Phosphatase (ALP)',
            unit: 'U/L',
            normalRangeMin: 30,
            normalRangeMax: 120,
            normalRangeText: '30 - 120'
          },
          {
            id: 'param_ggt',
            name: 'Gamma GT (GGT)',
            unit: 'U/L',
            normalRangeMin: 9,
            normalRangeMax: 48,
            normalRangeText: '9 - 48'
          }
        ]
      },
      {
        id: 'sh_proteins',
        title: 'Serum Proteins',
        parameters: [
          {
            id: 'param_tp',
            name: 'Total Protein',
            unit: 'g/dL',
            normalRangeMin: 6.0,
            normalRangeMax: 8.3,
            normalRangeText: '6.0 - 8.3'
          },
          {
            id: 'param_alb',
            name: 'Serum Albumin',
            unit: 'g/dL',
            normalRangeMin: 3.5,
            normalRangeMax: 5.0,
            normalRangeText: '3.5 - 5.0'
          },
          {
            id: 'param_glob',
            name: 'Serum Globulin',
            unit: 'g/dL',
            normalRangeMin: 2.3,
            normalRangeMax: 3.5,
            normalRangeText: '2.3 - 3.5'
          },
          {
            id: 'param_agratio',
            name: 'A / G Ratio',
            unit: 'Ratio',
            normalRangeMin: 1.2,
            normalRangeMax: 2.2,
            normalRangeText: '1.2 - 2.2'
          }
        ]
      }
    ]
  },
  {
    code: 'RFT',
    name: 'Renal Function Tests (RFT / Kidney Profile)',
    category: 'Biochemistry',
    fee: 1400,
    specimen: 'Serum (Yellow / Red Gel Tube)',
    turnaroundHours: 6,
    subHeadings: [
      {
        id: 'sh_kidney',
        title: 'Renal Function Parameters',
        parameters: [
          {
            id: 'param_creat',
            name: 'Serum Creatinine',
            unit: 'mg/dL',
            normalRangeMin: 0.6,
            normalRangeMax: 1.2,
            normalRangeText: '0.6 - 1.2'
          },
          {
            id: 'param_urea',
            name: 'Blood Urea',
            unit: 'mg/dL',
            normalRangeMin: 10,
            normalRangeMax: 50,
            normalRangeText: '10 - 50'
          },
          {
            id: 'param_bun',
            name: 'Blood Urea Nitrogen (BUN)',
            unit: 'mg/dL',
            normalRangeMin: 7,
            normalRangeMax: 20,
            normalRangeText: '7 - 20'
          },
          {
            id: 'param_uric',
            name: 'Serum Uric Acid',
            unit: 'mg/dL',
            normalRangeMin: 3.5,
            normalRangeMax: 7.2,
            normalRangeText: '3.5 - 7.2'
          },
          {
            id: 'param_egfr',
            name: 'Estimated GFR (eGFR)',
            unit: 'mL/min/1.73m²',
            normalRangeMin: 90,
            normalRangeMax: 150,
            normalRangeText: '> 90 Normal'
          }
        ]
      }
    ]
  },
  {
    code: 'LIPID',
    name: 'Lipid Profile (Fasting 12 Hours)',
    category: 'Biochemistry',
    fee: 1900,
    specimen: 'Serum (Yellow Gel Tube)',
    turnaroundHours: 8,
    subHeadings: [
      {
        id: 'sh_lipids',
        title: 'Lipid Fractions',
        parameters: [
          {
            id: 'param_chol',
            name: 'Total Cholesterol',
            unit: 'mg/dL',
            normalRangeMin: 100,
            normalRangeMax: 200,
            normalRangeText: 'Desirable: < 200'
          },
          {
            id: 'param_trig',
            name: 'Triglycerides',
            unit: 'mg/dL',
            normalRangeMin: 50,
            normalRangeMax: 150,
            normalRangeText: 'Normal: < 150'
          },
          {
            id: 'param_hdl',
            name: 'HDL Cholesterol (Good Cholesterol)',
            unit: 'mg/dL',
            normalRangeMin: 40,
            normalRangeMax: 70,
            normalRangeText: '> 40 (Optimal: > 50)'
          },
          {
            id: 'param_ldl',
            name: 'LDL Cholesterol (Bad Cholesterol)',
            unit: 'mg/dL',
            normalRangeMin: 50,
            normalRangeMax: 100,
            normalRangeText: 'Optimal: < 100'
          },
          {
            id: 'param_vldl',
            name: 'VLDL Cholesterol',
            unit: 'mg/dL',
            normalRangeMin: 10,
            normalRangeMax: 30,
            normalRangeText: '10 - 30'
          },
          {
            id: 'param_chol_ratio',
            name: 'Total Cholesterol / HDL Ratio',
            unit: 'Ratio',
            normalRangeMin: 2.0,
            normalRangeMax: 4.5,
            normalRangeText: '< 4.5'
          }
        ]
      }
    ]
  },
  {
    code: 'HBA1C',
    name: 'HbA1c (Glycated Hemoglobin) & Fasting Glucose',
    category: 'Biochemistry',
    fee: 1750,
    specimen: 'Whole Blood (EDTA) + Fluoride Plasma',
    turnaroundHours: 4,
    subHeadings: [
      {
        id: 'sh_glycemic',
        title: 'Glycemic Control Indicators',
        parameters: [
          {
            id: 'param_fbs',
            name: 'Fasting Blood Glucose',
            unit: 'mg/dL',
            normalRangeMin: 70,
            normalRangeMax: 100,
            normalRangeText: '70 - 100 (Normal)'
          },
          {
            id: 'param_hba1c',
            name: 'Glycated Hemoglobin (HbA1c)',
            unit: '%',
            normalRangeMin: 4.0,
            normalRangeMax: 5.6,
            normalRangeText: '< 5.7 Normal, 5.7 - 6.4 Pre-diabetes'
          },
          {
            id: 'param_eag',
            name: 'Estimated Average Glucose (eAG)',
            unit: 'mg/dL',
            normalRangeMin: 80,
            normalRangeMax: 126,
            normalRangeText: '80 - 126'
          }
        ]
      }
    ]
  },
  {
    code: 'TSH',
    name: 'Thyroid Stimulating Hormone (TSH, Ultra-sensitive)',
    category: 'Endocrinology',
    fee: 1100,
    specimen: 'Serum (Yellow Gel Tube)',
    turnaroundHours: 6,
    subHeadings: [
      {
        id: 'sh_tsh',
        title: 'Thyroid Hormones',
        parameters: [
          {
            id: 'param_tsh_val',
            name: 'TSH (Chemiluminescence CLIA)',
            unit: 'uIU/mL',
            normalRangeMin: 0.35,
            normalRangeMax: 4.94,
            normalRangeText: '0.35 - 4.94'
          }
        ]
      }
    ]
  },
  {
    code: 'URINE-RE',
    name: 'Urine Routine Examination (Urine R/E)',
    category: 'Clinical Pathology',
    fee: 550,
    specimen: 'Clean Catch Midstream Urine',
    turnaroundHours: 2,
    subHeadings: [
      {
        id: 'sh_u_phys',
        title: 'Physical Examination',
        parameters: [
          {
            id: 'param_u_color',
            name: 'Color',
            unit: '-',
            normalRangeText: 'Pale Yellow / Straw',
            defaultValue: 'Pale Yellow'
          },
          {
            id: 'param_u_clarity',
            name: 'Appearance / Clarity',
            unit: '-',
            normalRangeText: 'Clear',
            defaultValue: 'Clear'
          },
          {
            id: 'param_u_sg',
            name: 'Specific Gravity',
            unit: '-',
            normalRangeMin: 1.005,
            normalRangeMax: 1.030,
            normalRangeText: '1.005 - 1.030'
          },
          {
            id: 'param_u_ph',
            name: 'pH Reaction',
            unit: 'pH',
            normalRangeMin: 5.0,
            normalRangeMax: 7.5,
            normalRangeText: '5.0 - 7.5'
          }
        ]
      },
      {
        id: 'sh_u_chem',
        title: 'Chemical Examination',
        parameters: [
          {
            id: 'param_u_protein',
            name: 'Protein (Albumin)',
            unit: '-',
            normalRangeText: 'Nil / Negative',
            defaultValue: 'Negative'
          },
          {
            id: 'param_u_glucose',
            name: 'Glucose (Sugar)',
            unit: '-',
            normalRangeText: 'Nil / Negative',
            defaultValue: 'Negative'
          },
          {
            id: 'param_u_ketones',
            name: 'Ketone Bodies',
            unit: '-',
            normalRangeText: 'Negative',
            defaultValue: 'Negative'
          },
          {
            id: 'param_u_blood',
            name: 'Occult Blood',
            unit: '-',
            normalRangeText: 'Negative',
            defaultValue: 'Negative'
          }
        ]
      },
      {
        id: 'sh_u_micro',
        title: 'Microscopic Examination (per HPF)',
        parameters: [
          {
            id: 'param_u_pus',
            name: 'Pus Cells (WBC)',
            unit: '/HPF',
            normalRangeMin: 0,
            normalRangeMax: 5,
            normalRangeText: '0 - 5'
          },
          {
            id: 'param_u_rbc',
            name: 'Red Blood Cells (RBC)',
            unit: '/HPF',
            normalRangeMin: 0,
            normalRangeMax: 2,
            normalRangeText: '0 - 2'
          },
          {
            id: 'param_u_epi',
            name: 'Epithelial Cells',
            unit: '/HPF',
            normalRangeText: 'Few (1 - 3)',
            defaultValue: 'Few (1-2)'
          },
          {
            id: 'param_u_casts',
            name: 'Casts',
            unit: '/LPF',
            normalRangeText: 'None seen',
            defaultValue: 'Nil'
          },
          {
            id: 'param_u_crystals',
            name: 'Crystals',
            unit: '-',
            normalRangeText: 'Nil',
            defaultValue: 'Nil'
          }
        ]
      }
    ]
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'PAT-2026-0001',
    name: 'Muhammad Asif',
    age: 48,
    gender: 'Male',
    phone: '0300-4819203',
    cnic: '35201-8392019-1',
    address: 'House 42, Street 8, Sector F-8/2, Islamabad',
    referredBy: 'Dr. Tariq Mahmood (Consultant Physician)',
    createdAt: '2026-09-21T09:15:00Z'
  },
  {
    id: 'PAT-2026-0002',
    name: 'Fatima Zahra Bibi',
    age: 34,
    gender: 'Female',
    phone: '0321-9541280',
    cnic: '35202-6184920-4',
    address: 'Apartment 4B, Gulberg Heights, Lahore',
    referredBy: 'Dr. Nighat Sultana (Gynecologist)',
    createdAt: '2026-09-22T10:30:00Z'
  },
  {
    id: 'PAT-2026-0003',
    name: 'Chaudhry Kamran Akram',
    age: 56,
    gender: 'Male',
    phone: '0333-5128491',
    cnic: '37405-1940294-7',
    address: 'Main Commercial Area, DHA Phase 5, Lahore',
    referredBy: 'Dr. Zulfiqar Ali (Cardiologist)',
    createdAt: '2026-09-23T08:45:00Z'
  },
  {
    id: 'PAT-2026-0004',
    name: 'Zainab Noor',
    age: 22,
    gender: 'Female',
    phone: '0312-4419283',
    cnic: '61101-7294012-6',
    address: 'Sector G-10/4, Islamabad',
    referredBy: 'Self',
    createdAt: '2026-09-23T11:00:00Z'
  },
  {
    id: 'PAT-2026-0005',
    name: 'Syed Moazzam Shah',
    age: 62,
    gender: 'Male',
    phone: '0301-7788990',
    cnic: '38403-1284901-3',
    address: 'Satellite Town, Rawalpindi',
    referredBy: 'Dr. Zulfiqar Ali (Cardiologist)',
    createdAt: '2026-09-22T09:00:00Z'
  },
  {
    id: 'PAT-2026-0006',
    name: 'Khadija Arshad',
    age: 29,
    gender: 'Female',
    phone: '0346-3344556',
    cnic: '35201-9988112-2',
    address: 'Johar Town, Block G, Lahore',
    referredBy: 'Dr. Nighat Sultana (Gynecologist)',
    createdAt: '2026-09-21T14:20:00Z'
  },
  {
    id: 'PAT-2026-0007',
    name: 'Waqas Ahmed Sheikh',
    age: 41,
    gender: 'Male',
    phone: '0322-8877665',
    cnic: '37405-5544332-1',
    address: 'Chaklala Scheme 3, Rawalpindi',
    referredBy: 'Dr. Tariq Mahmood (Consultant Physician)',
    createdAt: '2026-09-20T10:15:00Z'
  },
  {
    id: 'PAT-2026-0008',
    name: 'Hina Farooq',
    age: 38,
    gender: 'Female',
    phone: '0334-1239876',
    cnic: '35202-4433221-8',
    address: 'Model Town, Lahore',
    referredBy: 'Dr. Tariq Mahmood (Consultant Physician)',
    createdAt: '2026-09-19T11:30:00Z'
  },
  {
    id: 'PAT-2026-0009',
    name: 'Malik Tanveer Hussain',
    age: 51,
    gender: 'Male',
    phone: '0300-6655443',
    cnic: '36302-8877661-5',
    address: 'Cantt Bazaar, Multan / Lahore Clinic',
    referredBy: 'Dr. Zulfiqar Ali (Cardiologist)',
    createdAt: '2026-09-18T09:45:00Z'
  },
  {
    id: 'PAT-2026-0010',
    name: 'Samina Pervez',
    age: 45,
    gender: 'Female',
    phone: '0315-9988771',
    cnic: '35201-3322119-4',
    address: 'WAPDA Town, Lahore',
    referredBy: 'Dr. Nighat Sultana (Gynecologist)',
    createdAt: '2026-09-17T08:30:00Z'
  },
  {
    id: 'PAT-2026-0011',
    name: 'Hamza Bilal',
    age: 7,
    gender: 'Male',
    phone: '0321-7788441',
    cnic: '35201-9988221-3',
    address: 'Sector F-10/2, Islamabad',
    referredBy: 'Dr. Shagufta Rehman (Consultant Pediatrician)',
    createdAt: '2026-09-23T12:00:00Z'
  },
  {
    id: 'PAT-2026-0012',
    name: 'Aanya Farhan',
    age: 12,
    gender: 'Female',
    phone: '0302-3344112',
    cnic: '37405-1122998-6',
    address: 'Bahria Town Phase 4, Rawalpindi',
    referredBy: 'Dr. Shagufta Rehman (Consultant Pediatrician)',
    createdAt: '2026-09-22T15:30:00Z'
  },
  {
    id: 'PAT-2026-0013',
    name: 'Begum Parveen Akhtar',
    age: 68,
    gender: 'Female',
    phone: '0333-8899221',
    cnic: '35202-7711442-8',
    address: 'Cantt Officers Colony, Lahore',
    referredBy: 'Dr. Zulfiqar Ali (Cardiologist)',
    createdAt: '2026-09-20T11:45:00Z'
  }
];

export const INITIAL_ORDERS: LabOrder[] = [
  {
    id: 'ORD-9401',
    patientId: 'PAT-2026-0001',
    bookingDate: '2026-09-23T09:15:00Z',
    tests: ['CBC', 'LFT'],
    sampleBarcode: 'BC-849102',
    sampleType: 'Whole Blood (EDTA) + Serum Clot',
    sampleStatus: 'Completed',
    collectedAt: '2026-09-23T09:20:00Z',
    collectedBy: 'Hamza Malik (Sr. Phlebotomist)',
    totalAmount: 2450,
    discount: 250,
    discountType: 'flat',
    netAmount: 2200,
    paidAmount: 2200,
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    referredByDoctor: 'Dr. Tariq Mahmood (Consultant Physician)',
    notes: 'Patient was in fasting state. Priority urgent delivery.'
  },
  {
    id: 'ORD-9402',
    patientId: 'PAT-2026-0002',
    bookingDate: '2026-09-23T10:30:00Z',
    tests: ['CBC', 'TSH'],
    sampleBarcode: 'BC-849103',
    sampleType: 'Whole Blood (EDTA) + Serum',
    sampleStatus: 'In Processing',
    collectedAt: '2026-09-23T10:35:00Z',
    collectedBy: 'Zainab Qasim (Phlebotomist)',
    totalAmount: 1950,
    discount: 0,
    discountType: 'flat',
    netAmount: 1950,
    paidAmount: 1950,
    paymentStatus: 'Paid',
    paymentMethod: 'JazzCash',
    referredByDoctor: 'Dr. Nighat Sultana (Gynecologist)',
    notes: 'Antenatal workup routine checkup.'
  },
  {
    id: 'ORD-9403',
    patientId: 'PAT-2026-0003',
    bookingDate: '2026-09-23T11:10:00Z',
    tests: ['LIPID', 'RFT', 'HBA1C'],
    sampleBarcode: 'BC-849104',
    sampleType: 'Serum Yellow Top + Whole Blood EDTA',
    sampleStatus: 'Sample Collected',
    collectedAt: '2026-09-23T11:15:00Z',
    collectedBy: 'Hamza Malik (Sr. Phlebotomist)',
    totalAmount: 5050,
    discount: 550,
    discountType: 'flat',
    netAmount: 4500,
    paidAmount: 3000,
    paymentStatus: 'Partial',
    paymentMethod: 'EasyPaisa',
    referredByDoctor: 'Dr. Zulfiqar Ali (Cardiologist)',
    notes: '12 hours overnight fasting confirmed. Balance PKR 1,500 due on report pickup.'
  },
  {
    id: 'ORD-9404',
    patientId: 'PAT-2026-0004',
    bookingDate: '2026-09-23T11:40:00Z',
    tests: ['CBC', 'URINE-RE'],
    sampleBarcode: 'BC-849105',
    sampleType: 'Whole Blood EDTA + Sterile Urine Cup',
    sampleStatus: 'Sample Pending',
    totalAmount: 1400,
    discount: 0,
    discountType: 'flat',
    netAmount: 1400,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    paymentMethod: 'Cash',
    referredByDoctor: 'Self',
    notes: 'Awaiting sample collection at phlebotomy counter 2.'
  },
  // Past 7 Days Historical Orders with Completed Billing Transactions
  {
    id: 'ORD-9399',
    patientId: 'PAT-2026-0005',
    bookingDate: '2026-09-22T09:30:00Z',
    tests: ['LIPID', 'HBA1C', 'LFT', 'RFT'],
    sampleBarcode: 'BC-849099',
    sampleType: 'Whole Blood EDTA + Serum Gel',
    sampleStatus: 'Completed',
    collectedAt: '2026-09-22T09:35:00Z',
    collectedBy: 'Hamza Malik (Sr. Phlebotomist)',
    totalAmount: 6500,
    discount: 500,
    discountType: 'flat',
    netAmount: 6000,
    paidAmount: 6000,
    paymentStatus: 'Paid',
    paymentMethod: 'Bank Card / Transfer',
    referredByDoctor: 'Dr. Zulfiqar Ali (Cardiologist)',
    notes: 'Cardiac executive profiling.'
  },
  {
    id: 'ORD-9398',
    patientId: 'PAT-2026-0002',
    bookingDate: '2026-09-22T14:15:00Z',
    tests: ['CBC', 'FERRITIN', 'VIT-D'],
    sampleBarcode: 'BC-849098',
    sampleType: 'EDTA Whole Blood + Serum',
    sampleStatus: 'Completed',
    collectedAt: '2026-09-22T14:20:00Z',
    collectedBy: 'Zainab Qasim (Phlebotomist)',
    totalAmount: 6800,
    discount: 300,
    discountType: 'flat',
    netAmount: 6500,
    paidAmount: 6500,
    paymentStatus: 'Paid',
    paymentMethod: 'JazzCash',
    referredByDoctor: 'Dr. Nighat Sultana (Gynecologist)',
    notes: 'Anemia and vitamin profile.'
  },
  {
    id: 'ORD-9397',
    patientId: 'PAT-2026-0006',
    bookingDate: '2026-09-21T10:00:00Z',
    tests: ['CBC', 'URINE-RE', 'BLOOD-SUGAR-F'],
    sampleBarcode: 'BC-849097',
    sampleType: 'EDTA Blood + Urine Cup + Fluoride Plasma',
    sampleStatus: 'Completed',
    collectedAt: '2026-09-21T10:10:00Z',
    collectedBy: 'Hamza Malik (Sr. Phlebotomist)',
    totalAmount: 2000,
    discount: 0,
    discountType: 'flat',
    netAmount: 2000,
    paidAmount: 2000,
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    referredByDoctor: 'Dr. Tariq Mahmood (Consultant Physician)',
    notes: 'Routine baseline investigation.'
  },
  {
    id: 'ORD-9396',
    patientId: 'PAT-2026-0007',
    bookingDate: '2026-09-21T15:30:00Z',
    tests: ['LFT', 'RFT', 'URIC-ACID'],
    sampleBarcode: 'BC-849096',
    sampleType: 'Serum Clot Activator',
    sampleStatus: 'Completed',
    collectedAt: '2026-09-21T15:40:00Z',
    collectedBy: 'Muhammad Bilal (MLT)',
    totalAmount: 3950,
    discount: 250,
    discountType: 'flat',
    netAmount: 3700,
    paidAmount: 3700,
    paymentStatus: 'Paid',
    paymentMethod: 'EasyPaisa',
    referredByDoctor: 'Dr. Zulfiqar Ali (Cardiologist)',
    notes: 'Joint pain & metabolic profile.'
  },
  {
    id: 'ORD-9395',
    patientId: 'PAT-2026-0008',
    bookingDate: '2026-09-20T11:00:00Z',
    tests: ['CBC', 'TSH'],
    sampleBarcode: 'BC-849095',
    sampleType: 'EDTA Whole Blood + Serum',
    sampleStatus: 'Completed',
    collectedAt: '2026-09-20T11:05:00Z',
    collectedBy: 'Zainab Qasim (Phlebotomist)',
    totalAmount: 1950,
    discount: 0,
    discountType: 'flat',
    netAmount: 1950,
    paidAmount: 1950,
    paymentStatus: 'Paid',
    paymentMethod: 'JazzCash',
    referredByDoctor: 'Dr. Tariq Mahmood (Consultant Physician)',
    notes: 'Thyroid function screening.'
  },
  {
    id: 'ORD-9394',
    patientId: 'PAT-2026-0009',
    bookingDate: '2026-09-19T09:45:00Z',
    tests: ['LIPID', 'RFT', 'HBA1C'],
    sampleBarcode: 'BC-849094',
    sampleType: 'Serum Yellow Top + Whole Blood EDTA',
    sampleStatus: 'Completed',
    collectedAt: '2026-09-19T09:50:00Z',
    collectedBy: 'Hamza Malik (Sr. Phlebotomist)',
    totalAmount: 5050,
    discount: 550,
    discountType: 'flat',
    netAmount: 4500,
    paidAmount: 4500,
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    referredByDoctor: 'Dr. Zulfiqar Ali (Cardiologist)',
    notes: 'Diabetic follow-up checkup.'
  },
  {
    id: 'ORD-9393',
    patientId: 'PAT-2026-0001',
    bookingDate: '2026-09-19T16:00:00Z',
    tests: ['CBC', 'ESR', 'CRP'],
    sampleBarcode: 'BC-849093',
    sampleType: 'EDTA Blood + Citrate + Serum',
    sampleStatus: 'Completed',
    collectedAt: '2026-09-19T16:10:00Z',
    collectedBy: 'Muhammad Bilal (MLT)',
    totalAmount: 3200,
    discount: 200,
    discountType: 'flat',
    netAmount: 3000,
    paidAmount: 3000,
    paymentStatus: 'Paid',
    paymentMethod: 'EasyPaisa',
    referredByDoctor: 'Dr. Tariq Mahmood (Consultant Physician)',
    notes: 'Inflammatory markers assessment.'
  },
  {
    id: 'ORD-9392',
    patientId: 'PAT-2026-0010',
    bookingDate: '2026-09-18T10:30:00Z',
    tests: ['CBC', 'LFT', 'RFT'],
    sampleBarcode: 'BC-849092',
    sampleType: 'EDTA Blood + Serum Gel',
    sampleStatus: 'Completed',
    collectedAt: '2026-09-18T10:40:00Z',
    collectedBy: 'Zainab Qasim (Phlebotomist)',
    totalAmount: 4100,
    discount: 300,
    discountType: 'flat',
    netAmount: 3800,
    paidAmount: 3800,
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    referredByDoctor: 'Dr. Nighat Sultana (Gynecologist)',
    notes: 'Pre-op general surgical workup.'
  },
  {
    id: 'ORD-9391',
    patientId: 'PAT-2026-0003',
    bookingDate: '2026-09-17T11:20:00Z',
    tests: ['LIPID', 'BLOOD-SUGAR-F'],
    sampleBarcode: 'BC-849091',
    sampleType: 'Serum Yellow Top + Fluoride Plasma',
    sampleStatus: 'Completed',
    collectedAt: '2026-09-17T11:25:00Z',
    collectedBy: 'Hamza Malik (Sr. Phlebotomist)',
    totalAmount: 2350,
    discount: 150,
    discountType: 'flat',
    netAmount: 2200,
    paidAmount: 2200,
    paymentStatus: 'Paid',
    paymentMethod: 'Bank Card / Transfer',
    referredByDoctor: 'Dr. Zulfiqar Ali (Cardiologist)',
    notes: 'Routine fasting lipid screening.'
  }
];

export const INITIAL_REPORTS: OrderResultReport[] = [
  {
    orderId: 'ORD-9401',
    isApproved: true,
    approvedBy: 'Dr. Salman Tariq, MBBS, MPhil (Clinical Pathology)',
    approvedAt: '2026-09-23T10:45:00Z',
    pathologistRemarks: 'Mild microcytic hypochromic indices noted. Mild elevation in SGPT/ALT. Correlate clinically. Repeat LFT advised after 4 weeks.',
    results: [
      {
        testCode: 'CBC',
        subHeadingId: 'sh_rbc',
        subHeadingTitle: 'Red Blood Cell (RBC) Profile',
        parameterId: 'param_hb',
        parameterName: 'Hemoglobin (Hb)',
        value: '11.8',
        unit: 'g/dL',
        normalRangeText: '13.0 - 17.0',
        flag: 'Low'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_rbc',
        subHeadingTitle: 'Red Blood Cell (RBC) Profile',
        parameterId: 'param_rbc',
        parameterName: 'Red Blood Cells (RBC Count)',
        value: '4.2',
        unit: 'mil/uL',
        normalRangeText: '4.5 - 5.9',
        flag: 'Low'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_rbc',
        subHeadingTitle: 'Red Blood Cell (RBC) Profile',
        parameterId: 'param_hct',
        parameterName: 'Hematocrit (PCV / HCT)',
        value: '36.5',
        unit: '%',
        normalRangeText: '40.0 - 50.0',
        flag: 'Low'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_rbc',
        subHeadingTitle: 'Red Blood Cell (RBC) Profile',
        parameterId: 'param_mcv',
        parameterName: 'Mean Corpuscular Volume (MCV)',
        value: '76.2',
        unit: 'fL',
        normalRangeText: '80.0 - 98.0',
        flag: 'Low'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_rbc',
        subHeadingTitle: 'Red Blood Cell (RBC) Profile',
        parameterId: 'param_mch',
        parameterName: 'Mean Corpuscular Hemoglobin (MCH)',
        value: '25.1',
        unit: 'pg',
        normalRangeText: '27.0 - 33.0',
        flag: 'Low'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_rbc',
        subHeadingTitle: 'Red Blood Cell (RBC) Profile',
        parameterId: 'param_mchc',
        parameterName: 'MCHC',
        value: '33.0',
        unit: 'g/dL',
        normalRangeText: '32.0 - 36.0',
        flag: 'Normal'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_wbc',
        subHeadingTitle: 'White Blood Cells & Differential Count (DLC)',
        parameterId: 'param_tlc',
        parameterName: 'Total Leukocyte Count (TLC / WBC)',
        value: '7800',
        unit: '/cumm',
        normalRangeText: '4,000 - 11,000',
        flag: 'Normal'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_wbc',
        subHeadingTitle: 'White Blood Cells & Differential Count (DLC)',
        parameterId: 'param_neutro',
        parameterName: 'Neutrophils',
        value: '64',
        unit: '%',
        normalRangeText: '40 - 75',
        flag: 'Normal'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_wbc',
        subHeadingTitle: 'White Blood Cells & Differential Count (DLC)',
        parameterId: 'param_lympho',
        parameterName: 'Lymphocytes',
        value: '28',
        unit: '%',
        normalRangeText: '20 - 45',
        flag: 'Normal'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_wbc',
        subHeadingTitle: 'White Blood Cells & Differential Count (DLC)',
        parameterId: 'param_mono',
        parameterName: 'Monocytes',
        value: '5',
        unit: '%',
        normalRangeText: '2 - 10',
        flag: 'Normal'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_wbc',
        subHeadingTitle: 'White Blood Cells & Differential Count (DLC)',
        parameterId: 'param_eosino',
        parameterName: 'Eosinophils',
        value: '3',
        unit: '%',
        normalRangeText: '1 - 6',
        flag: 'Normal'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_plt',
        subHeadingTitle: 'Platelet Indices',
        parameterId: 'param_plt',
        parameterName: 'Platelet Count',
        value: '265000',
        unit: '/cumm',
        normalRangeText: '150,000 - 450,000',
        flag: 'Normal'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_plt',
        subHeadingTitle: 'Platelet Indices',
        parameterId: 'param_mpv',
        parameterName: 'Mean Platelet Volume (MPV)',
        value: '9.2',
        unit: 'fL',
        normalRangeText: '7.5 - 11.5',
        flag: 'Normal'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_esr',
        subHeadingTitle: 'Erythrocyte Sedimentation Rate',
        parameterId: 'param_esr',
        parameterName: 'ESR (Westergren Method - 1st Hr)',
        value: '18',
        unit: 'mm/hr',
        normalRangeText: '0 - 20',
        flag: 'Normal'
      },
      {
        testCode: 'LFT',
        subHeadingId: 'sh_bili',
        subHeadingTitle: 'Bilirubin Profile',
        parameterId: 'param_tbili',
        parameterName: 'Serum Bilirubin - Total',
        value: '0.9',
        unit: 'mg/dL',
        normalRangeText: '0.2 - 1.2',
        flag: 'Normal'
      },
      {
        testCode: 'LFT',
        subHeadingId: 'sh_bili',
        subHeadingTitle: 'Bilirubin Profile',
        parameterId: 'param_dbili',
        parameterName: 'Serum Bilirubin - Direct (Conjugated)',
        value: '0.2',
        unit: 'mg/dL',
        normalRangeText: '0.0 - 0.3',
        flag: 'Normal'
      },
      {
        testCode: 'LFT',
        subHeadingId: 'sh_bili',
        subHeadingTitle: 'Bilirubin Profile',
        parameterId: 'param_ibili',
        parameterName: 'Serum Bilirubin - Indirect (Unconjugated)',
        value: '0.7',
        unit: 'mg/dL',
        normalRangeText: '0.1 - 0.8',
        flag: 'Normal'
      },
      {
        testCode: 'LFT',
        subHeadingId: 'sh_enzymes',
        subHeadingTitle: 'Hepatic Enzymes',
        parameterId: 'param_sgpt',
        parameterName: 'SGPT / ALT (Alanine Aminotransferase)',
        value: '68',
        unit: 'U/L',
        normalRangeText: 'Up to 45',
        flag: 'High'
      },
      {
        testCode: 'LFT',
        subHeadingId: 'sh_enzymes',
        subHeadingTitle: 'Hepatic Enzymes',
        parameterId: 'param_sgot',
        parameterName: 'SGOT / AST (Aspartate Aminotransferase)',
        value: '38',
        unit: 'U/L',
        normalRangeText: 'Up to 35',
        flag: 'High'
      },
      {
        testCode: 'LFT',
        subHeadingId: 'sh_enzymes',
        subHeadingTitle: 'Hepatic Enzymes',
        parameterId: 'param_alp',
        parameterName: 'Alkaline Phosphatase (ALP)',
        value: '95',
        unit: 'U/L',
        normalRangeText: '30 - 120',
        flag: 'Normal'
      },
      {
        testCode: 'LFT',
        subHeadingId: 'sh_proteins',
        subHeadingTitle: 'Serum Proteins',
        parameterId: 'param_tp',
        parameterName: 'Total Protein',
        value: '7.2',
        unit: 'g/dL',
        normalRangeText: '6.0 - 8.3',
        flag: 'Normal'
      },
      {
        testCode: 'LFT',
        subHeadingId: 'sh_proteins',
        subHeadingTitle: 'Serum Proteins',
        parameterId: 'param_alb',
        parameterName: 'Serum Albumin',
        value: '4.2',
        unit: 'g/dL',
        normalRangeText: '3.5 - 5.0',
        flag: 'Normal'
      },
      {
        testCode: 'LFT',
        subHeadingId: 'sh_proteins',
        subHeadingTitle: 'Serum Proteins',
        parameterId: 'param_glob',
        parameterName: 'Serum Globulin',
        value: '3.0',
        unit: 'g/dL',
        normalRangeText: '2.3 - 3.5',
        flag: 'Normal'
      },
      {
        testCode: 'LFT',
        subHeadingId: 'sh_proteins',
        subHeadingTitle: 'Serum Proteins',
        parameterId: 'param_agratio',
        parameterName: 'A / G Ratio',
        value: '1.4',
        unit: 'Ratio',
        normalRangeText: '1.2 - 2.2',
        flag: 'Normal'
      }
    ]
  },
  {
    orderId: 'ORD-9393',
    isApproved: true,
    approvedBy: 'Dr. Salman Tariq, MBBS, MPhil (Clinical Pathology)',
    approvedAt: '2026-09-19T17:30:00Z',
    pathologistRemarks: 'Microcytic hypochromic anemia with moderate acute phase inflammatory elevation (ESR 28 mm/hr). Platelets normal. Iron replacement therapy initiated.',
    results: [
      {
        testCode: 'CBC',
        subHeadingId: 'sh_rbc',
        subHeadingTitle: 'Red Blood Cell (RBC) Profile',
        parameterId: 'param_hb',
        parameterName: 'Hemoglobin (Hb)',
        value: '10.9',
        unit: 'g/dL',
        normalRangeText: '13.0 - 17.0',
        flag: 'Low'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_rbc',
        subHeadingTitle: 'Red Blood Cell (RBC) Profile',
        parameterId: 'param_rbc',
        parameterName: 'Red Blood Cells (RBC Count)',
        value: '3.9',
        unit: 'mil/uL',
        normalRangeText: '4.5 - 5.9',
        flag: 'Low'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_rbc',
        subHeadingTitle: 'Red Blood Cell (RBC) Profile',
        parameterId: 'param_hct',
        parameterName: 'Hematocrit (Hct / PCV)',
        value: '33.2',
        unit: '%',
        normalRangeText: '40 - 52',
        flag: 'Low'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_rbc',
        subHeadingTitle: 'Red Blood Cell (RBC) Profile',
        parameterId: 'param_mcv',
        parameterName: 'Mean Corpuscular Volume (MCV)',
        value: '74.2',
        unit: 'fL',
        normalRangeText: '80 - 96',
        flag: 'Low'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_rbc',
        subHeadingTitle: 'Red Blood Cell (RBC) Profile',
        parameterId: 'param_mch',
        parameterName: 'Mean Corpuscular Hemoglobin (MCH)',
        value: '23.8',
        unit: 'pg',
        normalRangeText: '27 - 33',
        flag: 'Low'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_rbc',
        subHeadingTitle: 'Red Blood Cell (RBC) Profile',
        parameterId: 'param_mchc',
        parameterName: 'MCHC',
        value: '30.1',
        unit: 'g/dL',
        normalRangeText: '32 - 36',
        flag: 'Low'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_rbc',
        subHeadingTitle: 'Red Blood Cell (RBC) Profile',
        parameterId: 'param_rdw',
        parameterName: 'Red Cell Distribution Width (RDW)',
        value: '16.4',
        unit: '%',
        normalRangeText: '11.5 - 14.5',
        flag: 'High'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_wbc',
        subHeadingTitle: 'White Blood Cells & Differential Count (DLC)',
        parameterId: 'param_tlc',
        parameterName: 'Total Leukocyte Count (TLC / WBC)',
        value: '11200',
        unit: '/cumm',
        normalRangeText: '4,000 - 11,000',
        flag: 'High'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_wbc',
        subHeadingTitle: 'White Blood Cells & Differential Count (DLC)',
        parameterId: 'param_neutro',
        parameterName: 'Neutrophils',
        value: '68',
        unit: '%',
        normalRangeText: '40 - 75',
        flag: 'Normal'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_wbc',
        subHeadingTitle: 'White Blood Cells & Differential Count (DLC)',
        parameterId: 'param_lympho',
        parameterName: 'Lymphocytes',
        value: '24',
        unit: '%',
        normalRangeText: '20 - 45',
        flag: 'Normal'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_plt',
        subHeadingTitle: 'Platelet Indices',
        parameterId: 'param_plt',
        parameterName: 'Platelet Count',
        value: '235000',
        unit: '/cumm',
        normalRangeText: '150,000 - 450,000',
        flag: 'Normal'
      },
      {
        testCode: 'CBC',
        subHeadingId: 'sh_esr',
        subHeadingTitle: 'Erythrocyte Sedimentation Rate',
        parameterId: 'param_esr',
        parameterName: 'ESR (Westergren Method - 1st Hr)',
        value: '28',
        unit: 'mm/hr',
        normalRangeText: '0 - 20',
        flag: 'High'
      }
    ]
  },
  {
    orderId: 'ORD-9394',
    isApproved: true,
    approvedBy: 'Dr. Salman Tariq, MBBS, MPhil (Clinical Pathology)',
    approvedAt: '2026-09-20T12:00:00Z',
    pathologistRemarks: 'Dyslipidemia and suboptimal glycemic control documented (HbA1c 7.8%). Renal parameters mildly elevated with serum creatinine at 1.35 mg/dL. Statin & diabetic therapy titration recommended.',
    results: [
      {
        testCode: 'LIPID',
        subHeadingId: 'sh_chol',
        subHeadingTitle: 'Cholesterol Profile',
        parameterId: 'param_chol',
        parameterName: 'Total Cholesterol',
        value: '242',
        unit: 'mg/dL',
        normalRangeText: '< 200 Desirable',
        flag: 'High'
      },
      {
        testCode: 'LIPID',
        subHeadingId: 'sh_chol',
        subHeadingTitle: 'Cholesterol Profile',
        parameterId: 'param_tg',
        parameterName: 'Triglycerides',
        value: '210',
        unit: 'mg/dL',
        normalRangeText: '< 150 Normal',
        flag: 'High'
      },
      {
        testCode: 'LIPID',
        subHeadingId: 'sh_chol',
        subHeadingTitle: 'Cholesterol Profile',
        parameterId: 'param_hdl',
        parameterName: 'HDL Cholesterol (Good)',
        value: '36',
        unit: 'mg/dL',
        normalRangeText: '> 40 Men, > 50 Women',
        flag: 'Low'
      },
      {
        testCode: 'LIPID',
        subHeadingId: 'sh_chol',
        subHeadingTitle: 'Cholesterol Profile',
        parameterId: 'param_ldl',
        parameterName: 'LDL Cholesterol (Calculated)',
        value: '164',
        unit: 'mg/dL',
        normalRangeText: '< 100 Optimal',
        flag: 'High'
      },
      {
        testCode: 'RFT',
        subHeadingId: 'sh_renal_func',
        subHeadingTitle: 'Renal Function Indices',
        parameterId: 'param_urea',
        parameterName: 'Blood Urea',
        value: '42',
        unit: 'mg/dL',
        normalRangeText: '15 - 45',
        flag: 'Normal'
      },
      {
        testCode: 'RFT',
        subHeadingId: 'sh_renal_func',
        subHeadingTitle: 'Renal Function Indices',
        parameterId: 'param_creat',
        parameterName: 'Serum Creatinine',
        value: '1.35',
        unit: 'mg/dL',
        normalRangeText: '0.6 - 1.2',
        flag: 'High'
      },
      {
        testCode: 'HBA1C',
        subHeadingId: 'sh_glycemia',
        subHeadingTitle: 'Glycemic Control',
        parameterId: 'param_hba1c',
        parameterName: 'Glycated Hemoglobin (HbA1c)',
        value: '7.8',
        unit: '%',
        normalRangeText: '< 5.7 Normal, 5.7-6.4 Pre, >=6.5 Diabetic',
        flag: 'High'
      }
    ]
  }
];
