import { AudioService } from '../services/AudioService';
import { SoundClip } from '../types';

// Mock expo-av module
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn(),
    },
  },
}));

describe('AudioService', () => {
  const mockSoundClip: SoundClip = {
    id: 'test_clip',
    file: 'test.mp3',
    lat: 40.7589,
    lng: -73.9851,
    radius: 50,
    title: 'Test Sound',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset AudioService static state
    (AudioService as any).soundMap = new Map();
    (AudioService as any).currentSound = null;
    (AudioService as any).volume = 1.0;
    (AudioService as any).isInitialized = false;
  });

  describe('initialize', () => {
    it('should initialize audio service successfully', async () => {
      const result = await AudioService.initialize();
      
      expect(result.success).toBe(true);
      expect((AudioService as any).isInitialized).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      // First initialization
      await AudioService.initialize();
      
      // Second initialization
      const result = await AudioService.initialize();
      
      expect(result.success).toBe(true);
      expect((AudioService as any).isInitialized).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock Audio.setAudioModeAsync to throw error
      const { Audio } = require('expo-av');
      Audio.setAudioModeAsync.mockRejectedValueOnce(new Error('Audio mode error'));
      
      const result = await AudioService.initialize();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to initialize audio service');
    });
  });

  describe('setVolume', () => {
    beforeEach(async () => {
      await AudioService.initialize();
    });

    it('should clamp volume between 0 and 1', async () => {
      await AudioService.setVolume(-0.5);
      expect((AudioService as any).volume).toBe(0);
      
      await AudioService.setVolume(1.5);
      expect((AudioService as any).volume).toBe(1);
    });

    it('should handle volume changes with no loaded sounds', async () => {
      const result = await AudioService.setVolume(0.5);
      
      expect(result.success).toBe(true);
      expect((AudioService as any).volume).toBe(0.5);
    });
  });

  describe('getPlaybackStatus', () => {
    beforeEach(async () => {
      await AudioService.initialize();
    });

    it('should return correct status when no sound is loaded', async () => {
      const status = await AudioService.getPlaybackStatus();
      
      expect(status.isPlaying).toBe(false);
      expect(status.isLoaded).toBe(false);
      expect(status.volume).toBe(1.0);
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await AudioService.initialize();
    });

    it('should handle cleanup when no sounds are loaded', async () => {
      const result = await AudioService.cleanup();
      
      expect(result.success).toBe(true);
      expect((AudioService as any).isInitialized).toBe(false);
    });
  });

  describe('utility methods', () => {
    beforeEach(async () => {
      await AudioService.initialize();
    });

    it('should return correct loaded sound count when no sounds loaded', () => {
      expect(AudioService.getLoadedSoundCount()).toBe(0);
    });

    it('should check if specific sound is loaded when no sounds loaded', () => {
      expect(AudioService.isSoundLoaded('test_clip')).toBe(false);
      expect(AudioService.isSoundLoaded('nonexistent')).toBe(false);
    });
  });
});
