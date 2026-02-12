
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Switch } from 'react-native';
import MapView, { Polyline, Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';

// ---------------------------------------------------------
// 🔧 CONFIGURATION: CHANGE THIS TO YOUR LAPTOP'S IP!
// ---------------------------------------------------------
const LAPTOP_IP = '172.20.10.2'; 
const BACKEND_URL = `http://${LAPTOP_IP}:8000`; 
// ---------------------------------------------------------

export default function App() {
  const [location, setLocation] = useState(null);
  const [roads, setRoads] = useState([]); // Heatmap data
  const [route, setRoute] = useState([]); // Safe Path data
  const [isNightMode, setIsNightMode] = useState(false);

  // 1. On App Start: Get Location & Load Map
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let userLoc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: userLoc.coords.latitude,
        longitude: userLoc.coords.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      });

      fetchHeatmap("day"); // Load Day map initially
    })();
  }, []);

  // 2. Fetch Heatmap from Python Backend
  const fetchHeatmap = async (mode) => {
    try {
      console.log(`Fetching ${mode} map from: ${BACKEND_URL}/api/heatmap?time=${mode}`);
      const response = await fetch(`${BACKEND_URL}/api/heatmap?time=${mode}`);
      const json = await response.json();
      setRoads(json.roads);
    } catch (error) {
      console.error("Fetch Error:", error);
      Alert.alert("Connection Error", "Check if Backend is running & IP is correct.");
    }
  };

  // 3. Toggle Day/Night Mode
  const toggleNightMode = () => {
    const newMode = !isNightMode;
    setIsNightMode(newMode);
    fetchHeatmap(newMode ? "night" : "day");
  };

  // 4. Get Safe Route (Patia -> Destination)
  const getSafeRoute = async () => {
    if (!location) return;

    // Hardcoded destination (e.g., a spot nearby) to simulate navigation
    // In a real app, you'd pick this from the map.
    const destination = { lat: 20.3500, lng: 85.8200 }; 

    try {
      const response = await fetch(`${BACKEND_URL}/api/get-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_lat: location.latitude,
          start_lng: location.longitude,
          end_lat: destination.lat,
          end_lng: destination.lng,
          mode: 'safe'
        })
      });
      
      const json = await response.json();
      
      // Convert [lat, lng] array to object {latitude, longitude}
      const formattedRoute = json.path.map(p => ({ latitude: p[0], longitude: p[1] }));
      setRoute(formattedRoute);
      Alert.alert("Safe Route Found!", "Follow the BLUE line.");
    } catch (error) {
      Alert.alert("Error", "Could not find a path.");
    }
  };

  // 5. Send SOS Alert
  const sendSOS = async () => {
    if (!location) return;
    try {
      await fetch(`${BACKEND_URL}/api/report-incident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "SOS",
          lat: location.latitude,
          lng: location.longitude,
          description: "User pressed Panic Button"
        })
      });
      Alert.alert("🚨 SOS SENT!", "Help is on the way.");
    } catch (error) {
      Alert.alert("Failed", "Could not connect to server.");
    }
  };

  // Helper: Get Color for Roads
  const getRoadColor = (score) => {
    if (score >= 8) return '#00E676'; // Green (Safe)
    if (score >= 4) return '#FFEA00'; // Yellow
    return '#FF1744';                 // Red (Danger)
  };

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={styles.map}
          initialRegion={location}
          showsUserLocation={true}
        >
          {/* Hack: Use OpenStreetMap Tiles so you don't need a Google API Key */}
          <UrlTile 
             urlTemplate={isNightMode 
               ? "https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png" // Dark Mode
               : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // Light Mode
             }
             maximumZ={19}
             flipY={false}
          />

          {/* LAYER 1: The Heatmap */}
          {roads.map((road, index) => (
            <Polyline
              key={index}
              coordinates={road.coords.map(c => ({ latitude: c[0], longitude: c[1] }))}
              strokeColor={getRoadColor(road.safety)}
              strokeWidth={4}
            />
          ))}

          {/* LAYER 2: The Safe Route */}
          {route.length > 0 && (
            <Polyline
              coordinates={route}
              strokeColor="#2979FF"
              strokeWidth={6}
            />
          )}
        </MapView>
      ) : (
        <View style={styles.loading}>
          <Text>Getting GPS Location...</Text>
        </View>
      )}

      {/* UI Overlay */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Abhaya Safe Map</Text>
        <View style={styles.switchContainer}>
          <Text style={{color: 'black', marginRight: 5}}>{isNightMode ? "Night" : "Day"}</Text>
          <Switch value={isNightMode} onValueChange={toggleNightMode} />
        </View>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navButton} onPress={getSafeRoute}>
          <Text style={styles.btnText}>navigate_safe</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sosButton} onPress={sendSOS}>
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  topBar: {
    position: 'absolute', top: 50, left: 20, right: 20,
    backgroundColor: 'white', padding: 15, borderRadius: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity:0.2
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  switchContainer: { flexDirection: 'row', alignItems: 'center' },

  bottomBar: {
    position: 'absolute', bottom: 40, width: '100%',
    flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center'
  },
  navButton: {
    backgroundColor: '#2979FF', paddingVertical: 15, paddingHorizontal: 30,
    borderRadius: 30, elevation: 5
  },
  sosButton: {
    backgroundColor: '#D50000', width: 70, height: 70,
    borderRadius: 35, justifyContent: 'center', alignItems: 'center',
    elevation: 10, borderWidth: 3, borderColor: 'white'
  },
  btnText: { color: 'white', fontWeight: 'bold' },
  sosText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});