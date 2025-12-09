
export interface Decision {
  decision: string;
}

export interface ActionItem {
  task: string;
  owner: string;
  dueDate: string;
}

export interface Verbal {
  executiveSummary: string;
  decisions: Decision[];
  actionItems: ActionItem[];
  discussionSummary: string;
  flowchart?: string;
  fullTranscript: string;
}

export type MeetingStatus = 'pending' | 'processing' | 'processed' | 'error';

export interface Meeting {
  id: string;
  title: string;
  participants: string[];
  date: string;
  verbal: Verbal | null;
  audioUrl?: string | null;
  companyId: string;
  status: MeetingStatus;
  creatorId: string;
  visibility: 'company' | 'private';
  sharedWith?: { id: string, email: string }[];
}

export enum UserRole {
  User = 'User',
  CompanyAdmin = 'CompanyAdmin',
  GeneralAdmin = 'GeneralAdmin'
}

export interface User {
  id: string;
  email: string;
  password?: string; // In a real app, this would be a hash
  role: UserRole;
  companyId?: string; // Optional for GeneralAdmin
  googleApiKey?: string;
  monthlyAllowanceSeconds: number;
  usedSecondsThisMonth: number;
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface SmtpSettings {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    smtpFrom: string;
    appBaseUrl: string;
}
