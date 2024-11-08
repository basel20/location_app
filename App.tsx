import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import MapView, { Marker } from 'react-native-maps';

type LocationObject = Location.LocationObject;

export default function App() {
  const [serverUrl, setServerUrl] = useState<string>(''); // Server URL
  const [location, setLocation] = useState<LocationObject | null>(null);

  useEffect(() => {
    requestPermissions();
    startBackgroundLocationTracking();
  }, []);

  const requestPermissions = async () => {
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
    
    if (locationStatus !== 'granted' || backgroundStatus !== 'granted') {
      Alert.alert('Permission required', 'Location permissions are necessary for tracking.');
    }
    if (notificationStatus !== 'granted') {
      Alert.alert('Permission required', 'Notification permissions are necessary for push notifications.');
    }
  };

  const sendLocationToServer = async (locationData: LocationObject) => {
    if (!serverUrl) {
      Alert.alert('Error', 'Please enter a server URL.');
      return;
    }

    try {
      await fetch(serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: locationData.coords.latitude,
          longitude: locationData.coords.longitude,
          timestamp: locationData.timestamp,
        }),
      });
      sendNotification('Location sent to server');
    } catch (error) {
      console.error('Error sending location to server:', error);
    }
  };

  const sendNotification = async (message: string) => {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Location Update', body: message },
      trigger: null,
    });
  };

  const startBackgroundLocationTracking = async () => {
    await Location.startLocationUpdatesAsync('location-task', {
      accuracy: Location.Accuracy.High,
      distanceInterval: 10,
    });
  };

  const getLocation = async () => {
    const locationData = await Location.getCurrentPositionAsync({});
    setLocation(locationData);
  };

  const handleSendLocation = () => {
    if (location) {
      sendLocationToServer(location);
    } else {
      Alert.alert('Location Not Available', 'Please get the current location first.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>User Location Tracking</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Server URL"
        value={serverUrl}
        onChangeText={setServerUrl}
      />

      <TouchableOpacity style={styles.sendButton} onPress={getLocation}>
        <Text style={styles.btnText}>
          Get Current Location
        </Text>
      </TouchableOpacity>

      {location && (
        <View style={styles.locationInfo}>
          <Text style={styles.coordinates}>
            Latitude: {location.coords.latitude.toFixed(6)}
          </Text>
          <Text style={styles.coordinates}>
            Longitude: {location.coords.longitude.toFixed(6)}
          </Text>

          {/* Map displaying the user's location */}
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Your Location"
            />
          </MapView>
        </View>
      )}

      {/* Button to send location to the server */}
      <TouchableOpacity style={styles.sendButton} onPress={handleSendLocation}>
        <Text style={styles.btnText}>
          Send Location to Server
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 20
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#005964',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#005964',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  locationInfo: {
    marginTop: 20,
  },
  coordinates: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  map: {
    width: '100%',
    height: 300,
    marginTop: 15,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor:'#005964',
    height: 50,
    borderRadius: 20,
    width:'auto',
    alignItems:'center',
    justifyContent:'center'
  },
  btnText:{
    color:'#fff',
    fontSize:18
  }
});
