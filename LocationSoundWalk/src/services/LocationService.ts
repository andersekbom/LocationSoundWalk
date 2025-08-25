import * as Location from 'expo-location';
import { LocationObject, LocationSubscription } from 'expo-location';
import { GeolocationUtils, Location as AppLocation } from '../utils/GeolocationUtils';

export interface LocationServiceResult {
  success: boolean;
  error?: string;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

export interface LocationTrackingOptions {
  accuracy?: Location.Accuracy;
  timeInterval?: number;
  distanceInterval?: number;
  batteryOptimized?: boolean;
}

export interface LocationAccuracyInfo {
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export class LocationService {
  private static locationSubscription: LocationSubscription | null = null;
  private static isTracking: boolean = false;
  private static currentLocation: AppLocation | null = null;
  private static onLocationUpdate: ((location: AppLocation) => void) | null = null;
  private static accuracyHistory: LocationAccuracyInfo[] = [];
  private static batteryOptimized: boolean = true;

  /**
   * Request location permissions with enhanced error handling
   */
  static async requestPermissions(): Promise<LocationServiceResult> {
    try {
      // First check if we already have permissions
      const currentStatus = await this.getPermissionStatus();
      if (currentStatus.granted) {
        return { success: true };
      }

      // Request foreground permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === Location.PermissionStatus.GRANTED) {
        return { success: true };
      } else if (status === Location.PermissionStatus.DENIED) {
        return {
          success: false,
          error: 'Location permission denied. Please enable in device settings.'
        };
      } else if (status === Location.PermissionStatus.UNDETERMINED) {
        return {
          success: false,
          error: 'Location permission not determined. Please try again.'
        };
      } else {
        return {
          success: false,
          error: `Unknown permission status: ${status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to request location permissions: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check current location permission status with detailed information
   */
  static async getPermissionStatus(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      return {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status
      };
    } catch (error) {
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.DENIED
      };
    }
  }

  /**
   * Get the current location with optimized accuracy and battery usage
   */
  static async getCurrentLocation(): Promise<LocationServiceResult & { location?: AppLocation; accuracy?: number }> {
    try {
      // Check permissions first
      const permissionStatus = await this.getPermissionStatus();
      if (!permissionStatus.granted) {
        return {
          success: false,
          error: 'Location permission not granted'
        };
      }

      // Check if location services are enabled
      const servicesEnabled = await this.isLocationEnabled();
      if (!servicesEnabled) {
        return {
          success: false,
          error: 'Location services are disabled on this device'
        };
      }

      // Get current location with battery-optimized settings
      const location = await Location.getCurrentPositionAsync({
        accuracy: this.batteryOptimized ? Location.Accuracy.Balanced : Location.Accuracy.High,
        timeInterval: this.batteryOptimized ? 10000 : 5000, // 10s vs 5s
        distanceInterval: this.batteryOptimized ? 20 : 10, // 20m vs 10m
        mayShowUserSettingsDialog: true
      });

      const appLocation: AppLocation = {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      };

      this.currentLocation = appLocation;

      // Store accuracy information
      const accuracyInfo: LocationAccuracyInfo = {
        accuracy: location.coords.accuracy || 0,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: new Date(location.timestamp)
      };

      this.accuracyHistory.push(accuracyInfo);
      
      // Keep only last 10 accuracy readings
      if (this.accuracyHistory.length > 10) {
        this.accuracyHistory.shift();
      }

      return { 
        success: true, 
        location: appLocation,
        accuracy: location.coords.accuracy || undefined
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get current location: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Start continuous location tracking with battery optimization
   */
  static async startLocationTracking(
    onUpdate: (location: AppLocation) => void,
    options: LocationTrackingOptions = {}
  ): Promise<LocationServiceResult> {
    try {
      // Check permissions first
      const permissionStatus = await this.getPermissionStatus();
      if (!permissionStatus.granted) {
        return {
          success: false,
          error: 'Location permission not granted'
        };
      }

      // Check if location services are enabled
      const servicesEnabled = await this.isLocationEnabled();
      if (!servicesEnabled) {
        return {
          success: false,
          error: 'Location services are disabled on this device'
        };
      }

      // Stop any existing tracking
      await this.stopLocationTracking();

      // Set up location tracking with battery optimization
      const {
        accuracy = this.batteryOptimized ? Location.Accuracy.Balanced : Location.Accuracy.High,
        timeInterval = this.batteryOptimized ? 5000 : 3000, // 5s vs 3s
        distanceInterval = this.batteryOptimized ? 10 : 5, // 10m vs 5m
        batteryOptimized = this.batteryOptimized
      } = options;

      this.batteryOptimized = batteryOptimized;

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy,
          timeInterval,
          distanceInterval,
          mayShowUserSettingsDialog: true
        },
        (location: LocationObject) => {
          const appLocation: AppLocation = {
            lat: location.coords.latitude,
            lng: location.coords.longitude
          };

          this.currentLocation = appLocation;
          this.onLocationUpdate = onUpdate;
          onUpdate(appLocation);

          // Store accuracy information
          const accuracyInfo: LocationAccuracyInfo = {
            accuracy: location.coords.accuracy || 0,
            altitude: location.coords.altitude || undefined,
            heading: location.coords.heading || undefined,
            speed: location.coords.speed || undefined,
            timestamp: new Date(location.timestamp)
          };

          this.accuracyHistory.push(accuracyInfo);
          
          // Keep only last 20 accuracy readings for tracking
          if (this.accuracyHistory.length > 20) {
            this.accuracyHistory.shift();
          }
        }
      );

      this.isTracking = true;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to start location tracking: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Stop location tracking and clean up resources
   */
  static async stopLocationTracking(): Promise<LocationServiceResult> {
    try {
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      this.isTracking = false;
      this.onLocationUpdate = null;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to stop location tracking: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if location tracking is active
   */
  static isLocationTrackingActive(): boolean {
    return this.isTracking;
  }

  /**
   * Get the last known location
   */
  static getLastKnownLocation(): AppLocation | null {
    return this.currentLocation;
  }

  /**
   * Get comprehensive location accuracy information
   */
  static async getLocationAccuracy(): Promise<LocationServiceResult & { accuracy?: number; history?: LocationAccuracyInfo[] }> {
    try {
      if (!this.currentLocation) {
        return {
          success: false,
          error: 'No location data available'
        };
      }

      // Get the last location with accuracy info
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1
      });

      const accuracy = location.coords.accuracy || undefined;

      return {
        success: true,
        accuracy,
        history: [...this.accuracyHistory]
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get location accuracy: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get average accuracy over time
   */
  static getAverageAccuracy(): number | null {
    if (this.accuracyHistory.length === 0) {
      return null;
    }

    const totalAccuracy = this.accuracyHistory.reduce((sum, info) => sum + info.accuracy, 0);
    return totalAccuracy / this.accuracyHistory.length;
  }

  /**
   * Check if location services are enabled
   */
  static async isLocationEnabled(): Promise<boolean> {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get location settings status with detailed information
   */
  static async getLocationSettingsStatus(): Promise<LocationServiceResult & { enabled?: boolean; details?: string }> {
    try {
      const enabled = await this.isLocationEnabled();
      
      if (!enabled) {
        return {
          success: false,
          error: 'Location services are disabled on this device',
          enabled: false,
          details: 'Please enable location services in your device settings to use location-based features.'
        };
      }

      return { 
        success: true, 
        enabled: true,
        details: 'Location services are enabled and ready to use.'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to check location services: ${error instanceof Error ? error.message : 'Unknown error'}`,
        enabled: false,
        details: 'Unable to determine location service status.'
      };
    }
  }

  /**
   * Toggle battery optimization mode
   */
  static setBatteryOptimized(optimized: boolean): void {
    this.batteryOptimized = optimized;
  }

  /**
   * Get current battery optimization status
   */
  static isBatteryOptimized(): boolean {
    return this.batteryOptimized;
  }

  /**
   * Calculate distance between current location and a target location
   */
  static calculateDistanceToTarget(targetLocation: AppLocation): number | null {
    if (!this.currentLocation) {
      return null;
    }

    return GeolocationUtils.calculateDistance(
      this.currentLocation.lat,
      this.currentLocation.lng,
      targetLocation.lat,
      targetLocation.lng
    );
  }

  /**
   * Check if current location is within a specific radius
   */
  static isWithinRadius(targetLocation: AppLocation, radius: number): boolean {
    if (!this.currentLocation) {
      return false;
    }

    const distance = this.calculateDistanceToTarget(targetLocation);
    return distance !== null && distance <= radius;
  }

  /**
   * Get formatted distance to a target location
   */
  static getFormattedDistanceToTarget(targetLocation: AppLocation): string | null {
    const distance = this.calculateDistanceToTarget(targetLocation);
    if (distance === null) {
      return null;
    }

    return GeolocationUtils.formatDistance(distance);
  }

  /**
   * Get location quality assessment
   */
  static getLocationQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
    const avgAccuracy = this.getAverageAccuracy();
    
    if (avgAccuracy === null) {
      return 'unknown';
    }

    if (avgAccuracy <= 5) return 'excellent';
    if (avgAccuracy <= 15) return 'good';
    if (avgAccuracy <= 50) return 'fair';
    return 'poor';
  }

  /**
   * Get recommendations for improving location accuracy
   */
  static getAccuracyRecommendations(): string[] {
    const quality = this.getLocationQuality();
    const recommendations: string[] = [];

    switch (quality) {
      case 'excellent':
        recommendations.push('Location accuracy is excellent!');
        break;
      case 'good':
        recommendations.push('Location accuracy is good for most use cases.');
        break;
      case 'fair':
        recommendations.push('Consider moving to an open area for better GPS signal.');
        recommendations.push('Ensure you have a clear view of the sky.');
        break;
      case 'poor':
        recommendations.push('Move to an open outdoor area for better GPS accuracy.');
        recommendations.push('Check if your device has a clear view of the sky.');
        recommendations.push('Consider waiting a few minutes for GPS to stabilize.');
        break;
      case 'unknown':
        recommendations.push('No location data available yet.');
        break;
    }

    if (this.batteryOptimized) {
      recommendations.push('Battery optimization is enabled. Disable for higher accuracy.');
    }

    return recommendations;
  }

  /**
   * Clean up resources and reset state
   */
  static async cleanup(): Promise<LocationServiceResult> {
    try {
      await this.stopLocationTracking();
      this.currentLocation = null;
      this.accuracyHistory = [];
      this.batteryOptimized = true;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to cleanup location service: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
