// components/AuthenticatedScreen.js

import React from 'react';
import { View, Text, Button } from 'react-native';
import styles from '../styles/styles';

const AuthenticatedScreen = ({ user, handleAuthentication }) => {
  return (
    <View style={styles.authContainer}>
      <Text style={styles.title}>Thank you for trying our User Authentication System!</Text>
      <Text style={styles.emailText}>{user.email}</Text>
      <Button title="Logout" onPress={handleAuthentication} color="#e74c3c" />
    </View>
  );
};

export default AuthenticatedScreen;
