import React, { useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react';

interface Props {
  accept: string;
  label: string;
  description: string;
  onUpload: (files: FileList) => void;
  files?: { name: string }[];
  onRemove?: (index: number) => void;
  multiple?: boolean;
}

export const FileUpload: React.FC<Props> = ({ accept, label, description, onUpload, files = [], onRemove, multiple = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
    // Reset input so same file can be selected again if needed
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <div 
        onClick={handleClick}
        className="border-2 border-dashed border-indigo-200 rounded-xl p-8 flex flex-col items-center justify-center bg-indigo-50/50 hover:bg-indigo-50 transition-colors cursor-pointer group"
      >
        <input 
          ref={inputRef}
          type="file" 
          accept={accept} 
          className="hidden" 
          onChange={handleChange}
          multiple={multiple}
        />
        <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
          <Upload className="w-8 h-8 text-indigo-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-800">{label}</h3>
        <p className="mt-2 text-sm text-gray-500 text-center max-w-xs">{description}</p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                {accept.includes('image') ? (
                  <ImageIcon className="w-5 h-5 text-blue-500" />
                ) : (
                  <FileText className="w-5 h-5 text-orange-500" />
                )}
                <span className="text-sm font-medium text-gray-700 truncate max-w-[200px] md:max-w-md">
                  {file.name}
                </span>
              </div>
              {onRemove && (
                <button 
                  onClick={() => onRemove(idx)}
                  className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};