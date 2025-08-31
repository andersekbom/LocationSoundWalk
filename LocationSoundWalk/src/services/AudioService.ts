import { Audio } from 'expo-av';
import { SoundClip } from '../types';

export interface AudioServiceResult {
  success: boolean;
  error?: string;
}

export interface PlaybackStatus {
  isPlaying: boolean;
  currentSound?: SoundClip;
  volume: number;
  isLoaded: boolean;
}

export class AudioService {
  private static soundMap: Map<string, Audio.Sound> = new Map();
  private static currentSound: Audio.Sound | null = null;
  private static volume: number = 1.0;
  private static isInitialized: boolean = false;

  /**
   * Initialize the audio service
   */
  static async initialize(): Promise<AudioServiceResult> {
    try {
      if (this.isInitialized) {
        return { success: true };
      }

      // Set audio mode for iOS/Android
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.isInitialized = true;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize audio service: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Load a sound file for a sound clip
   */
  static async loadSound(soundClip: SoundClip): Promise<AudioServiceResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check if sound is already loaded
      if (this.soundMap.has(soundClip.id)) {
        return { success: true };
      }

      // Load the sound file using URI instead of dynamic require
      const soundUri = `../../assets/sounds/${soundClip.file}`;
      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUri },
        { volume: this.volume }
      );

      // Store the loaded sound
      this.soundMap.set(soundClip.id, sound);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load sound ${soundClip.file}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Load all sounds for a story
   */
  static async loadStorySounds(soundClips: SoundClip[]): Promise<AudioServiceResult> {
    try {
      const loadPromises = soundClips.map(clip => this.loadSound(clip));
      const results = await Promise.all(loadPromises);

      // Check if any loads failed
      const failedLoads = results.filter(result => !result.success);
      if (failedLoads.length > 0) {
        return {
          success: false,
          error: `Failed to load ${failedLoads.length} sound files`
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load story sounds: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Play a specific sound clip
   */
  static async playSound(soundClip: SoundClip): Promise<AudioServiceResult> {
    try {
      // Stop any currently playing sound
      await this.stopCurrentSound();

      // Load the sound if not already loaded
      const loadResult = await this.loadSound(soundClip);
      if (!loadResult.success) {
        return loadResult;
      }

      // Get the sound and play it
      const sound = this.soundMap.get(soundClip.id);
      if (!sound) {
        return {
          success: false,
          error: `Sound ${soundClip.id} not found in loaded sounds`
        };
      }

      // Set as current sound and play
      this.currentSound = sound;
      await sound.playAsync();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to play sound ${soundClip.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Stop the currently playing sound
   */
  static async stopCurrentSound(): Promise<AudioServiceResult> {
    try {
      if (this.currentSound) {
        await this.currentSound.stopAsync();
        this.currentSound = null;
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to stop current sound: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Pause the currently playing sound
   */
  static async pauseCurrentSound(): Promise<AudioServiceResult> {
    try {
      if (this.currentSound) {
        await this.currentSound.pauseAsync();
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to pause current sound: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Resume the currently paused sound
   */
  static async resumeCurrentSound(): Promise<AudioServiceResult> {
    try {
      if (this.currentSound) {
        await this.currentSound.playAsync();
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to resume current sound: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Set the volume for all sounds
   */
  static async setVolume(volume: number): Promise<AudioServiceResult> {
    try {
      this.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1

      // Update volume for all loaded sounds
      const updatePromises = Array.from(this.soundMap.values()).map(sound =>
        sound.setVolumeAsync(this.volume)
      );
      await Promise.all(updatePromises);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set volume: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get current playback status
   */
  static async getPlaybackStatus(): Promise<PlaybackStatus> {
    try {
      let isPlaying = false;
      let currentSoundClip: SoundClip | undefined;

      if (this.currentSound) {
        const status = await this.currentSound.getStatusAsync();
        isPlaying = status.isLoaded && status.isPlaying;
        
        // Find the current sound clip by matching the sound object
        for (const [clipId, sound] of this.soundMap.entries()) {
          if (sound === this.currentSound) {
            // This is a simplified approach - in a real app you'd want to store the mapping
            currentSoundClip = { id: clipId } as SoundClip;
            break;
          }
        }
      }

      return {
        isPlaying,
        currentSound: currentSoundClip,
        volume: this.volume,
        isLoaded: this.soundMap.size > 0
      };
    } catch (error) {
      return {
        isPlaying: false,
        volume: this.volume,
        isLoaded: false
      };
    }
  }

  /**
   * Unload all sounds and clean up resources
   */
  static async cleanup(): Promise<AudioServiceResult> {
    try {
      // Stop current sound
      await this.stopCurrentSound();

      // Unload all sounds
      const unloadPromises = Array.from(this.soundMap.values()).map(sound =>
        sound.unloadAsync()
      );
      await Promise.all(unloadPromises);

      // Clear the sound map
      this.soundMap.clear();
      this.isInitialized = false;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to cleanup audio service: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get the number of loaded sounds
   */
  static getLoadedSoundCount(): number {
    return this.soundMap.size;
  }

  /**
   * Check if a specific sound is loaded
   */
  static isSoundLoaded(soundId: string): boolean {
    return this.soundMap.has(soundId);
  }
}
