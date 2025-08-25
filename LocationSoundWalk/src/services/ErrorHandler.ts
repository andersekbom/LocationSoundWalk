export enum ErrorType {
  // Story-related errors
  STORY_LOAD_FAILED = 'STORY_LOAD_FAILED',
  STORY_NOT_FOUND = 'STORY_NOT_FOUND',
  STORY_INVALID_DATA = 'STORY_INVALID_DATA',
  
  // Audio-related errors
  AUDIO_INIT_FAILED = 'AUDIO_INIT_FAILED',
  AUDIO_LOAD_FAILED = 'AUDIO_LOAD_FAILED',
  AUDIO_PLAYBACK_FAILED = 'AUDIO_PLAYBACK_FAILED',
  AUDIO_FILE_NOT_FOUND = 'AUDIO_FILE_NOT_FOUND',
  
  // Location-related errors
  LOCATION_PERMISSION_DENIED = 'LOCATION_PERMISSION_DENIED',
  LOCATION_SERVICES_DISABLED = 'LOCATION_SERVICES_DISABLED',
  LOCATION_UNAVAILABLE = 'LOCATION_UNAVAILABLE',
  LOCATION_TIMEOUT = 'LOCATION_TIMEOUT',
  LOCATION_ACCURACY_POOR = 'LOCATION_ACCURACY_POOR',
  
  // Network-related errors
  NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  
  // System errors
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  MEMORY_LOW = 'MEMORY_LOW',
  STORAGE_FULL = 'STORAGE_FULL',
  
  // User action errors
  USER_CANCELLED = 'USER_CANCELLED',
  INVALID_INPUT = 'INVALID_INPUT',
}

export interface AppError {
  type: ErrorType;
  message: string;
  technicalDetails?: string;
  timestamp: Date;
  context?: Record<string, any>;
  recoverable: boolean;
  userActionRequired: boolean;
}

export interface ErrorResolution {
  action: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorHandler {
  private static errorLog: AppError[] = [];
  private static maxLogSize = 100;
  private static onErrorCallback?: (error: AppError) => void;

  /**
   * Create and log an application error
   */
  static createError(
    type: ErrorType,
    message: string,
    technicalDetails?: string,
    context?: Record<string, any>,
    recoverable: boolean = true,
    userActionRequired: boolean = false
  ): AppError {
    const error: AppError = {
      type,
      message,
      technicalDetails,
      timestamp: new Date(),
      context,
      recoverable,
      userActionRequired,
    };

    this.logError(error);
    this.notifyError(error);

    return error;
  }

  /**
   * Log an error to the internal log
   */
  private static logError(error: AppError): void {
    this.errorLog.push(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console in development
    if (__DEV__) {
      console.error('App Error:', {
        type: error.type,
        message: error.message,
        technicalDetails: error.technicalDetails,
        context: error.context,
        timestamp: error.timestamp,
      });
    }
  }

  /**
   * Notify external listeners of errors
   */
  private static notifyError(error: AppError): void {
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }

  /**
   * Set error notification callback
   */
  static setErrorCallback(callback: (error: AppError) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: AppError): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.STORY_LOAD_FAILED]: 'Unable to load stories. Please try again.',
      [ErrorType.STORY_NOT_FOUND]: 'The requested story was not found.',
      [ErrorType.STORY_INVALID_DATA]: 'Story data appears to be corrupted.',
      
      [ErrorType.AUDIO_INIT_FAILED]: 'Audio system failed to initialize. Please restart the app.',
      [ErrorType.AUDIO_LOAD_FAILED]: 'Unable to load audio files. Please check your device storage.',
      [ErrorType.AUDIO_PLAYBACK_FAILED]: 'Audio playback failed. Please try again.',
      [ErrorType.AUDIO_FILE_NOT_FOUND]: 'Audio file not found. Please reinstall the app.',
      
      [ErrorType.LOCATION_PERMISSION_DENIED]: 'Location access is required for this app to work properly.',
      [ErrorType.LOCATION_SERVICES_DISABLED]: 'Please enable location services in your device settings.',
      [ErrorType.LOCATION_UNAVAILABLE]: 'Unable to determine your location. Please try again.',
      [ErrorType.LOCATION_TIMEOUT]: 'Location request timed out. Please try again.',
      [ErrorType.LOCATION_ACCURACY_POOR]: 'Location accuracy is poor. Please move to an open area.',
      
      [ErrorType.NETWORK_UNAVAILABLE]: 'No internet connection available.',
      [ErrorType.NETWORK_TIMEOUT]: 'Network request timed out. Please try again.',
      
      [ErrorType.SYSTEM_ERROR]: 'A system error occurred. Please restart the app.',
      [ErrorType.MEMORY_LOW]: 'Device memory is low. Please close other apps.',
      [ErrorType.STORAGE_FULL]: 'Device storage is full. Please free up some space.',
      
      [ErrorType.USER_CANCELLED]: 'Operation was cancelled.',
      [ErrorType.INVALID_INPUT]: 'Invalid input provided. Please check your input.',
    };

    return messages[error.type] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get error resolution suggestions
   */
  static getErrorResolution(error: AppError): ErrorResolution[] {
    const resolutions: Record<ErrorType, ErrorResolution[]> = {
      [ErrorType.STORY_LOAD_FAILED]: [
        {
          action: 'Retry',
          description: 'Try loading stories again',
          priority: 'high',
        },
        {
          action: 'Restart App',
          description: 'Close and reopen the app',
          priority: 'medium',
        },
      ],
      
      [ErrorType.AUDIO_INIT_FAILED]: [
        {
          action: 'Restart App',
          description: 'Close and reopen the app',
          priority: 'critical',
        },
        {
          action: 'Check Device Audio',
          description: 'Ensure device audio is not muted',
          priority: 'medium',
        },
      ],
      
      [ErrorType.LOCATION_PERMISSION_DENIED]: [
        {
          action: 'Grant Permissions',
          description: 'Allow location access in app settings',
          priority: 'critical',
        },
        {
          action: 'Check Settings',
          description: 'Verify location permissions in device settings',
          priority: 'high',
        },
      ],
      
      [ErrorType.LOCATION_SERVICES_DISABLED]: [
        {
          action: 'Enable Location',
          description: 'Turn on location services in device settings',
          priority: 'critical',
        },
        {
          action: 'Check GPS',
          description: 'Ensure GPS is enabled',
          priority: 'high',
        },
      ],
      
      [ErrorType.NETWORK_UNAVAILABLE]: [
        {
          action: 'Check Connection',
          description: 'Verify your internet connection',
          priority: 'high',
        },
        {
          action: 'Try Later',
          description: 'Wait for connection to be restored',
          priority: 'medium',
        },
      ],
      
      [ErrorType.SYSTEM_ERROR]: [
        {
          action: 'Restart App',
          description: 'Close and reopen the app',
          priority: 'high',
        },
        {
          action: 'Restart Device',
          description: 'Restart your device if problem persists',
          priority: 'medium',
        },
      ],
      
      [ErrorType.MEMORY_LOW]: [
        {
          action: 'Close Apps',
          description: 'Close other running applications',
          priority: 'high',
        },
        {
          action: 'Restart Device',
          description: 'Restart your device to free memory',
          priority: 'medium',
        },
      ],
      
      [ErrorType.STORAGE_FULL]: [
        {
          action: 'Free Space',
          description: 'Delete unnecessary files and apps',
          priority: 'critical',
        },
        {
          action: 'Clear Cache',
          description: 'Clear app cache and temporary files',
          priority: 'high',
        },
      ],
      
      // Default resolutions for other error types
      [ErrorType.STORY_NOT_FOUND]: [
        {
          action: 'Try Again',
          description: 'The story may be temporarily unavailable',
          priority: 'medium',
        },
      ],
      
      [ErrorType.STORY_INVALID_DATA]: [
        {
          action: 'Reinstall App',
          description: 'App data may be corrupted',
          priority: 'high',
        },
      ],
      
      [ErrorType.AUDIO_LOAD_FAILED]: [
        {
          action: 'Check Storage',
          description: 'Ensure you have enough storage space',
          priority: 'high',
        },
        {
          action: 'Reinstall App',
          description: 'Audio files may be corrupted',
          priority: 'medium',
        },
      ],
      
      [ErrorType.AUDIO_PLAYBACK_FAILED]: [
        {
          action: 'Check Audio',
          description: 'Ensure device audio is working',
          priority: 'medium',
        },
        {
          action: 'Try Again',
          description: 'Audio may be temporarily unavailable',
          priority: 'low',
        },
      ],
      
      [ErrorType.AUDIO_FILE_NOT_FOUND]: [
        {
          action: 'Reinstall App',
          description: 'Audio files are missing',
          priority: 'critical',
        },
      ],
      
      [ErrorType.LOCATION_UNAVAILABLE]: [
        {
          action: 'Move Location',
          description: 'Try moving to a different area',
          priority: 'medium',
        },
        {
          action: 'Wait',
          description: 'GPS signal may be temporarily weak',
          priority: 'low',
        },
      ],
      
      [ErrorType.LOCATION_TIMEOUT]: [
        {
          action: 'Try Again',
          description: 'Location request may succeed on retry',
          priority: 'medium',
        },
        {
          action: 'Check GPS',
          description: 'Ensure GPS is working properly',
          priority: 'high',
        },
      ],
      
      [ErrorType.LOCATION_ACCURACY_POOR]: [
        {
          action: 'Move to Open Area',
          description: 'GPS works better in open spaces',
          priority: 'high',
        },
        {
          action: 'Wait',
          description: 'GPS accuracy may improve over time',
          priority: 'low',
        },
      ],
      
      [ErrorType.NETWORK_TIMEOUT]: [
        {
          action: 'Try Again',
          description: 'Network may be temporarily slow',
          priority: 'medium',
        },
        {
          action: 'Check Connection',
          description: 'Verify your internet connection',
          priority: 'high',
        },
      ],
      
      [ErrorType.USER_CANCELLED]: [
        {
          action: 'Continue',
          description: 'You can try the operation again',
          priority: 'low',
        },
      ],
      
      [ErrorType.INVALID_INPUT]: [
        {
          action: 'Check Input',
          description: 'Verify the information you entered',
          priority: 'medium',
        },
      ],
    };

    return resolutions[error.type] || [
      {
        action: 'Try Again',
        description: 'The error may resolve itself',
        priority: 'medium',
      },
    ];
  }

  /**
   * Check if an error is recoverable
   */
  static isRecoverable(error: AppError): boolean {
    return error.recoverable;
  }

  /**
   * Check if user action is required
   */
  static requiresUserAction(error: AppError): boolean {
    return error.userActionRequired;
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    recentErrors: AppError[];
    criticalErrors: AppError[];
  } {
    const errorsByType: Record<ErrorType, number> = {};
    const criticalErrors: AppError[] = [];
    const recentErrors = this.errorLog.slice(-10); // Last 10 errors

    // Count errors by type
    this.errorLog.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      
      // Collect critical errors
      if (!error.recoverable) {
        criticalErrors.push(error);
      }
    });

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      recentErrors,
      criticalErrors,
    };
  }

  /**
   * Clear error log
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get errors by type
   */
  static getErrorsByType(type: ErrorType): AppError[] {
    return this.errorLog.filter(error => error.type === type);
  }

  /**
   * Get errors within time range
   */
  static getErrorsInTimeRange(startTime: Date, endTime: Date): AppError[] {
    return this.errorLog.filter(
      error => error.timestamp >= startTime && error.timestamp <= endTime
    );
  }

  /**
   * Check if there are critical errors
   */
  static hasCriticalErrors(): boolean {
    return this.errorLog.some(error => !error.recoverable);
  }

  /**
   * Get the most recent error
   */
  static getMostRecentError(): AppError | null {
    return this.errorLog.length > 0 ? this.errorLog[this.errorLog.length - 1] : null;
  }
}

// Convenience functions for common error types
export const createStoryError = (message: string, technicalDetails?: string, context?: Record<string, any>) =>
  ErrorHandler.createError(ErrorType.STORY_LOAD_FAILED, message, technicalDetails, context, true, false);

export const createAudioError = (message: string, technicalDetails?: string, context?: Record<string, any>) =>
  ErrorHandler.createError(ErrorType.AUDIO_PLAYBACK_FAILED, message, technicalDetails, context, true, false);

export const createLocationError = (message: string, technicalDetails?: string, context?: Record<string, any>) =>
  ErrorHandler.createError(ErrorType.LOCATION_UNAVAILABLE, message, technicalDetails, context, true, true);

export const createSystemError = (message: string, technicalDetails?: string, context?: Record<string, any>) =>
  ErrorHandler.createError(ErrorType.SYSTEM_ERROR, message, technicalDetails, context, false, true);
