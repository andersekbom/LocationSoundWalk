import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { LocationService } from '../services/LocationService';

export default function LocationPermissionScreen({ navigation, onPermissionGranted }: any) {
  const { state } = useAppContext();
  const [isChecking, setIsChecking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<any>(null);
  const [locationEnabled, setLocationEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    checkLocationStatus();
  }, []);

  const checkLocationStatus = async () => {
    setIsChecking(true);
    try {
      // Check location permissions
      const permStatus = await LocationService.getPermissionStatus();
      setPermissionStatus(permStatus);

      // Check if location services are enabled
      const enabled = await LocationService.isLocationEnabled();
      setLocationEnabled(enabled);
    } catch (error) {
      console.error('Error checking location status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRequestPermission = async () => {
    try {
      setIsChecking(true);
      const result = await LocationService.requestPermissions();
      
      if (result.success) {
        setPermissionStatus({ granted: true, canAskAgain: true, status: 'granted' });
        if (onPermissionGranted) {
          onPermissionGranted();
        } else {
          navigation.goBack();
        }
      } else {
        Alert.alert(
          'Permission Denied',
          'Location permission is required for the sound walk experience. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => checkLocationStatus() }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to request location permission. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleOpenSettings = () => {
    // This would typically open device settings
    // For now, we'll just refresh the status
    checkLocationStatus();
  };

  const renderPermissionStatus = () => {
    if (!permissionStatus) return null;

    if (permissionStatus.granted) {
      return (
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons name="checkmark-circle" size={48} color="#28a745" />
          </View>
          <Text style={styles.statusTitle}>Location Permission Granted</Text>
          <Text style={styles.statusMessage}>
            You can now enjoy location-based sound walks!
          </Text>
        </View>
      );
    }

    if (permissionStatus.status === 'denied') {
      return (
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons name="close-circle" size={48} color="#dc3545" />
          </View>
          <Text style={styles.statusTitle}>Location Permission Required</Text>
          <Text style={styles.statusMessage}>
            This app needs location access to play sounds based on your physical location.
          </Text>
          
          {permissionStatus.canAskAgain ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRequestPermission}
              disabled={isChecking}
            >
              {isChecking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Grant Permission</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleOpenSettings}
            >
              <Text style={styles.secondaryButtonText}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.statusCard}>
        <View style={styles.statusIcon}>
          <Ionicons name="help-circle" size={48} color="#ffc107" />
        </View>
        <Text style={styles.statusTitle}>Location Permission Status</Text>
        <Text style={styles.statusMessage}>
          Current status: {permissionStatus.status}
        </Text>
        
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleRequestPermission}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Request Permission</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderLocationServicesStatus = () => {
    if (locationEnabled === null) return null;

    if (locationEnabled) {
      return (
        <View style={styles.servicesCard}>
          <View style={styles.servicesHeader}>
            <Ionicons name="location" size={24} color="#28a745" />
            <Text style={styles.servicesTitle}>Location Services</Text>
          </View>
          <Text style={styles.servicesMessage}>
            Location services are enabled on your device.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.servicesCard}>
        <View style={styles.servicesHeader}>
          <Ionicons name="location-outline" size={24} color="#dc3545" />
          <Text style={styles.servicesTitle}>Location Services Disabled</Text>
        </View>
        <Text style={styles.servicesMessage}>
          Please enable location services in your device settings to use this app.
        </Text>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleOpenSettings}
        >
          <Text style={styles.secondaryButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderInfoSection = () => (
    <View style={styles.infoCard}>
      <Text style={styles.infoTitle}>Why Location Access?</Text>
      
      <View style={styles.infoItem}>
        <Ionicons name="musical-notes" size={20} color="#007AFF" />
        <View style={styles.infoContent}>
          <Text style={styles.infoItemTitle}>Location-Based Audio</Text>
          <Text style={styles.infoItemText}>
            Sounds play automatically when you walk near specific locations
          </Text>
        </View>
      </View>
      
      <View style={styles.infoItem}>
        <Ionicons name="walk" size={20} color="#007AFF" />
        <View style={styles.infoContent}>
          <Text style={styles.infoItemTitle}>Immersive Experience</Text>
          <Text style={styles.infoItemText}>
            Discover audio stories as you explore the world around you
          </Text>
        </View>
      </View>
      
      <View style={styles.infoItem}>
        <Ionicons name="shield-checkmark" size={20} color="#007AFF" />
        <View style={styles.infoContent}>
          <Text style={styles.infoItemTitle}>Privacy First</Text>
          <Text style={styles.infoItemText}>
            Your location is only used locally on your device
          </Text>
        </View>
      </View>
    </View>
  );

  if (isChecking && !permissionStatus) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Checking location status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Access</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderPermissionStatus()}
        {renderLocationServicesStatus()}
        {renderInfoSection()}
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={checkLocationStatus}
          disabled={isChecking}
        >
          <Ionicons name="refresh" size={20} color="#007AFF" />
          <Text style={styles.refreshButtonText}>
            {isChecking ? 'Checking...' : 'Refresh Status'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 20,
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
  
  // Status Cards
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusIcon: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  
  // Services Card
  servicesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  servicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  servicesMessage: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 22,
    marginBottom: 16,
  },
  
  // Info Card
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  infoItemText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  secondaryButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  refreshButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
