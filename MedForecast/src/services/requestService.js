import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notificationService';


// Create a new request
// Create a new request
export const createRequest = async (requestData) => {
  try {
    const docRef = await addDoc(collection(db, 'requests'), {
      ...requestData,
      status: 'open',
      respondingHospitalId: null,
      respondingHospitalName: null,
      fulfilledAt: null,
      createdAt: new Date().toISOString()
    });

    // Notify nearby hospitals (get all hospitals and notify them)
    const hospitalsSnapshot = await getDocs(collection(db, 'hospitals'));
    const notificationPromises = hospitalsSnapshot.docs
      .filter(doc => doc.id !== requestData.requestingHospitalId) // Don't notify yourself
      .map(doc => 
        createNotification({
          recipientId: doc.id,
          type: 'request',
          title: '🚨 Urgent Resource Request',
          message: `${requestData.requestingHospitalName} needs ${requestData.quantity} ${requestData.resourceName} (${requestData.urgency} priority)`,
          relatedRequestId: docRef.id
        })
      );
    
    await Promise.all(notificationPromises);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
};

// Subscribe to all open requests (real-time)
export const subscribeToOpenRequests = (callback) => {
  // Simpler query - just get by status
  const q = query(
    collection(db, 'requests'),
    where('status', '==', 'open')
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory instead of Firestore
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log('Open requests from Firestore:', requests); // Debug
    callback(requests);
  }, (error) => {
    console.error('Error in subscribeToOpenRequests:', error);
  });
};

// Subscribe to hospital's own requests
export const subscribeToMyRequests = (hospitalId, callback) => {
  // Simpler query - just get by hospitalId
  const q = query(
    collection(db, 'requests'),
    where('requestingHospitalId', '==', hospitalId)
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log('My requests from Firestore:', requests); // Debug
    callback(requests);
  }, (error) => {
    console.error('Error in subscribeToMyRequests:', error);
  });
};


// Accept/Respond to a request
export const respondToRequest = async (requestId, respondingHospitalId, respondingHospitalName, requestData) => {
  try {
    const requestRef = doc(db, 'requests', requestId);
    await updateDoc(requestRef, {
      status: 'matched',
      respondingHospitalId,
      respondingHospitalName,
      matchedAt: new Date().toISOString()
    });

    // Create notification for requester
    await createNotification({
      recipientId: requestData.requestingHospitalId,
      type: 'response',
      title: '🎉 Help is on the way!',
      message: `${respondingHospitalName} has offered to help with your request for ${requestData.quantity} ${requestData.resourceName}`,
      relatedRequestId: requestId
    });

    console.log('Response sent successfully!');
  } catch (error) {
    console.error('Error responding to request:', error);
    throw error;
  }
};

// Mark request as fulfilled
export const fulfillRequest = async (requestId) => {
  try {
    const requestRef = doc(db, 'requests', requestId);
    await updateDoc(requestRef, {
      status: 'fulfilled',
      fulfilledAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fulfilling request:', error);
    throw error;
  }
};

// Cancel request
export const cancelRequest = async (requestId) => {
  try {
    const requestRef = doc(db, 'requests', requestId);
    await updateDoc(requestRef, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error cancelling request:', error);
    throw error;
  }
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance.toFixed(1); // Return distance in km with 1 decimal
};