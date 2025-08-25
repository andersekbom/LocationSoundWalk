# Development Tasks: Location-Based Sound Walk App

This task list is designed for step-by-step implementation by a coding LLM.  
Each task is small, has a clear start and end, and is testable.
Focus on MVP scope: local stories, GPS-based playback, basic UI, offline-only operation.

**Progress Tracking:** Mark tasks as completed by changing `[ ]` to `[x]`

---

# Phase 1: Foundation & Setup (Tasks 1-5)

## 1.1 Setup & Environment
**1.1** - [x] Initialize a new Expo React Native project
  - Run `npx create-expo-app --template blank-typescript LocationSoundWalk`
  - Test: App starts and displays default screen

**1.2** - [x] Install required Expo packages: `expo-location`, `expo-av`
  - Run `npx expo install expo-location expo-av`
  - Test: Packages install without errors

**1.3** - [x] Configure project to load local JSON and audio files from assets
  - Create `assets/` folder structure: `assets/stories/`, `assets/sounds/`
  - Update `app.json` to include asset paths
  - Test: Assets are bundled and accessible via `require()`

## 1.2 Project Structure & Navigation
**1.4** - [x] Set up basic navigation structure
  - Install and configure React Navigation: `@react-navigation/native`, `@react-navigation/native-stack`
  - Create basic stack navigator with StoryList and PlaybackScreen
  - Test: Navigation between screens works

**1.5** - [x] Create basic app state management
  - Set up React Context for global app state (current story, location, playback status)
  - Create types for Story, SoundClip, and AppState interfaces
  - Test: State updates across components

---

# Phase 2: Data Layer & Sample Content (Tasks 6-9)

## 2.1 Data Layer
**2.1** - [ ] Create sample `stories.json` file based on provided schema
  - Include 2-3 sample stories with different locations
  - Each story should have 3-5 sound clips with realistic GPS coordinates
  - Test: JSON file is valid and follows schema

**2.2** - [ ] Create sample audio files for testing
  - Add 3-5 short MP3 files (5-10 seconds each) to `assets/sounds/`
  - Ensure files are small for testing purposes
  - Test: Audio files load and play in Expo

**2.3** - [ ] Implement JSON loader to parse stories and sound clips into app state
  - Create `services/StoryLoader.ts` to read and parse stories.json
  - Handle loading errors gracefully with try/catch
  - Test: Stories load correctly into state on app launch

**2.4** - [ ] Write unit test to ensure JSON is parsed correctly and malformed files are rejected
  - Test valid JSON parsing
  - Test invalid JSON handling
  - Test missing required fields

---

# Phase 3: User Interface (Tasks 10-12)

## 3.1 Story Selection UI
**3.1** - [ ] Implement a screen that lists available stories (from JSON)
  - Create `StoryListScreen` component with FlatList of stories
  - Display story title, description, and number of sound clips
  - Add basic styling for readability
  - Test: All stories from JSON appear in list

**3.2** - [ ] Add functionality to select a story and save the selection to state
  - Handle story selection onPress event
  - Update global state with selected story
  - Navigate to playback screen after selection
  - Test: Selecting a story updates state and navigates correctly

**3.3** - [ ] Write test: selecting a story updates current story state
  - Mock story selection action
  - Verify state update occurs
  - Verify navigation is triggered

---

# Phase 4: Location Services (Tasks 13-17)

## 4.1 Permissions & Location Setup
**4.1** - [ ] Request location permissions using `expo-location`
  - Create `services/LocationService.ts` to handle permissions
  - Request foreground and background location permissions
  - Handle permission denied scenarios with user-friendly messages
  - Test: Permissions are requested on app launch

**4.2** - [ ] Implement location permission UI feedback
  - Show permission status to user
  - Provide retry option if permissions are denied
  - Test: UI updates based on permission status

## 4.2 Location Tracking
**4.3** - [ ] Implement continuous GPS tracking with Expo Location API
  - Start location tracking when story is selected
  - Update location state every 5-10 seconds
  - Handle location errors (GPS disabled, no signal)
  - Test: Location updates are received and stored in state

**4.4** - [ ] Add location accuracy and battery optimization
  - Configure location accuracy for balance of precision and battery life
  - Stop tracking when app is backgrounded (MVP scope)
  - Test: Location tracking stops/starts appropriately

**4.5** - [ ] Write test: simulate GPS coordinates and confirm updates are received
  - Mock Location API responses
  - Verify location state updates
  - Test error handling scenarios

---

# Phase 5: Audio System (Tasks 18-21)

## 5.1 Sound Playback
**5.1** - [ ] Load and prepare audio files using `expo-av`
  - Create `services/AudioService.ts` to manage sound loading and playback
  - Preload all sound files for selected story
  - Handle audio loading errors
  - Test: Audio files load without errors

**5.2** - [ ] Implement function to play sound when triggered by location
  - Create play/pause/stop functionality
  - Handle multiple sounds (stop current, play new)
  - Add audio session management for iOS/Android
  - Test: Sounds play and stop correctly

**5.3** - [ ] Add basic playback UI controls
  - Show currently playing sound title
  - Add stop button for user control
  - Display playback status
  - Test: UI reflects current playback state

**5.4** - [ ] Write test: manually trigger playback and confirm audio plays
  - Mock audio playback
  - Verify playback state changes
  - Test error scenarios

---

# Phase 6: Location-Based Logic (Tasks 22-25)

## 6.1 Location-Based Triggers
**6.1** - [ ] Implement function to check if user is within a sound clip's radius
  - Create `utils/GeolocationUtils.ts` with distance calculation
  - Use Haversine formula for GPS coordinate distance
  - Account for GPS accuracy in radius calculations
  - Test: Distance calculations are accurate for test coordinates

**6.2** - [ ] Connect GPS updates to trigger sound playback when entering a radius
  - Monitor location changes and check against all sound clip locations
  - Trigger playback when entering radius, stop when exiting
  - Prevent duplicate triggers for same sound clip
  - Test: Sounds trigger at correct locations

**6.3** - [ ] Add trigger zone visualization (optional for MVP)
  - Simple text display showing nearest sound clips and distances
  - Help users understand proximity to triggers
  - Test: Distance display updates with location

**6.4** - [ ] Write test: simulate entering/exiting a radius, verify playback starts/stops
  - Mock GPS coordinates entering/exiting trigger zones
  - Verify sound playback starts/stops correctly
  - Test multiple overlapping zones

---

# Phase 7: Polish & Reliability (Tasks 26-28)

## 7.1 Error Handling & User Experience
**7.1** - [ ] Add comprehensive error handling
  - Handle GPS unavailable, permission denied, audio loading failures
  - Show user-friendly error messages with recovery actions
  - Test: App doesn't crash on various error conditions

**7.2** - [ ] Add loading states and user feedback
  - Loading indicators for story loading, location acquisition
  - Progress feedback for audio file loading
  - Test: Users understand app state at all times

**7.3** - [ ] Add basic app lifecycle management
  - Handle app backgrounding/foregrounding
  - Save/restore current story and playback state
  - Test: App resumes correctly after backgrounding

---

# Phase 8: Validation & Testing (Tasks 29-35)

## 8.1 Offline Support & Validation
**8.1** - [ ] Confirm app runs without internet access using only local JSON and audio files
  - Test app functionality with airplane mode enabled
  - Verify all assets are bundled and accessible offline
  - Test: Complete user flow works offline

**8.2** - [ ] Write test: disable network and verify story loading and playback still work
  - Mock network disabled state
  - Verify all core functionality remains operational
  - Test story selection, location tracking, and audio playback

## 8.2 Testing & Quality Assurance
**8.3** - [ ] Set up testing framework and configuration
  - Install and configure Jest, React Native Testing Library
  - Set up test utilities and mocks for Expo modules
  - Test: Test suite runs successfully

**8.4** - [ ] Write comprehensive unit tests
  - Test JSON parsing, location calculations, audio service
  - Test React components with proper mocking
  - Achieve reasonable test coverage for core functionality

**8.5** - [ ] Perform manual testing on physical device
  - Test on iOS and Android devices with actual GPS
  - Walk through complete user journey outdoors
  - Verify audio quality and location accuracy

**8.6** - [ ] Create simple debugging tools
  - Add development-only location spoofing capability
  - Show debug info for location, distances, and trigger states
  - Test: Debug tools help with development and testing

---

## MVP Deliverables
- Running Expo app with local stories and location-based audio playback
- Basic story selection UI with offline operation
- GPS-based sound triggering within defined radius zones
- Comprehensive test suite covering core functionality
- App works reliably on iOS and Android devices
- Documentation for testing and development setup

## Future Features (Post-MVP)
- Server-based story and audio management
- Enhanced UI/UX with maps and visual feedback
- Background location tracking
- Story creation tools
- Social features and sharing
