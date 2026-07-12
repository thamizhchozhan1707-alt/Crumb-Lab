import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Standard Firebase Applet Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDtnr7Tg8LKNZGwiI8qOFvXnJgjhRMweVk",
  authDomain: "gentle-current-4hh41.firebaseapp.com",
  projectId: "gentle-current-4hh41",
  storageBucket: "gentle-current-4hh41.firebasestorage.app",
  messagingSenderId: "644656443029",
  appId: "1:644656443029:web:60cf9d0d006c4af790f59c"
};

const databaseId = "ai-studio-3c0754e2-3678-4ab7-afa7-055a7a2b8a9c";

const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with custom Database ID
export const db = getFirestore(app, databaseId);

// Initialize Storage
export const storage = getStorage(app);

/**
 * Robust image uploader helper.
 * Attempts to upload to Firebase Storage.
 * If it fails (e.g. storage bucket not activated or permissions), falls back to a base64 Data URL.
 */
export async function uploadCookiePhoto(file: File): Promise<string> {
  try {
    const fileRef = ref(storage, `cookies/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn("Firebase Storage upload failed. Falling back to local Base64 storage.", error);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
