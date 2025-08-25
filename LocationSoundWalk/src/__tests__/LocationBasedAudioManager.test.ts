import { LocationBasedAudioManager } from '../services/LocationBasedAudioManager';
import { StoryLoader } from '../services/StoryLoader';
import { AudioService } from '../services/AudioService';
import { LocationService } from '../services/LocationService';
import { Story, SoundClip } from '../types';
import { GeolocationUtils, Location } from '../utils/GeolocationUtils';

// Mock all dependencies
jest.mock('../services/StoryLoader');
jest.mock('../services/AudioService');
jest.mock('../services/LocationService');
jest.mock('../utils/GeolocationUtils');

const mockStoryLoader = StoryLoader as jest.Mocked<typeof StoryLoader>;
const mockAudioService = AudioService as jest.Mocked<typeof AudioService>;
const mockLocationService = LocationService as jest.Mocked<typeof LocationService>;
const mockGeolocationUtils = GeolocationUtils as jest.Mocked<typeof GeolocationUtils>;

describe('LocationBasedAudioManager', () => {
  const mockStory: Story = {
    id: 'test_story',
    title: 'Test Story',
    description: 'A test story for testing',
    soundClips: [
      {
        id: 'clip1',
        file: 'clip1.mp3',
        lat: 40.7589,
        lng: -73.9851,
        radius: 100,
        title: 'Test Clip 1',
      },
      {
        id: 'clip2',
        file: 'clip2.mp3',
        lat: 40.7648,
        lng: -73.9808,
        radius: 150,
        title: 'Test Clip 2',
      },
      {
        id: 'clip3',
        file: 'clip3.mp3',
        lat: 40.8000,
        lng: -73.9000,
        radius: 200,
        title: 'Test Clip 3',
      },
    ],
  };

  const mockUserLocation: Location = { lat: 40.7589, lng: -73.9851 };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset static state
    (LocationBasedAudioManager as any).currentStory = null;
    (LocationBasedAudioManager as any).isActive = false;
    (LocationBasedAudioManager as any).lastTriggeredClips = new Set();
    (LocationBasedAudioManager as any).onAudioTrigger = undefined;
  });

  describe('initializeWithStory', () => {
    it('should initialize successfully with a valid story', async () => {
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });

      const result = await LocationBasedAudioManager.initializeWithStory('test_story');

      expect(result.success).toBe(true);
      expect(mockStoryLoader.getStoryById).toHaveBeenCalledWith('test_story');
      expect(mockAudioService.initialize).toHaveBeenCalled();
      expect(mockAudioService.loadStorySounds).toHaveBeenCalledWith(mockStory.soundClips);
    });

    it('should fail if story not found', async () => {
      mockStoryLoader.getStoryById.mockResolvedValue(null);

      const result = await LocationBasedAudioManager.initializeWithStory('nonexistent_story');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Story not found');
    });

    it('should fail if audio service initialization fails', async () => {
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ 
        success: false, 
        error: 'Audio init failed' 
      });

      const result = await LocationBasedAudioManager.initializeWithStory('test_story');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Audio init failed');
    });

    it('should fail if audio loading fails', async () => {
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ 
        success: false, 
        error: 'Audio loading failed' 
      });

      const result = await LocationBasedAudioManager.initializeWithStory('test_story');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Audio loading failed');
    });
  });

  describe('startMonitoring', () => {
    beforeEach(async () => {
      // Initialize with story first
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });
      await LocationBasedAudioManager.initializeWithStory('test_story');
    });

    it('should start monitoring successfully with permissions', async () => {
      mockLocationService.requestPermissions.mockResolvedValue({ success: true });
      mockLocationService.getLocationSettingsStatus.mockResolvedValue({ 
        success: true, 
        enabled: true 
      });
      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });

      const result = await LocationBasedAudioManager.startMonitoring();

      expect(result.success).toBe(true);
      expect(mockLocationService.requestPermissions).toHaveBeenCalled();
      expect(mockLocationService.startLocationTracking).toHaveBeenCalled();
    });

    it('should fail if location permissions denied', async () => {
      mockLocationService.requestPermissions.mockResolvedValue({ 
        success: false, 
        error: 'Permission denied' 
      });

      const result = await LocationBasedAudioManager.startMonitoring();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });

    it('should fail if location services disabled', async () => {
      mockLocationService.requestPermissions.mockResolvedValue({ success: true });
      mockLocationService.getLocationSettingsStatus.mockResolvedValue({ 
        success: false, 
        error: 'Location services disabled' 
      });

      const result = await LocationBasedAudioManager.startMonitoring();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Location services disabled');
    });

    it('should fail if no story is loaded', async () => {
      // Reset story
      (LocationBasedAudioManager as any).currentStory = null;

      const result = await LocationBasedAudioManager.startMonitoring();

      expect(result.success).toBe(false);
      expect(result.error).toContain('No story loaded');
    });
  });

  describe('stopMonitoring', () => {
    beforeEach(async () => {
      // Initialize and start monitoring
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });
      await LocationBasedAudioManager.initializeWithStory('test_story');
      
      mockLocationService.requestPermissions.mockResolvedValue({ success: true });
      mockLocationService.getLocationSettingsStatus.mockResolvedValue({ 
        success: true, 
        enabled: true 
      });
      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });
      await LocationBasedAudioManager.startMonitoring();
    });

    it('should stop monitoring successfully', async () => {
      mockLocationService.stopLocationTracking.mockResolvedValue({ success: true });
      mockAudioService.stopCurrentSound.mockResolvedValue({ success: true });

      const result = await LocationBasedAudioManager.stopMonitoring();

      expect(result.success).toBe(true);
      expect(mockLocationService.stopLocationTracking).toHaveBeenCalled();
      expect(mockAudioService.stopCurrentSound).toHaveBeenCalled();
    });

    it('should handle stop tracking errors gracefully', async () => {
      mockLocationService.stopLocationTracking.mockResolvedValue({ 
        success: false, 
        error: 'Stop failed' 
      });

      const result = await LocationBasedAudioManager.stopMonitoring();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Stop failed');
    });
  });

  describe('location update handling', () => {
    let mockOnLocationUpdate: jest.Mock;

    beforeEach(async () => {
      // Initialize with story
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });
      await LocationBasedAudioManager.initializeWithStory('test_story');

      // Start monitoring
      mockLocationService.requestPermissions.mockResolvedValue({ success: true });
      mockLocationService.getLocationSettingsStatus.mockResolvedValue({ 
        success: true, 
        enabled: true 
      });
      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });
      
      mockOnLocationUpdate = jest.fn();
      await LocationBasedAudioManager.startMonitoring(mockOnLocationUpdate);
    });

    it('should trigger audio when entering trigger zone', async () => {
      // Mock user entering clip1's radius
      const userInRange: Location = { lat: 40.7589, lng: -73.9851 };
      mockGeolocationUtils.getClipsInRange.mockReturnValue([mockStory.soundClips[0]]);
      mockGeolocationUtils.calculateDistance.mockReturnValue(50); // Within 100m radius
      mockAudioService.playSound.mockResolvedValue({ success: true });

      // Simulate location update
      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];
      await locationUpdateCallback(userInRange);

      expect(mockAudioService.playSound).toHaveBeenCalledWith(mockStory.soundClips[0]);
      expect(mockOnLocationUpdate).toHaveBeenCalled();
    });

    it('should not trigger audio when outside trigger zone', async () => {
      // Mock user outside all clip radii
      const userOutOfRange: Location = { lat: 40.9000, lng: -73.8000 };
      mockGeolocationUtils.getClipsInRange.mockReturnValue([]);

      // Simulate location update
      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];
      await locationUpdateCallback(userOutOfRange);

      expect(mockAudioService.playSound).not.toHaveBeenCalled();
    });

    it('should prevent duplicate triggers with cooldown', async () => {
      // Mock user entering clip1's radius
      const userInRange: Location = { lat: 40.7589, lng: -73.9851 };
      mockGeolocationUtils.getClipsInRange.mockReturnValue([mockStory.soundClips[0]]);
      mockGeolocationUtils.calculateDistance.mockReturnValue(50);
      mockAudioService.playSound.mockResolvedValue({ success: true });

      // First trigger
      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];
      await locationUpdateCallback(userInRange);
      expect(mockAudioService.playSound).toHaveBeenCalledTimes(1);

      // Second trigger immediately (should be blocked by cooldown)
      await locationUpdateCallback(userInRange);
      expect(mockAudioService.playSound).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should stop audio when exiting trigger zone', async () => {
      // Mock user entering clip1's radius
      const userInRange: Location = { lat: 40.7589, lng: -73.9851 };
      mockGeolocationUtils.getClipsInRange.mockReturnValue([mockStory.soundClips[0]]);
      mockGeolocationUtils.calculateDistance.mockReturnValue(50);
      mockAudioService.playSound.mockResolvedValue({ success: true });
      mockAudioService.getPlaybackStatus.mockResolvedValue({
        isPlaying: true,
        currentSound: mockStory.soundClips[0],
        volume: 1.0,
        isLoaded: true,
      });

      // Enter zone
      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];
      await locationUpdateCallback(userInRange);

      // Mock user exiting clip1's radius
      const userOutOfRange: Location = { lat: 40.8000, lng: -73.9000 };
      mockGeolocationUtils.getClipsInRange.mockReturnValue([]);
      mockGeolocationUtils.calculateDistance.mockReturnValue(300); // Outside 100m radius

      // Exit zone
      await locationUpdateCallback(userOutOfRange);

      expect(mockAudioService.stopCurrentSound).toHaveBeenCalled();
    });
  });

  describe('manual clip triggering', () => {
    beforeEach(async () => {
      // Initialize with story
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });
      await LocationBasedAudioManager.initializeWithStory('test_story');
    });

    it('should trigger clip manually when story is loaded', async () => {
      mockLocationService.getLastKnownLocation.mockReturnValue(mockUserLocation);
      mockGeolocationUtils.calculateDistance.mockReturnValue(50);
      mockAudioService.playSound.mockResolvedValue({ success: true });

      const result = await LocationBasedAudioManager.triggerClipManually('clip1');

      expect(result.success).toBe(true);
      expect(mockAudioService.playSound).toHaveBeenCalledWith(mockStory.soundClips[0]);
    });

    it('should fail if no story is loaded', async () => {
      (LocationBasedAudioManager as any).currentStory = null;

      const result = await LocationBasedAudioManager.triggerClipManually('clip1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No story loaded');
    });

    it('should fail if clip not found', async () => {
      const result = await LocationBasedAudioManager.triggerClipManually('nonexistent_clip');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sound clip not found');
    });

    it('should fail if no location data available', async () => {
      mockLocationService.getLastKnownLocation.mockReturnValue(null);

      const result = await LocationBasedAudioManager.triggerClipManually('clip1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No location data available');
    });
  });

  describe('monitoring status and options', () => {
    beforeEach(async () => {
      // Initialize with story
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });
      await LocationBasedAudioManager.initializeWithStory('test_story');
    });

    it('should return correct monitoring status', () => {
      mockLocationService.isLocationTrackingActive.mockReturnValue(false);
      mockAudioService.getLoadedSoundCount.mockReturnValue(3);

      const status = LocationBasedAudioManager.getMonitoringStatus();

      expect(status.isActive).toBe(false);
      expect(status.currentStory).toBe(mockStory);
      expect(status.locationTrackingActive).toBe(false);
      expect(status.audioLoaded).toBe(true);
    });

    it('should update options correctly', () => {
      const newOptions = { autoPlay: false, triggerRadiusBuffer: 10 };
      
      LocationBasedAudioManager.updateOptions(newOptions);
      
      const options = LocationBasedAudioManager.getOptions();
      expect(options.autoPlay).toBe(false);
      expect(options.triggerRadiusBuffer).toBe(10);
    });

    it('should get nearby clips information', () => {
      mockLocationService.getLastKnownLocation.mockReturnValue(mockUserLocation);
      mockGeolocationUtils.calculateDistance
        .mockReturnValueOnce(50)  // clip1
        .mockReturnValueOnce(200) // clip2
        .mockReturnValueOnce(300); // clip3

      const nearbyClips = LocationBasedAudioManager.getNearbyClipsInfo(mockUserLocation);

      expect(nearbyClips).toHaveLength(3);
      expect(nearbyClips[0].clip.id).toBe('clip1'); // Closest
      expect(nearbyClips[0].distance).toBe(50);
      expect(nearbyClips[0].isInRange).toBe(true);
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      // Initialize with story
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });
      await LocationBasedAudioManager.initializeWithStory('test_story');
    });

    it('should cleanup all resources successfully', async () => {
      mockLocationService.cleanup.mockResolvedValue({ success: true });
      mockAudioService.cleanup.mockResolvedValue({ success: true });

      const result = await LocationBasedAudioManager.cleanup();

      expect(result.success).toBe(true);
      expect(mockLocationService.cleanup).toHaveBeenCalled();
      expect(mockAudioService.cleanup).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      mockLocationService.cleanup.mockResolvedValue({ 
        success: false, 
        error: 'Location cleanup failed' 
      });

      const result = await LocationBasedAudioManager.cleanup();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Location cleanup failed');
    });
  });

  describe('edge cases and error handling', () => {
    beforeEach(async () => {
      // Initialize with story
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });
      await LocationBasedAudioManager.initializeWithStory('test_story');
    });

    it('should handle location update errors gracefully', async () => {
      // Start monitoring
      mockLocationService.requestPermissions.mockResolvedValue({ success: true });
      mockLocationService.getLocationSettingsStatus.mockResolvedValue({ 
        success: true, 
        enabled: true 
      });
      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });
      
      const mockOnLocationUpdate = jest.fn();
      await LocationBasedAudioManager.startMonitoring(mockOnLocationUpdate);

      // Mock error in location update handling
      mockGeolocationUtils.getClipsInRange.mockImplementation(() => {
        throw new Error('Location update error');
      });

      // Simulate location update (should not crash)
      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];
      await expect(locationUpdateCallback(mockUserLocation)).resolves.not.toThrow();
    });

    it('should handle multiple overlapping trigger zones', async () => {
      // Mock user in range of multiple clips
      const userInMultipleZones: Location = { lat: 40.7600, lng: -73.9830 };
      mockGeolocationUtils.getClipsInRange.mockReturnValue([
        mockStory.soundClips[0], // clip1
        mockStory.soundClips[1], // clip2
      ]);
      mockGeolocationUtils.calculateDistance
        .mockReturnValueOnce(80)  // clip1 (radius 100)
        .mockReturnValueOnce(120); // clip2 (radius 150)
      mockAudioService.playSound.mockResolvedValue({ success: true });

      // Start monitoring
      mockLocationService.requestPermissions.mockResolvedValue({ success: true });
      mockLocationService.getLocationSettingsStatus.mockResolvedValue({ 
        success: true, 
        enabled: true 
      });
      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });
      
      const mockOnLocationUpdate = jest.fn();
      await LocationBasedAudioManager.startMonitoring(mockOnLocationUpdate);

      // Simulate location update
      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];
      await locationUpdateCallback(userInMultipleZones);

      // Should trigger both clips (first one will play, second will be queued)
      expect(mockAudioService.playSound).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid location changes', async () => {
      // Start monitoring
      mockLocationService.requestPermissions.mockResolvedValue({ success: true });
      mockLocationService.getLocationSettingsStatus.mockResolvedValue({ 
        success: true, 
        enabled: true 
      });
      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });
      
      const mockOnLocationUpdate = jest.fn();
      await LocationBasedAudioManager.startMonitoring(mockOnLocationUpdate);

      // Mock rapid location changes
      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];
      mockGeolocationUtils.getClipsInRange.mockReturnValue([mockStory.soundClips[0]]);
      mockGeolocationUtils.calculateDistance.mockReturnValue(50);
      mockAudioService.playSound.mockResolvedValue({ success: true });

      // Rapid updates
      const rapidUpdates = [
        { lat: 40.7589, lng: -73.9851 },
        { lat: 40.7589, lng: -73.9852 },
        { lat: 40.7589, lng: -73.9853 },
      ];

      for (const location of rapidUpdates) {
        await locationUpdateCallback(location);
      }

      // Should handle rapid updates without crashing
      expect(mockAudioService.playSound).toHaveBeenCalled();
    });
  });
});
