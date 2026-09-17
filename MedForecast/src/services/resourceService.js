import { collection, addDoc, updateDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';

// Get all resources for a hospital (real-time)
export const subscribeToResources = (hospitalId, callback) => {
  const q = query(
    collection(db, 'resources'),
    where('hospitalId', '==', hospitalId)
  );

  return onSnapshot(q, (snapshot) => {
    const resources = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(resources);
  });
};

// Update a resource
export const updateResource = async (resourceId, data) => {
  const resourceRef = doc(db, 'resources', resourceId);
  await updateDoc(resourceRef, {
    available: data.available,
    total: data.total,
    updatedAt: new Date().toISOString()
  });
};

// Create initial resources for a new hospital
export const createInitialResources = async (hospitalId) => {
  const initialResources = [
    {
      hospitalId,
      name: 'ICU Beds',
      type: 'bed',
      category: 'ICU',
      available: 0,
      total: 0,
      icon: 'Bed',
      color: 'blue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      hospitalId,
      name: 'Ventilators',
      type: 'equipment',
      category: 'Ventilator',
      available: 0,
      total: 0,
      icon: 'Activity',
      color: 'green',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      hospitalId,
      name: 'Blood Units (O+)',
      type: 'blood',
      category: 'O+',
      available: 0,
      total: 0,
      icon: 'Droplet',
      color: 'red',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      hospitalId,
      name: 'Doctors Available',
      type: 'doctor',
      category: 'General',
      available: 0,
      total: 0,
      icon: 'Users',
      color: 'purple',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const promises = initialResources.map(resource => 
    addDoc(collection(db, 'resources'), resource)
  );

  await Promise.all(promises);
};