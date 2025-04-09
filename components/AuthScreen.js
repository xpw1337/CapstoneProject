// components/AuthScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView, Alert, Image, ScrollView,
} from 'react-native';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ref, uploadBytes } from 'firebase/storage';
import { app, storage } from '../config'; // Import your Firebase app and storage
import styles from '../styles/styles';

const AuthScreen = ({
  email, setEmail, password, setPassword,
  isLogin, setIsLogin, handleAuthentication,
  images, setImages,
  isLockedOut, setIsLockedOut,
  lockoutEndTime, setLockoutEndTime,
  setIsImageAuthComplete, // Receive the setter
}) => {
  const [uploading, setUploading] = useState(false);

  // New state variables for tracking failed attempts and authentication time
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [authStartTime, setAuthStartTime] = useState(null); // To track authentication start time

  useEffect(() => {
    // Check if lockout time has passed
    if (isLockedOut && lockoutEndTime) {
      const interval = setInterval(() => {
        if (new Date() >= lockoutEndTime) {
          setIsLockedOut(false);
          setFailedAttempts(0);
          setLockoutEndTime(null);
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLockedOut, lockoutEndTime]);

  // Function to validate email format
  const isValidEmail = (email) => {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
  };

  // Function to validate password
  const isValidPassword = (password) => {
    // Minimum 8 characters, at least one number, and one special character
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return passwordRegex.test(password);
  };

  // Function to record authentication initiation
  const recordAuthenticationInitiated = async () => {
    try {
      const metric = {
        email: email,
        timestamp: new Date().toISOString(),
        event: 'Password Authentication Initiated',
      };
      const metricString = JSON.stringify(metric);
      const metricBlob = new Blob([metricString], { type: 'application/json' });

      const metricsRef = ref(storage, `metrics/${email}/password_auth_initiated_${Date.now()}.json`);
      await uploadBytes(metricsRef, metricBlob);
    } catch (error) {
      console.error('Error recording authentication initiation:', error);
    }
  };

  // Function to record authentication result
  const recordAuthenticationResult = async ({ success, timeTaken, failureReason }) => {
    try {
      const metric = {
        email: email,
        timestamp: new Date().toISOString(),
        event: 'Password Authentication',
        success,
        timeTaken,
        ...(failureReason && { failureReason }),
      };
      const metricString = JSON.stringify(metric);
      const metricBlob = new Blob([metricString], { type: 'application/json' });

      const metricsRef = ref(storage, `metrics/${email}/password_auth_result_${Date.now()}.json`);
      await uploadBytes(metricsRef, metricBlob);
    } catch (error) {
      console.error('Error recording authentication result:', error);
    }
  };

  // Function to handle sign-in process
  const handleSignIn = async () => {
    if (isLockedOut) {
      Alert.alert('Account Locked', 'Too many failed attempts. Please try again later.');
      return;
    }

    // Record authentication initiation
    setAuthStartTime(new Date());
    await recordAuthenticationInitiated();

    try {
      await signInWithEmailAndPassword(getAuth(app), email, password);
      console.log('User signed in successfully!');
      setEmail('');
      setPassword('');

      const authEndTime = new Date();
      const timeTaken = (authEndTime - authStartTime) / 1000; // in seconds

      // Record successful authentication
      await recordAuthenticationResult({
        success: true,
        timeTaken,
      });
    } catch (error) {
      console.error('Authentication error:', error.message);
      Alert.alert('Authentication error:', 'Incorrect email or password.');
      setFailedAttempts(failedAttempts + 1);

      const authEndTime = new Date();
      const timeTaken = (authEndTime - authStartTime) / 1000; // in seconds

      // Record authentication failure due to incorrect password
      await recordAuthenticationResult({
        success: false,
        timeTaken,
        failureReason: 'Incorrect Email or Password',
      });

      if (failedAttempts + 1 >= 3) { // Lockout after 3 failed attempts
        setIsLockedOut(true);
        const lockoutTime = new Date();
        lockoutTime.setSeconds(lockoutTime.getSeconds() + 30);
        setLockoutEndTime(lockoutTime);
      }
    }
  };

  // Function to pick images
  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true, // Allow multiple image selection
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      if (result.assets.length === 9) {
        setImages(result.assets.map((asset) => ({ uri: asset.uri }))); // Store images as objects
      } else {
        Alert.alert('Please select exactly 9 images.');
      }
    }
  };

  // Function to move image up or down
  const moveImage = (index, direction) => {
    const newImages = [...images];
    if (direction === 'up' && index > 0) {
      [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
      setImages(newImages);
    } else if (direction === 'down' && index < newImages.length - 1) {
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      setImages(newImages);
    }
  };

  // Function to handle sign-up process
  const handleSignUp = async () => {
    // Validate input
    if (!isValidEmail(email)) {
      Alert.alert('Please enter a valid email.');
      return;
    }
    if (!isValidPassword(password)) {
      Alert.alert('Please enter a valid password that meets the requirements.');
      return;
    }
    if (images.length !== 9) {
      Alert.alert('Please select exactly 9 images.');
      return;
    }

    setUploading(true);

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(getAuth(app), email, password);
      console.log('User created successfully!');

      const userId = userCredential.user.uid; // Get user ID

      // Upload images
      const uploadPromises = images.map(async (imageObj, index) => {
        const { uri } = await FileSystem.getInfoAsync(imageObj.uri);
        const blob = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = () => {
            resolve(xhr.response);
          };
          xhr.onerror = (e) => {
            reject(new TypeError('Network request failed'));
          };
          xhr.responseType = 'blob';
          xhr.open('GET', uri, true);
          xhr.send(null);
        });

        const assignedNumber = index + 1; // indices start at 0, so add 1
        const filename = `image_${assignedNumber}${imageObj.uri.substr(imageObj.uri.lastIndexOf('.'))}`; // Use assigned number and original extension

        // Create a reference in Firebase Storage under the user's folder
        const storageRef = ref(storage, `${userId}/${filename}`);

        // Upload the file
        await uploadBytes(storageRef, blob);
      });

      await Promise.all(uploadPromises);
      console.log('All images have been uploaded');

      Alert.alert('Account created and images uploaded successfully!');

      // Set isImageAuthComplete to true to bypass image authentication
      setIsImageAuthComplete(true);

      // Optionally, reset images
      setImages([]); // Clear the image array
    } catch (error) {
      console.error('Sign-up or upload error:', error);
      Alert.alert('Error:', error.message);
    } finally {
      setUploading(false);
    }
  };

  // Determine if Sign Up button should be enabled
  const canSignUp =
    !uploading &&
    isValidEmail(email) &&
    isValidPassword(password) &&
    images.length === 9;

  return (
    <View style={styles.authContainer}>
      <Text style={styles.title}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isLockedOut}
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        editable={!isLockedOut}
      />
      {/* Password Requirements Hint */}
      {!isLogin && (
        <Text style={styles.passwordHint}>
          Password must be at least 8 characters long and include at least one number and one special character.
        </Text>
      )}

      {isLockedOut && (
        <Text style={styles.lockoutText}>
          Account locked. Please try again later.
        </Text>
      )}

      {/* Show image selection and sign-up only when signing up */}
      {!isLogin && (
        <>
          <SafeAreaView>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={pickImages}
            >
              <Text style={styles.buttonText}>Select 9 Images</Text>
            </TouchableOpacity>
            {/* Image Selection Hint */}
            <Text style={styles.imageHint}>
              Please upload 9 images from your gallery and arrange them in order of priority, with the most important image at the top and the least important at the bottom. You will need to select and arrange 4 images in the priority order when logging in.
            </Text>
            <ScrollView>
              {images.map((imageObj, index) => (
                <View key={index} style={styles.selectedImageContainer}>
                  <Image source={{ uri: imageObj.uri }} style={styles.selectedImageGrid} />
                  <View style={styles.moveButtonsContainer}>
                    <TouchableOpacity onPress={() => moveImage(index, 'up')}>
                      <Text style={styles.moveButtonText}>Up</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveImage(index, 'down')}>
                      <Text style={styles.moveButtonText}>Down</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.authButton,
            { backgroundColor: isLogin || canSignUp ? '#3498db' : 'gray' },
          ]}
          onPress={isLogin ? handleSignIn : handleSignUp}
          disabled={isLogin ? isLockedOut : !canSignUp}
        >
          <Text style={styles.buttonText}>
            {uploading
              ? 'Processing...'
              : isLogin
                ? 'Sign In'
                : 'Sign Up'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomContainer}>
        <Text
          style={styles.toggleText}
          onPress={() => {
            setIsLogin(!isLogin);
            setImages([]); // Clear images when toggling between sign in and sign up
          }}
        >
          {isLogin
            ? 'Need an account? Sign Up'
            : 'Already have an account? Sign In'}
        </Text>
      </View>
    </View>
  );
};
export default AuthScreen;