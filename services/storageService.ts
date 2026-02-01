import { STORAGE_KEYS, INITIAL_USERS } from "../constants";
import { User, WorkoutRecord } from "../types";

export const getStoredUsers = (): User[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(stored);
};

export const saveUser = (user: User) => {
  const users = getStoredUsers();
  const updated = [...users, user];
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
  return updated;
};

export const getStoredRecords = (): WorkoutRecord[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.RECORDS);
  return stored ? JSON.parse(stored) : [];
};

export const saveRecord = (record: WorkoutRecord) => {
  const records = getStoredRecords();
  const updated = [...records, record];
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updated));
  return updated;
};

export const clearAllData = () => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    window.location.reload();
}
