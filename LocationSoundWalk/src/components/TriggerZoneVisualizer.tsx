import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SoundClip } from '../types';
import { GeolocationUtils } from '../utils/GeolocationUtils';

interface TriggerZoneVisualizerProps {
  userLocation: { lat: number; lng: number } | null;
  soundClips: SoundClip[];
  onClipPress?: (clip: SoundClip) => void;
}

interface ClipDistanceInfo {
  clip: SoundClip;
  distance: number;
  formattedDistance: string;
  isInRange: boolean;
  bearing: number;
}

export default function TriggerZoneVisualizer({
  userLocation,
  soundClips,
  onClipPress,
}: TriggerZoneVisualizerProps) {
  if (!userLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.noLocationContainer}>
          <Ionicons name="location-outline" size={48} color="#6c757d" />
          <Text style={styles.noLocationTitle}>Location Required</Text>
          <Text style={styles.noLocationMessage}>
            Enable location services to see nearby sound clips
          </Text>
        </View>
      </View>
    );
  }

  // Calculate distances and sort by proximity
  const clipsWithDistance: ClipDistanceInfo[] = soundClips
    .map(clip => {
      const distance = GeolocationUtils.calculateDistance(
        userLocation.lat,
        userLocation.lng,
        clip.lat,
        clip.lng
      );
      
      const bearing = GeolocationUtils.calculateBearing(
        userLocation.lat,
        userLocation.lng,
        clip.lat,
        clip.lng
      );

      return {
        clip,
        distance: Math.round(distance),
        formattedDistance: GeolocationUtils.formatDistance(distance),
        isInRange: distance <= clip.radius,
        bearing,
      };
    })
    .sort((a, b) => a.distance - b.distance);

  const getBearingIcon = (bearing: number): string => {
    if (bearing >= 315 || bearing < 45) return 'arrow-up';
    if (bearing >= 45 && bearing < 135) return 'arrow-forward';
    if (bearing >= 135 && bearing < 225) return 'arrow-down';
    return 'arrow-back';
  };

  const getBearingColor = (bearing: number): string => {
    if (bearing >= 315 || bearing < 45) return '#28a745'; // North - Green
    if (bearing >= 45 && bearing < 135) return '#007AFF'; // East - Blue
    if (bearing >= 135 && bearing < 225) return '#dc3545'; // South - Red
    return '#ffc107'; // West - Yellow
  };

  const getRangeStatusColor = (isInRange: boolean): string => {
    return isInRange ? '#28a745' : '#6c757d';
  };

  const getRangeStatusText = (isInRange: boolean): string => {
    return isInRange ? 'In Range' : 'Out of Range';
  };

  const renderClipItem = (clipInfo: ClipDistanceInfo, index: number) => (
    <TouchableOpacity
      key={clipInfo.clip.id}
      style={[
        styles.clipItem,
        clipInfo.isInRange && styles.clipItemInRange
      ]}
      onPress={() => onClipPress?.(clipInfo.clip)}
      activeOpacity={0.7}
    >
      <View style={styles.clipHeader}>
        <View style={styles.clipTitleContainer}>
          <Text style={styles.clipTitle}>
            {clipInfo.clip.title || clipInfo.clip.id}
          </Text>
          {clipInfo.clip.description && (
            <Text style={styles.clipDescription} numberOfLines={2}>
              {clipInfo.clip.description}
            </Text>
          )}
        </View>
        
        <View style={styles.clipStatus}>
          <View style={[
            styles.rangeIndicator,
            { backgroundColor: getRangeStatusColor(clipInfo.isInRange) }
          ]}>
            <Text style={styles.rangeText}>
              {getRangeStatusText(clipInfo.isInRange)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.clipDetails}>
        <View style={styles.distanceContainer}>
          <Ionicons 
            name="location" 
            size={16} 
            color={getBearingColor(clipInfo.bearing)} 
          />
          <Text style={styles.distanceText}>
            {clipInfo.formattedDistance} away
          </Text>
        </View>

        <View style={styles.bearingContainer}>
          <Ionicons 
            name={getBearingIcon(clipInfo.bearing) as any} 
            size={16} 
            color={getBearingColor(clipInfo.bearing)} 
          />
          <Text style={styles.bearingText}>
            {Math.round(clipInfo.bearing)}°
          </Text>
        </View>

        <View style={styles.radiusContainer}>
          <Ionicons name="radio-button-on" size={16} color="#6c757d" />
          <Text style={styles.radiusText}>
            {clipInfo.clip.radius}m radius
          </Text>
        </View>
      </View>

      {clipInfo.isInRange && (
        <View style={styles.inRangeIndicator}>
          <Ionicons name="musical-notes" size={16} color="#28a745" />
          <Text style={styles.inRangeText}>
            Audio will trigger automatically
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSummary = () => {
    const inRangeCount = clipsWithDistance.filter(clip => clip.isInRange).length;
    const nearestClip = clipsWithDistance[0];
    
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Nearby Clips</Text>
            <Text style={styles.summaryValue}>{clipsWithDistance.length}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>In Range</Text>
            <Text style={[
              styles.summaryValue,
              { color: inRangeCount > 0 ? '#28a745' : '#6c757d' }
            ]}>
              {inRangeCount}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Nearest</Text>
            <Text style={styles.summaryValue}>
              {nearestClip ? nearestClip.formattedDistance : 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderSummary()}
      
      <ScrollView 
        style={styles.clipsList} 
        showsVerticalScrollIndicator={false}
      >
        {clipsWithDistance.length > 0 ? (
          clipsWithDistance.map((clipInfo, index) => 
            renderClipItem(clipInfo, index)
          )
        ) : (
          <View style={styles.noClipsContainer}>
            <Ionicons name="musical-notes-outline" size={48} color="#6c757d" />
            <Text style={styles.noClipsTitle}>No Sound Clips</Text>
            <Text style={styles.noClipsMessage}>
              No sound clips are available for the current story
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Summary Section
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  
  // No Location State
  noLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noLocationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c757d',
    marginTop: 16,
    marginBottom: 8,
  },
  noLocationMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Clips List
  clipsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Individual Clip Items
  clipItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#e9ecef',
  },
  clipItemInRange: {
    borderLeftColor: '#28a745',
    backgroundColor: '#f8fff9',
  },
  
  clipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clipTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  clipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  clipDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
  clipStatus: {
    alignItems: 'flex-end',
  },
  rangeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  
  clipDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  distanceText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 6,
    fontWeight: '500',
  },
  bearingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  bearingText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 4,
    fontWeight: '500',
  },
  radiusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 4,
  },
  
  inRangeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inRangeText: {
    fontSize: 14,
    color: '#155724',
    marginLeft: 8,
    fontWeight: '500',
  },
  
  // No Clips State
  noClipsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  noClipsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c757d',
    marginTop: 16,
    marginBottom: 8,
  },
  noClipsMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
  },
});
