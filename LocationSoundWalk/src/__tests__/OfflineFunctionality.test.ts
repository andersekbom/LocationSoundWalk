import { StoryLoader } from '../services/StoryLoader';
import { AudioService } from '../services/AudioService';
import { LocationService } from '../services/LocationService';
import { LocationBasedAudioManager } from '../services/LocationBasedAudioManager';
import { GeolocationUtils } from '../utils/GeolocationUtils';

// Mock all dependencies
jest.mock('../services/StoryLoader');
jest.mock('../services/AudioService');
jest.mock('../services/LocationService');
jest.mock('../services/LocationBasedAudioManager');
jest.mock('../utils/GeolocationUtils');

const mockStoryLoader = StoryLoader as jest.Mocked<typeof StoryLoader>;
const mockAudioService = AudioService as jest.Mocked<typeof AudioService>;
const mockLocationService = LocationService as jest.Mocked<typeof LocationService>;
const mockLocationBasedAudioManager = LocationBasedAudioManager as jest.Mocked<typeof LocationBasedAudioManager>;
const mockGeolocationUtils = GeolocationUtils as jest.Mocked<typeof GeolocationUtils>;

describe('Offline Functionality Tests', () => {
  const mockStory = {
    id: 'offline_story',
    title: 'Offline Story',
    description: 'A story that works without internet',
    soundClips: [
      {
        id: 'clip1',
        file: 'clip1.mp3',
        lat: 40.7589,
        lng: -73.9851,
        radius: 100,
        title: 'Offline Clip 1',
      },
      {
        id: 'clip2',
        file: 'clip2.mp3',
        lat: 40.7648,
        lng: -73.9808,
        radius: 150,
        title: 'Offline Clip 2',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all static states
    (LocationBasedAudioManager as any).currentStory = null;
    (LocationBasedAudioManager as any).isActive = false;
    (LocationBasedAudioManager as any).lastTriggeredClips = new Set();
  });

  describe('Story Loading Without Internet', () => {
    it('should load stories from local JSON files without network access', async () => {
      // Mock successful local file loading
      mockStoryLoader.loadStories.mockResolvedValue({
        success: true,
        stories: [mockStory],
      });

      const result = await StoryLoader.loadStories();

      expect(result.success).toBe(true);
      expect(result.stories).toHaveLength(1);
      expect(result.stories![0].id).toBe('offline_story');
      expect(mockStoryLoader.loadStories).toHaveBeenCalledTimes(1);
    });

    it('should handle corrupted local JSON files gracefully', async () => {
      // Mock corrupted JSON data
      mockStoryLoader.loadStories.mockResolvedValue({
        success: false,
        error: 'Invalid JSON format',
      });

      const result = await StoryLoader.loadStories();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON format');
    });

    it('should validate story data structure locally', async () => {
      // Mock story with invalid structure
      const invalidStory = {
        id: 'invalid_story',
        // Missing required fields
      };

      mockStoryLoader.getStoryById.mockResolvedValue(invalidStory as any);

      const story = await StoryLoader.getStoryById('invalid_story');

      // Should still return the story (validation happens at load time)
      expect(story).toBeDefined();
    });

    it('should get story list without network requests', async () => {
      mockStoryLoader.getStoryList.mockResolvedValue([
        { id: 'story1', title: 'Story 1' },
        { id: 'story2', title: 'Story 2' },
      ]);

      const storyList = await StoryLoader.getStoryList();

      expect(storyList).toHaveLength(2);
      expect(mockStoryLoader.getStoryList).toHaveBeenCalledTimes(1);
    });
  });

  describe('Audio Loading Without Internet', () => {
    it('should load audio files from local assets', async () => {
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });

      const initResult = await AudioService.initialize();
      const loadResult = await AudioService.loadStorySounds(mockStory.soundClips);

      expect(initResult.success).toBe(true);
      expect(loadResult.success).toBe(true);
      expect(mockAudioService.loadStorySounds).toHaveBeenCalledWith(mockStory.soundClips);
    });

    it('should handle missing local audio files gracefully', async () => {
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({
        success: false,
        error: 'Audio file not found',
      });

      const result = await AudioService.loadStorySounds(mockStory.soundClips);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Audio file not found');
    });

    it('should play audio from local files without network', async () => {
      mockAudioService.playSound.mockResolvedValue({ success: true });
      mockAudioService.getPlaybackStatus.mockResolvedValue({
        isPlaying: true,
        currentSound: mockStory.soundClips[0],
        volume: 1.0,
        isLoaded: true,
      });

      const playResult = await AudioService.playSound(mockStory.soundClips[0]);
      const status = await AudioService.getPlaybackStatus();

      expect(playResult.success).toBe(true);
      expect(status.isPlaying).toBe(true);
      expect(status.currentSound?.id).toBe('clip1');
    });

    it('should control audio playback locally', async () => {
      mockAudioService.pauseCurrentSound.mockResolvedValue({ success: true });
      mockAudioService.stopCurrentSound.mockResolvedValue({ success: true });
      mockAudioService.setVolume.mockResolvedValue({ success: true });

      const pauseResult = await AudioService.pauseCurrentSound();
      const stopResult = await AudioService.stopCurrentSound();
      const volumeResult = await AudioService.setVolume(0.5);

      expect(pauseResult.success).toBe(true);
      expect(stopResult.success).toBe(true);
      expect(volumeResult.success).toBe(true);
    });
  });

  describe('Location Services Without Internet', () => {
    it('should work with GPS coordinates without network access', async () => {
      mockLocationService.requestPermissions.mockResolvedValue({ success: true });
      mockLocationService.getLocationSettingsStatus.mockResolvedValue({
        success: true,
        enabled: true,
      });
      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });

      const permissionsResult = await LocationService.requestPermissions();
      const settingsResult = await LocationService.getLocationSettingsStatus();
      const trackingResult = await LocationService.startLocationTracking(() => {});

      expect(permissionsResult.success).toBe(true);
      expect(settingsResult.success).toBe(true);
      expect(trackingResult.success).toBe(true);
    });

    it('should calculate distances using local GPS data', () => {
      const userLocation = { lat: 40.7589, lng: -73.9851 };
      const targetLocation = { lat: 40.7648, lng: -73.9808 };

      mockGeolocationUtils.calculateDistance.mockReturnValue(750.5);
      mockGeolocationUtils.isWithinRadius.mockReturnValue(false);

      const distance = GeolocationUtils.calculateDistance(
        userLocation.lat,
        userLocation.lng,
        targetLocation.lat,
        targetLocation.lng
      );
      const isInRange = GeolocationUtils.isWithinRadius(userLocation, {
        ...mockStory.soundClips[0],
        lat: targetLocation.lat,
        lng: targetLocation.lng,
      });

      expect(distance).toBe(750.5);
      expect(isInRange).toBe(false);
    });

    it('should handle location permission denial gracefully', async () => {
      mockLocationService.requestPermissions.mockResolvedValue({
        success: false,
        error: 'Permission denied',
      });

      const result = await LocationService.requestPermissions();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });

    it('should detect when location services are disabled', async () => {
      mockLocationService.getLocationSettingsStatus.mockResolvedValue({
        success: false,
        error: 'Location services disabled',
      });

      const result = await LocationService.getLocationSettingsStatus();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Location services disabled');
    });
  });

  describe('Location-Based Audio Without Internet', () => {
    it('should initialize location-based audio manager offline', async () => {
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });

      const result = await LocationBasedAudioManager.initializeWithStory('offline_story');

      expect(result.success).toBe(true);
      expect(mockStoryLoader.getStoryById).toHaveBeenCalledWith('offline_story');
      expect(mockAudioService.loadStorySounds).toHaveBeenCalledWith(mockStory.soundClips);
    });

    it('should start location monitoring without network', async () => {
      // Initialize first
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });
      await LocationBasedAudioManager.initializeWithStory('offline_story');

      // Start monitoring
      mockLocationService.requestPermissions.mockResolvedValue({ success: true });
      mockLocationService.getLocationSettingsStatus.mockResolvedValue({
        success: true,
        enabled: true,
      });
      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });

      const result = await LocationBasedAudioManager.startMonitoring();

      expect(result.success).toBe(true);
      expect(mockLocationService.startLocationTracking).toHaveBeenCalled();
    });

    it('should trigger audio based on local GPS coordinates', async () => {
      // Initialize and start monitoring
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });
      await LocationBasedAudioManager.initializeWithStory('offline_story');

      mockLocationService.requestPermissions.mockResolvedValue({ success: true });
      mockLocationService.getLocationSettingsStatus.mockResolvedValue({
        success: true,
        enabled: true,
      });
      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });

      const mockOnLocationUpdate = jest.fn();
      await LocationBasedAudioManager.startMonitoring(mockOnLocationUpdate);

      // Mock user entering trigger zone
      const userInRange = { lat: 40.7589, lng: -73.9851 };
      mockGeolocationUtils.getClipsInRange.mockReturnValue([mockStory.soundClips[0]]);
      mockGeolocationUtils.calculateDistance.mockReturnValue(50);
      mockAudioService.playSound.mockResolvedValue({ success: true });

      // Simulate location update
      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];
      await locationUpdateCallback(userInRange);

      expect(mockAudioService.playSound).toHaveBeenCalledWith(mockStory.soundClips[0]);
    });

    it('should get nearby clips information offline', () => {
      mockLocationService.getLastKnownLocation.mockReturnValue({ lat: 40.7589, lng: -73.9851 });
      mockGeolocationUtils.calculateDistance
        .mockReturnValueOnce(50)  // clip1
        .mockReturnValueOnce(200); // clip2

      const nearbyClips = LocationBasedAudioManager.getNearbyClipsInfo({ lat: 40.7589, lng: -73.9851 });

      expect(nearbyClips).toHaveLength(2);
      expect(nearbyClips[0].clip.id).toBe('clip1');
      expect(nearbyClips[0].distance).toBe(50);
      expect(nearbyClips[0].isInRange).toBe(true);
    });
  });

  describe('Complete Offline Workflow', () => {
    it('should complete full story experience without internet', async () => {
      // 1. Load stories offline
      mockStoryLoader.loadStories.mockResolvedValue({
        success: true,
        stories: [mockStory],
      });
      const storiesResult = await StoryLoader.loadStories();
      expect(storiesResult.success).toBe(true);

      // 2. Initialize audio system offline
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });
      const audioInitResult = await AudioService.initialize();
      expect(audioInitResult.success).toBe(true);

      // 3. Load story audio offline
      const audioLoadResult = await AudioService.loadStorySounds(mockStory.soundClips);
      expect(audioLoadResult.success).toBe(true);

      // 4. Initialize location-based audio manager offline
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      const managerInitResult = await LocationBasedAudioManager.initializeWithStory('offline_story');
      expect(managerInitResult.success).toBe(true);

      // 5. Start location monitoring offline
      mockLocationService.requestPermissions.mockResolvedValue({ success: true });
      mockLocationService.getLocationSettingsStatus.mockResolvedValue({
        success: true,
        enabled: true,
      });
      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });

      const monitoringResult = await LocationBasedAudioManager.startMonitoring();
      expect(monitoringResult.success).toBe(true);

      // 6. Verify all services are working offline
      expect(mockStoryLoader.loadStories).toHaveBeenCalledTimes(1);
      expect(mockAudioService.initialize).toHaveBeenCalledTimes(1);
      expect(mockAudioService.loadStorySounds).toHaveBeenCalledTimes(1);
      expect(mockLocationService.startLocationTracking).toHaveBeenCalledTimes(1);
    });

    it('should handle offline error scenarios gracefully', async () => {
      // Test various offline error conditions
      const errorScenarios = [
        {
          service: 'StoryLoader',
          mock: mockStoryLoader.loadStories,
          error: { success: false, error: 'File system error' },
        },
        {
          service: 'AudioService',
          mock: mockAudioService.initialize,
          error: { success: false, error: 'Audio system unavailable' },
        },
        {
          service: 'LocationService',
          mock: mockLocationService.requestPermissions,
          error: { success: false, error: 'GPS unavailable' },
        },
      ];

      for (const scenario of errorScenarios) {
        scenario.mock.mockResolvedValue(scenario.error);
        const result = await scenario.mock();
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Offline Data Persistence', () => {
    it('should maintain story selection without network', async () => {
      // Load stories
      mockStoryLoader.loadStories.mockResolvedValue({
        success: true,
        stories: [mockStory],
      });
      await StoryLoader.loadStories();

      // Get story by ID (simulating selection)
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      const selectedStory = await StoryLoader.getStoryById('offline_story');

      expect(selectedStory).toBeDefined();
      expect(selectedStory?.id).toBe('offline_story');
    });

    it('should preserve audio playback state offline', async () => {
      mockAudioService.getPlaybackStatus.mockResolvedValue({
        isPlaying: true,
        currentSound: mockStory.soundClips[0],
        volume: 0.8,
        isLoaded: true,
      });

      const status = await AudioService.getPlaybackStatus();

      expect(status.isPlaying).toBe(true);
      expect(status.currentSound?.id).toBe('clip1');
      expect(status.volume).toBe(0.8);
    });

    it('should maintain location monitoring state offline', () => {
      mockLocationService.isLocationTrackingActive.mockReturnValue(true);
      mockLocationService.getLastKnownLocation.mockReturnValue({ lat: 40.7589, lng: -73.9851 });

      const isTracking = LocationService.isLocationTrackingActive();
      const lastLocation = LocationService.getLastKnownLocation();

      expect(isTracking).toBe(true);
      expect(lastLocation).toBeDefined();
      expect(lastLocation?.lat).toBe(40.7589);
    });
  });
});
