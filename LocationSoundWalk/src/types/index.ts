export interface SoundClip {
  id: string;
  file: string;
  lat: number;
  lng: number;
  radius: number;
  title?: string;
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  soundClips: SoundClip[];
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentClip?: SoundClip;
  error?: string;
}

export interface AppState {
  currentStory?: Story;
  stories: Story[];
  location?: Location;
  playback: PlaybackState;
  isLocationPermissionGranted: boolean;
  isLoadingStories: boolean;
}