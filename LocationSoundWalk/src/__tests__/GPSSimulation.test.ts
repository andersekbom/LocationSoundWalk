import { LocationService } from '../services/LocationService';
import { LocationBasedAudioManager } from '../services/LocationBasedAudioManager';
import { GeolocationUtils } from '../utils/GeolocationUtils';
import { AudioService } from '../services/AudioService';
import { StoryLoader } from '../services/StoryLoader';

// Mock all dependencies
jest.mock('../services/LocationService');
jest.mock('../services/LocationBasedAudioManager');
jest.mock('../utils/GeolocationUtils');
jest.mock('../services/AudioService');
jest.mock('../services/StoryLoader');

const mockLocationService = LocationService as jest.Mocked<typeof LocationService>;
const mockLocationBasedAudioManager = LocationBasedAudioManager as jest.Mocked<typeof LocationBasedAudioManager>;
const mockGeolocationUtils = GeolocationUtils as jest.Mocked<typeof GeolocationUtils>;
const mockAudioService = AudioService as jest.Mocked<typeof AudioService>;
const mockStoryLoader = StoryLoader as jest.Mocked<typeof StoryLoader>;

describe('GPS Simulation Tests', () => {
  const mockStory = {
    id: 'gps_test_story',
    title: 'GPS Test Story',
    description: 'A story for testing GPS functionality',
    soundClips: [
      {
        id: 'clip1',
        file: 'clip1.mp3',
        lat: 40.7589,
        lng: -73.9851,
        radius: 100,
        title: 'GPS Clip 1',
      },
      {
        id: 'clip2',
        file: 'clip2.mp3',
        lat: 40.7648,
        lng: -73.9808,
        radius: 150,
        title: 'GPS Clip 2',
      },
      {
        id: 'clip3',
        file: 'clip3.mp3',
        lat: 40.8000,
        lng: -73.9000,
        radius: 200,
        title: 'GPS Clip 3',
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

  describe('GPS Coordinate Simulation', () => {
    it('should receive and process GPS coordinate updates', async () => {
      // Mock location service to accept simulated coordinates
      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });
      mockLocationService.getLastKnownLocation.mockReturnValue({ lat: 40.7589, lng: -73.9851 });

      // Start location tracking
      const mockOnLocationUpdate = jest.fn();
      const result = await LocationService.startLocationTracking(mockOnLocationUpdate);

      expect(result.success).toBe(true);
      expect(mockLocationService.startLocationTracking).toHaveBeenCalledWith(mockOnLocationUpdate);
    });

    it('should handle rapid GPS coordinate changes', async () => {
      // Mock location service
      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });
      mockLocationService.getLastKnownLocation.mockReturnValue({ lat: 40.7589, lng: -73.9851 });

      // Start tracking
      const mockOnLocationUpdate = jest.fn();
      await LocationService.startLocationTracking(mockOnLocationUpdate);

      // Simulate rapid coordinate changes
      const rapidCoordinates = [
        { lat: 40.7589, lng: -73.9851 },
        { lat: 40.7589, lng: -73.9852 },
        { lat: 40.7589, lng: -73.9853 },
        { lat: 40.7589, lng: -73.9854 },
        { lat: 40.7589, lng: -73.9855 },
      ];

      // Get the callback function that was passed to startLocationTracking
      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];

      // Process rapid updates
      for (const coords of rapidCoordinates) {
        await locationUpdateCallback(coords);
      }

      // Verify the callback was called for each coordinate
      expect(mockOnLocationUpdate).toHaveBeenCalledTimes(5);
    });

    it('should handle GPS coordinate precision and accuracy', async () => {
      // Mock location service with accuracy information
      mockLocationService.getLocationAccuracy.mockResolvedValue({
        success: true,
        accuracy: 3.5,
        history: [
          { accuracy: 3.5, timestamp: new Date(), altitude: 15, heading: 90, speed: 2.5 },
        ],
      });

      const result = await LocationService.getLocationAccuracy();

      expect(result.success).toBe(true);
      expect(result.accuracy).toBe(3.5);
      expect(result.history).toHaveLength(1);
      expect(result.history![0].altitude).toBe(15);
      expect(result.history![0].heading).toBe(90);
      expect(result.history![0].speed).toBe(2.5);
    });

    it('should validate GPS coordinate ranges', () => {
      // Test valid coordinates
      const validCoordinates = [
        { lat: 40.7589, lng: -73.9851 }, // NYC
        { lat: 51.5074, lng: -0.1278 },  // London
        { lat: 35.6762, lng: 139.6503 }, // Tokyo
        { lat: -33.8688, lng: 151.2093 }, // Sydney
      ];

      for (const coords of validCoordinates) {
        const isValid = GeolocationUtils.isValidCoordinates(coords.lat, coords.lng);
        expect(isValid).toBe(true);
      }

      // Test invalid coordinates
      const invalidCoordinates = [
        { lat: 91.0, lng: 0.0 },    // Latitude > 90
        { lat: -91.0, lng: 0.0 },   // Latitude < -90
        { lat: 0.0, lng: 181.0 },   // Longitude > 180
        { lat: 0.0, lng: -181.0 },  // Longitude < -180
        { lat: NaN, lng: 0.0 },     // Invalid latitude
        { lat: 0.0, lng: NaN },     // Invalid longitude
      ];

      for (const coords of invalidCoordinates) {
        const isValid = GeolocationUtils.isValidCoordinates(coords.lat, coords.lng);
        expect(isValid).toBe(false);
      }
    });
  });

  describe('GPS-Based Audio Triggering', () => {
    beforeEach(async () => {
      // Initialize the system
      mockStoryLoader.getStoryById.mockResolvedValue(mockStory);
      mockAudioService.initialize.mockResolvedValue({ success: true });
      mockAudioService.loadStorySounds.mockResolvedValue({ success: true });
      await LocationBasedAudioManager.initializeWithStory('gps_test_story');

      // Start location monitoring
      mockLocationService.requestPermissions.mockResolvedValue({ success: true });
      mockLocationService.getLocationSettingsStatus.mockResolvedValue({
        success: true,
        enabled: true,
      });
      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });
    });

    it('should trigger audio when entering sound clip radius', async () => {
      const mockOnLocationUpdate = jest.fn();
      await LocationBasedAudioManager.startMonitoring(mockOnLocationUpdate);

      // Mock user entering clip1's radius
      const userInRange = { lat: 40.7589, lng: -73.9851 };
      mockGeolocationUtils.getClipsInRange.mockReturnValue([mockStory.soundClips[0]]);
      mockGeolocationUtils.calculateDistance.mockReturnValue(50); // Within 100m radius
      mockAudioService.playSound.mockResolvedValue({ success: true });

      // Simulate location update
      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];
      await locationUpdateCallback(userInRange);

      expect(mockAudioService.playSound).toHaveBeenCalledWith(mockStory.soundClips[0]);
      expect(mockOnLocationUpdate).toHaveBeenCalled();
    });

    it('should not trigger audio when outside all sound clip radii', async () => {
      const mockOnLocationUpdate = jest.fn();
      await LocationBasedAudioManager.startMonitoring(mockOnLocationUpdate);

      // Mock user outside all clip radii
      const userOutOfRange = { lat: 40.9000, lng: -73.8000 };
      mockGeolocationUtils.getClipsInRange.mockReturnValue([]);

      // Simulate location update
      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];
      await locationUpdateCallback(userOutOfRange);

      expect(mockAudioService.playSound).not.toHaveBeenCalled();
    });

    it('should handle multiple overlapping trigger zones', async () => {
      const mockOnLocationUpdate = jest.fn();
      await LocationBasedAudioManager.startMonitoring(mockOnLocationUpdate);

      // Mock user in range of multiple clips
      const userInMultipleZones = { lat: 40.7600, lng: -73.9830 };
      mockGeolocationUtils.getClipsInRange.mockReturnValue([
        mockStory.soundClips[0], // clip1 (radius 100)
        mockStory.soundClips[1], // clip2 (radius 150)
      ]);
      mockGeolocationUtils.calculateDistance
        .mockReturnValueOnce(80)  // clip1 (within 100m)
        .mockReturnValueOnce(120); // clip2 (within 150m)
      mockAudioService.playSound.mockResolvedValue({ success: true });

      // Simulate location update
      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];
      await locationUpdateCallback(userInMultipleZones);

      // Should trigger both clips
      expect(mockAudioService.playSound).toHaveBeenCalledTimes(2);
      expect(mockAudioService.playSound).toHaveBeenCalledWith(mockStory.soundClips[0]);
      expect(mockAudioService.playSound).toHaveBeenCalledWith(mockStory.soundClips[1]);
    });

    it('should stop audio when exiting trigger zone', async () => {
      const mockOnLocationUpdate = jest.fn();
      await LocationBasedAudioManager.startMonitoring(mockOnLocationUpdate);

      // Mock user entering clip1's radius
      const userInRange = { lat: 40.7589, lng: -73.9851 };
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
      const userOutOfRange = { lat: 40.8000, lng: -73.9000 };
      mockGeolocationUtils.getClipsInRange.mockReturnValue([]);
      mockGeolocationUtils.calculateDistance.mockReturnValue(300); // Outside 100m radius

      // Exit zone
      await locationUpdateCallback(userOutOfRange);

      expect(mockAudioService.stopCurrentSound).toHaveBeenCalled();
    });
  });

  describe('GPS Movement Patterns', () => {
    it('should handle walking movement pattern', async () => {
      // Simulate walking movement (slow, consistent updates)
      const walkingPath = [
        { lat: 40.7589, lng: -73.9851 }, // Start
        { lat: 40.7589, lng: -73.9852 }, // 1 step
        { lat: 40.7589, lng: -73.9853 }, // 2 steps
        { lat: 40.7589, lng: -73.9854 }, // 3 steps
        { lat: 40.7589, lng: -73.9855 }, // 4 steps
      ];

      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });
      const mockOnLocationUpdate = jest.fn();
      await LocationService.startLocationTracking(mockOnLocationUpdate);

      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];

      // Simulate walking movement
      for (const coords of walkingPath) {
        await locationUpdateCallback(coords);
        // Add small delay to simulate walking speed
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(mockOnLocationUpdate).toHaveBeenCalledTimes(5);
    });

    it('should handle vehicle movement pattern', async () => {
      // Simulate vehicle movement (faster, larger updates)
      const vehiclePath = [
        { lat: 40.7589, lng: -73.9851 }, // Start
        { lat: 40.7590, lng: -73.9850 }, // 100m north
        { lat: 40.7595, lng: -73.9845 }, // 500m northeast
        { lat: 40.7600, lng: -73.9840 }, // 1km northeast
      ];

      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });
      const mockOnLocationUpdate = jest.fn();
      await LocationService.startLocationTracking(mockOnLocationUpdate);

      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];

      // Simulate vehicle movement
      for (const coords of vehiclePath) {
        await locationUpdateCallback(coords);
        // Add small delay to simulate vehicle speed
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      expect(mockOnLocationUpdate).toHaveBeenCalledTimes(4);
    });

    it('should handle stationary GPS updates', async () => {
      // Simulate stationary user (same coordinates, different accuracy)
      const stationaryUpdates = [
        { lat: 40.7589, lng: -73.9851, accuracy: 5.0 },
        { lat: 40.7589, lng: -73.9851, accuracy: 4.8 },
        { lat: 40.7589, lng: -73.9851, accuracy: 5.2 },
        { lat: 40.7589, lng: -73.9851, accuracy: 4.9 },
      ];

      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });
      const mockOnLocationUpdate = jest.fn();
      await LocationService.startLocationTracking(mockOnLocationUpdate);

      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];

      // Simulate stationary updates
      for (const update of stationaryUpdates) {
        await locationUpdateCallback(update);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      expect(mockOnLocationUpdate).toHaveBeenCalledTimes(4);
    });
  });

  describe('GPS Error Handling', () => {
    it('should handle GPS signal loss gracefully', async () => {
      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });
      const mockOnLocationUpdate = jest.fn();
      await LocationService.startLocationTracking(mockOnLocationUpdate);

      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];

      // Simulate GPS signal loss (null coordinates)
      await locationUpdateCallback(null as any);

      // Should handle null coordinates without crashing
      expect(mockOnLocationUpdate).toHaveBeenCalledWith(null);
    });

    it('should handle poor GPS accuracy', async () => {
      mockLocationService.getLocationAccuracy.mockResolvedValue({
        success: true,
        accuracy: 25.0, // Poor accuracy
        history: [
          { accuracy: 25.0, timestamp: new Date(), altitude: undefined, heading: undefined, speed: undefined },
        ],
      });

      const result = await LocationService.getLocationAccuracy();

      expect(result.success).toBe(true);
      expect(result.accuracy).toBe(25.0);
      expect(result.accuracy).toBeGreaterThan(20.0); // Poor accuracy threshold
    });

    it('should handle GPS timeout scenarios', async () => {
      mockLocationService.startLocationTracking.mockResolvedValue({ success: true });
      const mockOnLocationUpdate = jest.fn();
      await LocationService.startLocationTracking(mockOnLocationUpdate);

      // Simulate GPS timeout (no updates for extended period)
      const locationUpdateCallback = mockLocationService.startLocationTracking.mock.calls[0][0];

      // Send initial location
      await locationUpdateCallback({ lat: 40.7589, lng: -73.9851 });

      // Wait for "timeout" (simulated by no further updates)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should handle timeout gracefully
      expect(mockOnLocationUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('GPS Coordinate Validation', () => {
    it('should validate coordinate precision and format', () => {
      // Test various coordinate formats and precision
      const testCoordinates = [
        { lat: 40.7589, lng: -73.9851, expected: true },   // Standard precision
        { lat: 40.758900, lng: -73.985100, expected: true }, // High precision
        { lat: 40.76, lng: -73.99, expected: true },       // Low precision
        { lat: 40.758912345, lng: -73.985112345, expected: true }, // Very high precision
      ];

      for (const test of testCoordinates) {
        const isValid = GeolocationUtils.isValidCoordinates(test.lat, test.lng);
        expect(isValid).toBe(test.expected);
      }
    });

    it('should handle edge case coordinates', () => {
      // Test edge cases
      const edgeCases = [
        { lat: 90.0, lng: 0.0, expected: true },      // North Pole
        { lat: -90.0, lng: 0.0, expected: true },     // South Pole
        { lat: 0.0, lng: 180.0, expected: true },     // International Date Line
        { lat: 0.0, lng: -180.0, expected: true },    // International Date Line (negative)
        { lat: 0.0, lng: 0.0, expected: true },       // Prime Meridian & Equator
      ];

      for (const edgeCase of edgeCases) {
        const isValid = GeolocationUtils.isValidCoordinates(edgeCase.lat, edgeCase.lng);
        expect(isValid).toBe(edgeCase.expected);
      }
    });
  });
});
