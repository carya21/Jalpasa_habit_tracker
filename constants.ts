export const APP_TITLE = "잘파사 습관챌린지";
export const MIN_DISTANCE_KM = 3; // Daily Goal
export const MIN_UPLOAD_DISTANCE = 1; // Minimum per upload
export const MAX_PACE_MIN_PER_KM = 20; // Slower than 20min/km is invalid
export const PENALTY_AMOUNT = 20000; // Penalty per missed day in KRW

// Keys for LocalStorage
export const STORAGE_KEYS = {
  USERS: 'jalpasa_users',
  RECORDS: 'jalpasa_records',
};

// Start empty as requested
export const INITIAL_USERS = [];