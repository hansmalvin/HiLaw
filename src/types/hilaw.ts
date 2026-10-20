export type UserRole = 'CLIENT' | 'LAWYER' | 'ADMIN';

export type LegalSpecialization =
  | 'Hukum Keluarga & Waris'
  | 'Hukum Bisnis & Kontrak'
  | 'Hukum Pidana'
  | 'Hukum Perdata & Hutang Piutang'
  | 'Hukum Ketenagakerjaan (PHI)'
  | 'Pertanahan & Properti'
  | 'HKI & Pajak';

export type ConsultationChannel = 'CHAT' | 'VOICE_CALL' | 'VIDEO_CALL';

export type PaymentMethod = 'QRIS' | 'GOPAY' | 'SHOPEEPAY' | 'BCA_VA' | 'MANDIRI_VA' | 'BRI_VA' | 'CREDIT_CARD';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  tokenBalance: number;
  createdAt: string;
}

export interface LawyerProfile {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string;
  specialization: LegalSpecialization;
  subSpecialties: string[];
  licenseNumber: string; // Contoh: "PERADI-2018-09421"
  organization: 'PERADI' | 'KAI';
  basNumber: string; // Berita Acara Sumpah Pengadilan Tinggi
  university: string;
  bio: string;
  experienceYears: number;
  satisfactionRate: number; // Contoh: 99
  totalConsultations: number;
  tokenRateChat: number; // Contoh: 50 (setara Rp 50.000)
  tokenRateCall: number; // Contoh: 90 (setara Rp 90.000)
  isOnline: boolean;
  availabilityStatus: 'ONLINE' | 'BUSY' | 'OFFLINE';
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface TokenPackage {
  id: string;
  packageName: string;
  tokenAmount: number;
  bonusTokens: number;
  priceIdr: number;
  isPopular?: boolean;
  description: string;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  userName: string;
  packageId?: string;
  txType: 'TOPUP_MIDTRANS' | 'CONSULTATION_DEBIT' | 'REFUND' | 'WITHDRAWAL';
  tokenDelta: number;
  amountIdr: number;
  midtransOrderId?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus: 'PENDING' | 'SETTLEMENT' | 'EXPIRE';
  createdAt: string;
}

export interface LegalSummary {
  issueAnalysis: string;
  legalBasis: string;
  recommendedAction: string[];
}

export interface ConsultationSession {
  id: string;
  clientId: string;
  clientName: string;
  isAnonymous?: boolean;
  lawyerId: string;
  lawyerName: string;
  lawyerSpecialty: LegalSpecialization;
  lawyerLicense: string;
  channel: ConsultationChannel;
  caseCategory: LegalSpecialization;
  briefDescription: string;
  tokensLocked: number;
  durationMinutes: number;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'REFUNDED';
  legalSummary?: LegalSummary;
  clientRating?: number;
  startedAt: string;
}

export interface ConsultationMessage {
  id: string;
  consultationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'CLIENT' | 'LAWYER' | 'SYSTEM';
  content: string;
  attachmentUrl?: string;
  sentAt: string;
}

export interface LegalTriageCase {
  id: string;
  symptomTitle: string;
  symptomExample: string;
  recommendedSpecialty: LegalSpecialization;
  urgency: 'Normal' | 'Segera' | 'Mendesak';
  preliminaryTip: string;
}
