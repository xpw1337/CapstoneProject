// App.js

import React, { useState, useEffect } from 'react';
import { ScrollView, Alert } from 'react-native';
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from './config'; // Import your Firebase app
import AuthScreen from './components/AuthScreen';
import ImageAuthScreen from './components/ImageAuthScreen';
import AuthenticatedScreen from './components/AuthenticatedScreen';
import styles from './styles/styles';

const App = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [images, setImages] = useState([]); // For storing images during sign-up
  const [assignedNumbers, setAssignedNumbers] = useState({}); // For assigned numbers
  const [user, setUser] = useState(null); // Track user authentication state
  const [isLogin, setIsLogin] = useState(true);
  const [isImageAuthComplete, setIsImageAuthComplete] = useState(false); // New state for image authentication

  // New state variables for lockout
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState(null);

  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      // Do not reset isImageAuthComplete here
    });

    return () => unsubscribe();
  }, [auth]);

  const handleAuthentication = async () => {
    try {
      if (user) {
        // If user is already authenticated, log out
        console.log('User logged out successfully!');
        await signOut(auth);
        setIsImageAuthComplete(false); // Reset image authentication
      } else {
        // Sign in
        await signInWithEmailAndPassword(auth, email, password);
        console.log('User signed in successfully!');
        setIsImageAuthComplete(false); // Reset image authentication
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      console.error('Authentication error:', error.message);
      Alert.alert('Authentication error:', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {user ? (
        isImageAuthComplete ? (
          // Show authenticated screen
          <AuthenticatedScreen
            user={user}
            handleAuthentication={handleAuthentication}
          />
        ) : (
          // Show image authentication screen
          <ImageAuthScreen
            user={user}
            setIsImageAuthComplete={setIsImageAuthComplete}
            handleAuthentication={handleAuthentication}
            isLockedOut={isLockedOut}
            setIsLockedOut={setIsLockedOut}
            lockoutEndTime={lockoutEndTime}
            setLockoutEndTime={setLockoutEndTime}
          />
        )
      ) : (
        // Show sign-in or sign-up form
        <AuthScreen
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          isLogin={isLogin}
          setIsLogin={setIsLogin}
          handleAuthentication={handleAuthentication}
          images={images}
          setImages={setImages}
          assignedNumbers={assignedNumbers}
          setAssignedNumbers={setAssignedNumbers}
          isLockedOut={isLockedOut}
          setIsLockedOut={setIsLockedOut}
          lockoutEndTime={lockoutEndTime}
          setLockoutEndTime={setLockoutEndTime}
          setIsImageAuthComplete={setIsImageAuthComplete} // Pass the setter
        />
      )}
    </ScrollView>
  );
};

export default App;
