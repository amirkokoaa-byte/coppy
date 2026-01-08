
export type ContentType = 'text' | 'link' | 'email' | 'phone' | 'image' | 'unknown';
export type AIModelType = 'gemini-3-flash-preview' | 'gemini-3-pro-preview';

export interface ClipboardItem {
  id: string;
  content: string;
  type: ContentType;
  timestamp: number;
  aiAnalysis?: string;
  metadata?: {
    isSafe?: boolean;
    extractedText?: string;
    translation?: string;
    suggestedAction?: string;
  };
}

export interface AccountItem {
  id: string;
  appName: string;
  platform: 'Facebook' | 'Instagram' | 'Twitter' | 'Other';
  email: string;
  password: string;
  timestamp: number;
}

export interface GatekeeperAccount {
  id: string;
  username: string;
  passwordHash: string;
}

export interface AppSettings {
  adminEmail: string;
  securityEmail: string; // الإيميل القديم المطلوب للتحقق
  viewPasswordHash: string;
  primaryColor: string;
}
