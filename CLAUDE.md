# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a location-based sound walk app built with React Native (Expo). The app plays audio clips based on the user's physical location, allowing users to select from different "walks" or "stories" where sound files are tagged with GPS coordinates and trigger radii.

## Development Commands
Since this project hasn't been initialized yet, you'll need to:
- Initialize a new Expo React Native project
- Install required Expo packages: `expo-location`, `expo-av`
- Use standard Expo/React Native development commands once initialized:
  - `npx expo start` - Start development server
  - `npx expo run:ios` - Run on iOS simulator
  - `npx expo run:android` - Run on Android emulator

## Architecture
The app follows a client-server architecture designed for future scalability:

### Client-Side Layers
- **UI Layer**: Story selection, playback controls, and user feedback
- **Business Logic**: Location tracking, sound file selection, and playback management
- **Data Layer**: Local JSON configuration and sound files, with future API integration

### Data Structure
Stories are defined in JSON format with this schema:
```json
{
  "stories": [
    {
      "id": "story1",
      "title": "City Tour",
      "soundClips": [
        {
          "id": "clip1",
          "file": "clip1.mp3",
          "lat": 40.7128,
          "lng": -74.0060,
          "radius": 50
        }
      ]
    }
  ]
}
```

### Key Technical Components
- **Location Tracking**: Uses Expo Location API for GPS monitoring
- **Audio Playback**: Uses Expo AV for sound file playback
- **Trigger System**: Monitors GPS location and plays sounds when user enters defined radius zones
- **Configuration Management**: Loads stories from local JSON files (future: server API)

## Development Flow
1. User selects a story from the story selection screen
2. App loads story configuration (local JSON)
3. App monitors GPS location continuously
4. When user enters a trigger zone, corresponding sound plays
5. App supports offline-only operation in MVP

## File Storage Strategy
- **Local**: JSON configurations and sound files bundled with the app
- **Future**: Remote JSON and sound files hosted on server, fetched as needed

## Testing Approach
The project requires comprehensive testing for:
- JSON parsing and validation
- Story selection state management
- GPS coordinate simulation and updates
- Audio playback triggers
- Location-based radius detection
- Offline functionality