import { Story, SoundClip } from '../types';

export interface StoryLoaderResult {
  success: boolean;
  stories?: Story[];
  error?: string;
}

export class StoryLoader {
  /**
   * Loads and parses stories from the local JSON file
   */
  static async loadStories(): Promise<StoryLoaderResult> {
    try {
      // Load the stories.json file from assets
      const storiesData = require('../../assets/stories/stories.json');
      
      // Validate the loaded data
      const validationResult = this.validateStoriesData(storiesData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validationResult.error}`
        };
      }

      return {
        success: true,
        stories: storiesData.stories
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load stories: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validates the structure of loaded stories data
   */
  private static validateStoriesData(data: any): { isValid: boolean; error?: string } {
    // Check if data exists and has stories array
    if (!data || !Array.isArray(data.stories)) {
      return { isValid: false, error: 'Invalid data structure: missing or invalid stories array' };
    }

    // Validate each story
    for (let i = 0; i < data.stories.length; i++) {
      const story = data.stories[i];
      const storyValidation = this.validateStory(story, i);
      if (!storyValidation.isValid) {
        return { isValid: false, error: `Story ${i}: ${storyValidation.error}` };
      }
    }

    return { isValid: true };
  }

  /**
   * Validates individual story structure
   */
  private static validateStory(story: any, index: number): { isValid: boolean; error?: string } {
    // Required fields for a story
    const requiredFields = ['id', 'title', 'soundClips'];
    for (const field of requiredFields) {
      if (!story[field]) {
        return { isValid: false, error: `Missing required field: ${field}` };
      }
    }

    // Validate soundClips array
    if (!Array.isArray(story.soundClips)) {
      return { isValid: false, error: 'soundClips must be an array' };
    }

    // Validate each sound clip
    for (let j = 0; j < story.soundClips.length; j++) {
      const clip = story.soundClips[j];
      const clipValidation = this.validateSoundClip(clip, j);
      if (!clipValidation.isValid) {
        return { isValid: false, error: `Sound clip ${j}: ${clipValidation.error}` };
      }
    }

    return { isValid: true };
  }

  /**
   * Validates individual sound clip structure
   */
  private static validateSoundClip(clip: any, index: number): { isValid: boolean; error?: string } {
    // Required fields for a sound clip
    const requiredFields = ['id', 'file', 'lat', 'lng', 'radius'];
    for (const field of requiredFields) {
      if (clip[field] === undefined || clip[field] === null) {
        return { isValid: false, error: `Missing required field: ${field}` };
      }
    }

    // Validate coordinate types
    if (typeof clip.lat !== 'number' || typeof clip.lng !== 'number') {
      return { isValid: false, error: 'lat and lng must be numbers' };
    }

    // Validate coordinate ranges
    if (clip.lat < -90 || clip.lat > 90) {
      return { isValid: false, error: 'lat must be between -90 and 90' };
    }
    if (clip.lng < -180 || clip.lng > 180) {
      return { isValid: false, error: 'lng must be between -180 and 180' };
    }

    // Validate radius
    if (typeof clip.radius !== 'number' || clip.radius <= 0) {
      return { isValid: false, error: 'radius must be a positive number' };
    }

    return { isValid: true };
  }

  /**
   * Gets a specific story by ID
   */
  static async getStoryById(storyId: string): Promise<Story | null> {
    const result = await this.loadStories();
    if (!result.success || !result.stories) {
      return null;
    }

    return result.stories.find(story => story.id === storyId) || null;
  }

  /**
   * Gets all available story titles and IDs for selection
   */
  static async getStoryList(): Promise<Array<{ id: string; title: string; description?: string }>> {
    const result = await this.loadStories();
    if (!result.success || !result.stories) {
      return [];
    }

    return result.stories.map(story => ({
      id: story.id,
      title: story.title,
      description: story.description
    }));
  }
}
