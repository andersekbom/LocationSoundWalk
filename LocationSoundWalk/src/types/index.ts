export interface SoundClip {
  id: string;
  file: string;
  lat: number;
  lng: number;
  radius: number;
  title?: string;
  description?: string;
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  soundClips: SoundClip[];
}

export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentSound?: SoundClip | null;
  volume: number;
  error?: string;
}

export interface AppState {
  currentStory?: Story;
  stories: Story[];
  location?: Location;
  playback: PlaybackState;
  isLocationPermissionGranted: boolean;
  isLoadingStories: boolean;
  isMonitoringActive: boolean;
  error: string | null;
}