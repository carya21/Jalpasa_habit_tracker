import { db, storage } from './firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User, WorkoutRecord } from '../types';

export const storageService = {
  async getUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      } as User));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  async addUser(name: string): Promise<User> {
    try {
      const newUser: Omit<User, 'id'> = {
        name,
        records: [],
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'users'), {
        ...newUser,
        createdAt: Timestamp.fromDate(newUser.createdAt)
      });

      return {
        id: docRef.id,
        ...newUser
      };
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  },

  async uploadImage(file: File): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `workout_images/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  async addWorkoutRecord(userId: string, record: Omit<WorkoutRecord, 'id'>): Promise<void> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      
      const userDoc = querySnapshot.docs.find(doc => doc.id === userId);
      
      if (!userDoc) {
        throw new Error('User not found');
      }

      const userData = userDoc.data() as User;
      const newRecord: WorkoutRecord = {
        ...record,
        id: `record_${Date.now()}`
      };

      const updatedRecords = [...(userData.records || []), newRecord];

      await updateDoc(doc(db, 'users', userId), {
        records: updatedRecords
      });
    } catch (error) {
      console.error('Error adding workout record:', error);
      throw error;
    }
  }
};
