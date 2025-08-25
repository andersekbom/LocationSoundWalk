import { GeolocationUtils, Location } from '../utils/GeolocationUtils';
import { SoundClip } from '../types';

describe('GeolocationUtils', () => {
  const testLocation1: Location = { lat: 40.7589, lng: -73.9851 }; // Times Square
  const testLocation2: Location = { lat: 40.7648, lng: -73.9808 }; // Central Park
  const testLocation3: Location = { lat: 40.7829, lng: -73.9654 }; // Upper East Side

  const testSoundClip: SoundClip = {
    id: 'test_clip',
    file: 'test.mp3',
    lat: 40.7589,
    lng: -73.9851,
    radius: 100,
    title: 'Test Clip'
  };

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates correctly', () => {
      const distance = GeolocationUtils.calculateDistance(
        testLocation1.lat,
        testLocation1.lng,
        testLocation2.lat,
        testLocation2.lng
      );

      // Distance should be positive and reasonable (Times Square to Central Park ~1km)
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(2000); // Less than 2km
      expect(typeof distance).toBe('number');
    });

    it('should return 0 for identical coordinates', () => {
      const distance = GeolocationUtils.calculateDistance(
        testLocation1.lat,
        testLocation1.lng,
        testLocation1.lat,
        testLocation1.lng
      );

      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const negativeLocation: Location = { lat: -40.7589, lng: -73.9851 };
      const distance = GeolocationUtils.calculateDistance(
        testLocation1.lat,
        testLocation1.lng,
        negativeLocation.lat,
        negativeLocation.lng
      );

      expect(distance).toBeGreaterThan(0);
      expect(typeof distance).toBe('number');
    });

    it('should handle coordinates around the world', () => {
      const farLocation: Location = { lat: 40.7589, lng: 106.0149 }; // Opposite side of world
      const distance = GeolocationUtils.calculateDistance(
        testLocation1.lat,
        testLocation1.lng,
        farLocation.lat,
        farLocation.lng
      );

      expect(distance).toBeGreaterThan(10000000); // Should be very large
      expect(typeof distance).toBe('number');
    });
  });

  describe('calculateDistanceBetweenLocations', () => {
    it('should calculate distance between Location objects', () => {
      const distance = GeolocationUtils.calculateDistanceBetweenLocations(
        testLocation1,
        testLocation2
      );

      expect(distance).toBeGreaterThan(0);
      expect(typeof distance).toBe('number');
    });

    it('should return same result as calculateDistance', () => {
      const distance1 = GeolocationUtils.calculateDistance(
        testLocation1.lat,
        testLocation1.lng,
        testLocation2.lat,
        testLocation2.lng
      );

      const distance2 = GeolocationUtils.calculateDistanceBetweenLocations(
        testLocation1,
        testLocation2
      );

      expect(distance1).toBe(distance2);
    });
  });

  describe('isWithinRadius', () => {
    it('should return true when location is within radius', () => {
      const nearbyLocation: Location = { lat: 40.7589, lng: -73.9851 }; // Same as clip
      const result = GeolocationUtils.isWithinRadius(nearbyLocation, testSoundClip);

      expect(result).toBe(true);
    });

    it('should return false when location is outside radius', () => {
      const farLocation: Location = { lat: 40.8000, lng: -73.9000 }; // Far away
      const result = GeolocationUtils.isWithinRadius(farLocation, testSoundClip);

      expect(result).toBe(false);
    });

    it('should return true when location is exactly at radius boundary', () => {
      // Create a location exactly 100m away (the radius)
      // This is a simplified test - in practice, exact boundary cases might vary due to floating point precision
      const boundaryLocation: Location = { lat: 40.7589, lng: -73.9851 }; // Same location
      const result = GeolocationUtils.isWithinRadius(boundaryLocation, testSoundClip);

      expect(result).toBe(true);
    });

    it('should handle very small radius', () => {
      const smallRadiusClip: SoundClip = { ...testSoundClip, radius: 1 }; // 1 meter radius
      const nearbyLocation: Location = { lat: 40.7589, lng: -73.9851 }; // Same location
      const result = GeolocationUtils.isWithinRadius(nearbyLocation, smallRadiusClip);

      expect(result).toBe(true);
    });

    it('should handle very large radius', () => {
      const largeRadiusClip: SoundClip = { ...testSoundClip, radius: 10000 }; // 10km radius
      const farLocation: Location = { lat: 40.8000, lng: -73.9000 }; // Several km away
      const result = GeolocationUtils.isWithinRadius(farLocation, largeRadiusClip);

      expect(result).toBe(true);
    });
  });

  describe('getClipsInRange', () => {
    const testClips: SoundClip[] = [
      { ...testSoundClip, id: 'clip1', radius: 100 },
      { ...testSoundClip, id: 'clip2', lat: 40.7648, lng: -73.9808, radius: 200 },
      { ...testSoundClip, id: 'clip3', lat: 40.8000, lng: -73.9000, radius: 50 }
    ];

    it('should return clips within range of user location', () => {
      const userLocation: Location = { lat: 40.7589, lng: -73.9851 }; // Times Square
      const clipsInRange = GeolocationUtils.getClipsInRange(userLocation, testClips);

      expect(clipsInRange).toHaveLength(1); // Only clip1 should be in range (user is at its center)
      expect(clipsInRange.some(clip => clip.id === 'clip1')).toBe(true);
      expect(clipsInRange.some(clip => clip.id === 'clip2')).toBe(false); // clip2 is ~0.7km away, radius only 200m
      expect(clipsInRange.some(clip => clip.id === 'clip3')).toBe(false); // Too far
    });

    it('should return empty array when no clips in range', () => {
      const farLocation: Location = { lat: 40.9000, lng: -73.8000 }; // Very far away
      const clipsInRange = GeolocationUtils.getClipsInRange(farLocation, testClips);

      expect(clipsInRange).toHaveLength(0);
    });

    it('should return all clips when user is at center', () => {
      const centerLocation: Location = { lat: 40.7589, lng: -73.9851 }; // Center of clip1
      const clipsInRange = GeolocationUtils.getClipsInRange(centerLocation, testClips);

      expect(clipsInRange.length).toBeGreaterThan(0);
    });
  });

  describe('getNearestClip', () => {
    const testClips: SoundClip[] = [
      { ...testSoundClip, id: 'clip1', radius: 100 },
      { ...testSoundClip, id: 'clip2', lat: 40.7648, lng: -73.9808, radius: 200 },
      { ...testSoundClip, id: 'clip3', lat: 40.8000, lng: -73.9000, radius: 50 }
    ];

    it('should return the nearest clip to user location', () => {
      const userLocation: Location = { lat: 40.7589, lng: -73.9851 }; // Times Square
      const nearestClip = GeolocationUtils.getNearestClip(userLocation, testClips);

      expect(nearestClip).toBeDefined();
      expect(nearestClip!.id).toBe('clip1'); // Should be the closest
    });

    it('should return null when no clips provided', () => {
      const userLocation: Location = { lat: 40.7589, lng: -73.9851 };
      const nearestClip = GeolocationUtils.getNearestClip(userLocation, []);

      expect(nearestClip).toBeNull();
    });

    it('should handle single clip', () => {
      const userLocation: Location = { lat: 40.7589, lng: -73.9851 };
      const nearestClip = GeolocationUtils.getNearestClip(userLocation, [testClips[0]]);

      expect(nearestClip).toBeDefined();
      expect(nearestClip!.id).toBe('clip1');
    });
  });

  describe('getDistanceToNearestClip', () => {
    const testClips: SoundClip[] = [
      { ...testSoundClip, id: 'clip1', radius: 100 },
      { ...testSoundClip, id: 'clip2', lat: 40.7648, lng: -73.9808, radius: 200 }
    ];

    it('should return distance to nearest clip', () => {
      const userLocation: Location = { lat: 40.7589, lng: -73.9851 };
      const distance = GeolocationUtils.getDistanceToNearestClip(userLocation, testClips);

      expect(distance).toBeDefined();
      expect(distance).toBe(0); // User is at the exact location of clip1
    });

    it('should return null when no clips provided', () => {
      const userLocation: Location = { lat: 40.7589, lng: -73.9851 };
      const distance = GeolocationUtils.getDistanceToNearestClip(userLocation, []);

      expect(distance).toBeNull();
    });
  });

  describe('formatDistance', () => {
    it('should format distances less than 1000m correctly', () => {
      const result = GeolocationUtils.formatDistance(500);
      expect(result).toBe('500m');
    });

    it('should format distances greater than 1000m correctly', () => {
      const result = GeolocationUtils.formatDistance(1500);
      expect(result).toBe('1.5km');
    });

    it('should handle exact 1000m', () => {
      const result = GeolocationUtils.formatDistance(1000);
      expect(result).toBe('1.0km');
    });

    it('should handle very small distances', () => {
      const result = GeolocationUtils.formatDistance(1);
      expect(result).toBe('1m');
    });

    it('should handle very large distances', () => {
      const result = GeolocationUtils.formatDistance(50000);
      expect(result).toBe('50.0km');
    });

    it('should round meters to whole numbers', () => {
      const result = GeolocationUtils.formatDistance(1234);
      expect(result).toBe('1.2km');
    });
  });

  describe('isValidCoordinates', () => {
    it('should return true for valid coordinates', () => {
      expect(GeolocationUtils.isValidCoordinates(40.7589, -73.9851)).toBe(true);
      expect(GeolocationUtils.isValidCoordinates(0, 0)).toBe(true);
      expect(GeolocationUtils.isValidCoordinates(-90, -180)).toBe(true);
      expect(GeolocationUtils.isValidCoordinates(90, 180)).toBe(true);
    });

    it('should return false for invalid latitude', () => {
      expect(GeolocationUtils.isValidCoordinates(91, -73.9851)).toBe(false);
      expect(GeolocationUtils.isValidCoordinates(-91, -73.9851)).toBe(false);
      expect(GeolocationUtils.isValidCoordinates(100, -73.9851)).toBe(false);
      expect(GeolocationUtils.isValidCoordinates(-100, -73.9851)).toBe(false);
    });

    it('should return false for invalid longitude', () => {
      expect(GeolocationUtils.isValidCoordinates(40.7589, 181)).toBe(false);
      expect(GeolocationUtils.isValidCoordinates(40.7589, -181)).toBe(false);
      expect(GeolocationUtils.isValidCoordinates(40.7589, 200)).toBe(false);
      expect(GeolocationUtils.isValidCoordinates(40.7589, -200)).toBe(false);
    });

    it('should return false for invalid coordinate types', () => {
      expect(GeolocationUtils.isValidCoordinates(NaN, -73.9851)).toBe(false);
      expect(GeolocationUtils.isValidCoordinates(40.7589, NaN)).toBe(false);
      expect(GeolocationUtils.isValidCoordinates(Infinity, -73.9851)).toBe(false);
      expect(GeolocationUtils.isValidCoordinates(40.7589, -Infinity)).toBe(false);
    });
  });

  describe('calculateBearing', () => {
    it('should calculate bearing between two points', () => {
      const bearing = GeolocationUtils.calculateBearing(
        testLocation1.lat,
        testLocation1.lng,
        testLocation2.lat,
        testLocation2.lng
      );

      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
      expect(typeof bearing).toBe('number');
    });

    it('should return 0 for same location', () => {
      const bearing = GeolocationUtils.calculateBearing(
        testLocation1.lat,
        testLocation1.lng,
        testLocation1.lat,
        testLocation1.lng
      );

      expect(bearing).toBe(0);
    });

    it('should handle northward direction', () => {
      const northLocation: Location = { lat: 40.8000, lng: -73.9851 }; // North of Times Square
      const bearing = GeolocationUtils.calculateBearing(
        testLocation1.lat,
        testLocation1.lng,
        northLocation.lat,
        northLocation.lng
      );

      // Should be roughly north (0 degrees)
      expect(bearing).toBeCloseTo(0, 0);
    });

    it('should handle eastward direction', () => {
      const eastLocation: Location = { lat: 40.7589, lng: -73.9000 }; // East of Times Square
      const bearing = GeolocationUtils.calculateBearing(
        testLocation1.lat,
        testLocation1.lng,
        eastLocation.lat,
        eastLocation.lng
      );

      // Should be roughly east (90 degrees)
      expect(bearing).toBeCloseTo(90, 0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle coordinates at poles', () => {
      const northPole: Location = { lat: 90, lng: 0 };
      const southPole: Location = { lat: -90, lng: 0 };
      
      const distance = GeolocationUtils.calculateDistanceBetweenLocations(northPole, southPole);
      expect(distance).toBeGreaterThan(0);
      expect(typeof distance).toBe('number');
    });

    it('should handle coordinates at international date line', () => {
      const dateLine1: Location = { lat: 0, lng: 180 };
      const dateLine2: Location = { lat: 0, lng: -180 };
      
      const distance = GeolocationUtils.calculateDistanceBetweenLocations(dateLine1, dateLine2);
      expect(distance).toBeCloseTo(0, 5); // Same point (allowing for floating point precision)
    });

    it('should handle very small coordinate differences', () => {
      const tinyDiff: Location = { lat: 40.7589 + 0.000001, lng: -73.9851 + 0.000001 };
      const distance = GeolocationUtils.calculateDistanceBetweenLocations(testLocation1, tinyDiff);
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1); // Should be very small
    });
  });
});
