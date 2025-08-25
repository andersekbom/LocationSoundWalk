import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Toast, { ToastMessage, ToastManager } from './Toast';

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = ToastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const handleDismiss = (id: string) => {
    ToastManager.dismiss(id);
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          message={toast}
          onDismiss={handleDismiss}
          position={index === 0 ? 'top' : 'bottom'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
});
