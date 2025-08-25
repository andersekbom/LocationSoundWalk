import { StoryLoader } from '../services/StoryLoader';

// Mock the stories.json file
jest.mock('../../assets/stories/stories.json', () => ({
  stories: [
    {
      id: 'test_story',
      title: 'Test Story',
      description: 'A test story',
      soundClips: [
        {
          id: 'test_clip',
          file: 'test.mp3',
          lat: 40.7589,
          lng: -73.9851,
          radius: 50,
          title: 'Test Sound',
          description: 'A test sound clip'
        }
      ]
    }
  ]
}));

describe('StoryLoader', () => {
  describe('loadStories', () => {
    it('should successfully load valid stories data', async () => {
      const result = await StoryLoader.loadStories();
      
      expect(result.success).toBe(true);
      expect(result.stories).toBeDefined();
      expect(result.stories).toHaveLength(1);
      expect(result.stories![0].id).toBe('test_story');
      expect(result.stories![0].soundClips).toHaveLength(1);
    });

    it('should handle missing stories array', async () => {
      // Test with invalid data structure
      const invalidData = {};
      const result = StoryLoader['validateStoriesData'](invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid data structure: missing or invalid stories array');
    });

    it('should handle non-array stories data', async () => {
      // Test with invalid data structure
      const invalidData = { stories: 'not an array' };
      const result = StoryLoader['validateStoriesData'](invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid data structure: missing or invalid stories array');
    });

    it('should handle missing required story fields', async () => {
      // Test with invalid story data
      const invalidStory = {
        id: 'test_story',
        // Missing title and soundClips
      };
      const result = StoryLoader['validateStory'](invalidStory, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required field: title');
    });

    it('should handle missing soundClips array', async () => {
      // Test with invalid story data
      const invalidStory = {
        id: 'test_story',
        title: 'Test Story',
        soundClips: 'not an array'
      };
      const result = StoryLoader['validateStory'](invalidStory, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('soundClips must be an array');
    });

    it('should handle missing required sound clip fields', async () => {
      // Test with invalid sound clip data
      const invalidClip = {
        id: 'test_clip',
        // Missing file, lat, lng, radius
      };
      const result = StoryLoader['validateSoundClip'](invalidClip, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required field: file');
    });

    it('should handle invalid coordinate types', async () => {
      // Test with invalid coordinate data
      const invalidClip = {
        id: 'test_clip',
        file: 'test.mp3',
        lat: 'not a number',
        lng: 'not a number',
        radius: 50
      };
      const result = StoryLoader['validateSoundClip'](invalidClip, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('lat and lng must be numbers');
    });

    it('should handle invalid latitude range', async () => {
      // Test with invalid latitude
      const invalidClip = {
        id: 'test_clip',
        file: 'test.mp3',
        lat: 100, // Invalid: > 90
        lng: -73.9851,
        radius: 50
      };
      const result = StoryLoader['validateSoundClip'](invalidClip, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('lat must be between -90 and 90');
    });

    it('should handle invalid longitude range', async () => {
      // Test with invalid longitude
      const invalidClip = {
        id: 'test_clip',
        file: 'test.mp3',
        lat: 40.7589,
        lng: 200, // Invalid: > 180
        radius: 50
      };
      const result = StoryLoader['validateSoundClip'](invalidClip, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('lng must be between -180 and 180');
    });

    it('should handle invalid radius', async () => {
      // Test with invalid radius
      const invalidClip = {
        id: 'test_clip',
        file: 'test.mp3',
        lat: 40.7589,
        lng: -73.9851,
        radius: -10 // Invalid: negative
      };
      const result = StoryLoader['validateSoundClip'](invalidClip, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('radius must be a positive number');
    });

    it('should handle zero radius', async () => {
      // Test with zero radius
      const invalidClip = {
        id: 'test_clip',
        file: 'test.mp3',
        lat: 40.7589,
        lng: -73.9851,
        radius: 0 // Invalid: zero
      };
      const result = StoryLoader['validateSoundClip'](invalidClip, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('radius must be a positive number');
    });
  });

  describe('getStoryById', () => {
    it('should return story when found', async () => {
      const story = await StoryLoader.getStoryById('test_story');
      
      expect(story).toBeDefined();
      expect(story!.id).toBe('test_story');
      expect(story!.title).toBe('Test Story');
    });

    it('should return null when story not found', async () => {
      const story = await StoryLoader.getStoryById('nonexistent_story');
      
      expect(story).toBeNull();
    });
  });

  describe('getStoryList', () => {
    it('should return list of available stories', async () => {
      const storyList = await StoryLoader.getStoryList();
      
      expect(storyList).toHaveLength(1);
      expect(storyList[0]).toEqual({
        id: 'test_story',
        title: 'Test Story',
        description: 'A test story'
      });
    });

    it('should return empty array when no stories', async () => {
      // Mock empty stories for this test
      const originalStories = require('../../assets/stories/stories.json');
      jest.doMock('../../assets/stories/stories.json', () => ({ stories: [] }));
      
      // Clear module cache to force reload
      jest.resetModules();
      
      const StoryLoader = require('../services/StoryLoader').StoryLoader;
      const storyList = await StoryLoader.getStoryList();
      
      expect(storyList).toHaveLength(0);
      
      // Restore original mock
      jest.doMock('../../assets/stories/stories.json', () => originalStories);
      jest.resetModules();
    });
  });

  describe('error handling', () => {
    it('should handle require errors gracefully', async () => {
      // Mock require to throw error
      jest.doMock('../../assets/stories/stories.json', () => {
        throw new Error('File not found');
      });
      
      // Clear module cache to force reload
      jest.resetModules();
      
      const StoryLoader = require('../services/StoryLoader').StoryLoader;
      const result = await StoryLoader.loadStories();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load stories: File not found');
      
      // Restore original mock
      jest.doMock('../../assets/stories/stories.json', () => ({
        stories: [
          {
            id: 'test_story',
            title: 'Test Story',
            description: 'A test story',
            soundClips: [
              {
                id: 'test_clip',
                file: 'test.mp3',
                lat: 40.7589,
                lng: -73.9851,
                radius: 50,
                title: 'Test Sound',
                description: 'A test sound clip'
              }
            ]
          }
        ]
      }));
      jest.resetModules();
    });

    it('should handle validation errors with proper context', async () => {
      // Test validation with missing required fields
      const invalidClip = {
        id: 'test_clip',
        // Missing file (required field)
        lat: 40.7589,
        lng: -73.9851,
        radius: 50,
        title: 'Test Sound'
      };
      const result = StoryLoader['validateSoundClip'](invalidClip, 1);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required field: file');
    });
  });
});
