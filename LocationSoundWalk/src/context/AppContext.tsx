import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import { AppState, Story, Location, PlaybackState } from '../types';
import { StoryLoader } from '../services/StoryLoader';
import { LocationBasedAudioManager, AudioTriggerEvent } from '../services/LocationBasedAudioManager';
import { LocationService } from '../services/LocationService';
import { AudioService, PlaybackStatus } from '../services/AudioService';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Story management
  loadStories: () => Promise<void>;
  selectStory: (storyId: string) => Promise<void>;
  // Location and audio management
  startLocationMonitoring: () => Promise<void>;
  stopLocationMonitoring: () => Promise<void>;
  // Audio controls
  playAudio: (clipId: string) => Promise<void>;
  stopAudio: () => Promise<void>;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  // Utility functions
  getNearbyClips: () => Array<{
    clip: any;
    distance: number;
    formattedDistance: string;
    isInRange: boolean;
  }>;
}

export type AppAction =
  | { type: 'SET_STORIES'; payload: Story[] }
  | { type: 'SET_CURRENT_STORY'; payload: Story }
  | { type: 'SET_LOCATION'; payload: Location }
  | { type: 'SET_PLAYBACK_STATE'; payload: Partial<PlaybackState> }
  | { type: 'SET_LOCATION_PERMISSION'; payload: boolean }
  | { type: 'SET_LOADING_STORIES'; payload: boolean }
  | { type: 'SET_MONITORING_ACTIVE'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR'; payload: null };

const initialState: AppState = {
  stories: [],
  playback: {
    isPlaying: false,
    currentSound: null,
    volume: 1.0,
  },
  isLocationPermissionGranted: false,
  isLoadingStories: false,
  isMonitoringActive: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STORIES':
      return { ...state, stories: action.payload };
    case 'SET_CURRENT_STORY':
      return { ...state, currentStory: action.payload };
    case 'SET_LOCATION':
      return { ...state, location: action.payload };
    case 'SET_PLAYBACK_STATE':
      return { ...state, playback: { ...state.playback, ...action.payload } };
    case 'SET_LOCATION_PERMISSION':
      return { ...state, isLocationPermissionGranted: action.payload };
    case 'SET_LOADING_STORIES':
      return { ...state, isLoadingStories: action.payload };
    case 'SET_MONITORING_ACTIVE':
      return { ...state, isMonitoringActive: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load stories on app startup
  useEffect(() => {
    loadStories();
  }, []);

  // Handle audio trigger events
  const handleAudioTrigger = useCallback((event: AudioTriggerEvent) => {
    dispatch({
      type: 'SET_PLAYBACK_STATE',
      payload: {
        isPlaying: true,
        currentSound: event.soundClip,
      }
    });
  }, []);

  // Load all available stories
  const loadStories = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING_STORIES', payload: true });
      dispatch({ type: 'CLEAR_ERROR', payload: null });

      const result = await StoryLoader.loadStories();
      if (result.success && result.stories) {
        dispatch({ type: 'SET_STORIES', payload: result.stories });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to load stories' });
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Error loading stories: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      dispatch({ type: 'SET_LOADING_STORIES', payload: false });
    }
  };

  // Select a story and initialize the audio manager
  const selectStory = async (storyId: string): Promise<void> => {
    try {
      dispatch({ type: 'CLEAR_ERROR', payload: null });

      const story = state.stories.find(s => s.id === storyId);
      if (!story) {
        dispatch({ type: 'SET_ERROR', payload: 'Story not found' });
        return;
      }

      // Initialize the location-based audio manager with the selected story
      const initResult = await LocationBasedAudioManager.initializeWithStory(storyId);
      if (!initResult.success) {
        dispatch({ type: 'SET_ERROR', payload: initResult.error || 'Failed to initialize story' });
        return;
      }

      dispatch({ type: 'SET_CURRENT_STORY', payload: story });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Error selecting story: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  // Start location monitoring
  const startLocationMonitoring = async (): Promise<void> => {
    try {
      dispatch({ type: 'CLEAR_ERROR', payload: null });

      const result = await LocationBasedAudioManager.startMonitoring(handleAudioTrigger);
      if (result.success) {
        dispatch({ type: 'SET_MONITORING_ACTIVE', payload: true });
        
        // Update location permission status
        const permissionStatus = await LocationService.getPermissionStatus();
        dispatch({ type: 'SET_LOCATION_PERMISSION', payload: permissionStatus.granted });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to start monitoring' });
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Error starting monitoring: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  // Stop location monitoring
  const stopLocationMonitoring = async (): Promise<void> => {
    try {
      const result = await LocationBasedAudioManager.stopMonitoring();
      if (result.success) {
        dispatch({ type: 'SET_MONITORING_ACTIVE', payload: false });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to stop monitoring' });
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Error stopping monitoring: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  // Audio control functions
  const playAudio = async (clipId: string): Promise<void> => {
    try {
      const result = await LocationBasedAudioManager.triggerClipManually(clipId);
      if (!result.success) {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to play audio' });
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Error playing audio: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const stopAudio = async (): Promise<void> => {
    try {
      await AudioService.stopCurrentSound();
      dispatch({
        type: 'SET_PLAYBACK_STATE',
        payload: { isPlaying: false, currentSound: null }
      });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Error stopping audio: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const pauseAudio = async (): Promise<void> => {
    try {
      await AudioService.pauseCurrentSound();
      dispatch({
        type: 'SET_PLAYBACK_STATE',
        payload: { isPlaying: false }
      });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Error pausing audio: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const resumeAudio = async (): Promise<void> => {
    try {
      await AudioService.resumeCurrentSound();
      dispatch({
        type: 'SET_PLAYBACK_STATE',
        payload: { isPlaying: true }
      });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Error resuming audio: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const setVolume = async (volume: number): Promise<void> => {
    try {
      const result = await AudioService.setVolume(volume);
      if (result.success) {
        dispatch({
          type: 'SET_PLAYBACK_STATE',
          payload: { volume }
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to set volume' });
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Error setting volume: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  // Get nearby clips information
  const getNearbyClips = (): Array<{
    clip: any;
    distance: number;
    formattedDistance: string;
    isInRange: boolean;
  }> => {
    if (!state.location) {
      return [];
    }

    return LocationBasedAudioManager.getNearbyClipsInfo(state.location);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      LocationBasedAudioManager.cleanup();
    };
  }, []);

  const contextValue: AppContextType = {
    state,
    dispatch,
    loadStories,
    selectStory,
    startLocationMonitoring,
    stopLocationMonitoring,
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
    setVolume,
    getNearbyClips,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}