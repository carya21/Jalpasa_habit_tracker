import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCfJ4PCk0vxHvpoVY2RPc0i1_XcmGY7Ykw",
  authDomain: "jalpasa-habit-challenge.firebaseapp.com",
  projectId: "jalpasa-habit-challenge",
  storageBucket: "jalpasa-habit-challenge.firebasestorage.app",
  messagingSenderId: "779059216402",
  appId: "1:779059216402:web:4ff3e3f912168b3b31d8cb",
  measurementId: "G-GHGHGBMLV7"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;
