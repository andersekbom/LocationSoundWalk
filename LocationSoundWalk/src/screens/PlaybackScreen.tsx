import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { SoundClip } from '../types';
import TriggerZoneVisualizer from '../components/TriggerZoneVisualizer';

export default function PlaybackScreen({ navigation }: any) {
  const {
    state,
    startLocationMonitoring,
    stopLocationMonitoring,
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
    setVolume,
    getNearbyClips,
  } = useAppContext();

  const [volume, setVolumeState] = useState(1.0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [nearbyClips, setNearbyClips] = useState<Array<{
    clip: SoundClip;
    distance: number;
    formattedDistance: string;
    isInRange: boolean;
  }>>([]);

  useEffect(() => {
    // Check if we have a current story
    if (!state.currentStory) {
      Alert.alert(
        'No Story Selected',
        'Please select a story first.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    // Start location monitoring automatically
    handleStartMonitoring();
  }, [state.currentStory]);

  useEffect(() => {
    // Update nearby clips when location changes
    if (state.location) {
      const clips = getNearbyClips();
      setNearbyClips(clips);
    }
  }, [state.location, getNearbyClips]);

  const handleStartMonitoring = async () => {
    try {
      setIsMonitoring(true);
      await startLocationMonitoring();
    } catch (error) {
      setIsMonitoring(false);
      Alert.alert(
        'Error',
        'Failed to start location monitoring. Please check your location permissions.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleStopMonitoring = async () => {
    try {
      setIsMonitoring(false);
      await stopLocationMonitoring();
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to stop location monitoring.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePlayAudio = async (clipId: string) => {
    try {
      await playAudio(clipId);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to play audio.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    try {
      setVolumeState(newVolume);
      await setVolume(newVolume);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to change volume.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleBackToStories = () => {
    Alert.alert(
      'Stop Sound Walk?',
      'Are you sure you want to stop the current sound walk and return to story selection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            stopLocationMonitoring();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderCurrentStory = () => (
    <View style={styles.storyCard}>
      <View style={styles.storyHeader}>
        <Text style={styles.storyTitle}>{state.currentStory?.title}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToStories}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      {state.currentStory?.description && (
        <Text style={styles.storyDescription}>
          {state.currentStory.description}
        </Text>
      )}
      
      <View style={styles.storyStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{state.currentStory?.soundClips.length}</Text>
          <Text style={styles.statLabel}>Sound Clips</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round(
              (state.currentStory?.soundClips.reduce((total, clip) => total + clip.radius, 0) || 0) /
              (state.currentStory?.soundClips.length || 1)
            )}
          </Text>
          <Text style={styles.statLabel}>Avg Radius</Text>
        </View>
      </View>
    </View>
  );

  const renderLocationStatus = () => (
    <View style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <Ionicons
          name={isMonitoring ? 'location' : 'location-outline'}
          size={24}
          color={isMonitoring ? '#28a745' : '#6c757d'}
        />
        <Text style={styles.statusTitle}>Location Status</Text>
        <Switch
          value={isMonitoring}
          onValueChange={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
          trackColor={{ false: '#e9ecef', true: '#28a745' }}
          thumbColor={isMonitoring ? '#fff' : '#fff'}
        />
      </View>
      
      <View style={styles.statusDetails}>
        <Text style={styles.statusText}>
          {isMonitoring ? 'Monitoring active' : 'Monitoring inactive'}
        </Text>
        <Text style={styles.statusSubtext}>
          {isMonitoring
            ? 'Walking around will trigger nearby sounds'
            : 'Enable to start location-based audio'}
        </Text>
      </View>
    </View>
  );

  const renderAudioControls = () => (
    <View style={styles.controlsCard}>
      <Text style={styles.controlsTitle}>Audio Controls</Text>
      
      <View style={styles.controlRow}>
        <TouchableOpacity
          style={[styles.controlButton, styles.playButton]}
          onPress={() => state.playback.currentSound && handlePlayAudio(state.playback.currentSound.id)}
          disabled={!state.playback.currentSound}
        >
          <Ionicons name="play" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.pauseButton]}
          onPress={pauseAudio}
          disabled={!state.playback.isPlaying}
        >
          <Ionicons name="pause" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.stopButton]}
          onPress={stopAudio}
          disabled={!state.playback.isPlaying}
        >
          <Ionicons name="stop" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.volumeControl}>
        <Text style={styles.volumeLabel}>Volume</Text>
        <View style={styles.volumeSlider}>
          <TouchableOpacity
            style={[styles.volumeButton, volume === 0 && styles.volumeButtonMuted]}
            onPress={() => handleVolumeChange(0)}
          >
            <Ionicons name="volume-mute" size={20} color={volume === 0 ? '#fff' : '#6c757d'} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.volumeButton, volume === 0.5 && styles.volumeButtonActive]}
            onPress={() => handleVolumeChange(0.5)}
          >
            <Ionicons name="volume-low" size={20} color={volume === 0.5 ? '#fff' : '#6c757d'} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.volumeButton, volume === 1.0 && styles.volumeButtonActive]}
            onPress={() => handleVolumeChange(1.0)}
          >
            <Ionicons name="volume-high" size={20} color={volume === 1.0 ? '#fff' : '#6c757d'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCurrentAudio = () => (
    <View style={styles.audioCard}>
      <Text style={styles.audioTitle}>Currently Playing</Text>
      
      {state.playback.currentSound ? (
        <View style={styles.currentAudio}>
          <View style={styles.audioInfo}>
            <Text style={styles.audioName}>{state.playback.currentSound.title || 'Unknown Sound'}</Text>
            <Text style={styles.audioStatus}>
              {state.playback.isPlaying ? 'Playing' : 'Paused'}
            </Text>
          </View>
          
          <View style={styles.audioProgress}>
            <View style={[styles.progressBar, { width: '100%' }]} />
          </View>
        </View>
      ) : (
        <Text style={styles.noAudioText}>No audio currently playing</Text>
      )}
    </View>
  );

  const renderNearbyClips = () => (
    <View style={styles.nearbyCard}>
      <Text style={styles.nearbyTitle}>Trigger Zones</Text>
      <TriggerZoneVisualizer
        userLocation={state.location}
        soundClips={state.currentStory?.soundClips || []}
        onClipPress={(clip) => handlePlayAudio(clip.id)}
      />
    </View>
  );

  if (!state.currentStory) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading story...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderCurrentStory()}
        {renderLocationStatus()}
        {renderAudioControls()}
        {renderCurrentAudio()}
        {renderNearbyClips()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  
  // Story Card
  storyCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  backButton: {
    padding: 8,
  },
  storyDescription: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 22,
    marginBottom: 16,
  },
  storyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  
  // Status Card
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 12,
    flex: 1,
  },
  statusDetails: {
    marginLeft: 36,
  },
  statusText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#6c757d',
  },
  
  // Controls Card
  controlsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#28a745',
  },
  pauseButton: {
    backgroundColor: '#ffc107',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  volumeControl: {
    alignItems: 'center',
  },
  volumeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  volumeSlider: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  volumeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  volumeButtonActive: {
    backgroundColor: '#007AFF',
  },
  volumeButtonMuted: {
    backgroundColor: '#6c757d',
  },
  
  // Audio Card
  audioCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  audioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  currentAudio: {
    alignItems: 'center',
  },
  audioInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  audioName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  audioStatus: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  audioProgress: {
    width: '100%',
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  noAudioText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Nearby Card
  nearbyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nearbyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  clipsList: {
    maxHeight: 300,
  },
  clipItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  clipInfo: {
    flex: 1,
  },
  clipName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  clipDistance: {
    fontSize: 14,
    color: '#6c757d',
  },
  clipActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  inRange: {
    backgroundColor: '#d4edda',
  },
  outOfRange: {
    backgroundColor: '#f8d7da',
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#155724',
  },
  playClipButton: {
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noClipsText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});