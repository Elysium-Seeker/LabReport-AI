export interface FileData {
  name: string;
  content: string; // Text content for text files, Base64 for images/PDFs
  type: 'text' | 'image' | 'pdf';
  mimeType?: string;
}

export enum Step {
  TEMPLATE = 0,
  GUIDE = 1,
  DATA = 2,
  GENERATE = 3,
}

export interface ReportConfig {
  template: string;
  guide: FileData | null;
  images: FileData[];
}