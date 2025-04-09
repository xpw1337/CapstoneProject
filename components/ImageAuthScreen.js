// components/ImageAuthScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView, Alert, SafeAreaView,
} from 'react-native';
import { ref, listAll, getDownloadURL, uploadBytes } from 'firebase/storage';
import { storage } from '../config';
import styles from '../styles/styles';

const ImageAuthScreen = ({
  user,
  setIsImageAuthComplete,
  handleAuthentication,
  isLockedOut,
  setIsLockedOut,
  lockoutEndTime,
  setLockoutEndTime,
}) => {
  const [imagesToSelect, setImagesToSelect] = useState([]);
  const [userImages, setUserImages] = useState([]); // All user images with filename and assignedNumber
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // New state variables for tracking failed attempts and authentication time
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [authStartTime, setAuthStartTime] = useState(null); // To track authentication start time

  useEffect(() => {
    if (isLockedOut && lockoutEndTime) {
      const interval = setInterval(() => {
        if (new Date() >= lockoutEndTime) {
          setIsLockedOut(false);
          setFailedAttempts(0);
          setLockoutEndTime(null);
          clearInterval(interval);
          fetchImages(); // Refetch images after lockout
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLockedOut, lockoutEndTime]);

  useEffect(() => {
    // Fetch images on mount
    if (!isLockedOut) {
      fetchImages();
      setAuthStartTime(new Date()); // Record the start time
      // Record authentication initiation
      recordAuthenticationInitiated();
    }
  }, [isLockedOut]);

  // Function to record authentication initiation
  const recordAuthenticationInitiated = async () => {
    try {
      const metric = {
        userId: user.uid,
        email: user.email,
        timestamp: new Date().toISOString(),
        event: 'Image Authentication Initiated',
      };
      const metricString = JSON.stringify(metric);
      const metricBlob = new Blob([metricString], { type: 'application/json' });

      const metricsRef = ref(storage, `metrics/${user.email}/image_auth_initiated_${Date.now()}.json`);
      await uploadBytes(metricsRef, metricBlob);
    } catch (error) {
      console.error('Error recording authentication initiation:', error);
    }
  };

  // Function to record authentication result
  const recordAuthenticationResult = async ({ success, timeTaken, failureReason }) => {
    try {
      const metric = {
        userId: user.uid,
        email: user.email,
        timestamp: new Date().toISOString(),
        event: 'Image Authentication',
        success,
        timeTaken,
        ...(failureReason && { failureReason }),
      };
      const metricString = JSON.stringify(metric);
      const metricBlob = new Blob([metricString], { type: 'application/json' });

      const metricsRef = ref(storage, `metrics/${user.email}/image_auth_result_${Date.now()}.json`);
      await uploadBytes(metricsRef, metricBlob);
    } catch (error) {
      console.error('Error recording authentication result:', error);
    }
  };

  // Function to fetch images
  const fetchImages = async () => {
    try {
      setLoading(true);
      // Fetch all user's images
      const userId = user.uid;

      // Reference to user's folder in storage
      const userFolderRef = ref(storage, `${userId}/`);

      // List all items (images) in the user's folder
      const userImageRefs = await listAll(userFolderRef);

      // Get download URLs, assigned numbers, and filenames
      const userImagePromises = userImageRefs.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const filename = itemRef.name;
        // Extract assigned number from filename, matching any extension
        const match = filename.match(/image_(\d+)(?:\.\w+)?$/);
        const assignedNumber = match ? parseInt(match[1], 10) : null;
        console.log(`Filename: ${filename}, Assigned Number: ${assignedNumber}`);
        return { url, assignedNumber, filename };
      });

      const allUserImages = await Promise.all(userImagePromises);

      setUserImages(allUserImages); // Store all user images

      // Randomly select 4 images from user's images for display
      const userImagesSelected = [...allUserImages]
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);

      // Fetch stock images
      const stockFolderRef = ref(storage, 'stock_images/');

      // List all items in the stock images folder
      const stockImageRefs = await listAll(stockFolderRef);

      // Get download URLs and filenames for stock images
      const stockImagePromises = stockImageRefs.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const filename = itemRef.name;
        return { url, assignedNumber: null, filename };
      });

      let stockImages = await Promise.all(stockImagePromises);

      // Randomly select 8 images
      stockImages = stockImages.sort(() => 0.5 - Math.random()).slice(0, 8);

      // Combine user's images and stock images
      const combinedImages = [...userImagesSelected, ...stockImages];

      // Shuffle the combined images
      const shuffledImages = combinedImages.sort(() => 0.5 - Math.random());

      setImagesToSelect(shuffledImages);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching images:', error);
      Alert.alert('Error fetching images:', error.message);
      setLoading(false);
    }
  };

  // Function to handle image selection
  const handleImageSelect = (image) => {
    // Check if image is already selected
    const alreadySelected = selectedImages.find((img) => img.url === image.url);

    if (alreadySelected) {
      // Remove from selected images
      setSelectedImages(selectedImages.filter((img) => img.url !== image.url));
    } else {
      if (selectedImages.length < 4) {
        // Add to selected images
        setSelectedImages([...selectedImages, image]);
      } else {
        Alert.alert('You can only select 4 images.');
      }
    }
  };

  // Function to move selected image up or down
  const moveImage = (index, direction) => {
    const newSelectedImages = [...selectedImages];
    if (direction === 'up' && index > 0) {
      [newSelectedImages[index], newSelectedImages[index - 1]] = [newSelectedImages[index - 1], newSelectedImages[index]];
      setSelectedImages(newSelectedImages);
    } else if (direction === 'down' && index < newSelectedImages.length - 1) {
      [newSelectedImages[index], newSelectedImages[index + 1]] = [newSelectedImages[index + 1], newSelectedImages[index]];
      setSelectedImages(newSelectedImages);
    }
  };

  // Function to verify the selected images
  const verifySelection = async () => {
    if (isLockedOut) {
      Alert.alert('Account Locked', 'Too many failed attempts. Please try again later.');
      return;
    }

    if (selectedImages.length !== 4) {
      Alert.alert('Please select exactly 4 images.');
      return;
    }

    const authEndTime = new Date();
    const timeTaken = (authEndTime - authStartTime) / 1000; // in seconds

    // Check if selected images are the user's images by comparing filenames
    const userImageFilenames = userImages.map((img) => img.filename);

    const allAreUserImages = selectedImages.every((img) =>
      userImageFilenames.includes(img.filename)
    );

    if (!allAreUserImages) {
      // Record authentication failure due to incorrect images
      await recordAuthenticationResult({
        success: false,
        timeTaken,
        failureReason: 'Incorrect Images Selected',
      });

      Alert.alert('One or more selected images are incorrect.');
      // Reshuffle images
      await fetchImages();
      setSelectedImages([]);
      setFailedAttempts(failedAttempts + 1);

      if (failedAttempts + 1 >= 3) {
        setIsLockedOut(true);
        const lockoutTime = new Date();
        lockoutTime.setSeconds(lockoutTime.getSeconds() + 30);
        setLockoutEndTime(lockoutTime);
        // Log the user out
        await handleAuthentication();
      }

      return;
    }

    // Now check if the order matches the ascending order of assigned numbers
    const selectedImageNumbers = selectedImages.map((img) => {
      const userImage = userImages.find((uimg) => uimg.filename === img.filename);
      console.log(
        `Selected Image Filename: ${img.filename}, Assigned Number: ${
          userImage ? userImage.assignedNumber : 'not found'
        }`
      );
      return userImage ? userImage.assignedNumber : null;
    });

    // Ensure all assigned numbers are valid
    if (selectedImageNumbers.includes(null) || selectedImageNumbers.includes(undefined)) {
      Alert.alert('Error retrieving image priorities.');
      return;
    }

    console.log('Selected Image Numbers:', selectedImageNumbers);

    // Check if the numbers are in strict ascending order
    const isAscending = selectedImageNumbers.every((num, i, arr) => {
      return i === 0 || num > arr[i - 1];
    });

    if (!isAscending) {
      // Record authentication failure due to incorrect order
      await recordAuthenticationResult({
        success: false,
        timeTaken,
        failureReason: 'Incorrect Order of Images',
      });

      Alert.alert('The images are not in the correct order.');
      // Reshuffle images
      await fetchImages();
      setSelectedImages([]);
      setFailedAttempts(failedAttempts + 1);

      if (failedAttempts + 1 >= 3) {
        setIsLockedOut(true);
        const lockoutTime = new Date();
        lockoutTime.setSeconds(lockoutTime.getSeconds() + 30);
        setLockoutEndTime(lockoutTime);
        // Log the user out
        await handleAuthentication();
      }

      return;
    }

    // If all checks pass
    Alert.alert('Authentication successful!');
    setIsImageAuthComplete(true);

    // Record successful authentication
    await recordAuthenticationResult({
      success: true,
      timeTaken,
    });
  };

  return (
    <View style={styles.authContainer}>
      <Text style={styles.title}>Image Authentication</Text>
      {loading ? (
        <Text>Please be patient while the images are loaded...</Text>
      ) : isLockedOut ? (
        <Text style={styles.lockoutText}>
          Too many failed attempts. Please try again later.
        </Text>
      ) : (
        <>
          <Text style={{ marginBottom: 10 }}>
            Please select your 4 images and arrange them in priority.
          </Text>
          <SafeAreaView>
            <ScrollView contentContainerStyle={styles.gridContainer}>
              {imagesToSelect.map((image, index) => {
                const isSelected = selectedImages.find((img) => img.url === image.url);
                return (
                  <TouchableOpacity key={index} onPress={() => handleImageSelect(image)}>
                    <Image
                      source={{ uri: image.url }}
                      style={[styles.imageGrid, isSelected && styles.selectedImage]}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>

          <Text style={{ marginTop: 20, marginBottom: 10 }}>Selected Images:</Text>
          <ScrollView>
            {selectedImages.map((image, index) => (
              <View key={index} style={styles.selectedImageContainer}>
                <Image source={{ uri: image.url }} style={styles.selectedImageGrid} />
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
          <TouchableOpacity style={styles.authButton} onPress={verifySelection}>
            <Text style={styles.buttonText}>Verify</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAuthentication}>
            <Text style={styles.toggleText}>Logout</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default ImageAuthScreen;
