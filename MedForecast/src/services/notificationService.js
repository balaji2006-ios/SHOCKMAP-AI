import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, limit } from 'firebase/firestore';
import { db } from './firebase';

// Create a notification
export const createNotification = async (notificationData) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      read: false,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Subscribe to notifications for a hospital (real-time)
export const subscribeToNotifications = (hospitalId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', hospitalId),
    orderBy('createdAt', 'desc'),
    limit(50) // Last 50 notifications
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(notifications);
  });
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllAsRead = async (hospitalId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', hospitalId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { 
        read: true, 
        readAt: new Date().toISOString() 
      })
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
};