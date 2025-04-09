// styles/styles.js

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  // Common container style with light background color and padding
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#eaf2f8', // Light background color for a softer look
  },
  
  // Main authentication container style with shadow and rounded corners
  authContainer: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 50,
    marginBottom: 50,
  },
  
  // Title style with a bolder color and larger font size
  title: {
    fontSize: 30,
    marginBottom: 16,
    textAlign: 'center',
    color: '#2c3e50', // Darker color for emphasis
    fontWeight: 'bold',
  },
  
  // Input field style with subtle border and padding
  input: {
    height: 50,
    borderColor: '#bdc3c7',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f9f9f9', // Light background for inputs
  },
  
  // Button container for alignment
  buttonContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  
  // Main authentication button style with dynamic color and rounded corners
  authButton: {
    borderRadius: 8,
    width: '100%',
    height: 50,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  // Button text style for a clean, readable look
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Toggle text style for switching between Sign In and Sign Up with color
  toggleText: {
    color: '#3498db',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 10,
  },
  
  // Bottom container style for additional spacing
  bottomContainer: {
    marginTop: 20,
  },
  
  // Email text style for prompts
  emailText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#34495e',
  },
  
  // Select images button style with prominent color
  selectButton: {
    borderRadius: 8,
    width: '100%',
    height: 50,
    backgroundColor: '#1abc9c',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  
  // Grid container for images with space and wrapping
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
  },
  
  // Wrapper for individual image in the grid
  imageWrapper: {
    position: 'relative',
    margin: 10,
    alignItems: 'center',
  },
  
  // Image grid style with round corners
  imageGrid: {
    width: 150,
    height: 150,
    borderRadius: 12,
  },
  
  // Style for selected images in the grid
  selectedImageGrid: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  
  // Overlay for image number
  imageNumber: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#ffffff',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    fontSize: 12,
  },
  
  // Modal container style with semi-transparent background
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  
  // Modal content style with padding and rounded corners
  modalContent: {
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    elevation: 5,
  },
  
  // Modal title with bold text
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#34495e',
  },
  
  // Number buttons container for PIN entry
  numberButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  
  // Number button style with vibrant color
  numberButton: {
    padding: 12,
    margin: 5,
    backgroundColor: '#3498db',
    borderRadius: 5,
    width: 50,
    alignItems: 'center',
  },
  
  // Disabled number button style
  numberButtonDisabled: {
    backgroundColor: '#7f8c8d',
  },
  
  // Number button text style
  numberButtonText: {
    color: '#ffffff',
    fontSize: 18,
  },
  
  // Highlight style for selected images
  selectedImage: {
    borderWidth: 2,
    borderColor: 'green',
  },
  
  // Selected image container for flex alignment
  selectedImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  
  // Move buttons container for spacing
  moveButtonsContainer: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  
  // Move button text with color
  moveButtonText: {
    marginHorizontal: 10,
    color: '#3498db',
    fontSize: 16,
  },
  
  // Lockout text style with attention-grabbing color
  lockoutText: {
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
  },
  
  // Password hint style with smaller font
  passwordHint: {
    color: '#7f8c8d',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 10,
  },
  
  // Image hint style for guidance text
  imageHint: {
    color: '#7f8c8d',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});

export default styles;
