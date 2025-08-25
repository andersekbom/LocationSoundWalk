import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number; // 0-100
  type?: 'spinner' | 'progress' | 'success' | 'error';
  showCancel?: boolean;
  onCancel?: () => void;
}

interface Props {
  loadingState: LoadingState;
  overlayStyle?: 'fullscreen' | 'modal' | 'inline';
  size?: 'small' | 'large';
}

interface State {
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

export default class LoadingOverlay extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      fadeAnim: new Animated.Value(0),
      scaleAnim: new Animated.Value(0.8),
    };
  }

  componentDidMount() {
    if (this.props.loadingState.isLoading) {
      this.animateIn();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.loadingState.isLoading !== this.props.loadingState.isLoading) {
      if (this.props.loadingState.isLoading) {
        this.animateIn();
      } else {
        this.animateOut();
      }
    }
  }

  private animateIn = () => {
    Animated.parallel([
      Animated.timing(this.state.fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(this.state.scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  private animateOut = () => {
    Animated.parallel([
      Animated.timing(this.state.fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(this.state.scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  private renderSpinner = () => (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator
        size={this.props.size === 'small' ? 'small' : 'large'}
        color="#007AFF"
      />
      {this.props.loadingState.message && (
        <Text style={styles.messageText}>{this.props.loadingState.message}</Text>
      )}
    </View>
  );

  private renderProgress = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${this.props.loadingState.progress || 0}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {Math.round(this.props.loadingState.progress || 0)}%
      </Text>
      {this.props.loadingState.message && (
        <Text style={styles.messageText}>{this.props.loadingState.message}</Text>
      )}
    </View>
  );

  private renderSuccess = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={48} color="#28a745" />
      </View>
      <Text style={styles.successText}>Success!</Text>
      {this.props.loadingState.message && (
        <Text style={styles.messageText}>{this.props.loadingState.message}</Text>
      )}
    </View>
  );

  private renderError = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorIcon}>
        <Ionicons name="close-circle" size={48} color="#dc3545" />
      </View>
      <Text style={styles.errorText}>Error</Text>
      {this.props.loadingState.message && (
        <Text style={styles.messageText}>{this.props.loadingState.message}</Text>
      )}
    </View>
  );

  private renderContent = () => {
    const { type = 'spinner' } = this.props.loadingState;

    switch (type) {
      case 'progress':
        return this.renderProgress();
      case 'success':
        return this.renderSuccess();
      case 'error':
        return this.renderError();
      default:
        return this.renderSpinner();
    }
  };

  private renderCancelButton = () => {
    if (!this.props.loadingState.showCancel || !this.props.loadingState.onCancel) {
      return null;
    }

    return (
      <View style={styles.cancelContainer}>
        <Text
          style={styles.cancelButton}
          onPress={this.props.loadingState.onCancel}
        >
          Cancel
        </Text>
      </View>
    );
  };

  render() {
    const { loadingState, overlayStyle = 'fullscreen' } = this.props;

    if (!loadingState.isLoading) {
      return null;
    }

    const containerStyle = [
      styles.container,
      overlayStyle === 'fullscreen' && styles.fullscreen,
      overlayStyle === 'modal' && styles.modal,
      overlayStyle === 'inline' && styles.inline,
    ];

    const contentStyle = [
      styles.content,
      overlayStyle === 'small' && styles.contentSmall,
    ];

    return (
      <Animated.View
        style={[
          containerStyle,
          {
            opacity: this.state.fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            contentStyle,
            {
              transform: [{ scale: this.state.scaleAnim }],
            },
          ]}
        >
          {this.renderContent()}
          {this.renderCancelButton()}
        </Animated.View>
      </Animated.View>
    );
  }
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  fullscreen: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },

  modal: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  inline: {
    backgroundColor: 'transparent',
    position: 'relative',
  },

  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
    maxWidth: 300,
  },

  contentSmall: {
    padding: 20,
    minWidth: 150,
    maxWidth: 200,
  },

  // Spinner styles
  spinnerContainer: {
    alignItems: 'center',
  },

  // Progress styles
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },

  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },

  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },

  // Success styles
  successContainer: {
    alignItems: 'center',
  },

  successIcon: {
    marginBottom: 16,
  },

  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 12,
  },

  // Error styles
  errorContainer: {
    alignItems: 'center',
  },

  errorIcon: {
    marginBottom: 16,
  },

  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 12,
  },

  // Common styles
  messageText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },

  // Cancel button styles
  cancelContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    width: '100%',
    alignItems: 'center',
  },

  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
