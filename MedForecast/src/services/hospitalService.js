import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Get hospital profile
export const getHospitalProfile = async (hospitalId) => {
  try {
    const docRef = doc(db, 'hospitals', hospitalId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting hospital profile:', error);
    throw error;
  }
};

// Save/Update hospital profile
export const saveHospitalProfile = async (hospitalId, profileData) => {
  try {
    const docRef = doc(db, 'hospitals', hospitalId);
    await setDoc(docRef, {
      ...profileData,
      verified: false, // Admin verification pending
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving hospital profile:', error);
    throw error;
  }
};

// Get all hospitals (for searching later)
export const getAllHospitals = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'hospitals'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting hospitals:', error);
    throw error;
  }
};