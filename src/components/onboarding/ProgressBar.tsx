"use client";

import { Check, Lock } from "lucide-react";

const STEPS = [
  { label: "Infos", number: 0 },
  { label: "Questions", number: 1 },
  { label: "Appel", number: 2 },
  { label: "Documents", number: 3 },
];

interface ProgressBarProps {
  currentStep: number;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="w-full px-2 py-6">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isLocked = index > currentStep;

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center relative">
                <div
                  className={`
                    w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center
                    text-sm font-semibold transition-all duration-200 shrink-0
                    ${
                      isCompleted
                        ? "bg-[#C9A84C] text-[#0A0F1E]"
                        : isActive
                        ? "border-2 border-[#C9A84C] text-[#C9A84C] bg-transparent animate-pulse"
                        : "border border-[#1E2D45] text-[#94A3B8] bg-[#111827]"
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : isLocked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    step.number + 1
                  )}
                </div>
                {/* Label */}
                <span
                  className={`
                    text-xs mt-2 whitespace-nowrap transition-all duration-200
                    ${
                      isCompleted
                        ? "text-[#C9A84C]"
                        : isActive
                        ? "text-white font-medium"
                        : "text-[#94A3B8]"
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-1.5 md:mx-3 relative overflow-hidden rounded-full">
                  <div className="absolute inset-0 bg-[#1E2D45]" />
                  <div
                    className="absolute inset-y-0 left-0 progress-gradient transition-all duration-500 ease-out rounded-full"
                    style={{
                      width:
                        index < currentStep
                          ? "100%"
                          : index === currentStep
                          ? "50%"
                          : "0%",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
