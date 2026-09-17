import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, getDocs, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notificationService';
import { setDoc, getDoc } from 'firebase/firestore';

// Create ambulance profile
export const createAmbulanceProfile = async (userId, profileData) => {
  try {
    const docRef = doc(db, 'ambulances', userId);
    await setDoc(docRef, {
      ...profileData,
      available: true,
      currentLocation: profileData.location,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating ambulance profile:', error);
    throw error;
  }
};

// Get ambulance profile
export const getAmbulanceProfile = async (userId) => {
  try {
    const docRef = doc(db, 'ambulances', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error getting ambulance profile:', error);
    throw error;
  }
};

// Subscribe to all available ambulances
export const subscribeToAvailableAmbulances = (callback) => {
  const q = query(
    collection(db, 'ambulances'),
    where('available', '==', true)
  );

  return onSnapshot(q, (snapshot) => {
    const ambulances = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(ambulances);
  });
};

// Create ambulance request from hospital
export const createAmbulanceRequest = async (requestData) => {
  try {
    const docRef = await addDoc(collection(db, 'ambulanceRequests'), {
      ...requestData,
      status: 'pending',
      acceptedBy: null,
      createdAt: new Date().toISOString()
    });

    // Notify all available ambulances
    const ambulancesSnapshot = await getDocs(query(
      collection(db, 'ambulances'),
      where('available', '==', true)
    ));

    const notificationPromises = ambulancesSnapshot.docs.map(doc => 
      createNotification({
        recipientId: doc.id,
        type: 'ambulance_request',
        title: '🚨 Ambulance Request',
        message: `${requestData.hospitalName} needs ambulance - ${requestData.patientCondition}`,
        relatedRequestId: docRef.id
      })
    );

    await Promise.all(notificationPromises);
    return docRef.id;
  } catch (error) {
    console.error('Error creating ambulance request:', error);
    throw error;
  }
};

// Subscribe to ambulance requests (for hospitals)
export const subscribeToHospitalAmbulanceRequests = (hospitalId, callback) => {
  const q = query(
    collection(db, 'ambulanceRequests'),
    where('requestingHospitalId', '==', hospitalId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(requests);
  });
};

// Subscribe to all ambulance requests (for ambulances)
export const subscribeToAmbulanceRequests = (callback) => {
  const q = query(
    collection(db, 'ambulanceRequests'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(requests);
  });
};

// Accept ambulance request
export const acceptAmbulanceRequest = async (requestId, ambulanceId, ambulanceName) => {
  try {
    const requestRef = doc(db, 'ambulanceRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    const requestData = requestSnap.data();

    await updateDoc(requestRef, {
      status: 'accepted',
      acceptedBy: ambulanceId,
      ambulanceName: ambulanceName,
      acceptedAt: new Date().toISOString()
    });

    // Notify hospital
    await createNotification({
      recipientId: requestData.requestingHospitalId,
      type: 'ambulance_accepted',
      title: '🚑 Ambulance On The Way!',
      message: `${ambulanceName} has accepted your request. ETA: 10-15 minutes`,
      relatedRequestId: requestId
    });
  } catch (error) {
    console.error('Error accepting ambulance request:', error);
    throw error;
  }
};

// Update ambulance availability
export const updateAmbulanceAvailability = async (ambulanceId, available) => {
  try {
    const ambulanceRef = doc(db, 'ambulances', ambulanceId);
    await updateDoc(ambulanceRef, {
      available,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    throw error;
  }
};

// Calculate distance (reuse from requestService)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
};

// Ambulance requests facility from hospitals
export const createHospitalFacilityRequest = async (requestData) => {
  try {
    const docRef = await addDoc(collection(db, 'facilityRequests'), {
      ...requestData,
      status: 'pending',
      responses: [],
      createdAt: new Date().toISOString()
    });

    // Get nearby hospitals within 20km radius
    const hospitalsSnapshot = await getDocs(collection(db, 'hospitals'));
    const nearbyHospitals = hospitalsSnapshot.docs.filter(doc => {
      const hospital = doc.data();
      if (!hospital.latitude || !hospital.longitude) return false;
      
      const distance = calculateDistance(
        parseFloat(requestData.location.lat),
        parseFloat(requestData.location.lng),
        parseFloat(hospital.latitude),
        parseFloat(hospital.longitude)
      );
      
      return parseFloat(distance) <= 20; // Within 20km
    });

    // Notify nearby hospitals
    const notificationPromises = nearbyHospitals.map(doc => 
      createNotification({
        recipientId: doc.id,
        type: 'facility_request',
        title: '🚨 Ambulance Needs Facility',
        message: `${requestData.ambulanceName} has a ${requestData.patientCondition} patient. Need: ${requestData.requiredFacility}`,
        relatedRequestId: docRef.id
      })
    );

    await Promise.all(notificationPromises);
    return docRef.id;
  } catch (error) {
    console.error('Error creating facility request:', error);
    throw error;
  }
};

// Hospital responds to facility request
export const respondToFacilityRequest = async (requestId, hospitalId, hospitalName, responseData) => {
  try {
    const requestRef = doc(db, 'facilityRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    const currentData = requestSnap.data();

    const newResponse = {
      hospitalId,
      hospitalName,
      available: responseData.available,
      message: responseData.message,
      distance: responseData.distance,
      respondedAt: new Date().toISOString()
    };

    await updateDoc(requestRef, {
      responses: [...(currentData.responses || []), newResponse],
      status: responseData.available ? 'available' : currentData.status
    });

    // Notify ambulance
    await createNotification({
      recipientId: currentData.requestingAmbulanceId,
      type: 'facility_response',
      title: responseData.available ? '✅ Facility Available!' : 'ℹ️ Hospital Response',
      message: `${hospitalName}: ${responseData.message}`,
      relatedRequestId: requestId
    });
  } catch (error) {
    console.error('Error responding to facility request:', error);
    throw error;
  }
};

// Subscribe to facility requests (for hospitals)
export const subscribeToFacilityRequests = (hospitalId, callback) => {
  const q = query(
    collection(db, 'facilityRequests'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, async (snapshot) => {
    const requests = await Promise.all(
      snapshot.docs.map(async doc => {
        const data = doc.data();
        
        // Get hospital location to calculate distance
        const hospitalDoc = await getDoc(doc(db, 'hospitals', hospitalId));
        const hospitalData = hospitalDoc.data();
        
        if (hospitalData && hospitalData.latitude && data.location) {
          const distance = calculateDistance(
            parseFloat(hospitalData.latitude),
            parseFloat(hospitalData.longitude),
            parseFloat(data.location.lat),
            parseFloat(data.location.lng)
          );
          
          // Only return if within 20km
          if (parseFloat(distance) <= 20) {
            return {
              id: doc.id,
              ...data,
              distance
            };
          }
        }
        return null;
      })
    );
    
    callback(requests.filter(r => r !== null));
  });
};

// Subscribe to ambulance's own facility requests
export const subscribeToAmbulanceFacilityRequests = (ambulanceId, callback) => {
  const q = query(
    collection(db, 'facilityRequests'),
    where('requestingAmbulanceId', '==', ambulanceId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(requests);
  });
};
