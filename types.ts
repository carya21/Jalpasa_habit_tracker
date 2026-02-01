export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  joinedAt?: number; // Timestamp of when user joined
}

export interface WorkoutRecord {
  id: string;
  userId: string;
  date: string; // ISO Date String YYYY-MM-DD
  distance: number;
  imageUrl: string;
  isValid: boolean; 
  timestamp: number;
}

export interface UserStats {
  userId: string;
  name: string;
  totalDistance: number;
  validDays: number;
  completionRate: number; // Percentage based on days elapsed in month
  todayDistance: number; // Added to track today's progress specifically
  isDoneToday: boolean; // True if todayDistance >= 3km
}

export interface VerificationResult {
  distance: number;
  durationInMinutes: number; // Extracted time in minutes
  reasoning: string;
}