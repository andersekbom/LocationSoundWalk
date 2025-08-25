import { AppState, AppStateStatus } from 'react-native';
import { AudioService } from './AudioService';
import { LocationService } from './LocationService';
import { LocationBasedAudioManager } from './LocationBasedAudioManager';
import { ErrorHandler, ErrorType } from './ErrorHandler';
import { ToastManager } from '../components/Toast';

export interface AppLifecycleState {
  isActive: boolean;
  isBackground: boolean;
  isInactive: boolean;
  lastActiveTime?: Date;
  backgroundTime?: number;
}

export interface LifecycleOptions {
  pauseAudioOnBackground?: boolean;
  stopLocationOnBackground?: boolean;
  showBackgroundNotification?: boolean;
  autoResumeOnForeground?: boolean;
}

export class AppLifecycleManager {
  private static currentState: AppLifecycleState = {
    isActive: false,
    isBackground: false,
    isInactive: false,
  };

  private static options: LifecycleOptions = {
    pauseAudioOnBackground: true,
    stopLocationOnBackground: false, // Keep location active for background audio
    showBackgroundNotification: true,
    autoResumeOnForeground: true,
  };

  private static listeners: Set<(state: AppLifecycleState) => void> = new Set();
  private static backgroundStartTime?: number;
  private static wasPlayingAudio = false;
  private static wasLocationActive = false;

  /**
   * Initialize the lifecycle manager
   */
  static initialize(options?: Partial<LifecycleOptions>): void {
    if (options) {
      this.options = { ...this.options, ...options };
    }

    // Set initial state
    this.currentState.isActive = AppState.currentState === 'active';
    this.currentState.isBackground = AppState.currentState === 'background';
    this.currentState.isInactive = AppState.currentState === 'inactive';

    // Listen for app state changes
    AppState.addEventListener('change', this.handleAppStateChange);

    // Log initialization
    console.log('AppLifecycleManager initialized with options:', this.options);
  }

  /**
   * Handle app state changes
   */
  private static handleAppStateChange = (nextAppState: AppStateStatus): void => {
    const previousState = { ...this.currentState };

    // Update current state
    this.currentState.isActive = nextAppState === 'active';
    this.currentState.isBackground = nextAppState === 'background';
    this.currentState.isInactive = nextAppState === 'inactive';

    console.log('App state changed:', {
      from: this.getStateDescription(previousState),
      to: this.getStateDescription(this.currentState),
      timestamp: new Date().toISOString(),
    });

    // Handle state transitions
    if (nextAppState === 'active') {
      this.handleAppForeground();
    } else if (nextAppState === 'background') {
      this.handleAppBackground();
    } else if (nextAppState === 'inactive') {
      this.handleAppInactive();
    }

    // Notify listeners
    this.notifyListeners();
  };

  /**
   * Handle app coming to foreground
   */
  private static handleAppForeground(): void {
    this.currentState.lastActiveTime = new Date();

    if (this.backgroundStartTime) {
      const backgroundDuration = Date.now() - this.backgroundStartTime;
      this.currentState.backgroundTime = backgroundDuration;
      this.backgroundStartTime = undefined;

      console.log(`App was in background for ${backgroundDuration}ms`);
    }

    // Auto-resume audio if enabled
    if (this.options.autoResumeOnForeground && this.wasPlayingAudio) {
      this.resumeAudioPlayback();
    }

    // Show welcome back message
    if (this.currentState.backgroundTime && this.currentState.backgroundTime > 30000) {
      ToastManager.info(
        'Welcome Back!',
        'Your sound walk has been resumed.',
        3000
      );
    }

    // Log foreground transition
    console.log('App entered foreground');
  }

  /**
   * Handle app going to background
   */
  private static handleAppBackground(): void {
    this.backgroundStartTime = Date.now();

    // Store current state
    this.wasPlayingAudio = this.isAudioCurrentlyPlaying();
    this.wasLocationActive = this.isLocationCurrentlyActive();

    // Pause audio if enabled
    if (this.options.pauseAudioOnBackground && this.wasPlayingAudio) {
      this.pauseAudioPlayback();
    }

    // Stop location tracking if enabled
    if (this.options.stopLocationOnBackground && this.wasLocationActive) {
      this.pauseLocationTracking();
    }

    // Show background notification if enabled
    if (this.options.showBackgroundNotification) {
      this.showBackgroundNotification();
    }

    // Log background transition
    console.log('App entered background');
  }

  /**
   * Handle app becoming inactive (e.g., incoming call, notification)
   */
  private static handleAppInactive(): void {
    // Store current state
    this.wasPlayingAudio = this.isAudioCurrentlyPlaying();
    this.wasLocationActive = this.isLocationCurrentlyActive();

    // Pause audio temporarily
    if (this.wasPlayingAudio) {
      this.pauseAudioPlayback();
    }

    console.log('App became inactive');
  }

  /**
   * Check if audio is currently playing
   */
  private static isAudioCurrentlyPlaying(): boolean {
    try {
      // This would need to be implemented based on your audio service
      // For now, we'll return false
      return false;
    } catch (error) {
      console.error('Error checking audio playback status:', error);
      return false;
    }
  }

  /**
   * Check if location tracking is currently active
   */
  private static isLocationCurrentlyActive(): boolean {
    try {
      return LocationService.isLocationTrackingActive();
    } catch (error) {
      console.error('Error checking location tracking status:', error);
      return false;
    }
  }

  /**
   * Pause audio playback
   */
  private static pauseAudioPlayback(): void {
    try {
      AudioService.pauseCurrentSound();
      console.log('Audio playback paused due to app backgrounding');
    } catch (error) {
      console.error('Error pausing audio playback:', error);
      ErrorHandler.createError(
        ErrorType.AUDIO_PLAYBACK_FAILED,
        'Failed to pause audio on background',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Resume audio playback
   */
  private static resumeAudioPlayback(): void {
    try {
      AudioService.resumeCurrentSound();
      console.log('Audio playback resumed after app foregrounding');
    } catch (error) {
      console.error('Error resuming audio playback:', error);
      ErrorHandler.createError(
        ErrorType.AUDIO_PLAYBACK_FAILED,
        'Failed to resume audio on foreground',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Pause location tracking
   */
  private static pauseLocationTracking(): void {
    try {
      LocationService.stopLocationTracking();
      console.log('Location tracking paused due to app backgrounding');
    } catch (error) {
      console.error('Error pausing location tracking:', error);
      ErrorHandler.createError(
        ErrorType.LOCATION_UNAVAILABLE,
        'Failed to pause location tracking on background',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Show background notification
   */
  private static showBackgroundNotification(): void {
    try {
      // In a real app, you would show a local notification
      // For now, we'll just log it
      console.log('Background notification would be shown here');
    } catch (error) {
      console.error('Error showing background notification:', error);
    }
  }

  /**
   * Get current lifecycle state
   */
  static getCurrentState(): AppLifecycleState {
    return { ...this.currentState };
  }

  /**
   * Get current options
   */
  static getOptions(): LifecycleOptions {
    return { ...this.options };
  }

  /**
   * Update lifecycle options
   */
  static updateOptions(newOptions: Partial<LifecycleOptions>): void {
    this.options = { ...this.options, ...newOptions };
    console.log('AppLifecycleManager options updated:', this.options);
  }

  /**
   * Subscribe to lifecycle state changes
   */
  static subscribe(listener: (state: AppLifecycleState) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately call with current state
    listener(this.currentState);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private static notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('Error in lifecycle listener:', error);
      }
    });
  }

  /**
   * Get human-readable state description
   */
  private static getStateDescription(state: AppLifecycleState): string {
    if (state.isActive) return 'active';
    if (state.isBackground) return 'background';
    if (state.isInactive) return 'inactive';
    return 'unknown';
  }

  /**
   * Check if app is currently active
   */
  static isAppActive(): boolean {
    return this.currentState.isActive;
  }

  /**
   * Check if app is currently in background
   */
  static isAppInBackground(): boolean {
    return this.currentState.isBackground;
  }

  /**
   * Get time spent in background
   */
  static getBackgroundTime(): number | undefined {
    return this.currentState.backgroundTime;
  }

  /**
   * Get last active time
   */
  static getLastActiveTime(): Date | undefined {
    return this.currentState.lastActiveTime;
  }

  /**
   * Manually pause app (useful for testing)
   */
  static pauseApp(): void {
    this.handleAppBackground();
  }

  /**
   * Manually resume app (useful for testing)
   */
  static resumeApp(): void {
    this.handleAppForeground();
  }

  /**
   * Cleanup resources
   */
  static cleanup(): void {
    try {
      // Remove event listener
      AppState.removeEventListener('change', this.handleAppStateChange);
      
      // Clear listeners
      this.listeners.clear();
      
      // Reset state
      this.currentState = {
        isActive: false,
        isBackground: false,
        isInactive: false,
      };
      
      console.log('AppLifecycleManager cleaned up');
    } catch (error) {
      console.error('Error cleaning up AppLifecycleManager:', error);
    }
  }
}

// Export convenience functions
export const initializeAppLifecycle = (options?: Partial<LifecycleOptions>) =>
  AppLifecycleManager.initialize(options);

export const getAppLifecycleState = () => AppLifecycleManager.getCurrentState();

export const subscribeToAppLifecycle = (listener: (state: AppLifecycleState) => void) =>
  AppLifecycleManager.subscribe(listener);

export const isAppActive = () => AppLifecycleManager.isAppActive();

export const isAppInBackground = () => AppLifecycleManager.isAppInBackground();
