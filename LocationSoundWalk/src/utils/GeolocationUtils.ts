import { SoundClip } from '../types';

export interface Location {
  lat: number;
  lng: number;
}

export interface LocationWithRadius extends Location {
  radius: number;
}

/**
 * Utility functions for geolocation calculations and location-based logic
 */
export class GeolocationUtils {
  /**
   * Calculates the distance between two GPS coordinates using the Haversine formula
   * @param lat1 Latitude of first point
   * @param lng1 Longitude of first point
   * @param lat2 Latitude of second point
   * @param lng2 Longitude of second point
   * @returns Distance in meters
   */
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLng = this.degreesToRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculates distance between two Location objects
   */
  static calculateDistanceBetweenLocations(loc1: Location, loc2: Location): number {
    return this.calculateDistance(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
  }

  /**
   * Converts degrees to radians
   */
  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Checks if a user location is within the radius of a sound clip
   * @param userLocation User's current GPS coordinates
   * @param soundClip Sound clip with location and radius
   * @returns True if user is within the trigger radius
   */
  static isWithinRadius(userLocation: Location, soundClip: SoundClip): boolean {
    const distance = this.calculateDistanceBetweenLocations(userLocation, soundClip);
    return distance <= soundClip.radius;
  }

  /**
   * Finds all sound clips that the user is currently within range of
   * @param userLocation User's current GPS coordinates
   * @param soundClips Array of sound clips to check
   * @returns Array of sound clips within range
   */
  static getClipsInRange(userLocation: Location, soundClips: SoundClip[]): SoundClip[] {
    return soundClips.filter(clip => this.isWithinRadius(userLocation, clip));
  }

  /**
   * Finds the nearest sound clip to the user's location
   * @param userLocation User's current GPS coordinates
   * @param soundClips Array of sound clips to check
   * @returns The nearest sound clip or null if none available
   */
  static getNearestClip(userLocation: Location, soundClips: SoundClip[]): SoundClip | null {
    if (soundClips.length === 0) return null;

    let nearestClip = soundClips[0];
    let shortestDistance = this.calculateDistanceBetweenLocations(userLocation, nearestClip);

    for (let i = 1; i < soundClips.length; i++) {
      const distance = this.calculateDistanceBetweenLocations(userLocation, soundClips[i]);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestClip = soundClips[i];
      }
    }

    return nearestClip;
  }

  /**
   * Gets the distance to the nearest sound clip
   * @param userLocation User's current GPS coordinates
   * @param soundClips Array of sound clips to check
   * @returns Distance in meters to nearest clip, or null if none available
   */
  static getDistanceToNearestClip(userLocation: Location, soundClips: SoundClip[]): number | null {
    const nearestClip = this.getNearestClip(userLocation, soundClips);
    if (!nearestClip) return null;

    return this.calculateDistanceBetweenLocations(userLocation, nearestClip);
  }

  /**
   * Formats distance for display (e.g., "50m", "1.2km")
   * @param distanceInMeters Distance in meters
   * @returns Formatted distance string
   */
  static formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Checks if GPS coordinates are valid
   * @param lat Latitude
   * @param lng Longitude
   * @returns True if coordinates are valid
   */
  static isValidCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  /**
   * Calculates the bearing between two points
   * @param lat1 Latitude of first point
   * @param lng1 Longitude of first point
   * @param lat2 Latitude of second point
   * @param lng2 Longitude of second point
   * @returns Bearing in degrees (0-360)
   */
  static calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = this.degreesToRadians(lng2 - lng1);
    const lat1Rad = this.degreesToRadians(lat1);
    const lat2Rad = this.degreesToRadians(lat2);

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    
    let bearing = Math.atan2(y, x);
    bearing = this.radiansToDegrees(bearing);
    
    return (bearing + 360) % 360;
  }

  /**
   * Converts radians to degrees
   */
  private static radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}
