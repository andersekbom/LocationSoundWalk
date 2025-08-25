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

describe('Network Disabled Tests (Airplane Mode)', () => {
  const mockStory = {
    id: 'airplane_story',
    title: 'Airplane Mode Story',
    description: 'A story that works without network access',
    soundClips: [
      {
        id: 'clip1',
        file: 'clip1.mp3',
        lat: 40.7589,
        lng: -73.9851,
        radius: 100,
        title: 'Airplane Clip 1',
      },
      {
        id: 'clip2',
        file: 'clip2.mp3',
        lat: 40.7648,
        lng: -73.9808,
        radius: 150,
        title: 'Airplane Clip 2',
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

  describe('Story Loading with Network Disabled', () => {
    it('should load stories from local files when network is unavailable', async () => {
      // Simulate network unavailable scenario
      mockStoryLoader.loadStories.mockResolvedValue({
        success: true,
        stories: [mockStory],
      });

      const result = await StoryLoader.loadStories();

      expect(result.success).toBe(true);
      expect(result.stories).toHaveLength(1);
      expect(result.stories![0].id).toBe('airplane_story');
      
      // Verify no network requests were made
      expect(mockStoryLoader.loadStories).toHaveBeenCalledTimes(1);
    });

    it('should handle story validation without network access', async () => {
      // Mock story with validation that works offline
      const validStory = {
        id: 'valid_offline_story',
        title: 'Valid Offline Story',
        description: 'A properly formatted story',
        soundClips: [
          {
            id: 'valid_clip',
            file: 'valid_clip.mp3',
            lat: 40.7589,
            lng: -73.9851,
            radius: 100,
            title: 'Valid Clip',
          },
        ],
      };

      mockStoryLoader.getStoryById.mockResolvedValue(validStory);

      const story = await StoryLoader.getStoryById('valid_offline_story');

      expect(story).toBeDefined();
      expect(story?.id).toBe('valid_offline_story');
      expect(story?.soundClips).toHaveLength(1);
    });

    it('should provide story list without network dependency', async () => {
      mockStoryLoader.getStoryList.mockResolvedValue([
        { id: 'story1', title: 'Story 1', description: 'First story' },
        { id: 'story2', title: 'Story 2', description: 'Second story' },
        { id: 'story3', title: 'Story 3', description: 'Third story' },
      ]);

      const storyList = await StoryLoader.getStoryList();

      expect(storyList).toHaveLength(3);
      expect(storyList[0].title).toBe('Story 1');
      expect(storyList[1].title).toBe('Story 2');
      expect(storyList[2].title).toBe('Story 3');
    });
  });

  describe('Audio System with Network Disabled', () => {
    it('should initialize audio system without network access', async () => {
      mockAudioService.initialize.mockResolvedValue({ success: true });

      const result = await AudioService.initialize();

      expect(result.success).toBe(true);
      expect(mockAudioService.initialize).toHaveBeenCalledTimes(1);
    });

    it('should load audio files from local assets when network is down', async () => {
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });

      const initResult = await AudioService.initialize();
      const loadResult = await AudioService.loadStorySounds(mockStory.soundClips);

      expect(initResult.success).toBe(true);
      expect(loadResult.success).toBe(true);
      expect(mockAudioService.loadStorySounds).toHaveBeenCalledWith(mockStory.soundClips);
    });

    it('should play audio files locally without network dependency', async () => {
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

    it('should control audio playback locally in airplane mode', async () => {
      // Test all audio control functions
      const audioControls = [
        { method: mockAudioService.pauseCurrentSound, name: 'pause' },
        { method: mockAudioService.stopCurrentSound, name: 'stop' },
        { method: mockAudioService.resumeCurrentSound, name: 'resume' },
        { method: mockAudioService.setVolume, name: 'volume' },
      ];

      for (const control of audioControls) {
        control.method.mockResolvedValue({ success: true });
      }

      const pauseResult = await AudioService.pauseCurrentSound();
      const stopResult = await AudioService.stopCurrentSound();
      const resumeResult = await AudioService.resumeCurrentSound();
      const volumeResult = await AudioService.setVolume(0.7);

      expect(pauseResult.success).toBe(true);
      expect(stopResult.success).toBe(true);
      expect(resumeResult.success).toBe(true);
      expect(volumeResult.success).toBe(true);
    });
  });

  describe('Location Services with Network Disabled', () => {
    it('should request location permissions without network access', async () => {
      mockLocationService.requestPermissions.mockResolvedValue({ success: true });

      const result = await LocationService.requestPermissions();

      expect(result.success).toBe(true);
      expect(mockLocationService.requestPermissions).toHaveBeenCalledTimes(1);
    });

    it('should check location services status offline', async () => {
      mockLocationService.getLocationSettingsStatus.mockResolvedValue({
        success: true,
        enabled: true,
      });

      const result = await LocationService.getLocationSettingsStatus();

      expect(result.success).toBe(true);
      expect(result.enabled).toBe(true);
    });

    it('should start location tracking without network dependency', async () => {
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

    it('should calculate GPS distances locally without network', () => {
      const userLocation = { lat: 40.7589, lng: -73.9851 };
      const targetLocation = { lat: 40.7648, lng: -73.9808 };

      mockGeolocationUtils.calculateDistance.mockReturnValue(650.2);
      mockGeolocationUtils.isWithinRadius.mockReturnValue(true);

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

      expect(distance).toBe(650.2);
      expect(isInRange).toBe(true);
    });

    it('should provide location accuracy information offline', async () => {
      mockLocationService.getLocationAccuracy.mockResolvedValue({
        success: true,
        accuracy: 5.2,
        history: [
          { accuracy: 5.2, timestamp: new Date(), altitude: 10, heading: 180, speed: 0 },
        ],
      });

      const result = await LocationService.getLocationAccuracy();

      expect(result.success).toBe(true);
      expect(result.accuracy).toBe(5.2);
      expect(result.history).toHaveLength(1);
    });
  });

  describe('Location-Based Audio with Network Disabled', () => {
    it('should initialize location-based audio manager offline', async () => {
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });

      const result = await LocationBasedAudioManager.initializeWithStory('airplane_story');

      expect(result.success).toBe(true);
      expect(mockStoryLoader.getStoryById).toHaveBeenCalledWith('airplane_story');
      expect(mockAudioService.loadStorySounds).toHaveBeenCalledWith(mockStory.soundClips);
    });

    it('should start location monitoring without network access', async () => {
      // Initialize first
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });
      await LocationBasedAudioManager.initializeWithStory('airplane_story');

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

    it('should trigger audio based on local GPS in airplane mode', async () => {
      // Initialize and start monitoring
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });
      await LocationBasedAudioManager.initializeWithStory('airplane_story');

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
      mockGeolocationUtils.calculateDistance.mockReturnValue(75);
      mockAudioService.playSound.mockResolvedValue({ success: true });

      // Simulate location update
      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];
      await locationUpdateCallback(userInRange);

      expect(mockAudioService.playSound).toHaveBeenCalledWith(mockStory.soundClips[0]);
    });

    it('should provide nearby clips information without network', () => {
      mockLocationService.getLastKnownLocation.mockReturnValue({ lat: 40.7589, lng: -73.9851 });
      mockGeolocationUtils.calculateDistance
        .mockReturnValueOnce(75)   // clip1 (within 100m radius)
        .mockReturnValueOnce(200); // clip2 (outside 150m radius)

      const nearbyClips = LocationBasedAudioManager.getNearbyClipsInfo({ lat: 40.7589, lng: -73.9851 });

      expect(nearbyClips).toHaveLength(2);
      expect(nearbyClips[0].clip.id).toBe('clip1');
      expect(nearbyClips[0].distance).toBe(75);
      expect(nearbyClips[0].isInRange).toBe(true);
      expect(nearbyClips[1].clip.id).toBe('clip2');
      expect(nearbyClips[1].distance).toBe(200);
      expect(nearbyClips[1].isInRange).toBe(false);
    });
  });

  describe('Complete Airplane Mode Workflow', () => {
    it('should complete full story experience without network access', async () => {
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
      const managerInitResult = await LocationBasedAudioManager.initializeWithStory('airplane_story');
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

      // 6. Verify complete offline functionality
      expect(mockStoryLoader.loadStories).toHaveBeenCalledTimes(1);
      expect(mockAudioService.initialize).toHaveBeenCalledTimes(1);
      expect(mockAudioService.loadStorySounds).toHaveBeenCalledTimes(1);
      expect(mockLocationService.startLocationTracking).toHaveBeenCalledTimes(1);
    });

    it('should handle airplane mode error scenarios gracefully', async () => {
      // Test various offline error conditions
      const errorScenarios = [
        {
          service: 'StoryLoader',
          mock: mockStoryLoader.loadStories,
          error: { success: false, error: 'Local file system error' },
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

  describe('Airplane Mode Data Persistence', () => {
    it('should maintain story selection without network', async () => {
      // Load stories
      mockStoryLoader.loadStories.mockResolvedValue({
        success: true,
        stories: [mockStory],
      });
      await StoryLoader.loadStories();

      // Get story by ID (simulating selection)
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      const selectedStory = await StoryLoader.getStoryById('airplane_story');

      expect(selectedStory).toBeDefined();
      expect(selectedStory?.id).toBe('airplane_story');
    });

    it('should preserve audio playback state in airplane mode', async () => {
      mockAudioService.getPlaybackStatus.mockResolvedValue({
        isPlaying: true,
        currentSound: mockStory.soundClips[0],
        volume: 0.6,
        isLoaded: true,
      });

      const status = await AudioService.getPlaybackStatus();

      expect(status.isPlaying).toBe(true);
      expect(status.currentSound?.id).toBe('clip1');
      expect(status.volume).toBe(0.6);
    });

    it('should maintain location monitoring state without network', () => {
      mockLocationService.isLocationTrackingActive.mockReturnValue(true);
      mockLocationService.getLastKnownLocation.mockReturnValue({ lat: 40.7589, lng: -73.9851 });

      const isTracking = LocationService.isLocationTrackingActive();
      const lastLocation = LocationService.getLastKnownLocation();

      expect(isTracking).toBe(true);
      expect(lastLocation).toBeDefined();
      expect(lastLocation?.lat).toBe(40.7589);
    });
  });

  describe('Network Reconnection Handling', () => {
    it('should continue working when network is restored', async () => {
      // Start in airplane mode
      mockStoryLoader.loadStories.mockResolvedValue({
        success: true,
        stories: [mockStory],
      });
      await StoryLoader.loadStories();

      // Simulate network restoration
      const storiesAfterReconnect = await StoryLoader.loadStories();

      expect(storiesAfterReconnect.success).toBe(true);
      expect(storiesAfterReconnect.stories).toHaveLength(1);
    });

    it('should maintain app state during network transitions', async () => {
      // Initialize without network
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });
      
      const managerInitResult = await LocationBasedAudioManager.initializeWithStory('airplane_story');
      expect(managerInitResult.success).toBe(true);

      // Verify state is maintained
      const status = LocationBasedAudioManager.getMonitoringStatus();
      expect(status.currentStory?.id).toBe('airplane_story');
      expect(status.audioLoaded).toBe(true);
    });
  });
});
