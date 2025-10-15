import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';

import { Feather } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onHide: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onHide }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0
  const slideAnim = useRef(new Animated.Value(-100)).current; // Initial value for position: -100 (off-screen top)

  useEffect(() => {
    // Sequence animation: slide down, fade in, wait, fade out, slide up
    Animated.sequence([
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(2000), // Display for 2 seconds
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onHide()); // Call onHide when animation is complete
  }, [fadeAnim, slideAnim, onHide]);

  const backgroundColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';
  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info';

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { transform: [{ translateY: slideAnim }], opacity: fadeAnim, backgroundColor },
      ]}>
      <Feather name={iconName as any} size={20} color="white" style={styles.toastIcon} />
      <ThemedText style={styles.toastMessage}>{message}</ThemedText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000, // Ensure it's on top of other content
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastIcon: {
    marginRight: 10,
  },
  toastMessage: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Toast;
