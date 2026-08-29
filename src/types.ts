export type TrainingStatus = 
  | 'Done' 
  | 'Hold' 
  | 'To-Do' 
  | 'Ongoing' 
  | 'Cancel' 
  | 'Ticket Sub Due' 
  | 'W/O Cancle';

export type PackageType = 
  | 'Basic'
  | 'Standard'
  | 'Advance'
  | 'Advance with Location Tracking'
  | 'Advance with Mobile Punch'
  | 'Advance with Location Tracking, Geo Fence'
  | 'Advacne with GEO Fence'
  | 'Advance and advance roster,mobile punch'
  | 'Advance and advance roster'
  | 'Advance roster'
  | 'Essential'
  | 'Essential, Location Tracking'
  | 'Premium'
  | 'Premium, Payroll'
  | 'Premium, Advance roster'
  | 'Standard, Payroll'
  | 'Standard, Location Tracking'
  | 'Standard, Advance roster'
  | 'Payroll'
  | 'Lunch Report'
  | 'Dynamic shift'
  | 'Free With Device'
  | 'Cs'
  | 'All';

export interface TrainingRecord {
  id: string;
  clientName: string;
  ticketId?: string;
  assignedPerson?: string; // Sales / KAM person who assigned or created (e.g., Taqi Yeasir, Fariha, Nur, Rohan, Moon, Foysal, Ashik Rahaman)
  package: string;
  manpowerSubmission?: string;
  trainingDate: string; // e.g. "2026-08-28" or "28-Aug-2026"
  trainingTime?: string; // e.g. "3:00 PM"
  pm: string; // Trainer / Project Manager (e.g., Shahin, Musa, Nirob, Anika, Badhon, Bithi, Lamisa, Samir, Rashed, Alim, Lamia)
  status: TrainingStatus;
  meetLink?: string;
  clientPhone?: string;
  clientEmail?: string;
  contactPerson?: string;
  remarks?: string;
  saasInterval?: string;
  tentativeCommunicationDate?: string;
  communicationDate?: string;
  communicatedPerson?: string;
  setupFeedback?: string; // Did you complete the initial software setup?
  issueFeedback?: string; // Did you encounter any issues during usage?
  rating?: number; // 1 to 5 scale
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppDropdownSettings {
  assignedPersons: string[];
  packages: string[];
  pms: string[];
  statuses: string[];
}

export interface TrainerMetric {
  name: string;
  total: number;
  done: number;
  hold: number;
  todo: number;
  ongoing: number;
  cancelled: number;
  ratingAverage?: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'trainer' | 'kam' | 'viewer';
}
