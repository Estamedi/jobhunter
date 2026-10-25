import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Answers, initialAnswers } from './data/questions'

interface OnboardingAnswersState {
  answers: Answers
  setAnswer: <K extends keyof Answers>(key: K, value: Answers[K]) => void
  reset: () => void
}

export const useOnboardingAnswers = create<OnboardingAnswersState>()(
  persist(
    (set) => ({
      answers: initialAnswers,
      setAnswer: (key, value) =>
        set((state) => ({ answers: { ...state.answers, [key]: value } })),
      reset: () => set({ answers: initialAnswers }),
    }),
    { name: 'onboarding-answers' }
  )
)
