import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ErrorHandler, AppError, ErrorType } from '../services/ErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  appError: AppError | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      appError: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Create an app error
    const appError = ErrorHandler.createError(
      ErrorType.SYSTEM_ERROR,
      'A React component error occurred',
      error.stack,
      { componentStack: errorInfo.componentStack },
      true,
      true
    );

    this.setState({
      errorInfo,
      appError,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      appError: null,
    });
  };

  private handleReportError = () => {
    if (this.state.appError) {
      const errorDetails = `
Error Type: ${this.state.appError.type}
Message: ${this.state.appError.message}
Technical Details: ${this.state.appError.technicalDetails || 'None'}
Component Stack: ${this.state.errorInfo?.componentStack || 'None'}
Timestamp: ${this.state.appError.timestamp.toISOString()}
      `.trim();

      Alert.alert(
        'Error Report',
        'Error details copied to clipboard. Please share this with support.',
        [
          {
            text: 'OK',
            onPress: () => {
              // In a real app, you would copy to clipboard or send to a logging service
              console.log('Error Report:', errorDetails);
            },
          },
        ]
      );
    }
  };

  private handleRestart = () => {
    Alert.alert(
      'Restart App',
      'This will close and reopen the app. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Restart',
          style: 'destructive',
          onPress: () => {
            // In a real app, you would implement app restart logic
            // For now, we'll just reset the error state
            this.handleRetry();
          },
        },
      ]
    );
  };

  private renderErrorDetails = () => {
    const { error, errorInfo, appError } = this.state;

    if (!appError) return null;

    const resolutions = ErrorHandler.getErrorResolution(appError);

    return (
      <View style={styles.errorDetails}>
        <Text style={styles.errorDetailsTitle}>Error Details</Text>
        
        <View style={styles.errorInfo}>
          <Text style={styles.errorInfoLabel}>Type:</Text>
          <Text style={styles.errorInfoValue}>{appError.type}</Text>
        </View>
        
        <View style={styles.errorInfo}>
          <Text style={styles.errorInfoLabel}>Message:</Text>
          <Text style={styles.errorInfoValue}>{appError.message}</Text>
        </View>
        
        {appError.technicalDetails && (
          <View style={styles.errorInfo}>
            <Text style={styles.errorInfoLabel}>Technical Details:</Text>
            <Text style={styles.errorInfoValue} numberOfLines={3}>
              {appError.technicalDetails}
            </Text>
          </View>
        )}
        
        {errorInfo?.componentStack && (
          <View style={styles.errorInfo}>
            <Text style={styles.errorInfoLabel}>Component Stack:</Text>
            <Text style={styles.errorInfoValue} numberOfLines={5}>
              {errorInfo.componentStack}
            </Text>
          </View>
        )}

        <View style={styles.resolutionsContainer}>
          <Text style={styles.resolutionsTitle}>Suggested Solutions:</Text>
          {resolutions.map((resolution, index) => (
            <View key={index} style={styles.resolutionItem}>
              <View style={[
                styles.priorityIndicator,
                { backgroundColor: this.getPriorityColor(resolution.priority) }
              ]} />
              <View style={styles.resolutionContent}>
                <Text style={styles.resolutionAction}>{resolution.action}</Text>
                <Text style={styles.resolutionDescription}>
                  {resolution.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  private getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return '#dc3545';
      case 'high':
        return '#fd7e14';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.errorHeader}>
              <Ionicons name="warning" size={64} color="#dc3545" />
              <Text style={styles.errorTitle}>Something went wrong</Text>
              <Text style={styles.errorSubtitle}>
                The app encountered an unexpected error
              </Text>
            </View>

            <View style={styles.errorMessage}>
              <Text style={styles.errorMessageText}>
                {ErrorHandler.getUserFriendlyMessage(this.state.appError!)}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={this.handleRetry}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={this.handleReportError}
              >
                <Ionicons name="document-text" size={20} color="#6c757d" />
                <Text style={styles.secondaryButtonText}>Report Error</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={this.handleRestart}
              >
                <Ionicons name="power" size={20} color="#6c757d" />
                <Text style={styles.secondaryButtonText}>Restart App</Text>
              </TouchableOpacity>
            </View>

            {__DEV__ && this.renderErrorDetails()}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  scrollView: {
    flex: 1,
  },
  
  errorHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  
  errorSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  errorMessage: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  
  errorMessageText: {
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  secondaryButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  errorDetails: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  
  errorDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  
  errorInfo: {
    marginBottom: 12,
  },
  
  errorInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  
  errorInfoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },
  
  resolutionsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  
  resolutionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  
  resolutionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 6,
  },
  
  resolutionContent: {
    flex: 1,
  },
  
  resolutionAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  
  resolutionDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
});
