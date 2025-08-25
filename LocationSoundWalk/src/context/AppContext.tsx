import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, Story, Location, PlaybackState } from '../types';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export type AppAction =
  | { type: 'SET_STORIES'; payload: Story[] }
  | { type: 'SET_CURRENT_STORY'; payload: Story }
  | { type: 'SET_LOCATION'; payload: Location }
  | { type: 'SET_PLAYBACK_STATE'; payload: Partial<PlaybackState> }
  | { type: 'SET_LOCATION_PERMISSION'; payload: boolean }
  | { type: 'SET_LOADING_STORIES'; payload: boolean };

const initialState: AppState = {
  stories: [],
  playback: {
    isPlaying: false,
  },
  isLocationPermissionGranted: false,
  isLoadingStories: false,
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
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
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