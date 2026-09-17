import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { Hospital, Ambulance, Heart, Shield, Truck, Activity } from 'lucide-react';
import { getHospitalProfile } from '../services/hospitalService';
import { setDoc, doc, getDoc } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('hospital');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isSignup) {
        // Sign up - create new user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Store user type in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          userType: userType,
          createdAt: new Date().toISOString()
        });

        // Redirect based on user type selected during signup
        if (userType === 'ambulance') {
          navigate('/ambulance-profile-setup');
        } else {
          navigate('/profile');
        }
      } else {
        // Login - authenticate user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get user type from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Check if user type matches selection
          if (userData.userType !== userType) {
            setError(`This account is registered as ${userData.userType}. Please select the correct account type.`);
            await auth.signOut();
            return;
          }
          
          // Redirect based on stored user type
          if (userData.userType === 'ambulance') {
            navigate('/ambulance-dashboard');
          } else {
            navigate('/dashboard');
          }
        } else {
          // **FALLBACK LOGIC FOR OLD USERS**
          // If user doc doesn't exist, check if it's an old hospital account
          if (userType === 'hospital') {
            const hospitalProfile = await getHospitalProfile(user.uid);
            if (hospitalProfile) {
              // This is an old hospital user, create the missing user document
              await setDoc(userDocRef, {
                email: user.email,
                userType: 'hospital',
                createdAt: new Date().toISOString() // Or use a placeholder
              });
              navigate('/dashboard'); // Redirect to hospital dashboard
              return;
            }
          }
          
          // If no fallback matches, the account is truly not found or inconsistent
          setError('Account data not found. Please contact support.');
          await auth.signOut();
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Better error messages
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format. Please check and try again.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters long.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-3">MedForecast</h1>
          <p className="text-xl text-gray-600">Connecting Healthcare Across India</p>
        </div>

        {/* User Type Selection - Large Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Hospital Card */}
          <div
            onClick={() => setUserType('hospital')}
            className={`relative cursor-pointer transform transition-all duration-300 ${
              userType === 'hospital' 
                ? 'scale-105 shadow-2xl' 
                : 'scale-100 shadow-lg hover:scale-102 hover:shadow-xl'
            }`}
          >
            <div className={`bg-white rounded-3xl p-8 border-4 transition-all ${
              userType === 'hospital' 
                ? 'border-blue-600' 
                : 'border-transparent'
            }`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  userType === 'hospital' ? 'bg-blue-600' : 'bg-blue-100'
                }`}>
                  <Hospital className={`w-8 h-8 ${
                    userType === 'hospital' ? 'text-white' : 'text-blue-600'
                  }`} />
                </div>
                {userType === 'hospital' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-blue-600">Selected</span>
                  </div>
                )}
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Hospital Portal</h3>
              <p className="text-gray-600 mb-6">
                For hospitals and healthcare facilities to manage resources, coordinate with network, and request emergency services.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-700">
                  <Shield className="w-4 h-4 mr-3 text-blue-600" />
                  <span>Manage bed availability & equipment</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Activity className="w-4 h-4 mr-3 text-blue-600" />
                  <span>Real-time resource coordination</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Truck className="w-4 h-4 mr-3 text-blue-600" />
                  <span>Request ambulance services</span>
                </div>
              </div>

              {userType === 'hospital' && (
                <div className="mt-6 pt-6 border-t border-blue-100">
                  <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full">
                    <input
                      type="radio"
                      name="userType"
                      value="hospital"
                      checked={true}
                      onChange={() => {}}
                      className="mr-2"
                    />
                    <span className="text-sm font-semibold text-blue-700">I'm signing in as Hospital</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ambulance Card */}
          <div
            onClick={() => setUserType('ambulance')}
            className={`relative cursor-pointer transform transition-all duration-300 ${
              userType === 'ambulance' 
                ? 'scale-105 shadow-2xl' 
                : 'scale-100 shadow-lg hover:scale-102 hover:shadow-xl'
            }`}
          >
            <div className={`bg-white rounded-3xl p-8 border-4 transition-all ${
              userType === 'ambulance' 
                ? 'border-red-600' 
                : 'border-transparent'
            }`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  userType === 'ambulance' ? 'bg-red-600' : 'bg-red-100'
                }`}>
                  <Ambulance className={`w-8 h-8 ${
                    userType === 'ambulance' ? 'text-white' : 'text-red-600'
                  }`} />
                </div>
                {userType === 'ambulance' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-red-600">Selected</span>
                  </div>
                )}
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Ambulance Portal</h3>
              <p className="text-gray-600 mb-6">
                For ambulance services and emergency responders to receive requests, navigate to hospitals, and provide rapid care.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-700">
                  <Shield className="w-4 h-4 mr-3 text-red-600" />
                  <span>Receive emergency requests instantly</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Activity className="w-4 h-4 mr-3 text-red-600" />
                  <span>GPS navigation to pickup locations</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Truck className="w-4 h-4 mr-3 text-red-600" />
                  <span>Coordinate with hospital network</span>
                </div>
              </div>

              {userType === 'ambulance' && (
                <div className="mt-6 pt-6 border-t border-red-100">
                  <div className="inline-flex items-center px-4 py-2 bg-red-50 rounded-full">
                    <input
                      type="radio"
                      name="userType"
                      value="ambulance"
                      checked={true}
                      onChange={() => {}}
                      className="mr-2"
                    />
                    <span className="text-sm font-semibold text-red-700">I'm signing in as Ambulance</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {isSignup ? 'Create Account' : 'Sign In'}
              </h2>
              <p className="text-gray-600 text-sm mt-2">
                {isSignup ? 'Register your account' : 'Welcome back!'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-start">
                <div className="w-5 h-5 rounded-full bg-red-200 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  <span className="text-red-700 font-bold text-xs">!</span>
                </div>
                <span>{error}</span>
              </div>
            )}

            {/* Success Indicator */}
            <div className={`mb-6 p-4 rounded-xl border-2 ${
              userType === 'hospital' 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center">
                {userType === 'hospital' ? (
                  <>
                    <Hospital className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-sm font-semibold text-blue-700">Signing in as Hospital</span>
                  </>
                ) : (
                  <>
                    <Ambulance className="w-5 h-5 text-red-600 mr-3" />
                    <span className="text-sm font-semibold text-red-700">Signing in as Ambulance</span>
                  </>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder={userType === 'hospital' ? 'hospital@example.com' : 'ambulance@example.com'}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="••••••••"
                  required
                  minLength="6"
                />
                {isSignup && (
                  <p className="text-xs text-gray-500 mt-2">Minimum 6 characters required</p>
                )}
              </div>
              
              <button 
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg ${
                  userType === 'hospital'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Please wait...
                  </div>
                ) : (
                  isSignup ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>
            
            {/* Toggle Sign Up/Login */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button 
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setError('');
                  }}
                  className={`font-bold ${
                    userType === 'hospital' ? 'text-blue-600 hover:text-blue-700' : 'text-red-600 hover:text-red-700'
                  }`}
                >
                  {isSignup ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Built for Google Tech Sprint Hackathon 2024
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Saving Lives Through Technology 💙
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}