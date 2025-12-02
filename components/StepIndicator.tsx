import React from 'react';
import { Step } from '../types';
import { CheckCircle, Circle } from 'lucide-react';

interface Props {
  currentStep: Step;
  setStep: (step: Step) => void;
}

export const StepIndicator: React.FC<Props> = ({ currentStep, setStep }) => {
  const steps = [
    { id: Step.TEMPLATE, label: 'Template' },
    { id: Step.GUIDE, label: 'Guide' },
    { id: Step.DATA, label: 'Data' },
    { id: Step.GENERATE, label: 'Result' },
  ];

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative max-w-3xl mx-auto px-4">
        {/* Connecting Line */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
        
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <button
              key={step.id}
              onClick={() => isCompleted && setStep(step.id)}
              disabled={!isCompleted && currentStep !== step.id}
              className={`flex flex-col items-center group focus:outline-none ${!isCompleted ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 bg-white
                ${isActive ? 'border-indigo-600 scale-110' : isCompleted ? 'border-green-500' : 'border-gray-300'}
              `}>
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <span className={`font-bold ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {index + 1}
                  </span>
                )}
              </div>
              <span className={`mt-2 text-sm font-medium ${isActive ? 'text-indigo-800' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};