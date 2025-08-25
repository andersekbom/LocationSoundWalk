import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppContext } from '../context/AppContext';

export default function StoryListScreen() {
  const { state } = useAppContext();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Story Selection</Text>
      <Text style={styles.subtitle}>Choose a story to begin your sound walk</Text>
      <Text style={styles.debug}>Stories loaded: {state.stories.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  debug: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
});