import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface Props {
  message: ToastMessage;
  onDismiss: (id: string) => void;
  position?: 'top' | 'bottom';
}

const { width: screenWidth } = Dimensions.get('window');

export default function Toast({ message, onDismiss, position = 'top' }: Props) {
  const [isVisible, setIsVisible] = useState(true);
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      dismissToast();
    }, message.duration || 4000);

    return () => clearTimeout(timer);
  }, []);

  const dismissToast = () => {
    setIsVisible(false);
    
    // Slide out animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -screenWidth,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(message.id);
    });
  };

  const getToastStyle = () => {
    switch (message.type) {
      case 'success':
        return styles.successToast;
      case 'error':
        return styles.errorToast;
      case 'warning':
        return styles.warningToast;
      case 'info':
        return styles.infoToast;
      default:
        return styles.infoToast;
    }
  };

  const getIconName = () => {
    switch (message.type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (message.type) {
      case 'success':
        return '#28a745';
      case 'error':
        return '#dc3545';
      case 'warning':
        return '#ffc107';
      case 'info':
        return '#007AFF';
      default:
        return '#007AFF';
    }
  };

  const getBackgroundColor = () => {
    switch (message.type) {
      case 'success':
        return '#d4edda';
      case 'error':
        return '#f8d7da';
      case 'warning':
        return '#fff3cd';
      case 'info':
        return '#d1ecf1';
      default:
        return '#d1ecf1';
    }
  };

  const getBorderColor = () => {
    switch (message.type) {
      case 'success':
        return '#c3e6cb';
      case 'error':
        return '#f5c6cb';
      case 'warning':
        return '#ffeaa7';
      case 'info':
        return '#bee5eb';
      default:
        return '#bee5eb';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        {
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          getToastStyle(),
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={getIconName() as any} size={24} color={getIconColor()} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{message.title}</Text>
          {message.message && (
            <Text style={styles.message}>{message.message}</Text>
          )}
        </View>

        <View style={styles.actions}>
          {message.action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={message.action.onPress}
            >
              <Text style={[styles.actionText, { color: getIconColor() }]}>
                {message.action.label}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={dismissToast}
          >
            <Ionicons name="close" size={20} color="#6c757d" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },

  topPosition: {
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
  },

  bottomPosition: {
    bottom: 20,
  },

  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  successToast: {
    // Styles handled dynamically
  },

  errorToast: {
    // Styles handled dynamically
  },

  warningToast: {
    // Styles handled dynamically
  },

  infoToast: {
    // Styles handled dynamically
  },

  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },

  content: {
    flex: 1,
    marginRight: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },

  message: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },

  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },

  dismissButton: {
    padding: 4,
  },
});

// Toast Manager for managing multiple toasts
export class ToastManager {
  private static toasts: ToastMessage[] = [];
  private static listeners: Set<(toasts: ToastMessage[]) => void> = new Set();
  private static nextId = 1;

  static show(
    type: ToastType,
    title: string,
    message?: string,
    duration?: number,
    action?: { label: string; onPress: () => void }
  ): string {
    const toast: ToastMessage = {
      id: `toast_${this.nextId++}`,
      type,
      title,
      message,
      duration,
      action,
    };

    this.toasts.push(toast);
    this.notifyListeners();

    return toast.id;
  }

  static success(title: string, message?: string, duration?: number): string {
    return this.show('success', title, message, duration);
  }

  static error(title: string, message?: string, duration?: number): string {
    return this.show('error', title, message, duration);
  }

  static warning(title: string, message?: string, duration?: number): string {
    return this.show('warning', title, message, duration);
  }

  static info(title: string, message?: string, duration?: number): string {
    return this.show('info', title, message, duration);
  }

  static dismiss(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }

  static dismissAll(): void {
    this.toasts = [];
    this.notifyListeners();
  }

  static getToasts(): ToastMessage[] {
    return [...this.toasts];
  }

  static subscribe(listener: (toasts: ToastMessage[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.toasts);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.toasts));
  }
}
