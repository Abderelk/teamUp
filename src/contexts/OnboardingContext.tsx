import React, { createContext, useContext, useState, ReactNode } from 'react';
import { OnboardingData, SkillLevel, NotificationPreferences } from '../types/onboarding';
import { Sport } from '../types';

interface OnboardingContextType {
  data: OnboardingData;
  currentStep: number;
  totalSteps: number;
  updateData: (newData: Partial<OnboardingData>) => void;
  setCurrentStep: (step: number) => void;
  resetOnboarding: () => void;
}

const initialData: OnboardingData = {
  dateOfBirth: null,
  profilePicture: null,
  favoriteSports: [],
  skillLevels: {} as Record<Sport, SkillLevel>,
  availability: [],
  maxTravelDistance: null,
  location: null,
  accessibilityNeeds: '',
  notificationPreferences: {
    newEvents: true,
    eventReminders: true,
    messages: true,
    eventUpdates: true,
    recommendations: false
  }
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<OnboardingData>(initialData);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 9;

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const resetOnboarding = () => {
    setData(initialData);
    setCurrentStep(1);
  };

  return (
    <OnboardingContext.Provider value={{
      data,
      currentStep,
      totalSteps,
      updateData,
      setCurrentStep,
      resetOnboarding
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};