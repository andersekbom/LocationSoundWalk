import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Story } from '../types';

interface StoryItemProps {
  story: Story;
  onSelect: (story: Story) => void;
}

const StoryItem: React.FC<StoryItemProps> = ({ story, onSelect }) => (
  <TouchableOpacity
    style={styles.storyItem}
    onPress={() => onSelect(story)}
    activeOpacity={0.7}
  >
    <View style={styles.storyHeader}>
      <Text style={styles.storyTitle}>{story.title}</Text>
      <View style={styles.storyBadge}>
        <Text style={styles.storyBadgeText}>{story.soundClips.length}</Text>
      </View>
    </View>
    
    {story.description && (
      <Text style={styles.storyDescription} numberOfLines={2}>
        {story.description}
      </Text>
    )}
    
    <View style={styles.storyFooter}>
      <Text style={styles.storyClips}>
        {story.soundClips.length} sound clip{story.soundClips.length !== 1 ? 's' : ''}
      </Text>
      <Text style={styles.storyDistance}>
        ~{Math.round(story.soundClips.reduce((total, clip) => total + clip.radius, 0) / story.soundClips.length)}m radius
      </Text>
    </View>
  </TouchableOpacity>
);

export default function StoryListScreen({ navigation }: any) {
  const { state, selectStory, loadStories } = useAppContext();

  React.useEffect(() => {
    // Load stories if not already loaded
    if (state.stories.length === 0 && !state.isLoadingStories) {
      loadStories();
    }
  }, [loadStories, state.stories.length, state.isLoadingStories]);

  const handleStorySelect = async (story: Story) => {
    try {
      await selectStory(story.id);
      // Navigate to playback screen
      navigation.navigate('Playback');
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to select story. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRetry = () => {
    loadStories();
  };

  const renderContent = () => {
    if (state.isLoadingStories) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading stories...</Text>
        </View>
      );
    }

    if (state.error) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>Failed to Load Stories</Text>
          <Text style={styles.errorMessage}>{state.error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (state.stories.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>No Stories Available</Text>
          <Text style={styles.emptyMessage}>
            No stories have been loaded. Please check your configuration.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Reload</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={state.stories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StoryItem story={item} onSelect={handleStorySelect} />
        )}
        contentContainerStyle={styles.storyList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sound Walks</Text>
        <Text style={styles.headerSubtitle}>
          Choose your adventure
        </Text>
      </View>
      
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  storyList: {
    padding: 20,
  },
  storyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  storyBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  storyBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  storyDescription: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 22,
    marginBottom: 16,
  },
  storyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyClips: {
    fontSize: 14,
    color: '#6c757d',
  },
  storyDistance: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});