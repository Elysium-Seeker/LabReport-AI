import { FileData } from './types';

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64," or "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const processFile = async (file: File, type: 'text' | 'image' | 'pdf'): Promise<FileData> => {
  if (type === 'text') {
    const content = await readFileAsText(file);
    return { name: file.name, content, type };
  } else {
    // Both images and PDFs need to be read as Base64 for the Gemini API
    const content = await readFileAsBase64(file);
    return { name: file.name, content, type, mimeType: file.type };
  }
};