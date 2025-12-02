import React, { useState } from 'react';
import { Step, ReportConfig, FileData } from './types';
import { StepIndicator } from './components/StepIndicator';
import { FileUpload } from './components/FileUpload';
import { generateLabReport } from './services/geminiService';
import { processFile } from './utils';
import { Beaker, ArrowRight, ArrowLeft, Loader2, Download, RefreshCw, FileText, BookOpen, Camera } from 'lucide-react';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.TEMPLATE);
  const [config, setConfig] = useState<ReportConfig>({
    template: '',
    guide: null,
    images: [],
  });
  
  // UI State for filenames to display
  const [templateFile, setTemplateFile] = useState<{name: string} | null>(null);
  const [guideFile, setGuideFile] = useState<{name: string} | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Handlers
  const handleTemplateUpload = async (files: FileList) => {
    const file = files[0];
    try {
      const data = await processFile(file, 'text');
      setConfig(prev => ({ ...prev, template: data.content }));
      setTemplateFile({ name: file.name });
    } catch (e) {
      setError("Failed to read template file.");
    }
  };

  const handleGuideUpload = async (files: FileList) => {
    const file = files[0];
    try {
      // Determine if it is a PDF or Text
      const isPdf = file.type === 'application/pdf';
      const type = isPdf ? 'pdf' : 'text';
      
      const data = await processFile(file, type);
      setConfig(prev => ({ ...prev, guide: data }));
      setGuideFile({ name: file.name });
    } catch (e) {
      setError("Failed to read guide file.");
    }
  };

  const handleImageUpload = async (files: FileList) => {
    const newImages: FileData[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const data = await processFile(files[i], 'image');
        newImages.push(data);
      } catch (e) {
        console.error("Skipped image due to error");
      }
    }
    // Append new images to existing ones to support multiple upload batches
    setConfig(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
  };

  const removeImage = (index: number) => {
    setConfig(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const latex = await generateLabReport(config);
      setResult(latex);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'application/x-latex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Render Steps ---

  const renderStepContent = () => {
    switch (currentStep) {
      case Step.TEMPLATE:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Upload LaTeX Template</h2>
              <p className="text-gray-500 mt-2">Upload your .tex file containing the structure of the report.</p>
            </div>
            <FileUpload 
              accept=".tex,.txt"
              label="Select Template File"
              description="Drop your .tex file here or click to browse"
              onUpload={handleTemplateUpload}
              files={templateFile ? [templateFile] : []}
            />
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Tip: Ensure your template contains packages like <code>graphicx</code> and <code>booktabs</code> if you expect images or nice tables.
              </p>
            </div>
          </div>
        );

      case Step.GUIDE:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Upload Experiment Guide</h2>
              <p className="text-gray-500 mt-2">Upload the lab manual (PDF recommended) so the AI sees diagrams and theory.</p>
            </div>
            <FileUpload 
              accept=".pdf,.txt,.md,.tex"
              label="Select Guide File"
              description="Upload PDF or text content of your lab manual"
              onUpload={handleGuideUpload}
              files={guideFile ? [guideFile] : []}
            />
             <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 flex gap-3">
              <BookOpen className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-800">
                The guide helps the AI perform correct calculations. We recommend <strong>PDF</strong> so the AI can understand diagrams and charts.
              </p>
            </div>
          </div>
        );

      case Step.DATA:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Upload Data Sheets</h2>
              <p className="text-gray-500 mt-2">Upload all photos of your handwritten data (multiple pages supported).</p>
            </div>
            <FileUpload 
              accept="image/*"
              label="Add Data Photos"
              description="Click to upload multiple photos of your data tables"
              onUpload={handleImageUpload}
              multiple={true}
              files={config.images}
              onRemove={removeImage}
            />
             <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex gap-3">
              <Camera className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-800">
                <p><strong>Supported:</strong> Multiple images.</p>
                <p>The AI will combine data from all uploaded photos to generate the full report.</p>
              </div>
            </div>
          </div>
        );

      case Step.GENERATE:
        return (
          <div className="space-y-6 animate-fadeIn h-full flex flex-col">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Generate Report</h2>
              <p className="text-gray-500 mt-2">Review your inputs and generate the LaTeX code.</p>
            </div>

            {!result && !isGenerating && (
               <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
                  <p className="text-gray-600 mb-4">
                    Ready to process: <br/>
                    <span className="font-semibold text-gray-900">{config.template ? '1 Template' : 'No Template'}</span>, {' '}
                    <span className="font-semibold text-gray-900">{config.guide ? '1 Guide' : 'No Guide'}</span>, {' '}
                    <span className="font-semibold text-gray-900">{config.images.length} Images</span>.
                  </p>
                  <button 
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg hover:shadow-indigo-500/30"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Start Generation
                  </button>
               </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-gray-600 font-medium animate-pulse">Analyzing handwriting and calculating data...</p>
                <p className="text-sm text-gray-400">This might take up to 30 seconds.</p>
              </div>
            )}

            {result && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">Generated LaTeX</h3>
                  <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 bg-indigo-50 rounded-md transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download .tex
                  </button>
                </div>
                <textarea 
                  className="w-full flex-1 min-h-[400px] p-4 font-mono text-sm bg-gray-900 text-gray-100 rounded-lg shadow-inner resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={result}
                  readOnly
                />
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                <p className="font-bold">Error</p>
                <p>{error}</p>
                <button onClick={() => setError(null)} className="mt-2 text-sm underline">Dismiss</button>
              </div>
            )}
          </div>
        );
    }
  };

  const nextStep = () => {
    if (currentStep < Step.GENERATE) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > Step.TEMPLATE) setCurrentStep(currentStep - 1);
  };

  const isNextDisabled = () => {
    if (currentStep === Step.TEMPLATE && !config.template) return true;
    if (currentStep === Step.GUIDE && !config.guide) return true;
    // Data step is optional technically, but better to have at least one image usually. Allowing empty for now.
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
            <Beaker className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            LabReport AI
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <StepIndicator currentStep={currentStep} setStep={setCurrentStep} />
        
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 mt-6 min-h-[500px] flex flex-col">
          {renderStepContent()}
        </div>
      </main>

      {/* Footer Navigation */}
      {currentStep !== Step.GENERATE && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button 
              onClick={prevStep}
              disabled={currentStep === Step.TEMPLATE}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors
                ${currentStep === Step.TEMPLATE 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            
            <button 
              onClick={nextStep}
              disabled={isNextDisabled()}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium shadow-md transition-all
                ${isNextDisabled()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/25'
                }`}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;