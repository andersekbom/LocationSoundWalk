import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider } from './src/context/AppContext';
import StoryListScreen from './src/screens/StoryListScreen';
import PlaybackScreen from './src/screens/PlaybackScreen';

export type RootStackParamList = {
  StoryList: undefined;
  Playback: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="StoryList">
          <Stack.Screen 
            name="StoryList" 
            component={StoryListScreen}
            options={{ title: 'Sound Walk Stories' }}
          />
          <Stack.Screen 
            name="Playback" 
            component={PlaybackScreen}
            options={{ title: 'Sound Walk' }}
          />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </AppProvider>
  );
}
