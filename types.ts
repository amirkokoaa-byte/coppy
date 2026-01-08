
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

export interface UserSettings {
  passwordHash: string;
  isLocked: boolean;
}
