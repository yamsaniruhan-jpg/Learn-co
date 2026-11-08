import React, { useState } from 'react';
import { Compass, Sparkles, BookOpen, Bot, ArrowRight, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
}

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to Learn.co',
      desc: 'Master STEM with gamified interactive practice.',
      icon: Compass,
      tab: 'dashboard',
    },
    {
      title: 'Practice Arena',
      desc: 'Solve adaptive questions and earn XP.',
      icon: BookOpen,
      tab: 'practice',
    },
    {
      title: 'Omni Co-Pilot',
      desc: 'Get Socratic AI hints instantly.',
      icon: Bot,
      tab: 'copilot',
    },
    {
      title: 'Creator Studio',
      desc: 'Build custom study notes and quizzes.',
      icon: Sparkles,
      tab: 'create',
    },
  ];

  const current = steps[step];
  const IconComponent = current.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handleAction = () => {
    onNavigate(current.tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2A4A]/80 p-4">
      <div className="bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_12px_32px_rgba(45,42,74,0.14)] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#6B6890] hover:text-[#2D2A4A] cursor-pointer"
          aria-label="Close walkthrough"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-20 h-20 rounded-full bg-[#6C5CE7]/10 flex items-center justify-center text-[#6C5CE7] mb-5">
            <IconComponent className="w-10 h-10" />
          </div>

          <h3 className="text-xl font-black text-[#2D2A4A] dark:text-[#F1EFFF] mb-2">
            {current.title}
          </h3>
          <p className="text-sm text-[#6B6890] dark:text-[#B8B3D9] max-w-xs mb-8">
            {current.desc}
          </p>

          <div className="flex items-center gap-2 mb-8">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === step ? 'w-8 bg-[#6C5CE7]' : 'w-2 bg-[#E3DFF5] dark:bg-[#3D3861]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl border-2 border-[#E3DFF5] dark:border-[#3D3861] text-[#6B6890] dark:text-[#B8B3D9] font-bold text-sm hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] min-h-[48px] cursor-pointer"
            >
              Skip
            </button>
            <button
              onClick={handleAction}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#6C5CE7] text-white font-bold text-sm hover:bg-[#5B4BC4] min-h-[48px] shadow-[0_4px_12px_rgba(108,92,231,0.25)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{step === steps.length - 1 ? 'Start' : 'Explore'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
