import { LocationService } from './LocationService';
import { AudioService } from './AudioService';
import { StoryLoader } from './StoryLoader';
import { GeolocationUtils, Location } from '../utils/GeolocationUtils';
import { Story, SoundClip } from '../types';

export interface AudioTriggerEvent {
  soundClip: SoundClip;
  distance: number;
  timestamp: Date;
}

export interface LocationBasedAudioManagerOptions {
  autoPlay: boolean;
  triggerRadiusBuffer: number; // Additional buffer around trigger radius
  maxConcurrentSounds: number;
}

export class LocationBasedAudioManager {
  private static currentStory: Story | null = null;
  private static isActive: boolean = false;
  private static lastTriggeredClips: Set<string> = new Set();
  private static onAudioTrigger?: (event: AudioTriggerEvent) => void;
  private static options: LocationBasedAudioManagerOptions = {
    autoPlay: true,
    triggerRadiusBuffer: 5, // 5 meter buffer
    maxConcurrentSounds: 1
  };

  /**
   * Initialize the manager with a story
   */
  static async initializeWithStory(storyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Load the story
      const story = await StoryLoader.getStoryById(storyId);
      if (!story) {
        return {
          success: false,
          error: `Story not found: ${storyId}`
        };
      }

      // Initialize audio service
      const audioInitResult = await AudioService.initialize();
      if (!audioInitResult.success) {
        return audioInitResult;
      }

      // Load all sounds for the story
      const audioLoadResult = await AudioService.loadStorySounds(story.soundClips);
      if (!audioLoadResult.success) {
        return audioLoadResult;
      }

      this.currentStory = story;
      this.lastTriggeredClips.clear();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize audio manager: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Start location-based audio monitoring
   */
  static async startMonitoring(
    onAudioTrigger?: (event: AudioTriggerEvent) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentStory) {
        return {
          success: false,
          error: 'No story loaded. Call initializeWithStory first.'
        };
      }

      // Request location permissions
      const permissionResult = await LocationService.requestPermissions();
      if (!permissionResult.success) {
        return permissionResult;
      }

      // Check if location services are enabled
      const locationStatus = await LocationService.getLocationSettingsStatus();
      if (!locationStatus.success) {
        return locationStatus;
      }

      // Start location tracking
      const trackingResult = await LocationService.startLocationTracking(
        (location: Location) => this.handleLocationUpdate(location),
        {
          accuracy: 5, // 5 meter accuracy
          timeInterval: 3000, // Update every 3 seconds
          distanceInterval: 5 // Update every 5 meters
        }
      );

      if (!trackingResult.success) {
        return trackingResult;
      }

      this.isActive = true;
      this.onAudioTrigger = onAudioTrigger;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to start monitoring: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Stop location-based audio monitoring
   */
  static async stopMonitoring(): Promise<{ success: boolean; error?: string }> {
    try {
      // Stop location tracking
      await LocationService.stopLocationTracking();

      // Stop any playing audio
      await AudioService.stopCurrentSound();

      this.isActive = false;
      this.onAudioTrigger = undefined;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to stop monitoring: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Handle location updates and trigger audio if needed
   */
  private static async handleLocationUpdate(userLocation: Location): Promise<void> {
    if (!this.currentStory || !this.isActive) {
      return;
    }

    try {
      // Find all sound clips that the user is currently within range of
      const clipsInRange = GeolocationUtils.getClipsInRange(userLocation, this.currentStory.soundClips);

      for (const clip of clipsInRange) {
        // Check if we should trigger this clip
        if (this.shouldTriggerClip(clip, userLocation)) {
          await this.triggerAudioClip(clip, userLocation);
        }
      }

      // Check for clips that are no longer in range and should stop
      await this.handleClipsOutOfRange(userLocation);
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }

  /**
   * Determine if a sound clip should be triggered
   */
  private static shouldTriggerClip(clip: SoundClip, userLocation: Location): boolean {
    // Check if we're within the trigger radius (with buffer)
    const distance = GeolocationUtils.calculateDistance(
      userLocation.lat,
      userLocation.lng,
      clip.lat,
      clip.lng
    );

    const effectiveRadius = clip.radius + this.options.triggerRadiusBuffer;
    
    if (distance > effectiveRadius) {
      return false;
    }

    // Check if we've already triggered this clip recently
    if (this.lastTriggeredClips.has(clip.id)) {
      return false;
    }

    return true;
  }

  /**
   * Trigger audio playback for a sound clip
   */
  private static async triggerAudioClip(clip: SoundClip, userLocation: Location): Promise<void> {
    try {
      // Calculate distance for the event
      const distance = GeolocationUtils.calculateDistance(
        userLocation.lat,
        userLocation.lng,
        clip.lat,
        clip.lng
      );

      // Mark this clip as recently triggered
      this.lastTriggeredClips.add(clip.id);

      // Auto-play if enabled
      if (this.options.autoPlay) {
        await AudioService.playSound(clip);
      }

      // Create trigger event
      const triggerEvent: AudioTriggerEvent = {
        soundClip: clip,
        distance: Math.round(distance),
        timestamp: new Date()
      };

      // Notify listeners
      if (this.onAudioTrigger) {
        this.onAudioTrigger(triggerEvent);
      }

      // Remove from recently triggered after a delay to prevent spam
      setTimeout(() => {
        this.lastTriggeredClips.delete(clip.id);
      }, 10000); // 10 second cooldown

    } catch (error) {
      console.error('Error triggering audio clip:', error);
    }
  }

  /**
   * Handle clips that are no longer in range
   */
  private static async handleClipsOutOfRange(userLocation: Location): Promise<void> {
    if (!this.currentStory) return;

    try {
      const currentPlaybackStatus = await AudioService.getPlaybackStatus();
      
      if (currentPlaybackStatus.isPlaying && currentPlaybackStatus.currentSound) {
        const currentClip = this.currentStory.soundClips.find(
          clip => clip.id === currentPlaybackStatus.currentSound?.id
        );

        if (currentClip) {
          const distance = GeolocationUtils.calculateDistance(
            userLocation.lat,
            userLocation.lng,
            currentClip.lat,
            currentClip.lng
          );

          // If we're outside the radius, stop the audio
          if (distance > currentClip.radius + this.options.triggerRadiusBuffer) {
            await AudioService.stopCurrentSound();
          }
        }
      }
    } catch (error) {
      console.error('Error handling clips out of range:', error);
    }
  }

  /**
   * Manually trigger a specific sound clip
   */
  static async triggerClipManually(clipId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentStory) {
        return {
          success: false,
          error: 'No story loaded'
        };
      }

      const clip = this.currentStory.soundClips.find(c => c.id === clipId);
      if (!clip) {
        return {
          success: false,
          error: `Sound clip not found: ${clipId}`
        };
      }

      const currentLocation = LocationService.getLastKnownLocation();
      if (!currentLocation) {
        return {
          success: false,
          error: 'No location data available'
        };
      }

      await this.triggerAudioClip(clip, currentLocation);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to trigger clip manually: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get current monitoring status
   */
  static getMonitoringStatus(): {
    isActive: boolean;
    currentStory: Story | null;
    locationTrackingActive: boolean;
    audioLoaded: boolean;
  } {
    return {
      isActive: this.isActive,
      currentStory: this.currentStory,
      locationTrackingActive: LocationService.isLocationTrackingActive(),
      audioLoaded: AudioService.getLoadedSoundCount() > 0
    };
  }

  /**
   * Update manager options
   */
  static updateOptions(newOptions: Partial<LocationBasedAudioManagerOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current options
   */
  static getOptions(): LocationBasedAudioManagerOptions {
    return { ...this.options };
  }

  /**
   * Get information about nearby sound clips
   */
  static getNearbyClipsInfo(userLocation: Location): Array<{
    clip: SoundClip;
    distance: number;
    formattedDistance: string;
    isInRange: boolean;
  }> {
    if (!this.currentStory) {
      return [];
    }

    return this.currentStory.soundClips.map(clip => {
      const distance = GeolocationUtils.calculateDistance(
        userLocation.lat,
        userLocation.lng,
        clip.lat,
        clip.lng
      );

      return {
        clip,
        distance: Math.round(distance),
        formattedDistance: GeolocationUtils.formatDistance(distance),
        isInRange: distance <= clip.radius
      };
    }).sort((a, b) => a.distance - b.distance);
  }

  /**
   * Clean up resources
   */
  static async cleanup(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.stopMonitoring();
      await AudioService.cleanup();
      await LocationService.cleanup();

      this.currentStory = null;
      this.lastTriggeredClips.clear();
      this.isActive = false;
      this.onAudioTrigger = undefined;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to cleanup audio manager: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
