import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Switch, Keyboard } from 'react-native';
import MapView, { Polyline, UrlTile, Marker } from 'react-native-maps';
import * as Location from 'expo-location';

// ---------------------------------------------------------
// 🔧 YOUR IP ADDRESS (Make sure this is correct!)
// ---------------------------------------------------------
const LAPTOP_IP = '172.20.10.2'; 
const BACKEND_URL = `http://${LAPTOP_IP}:8000`; 
// ---------------------------------------------------------

export default function App() {
  const [location, setLocation] = useState(null);
  const [isNightMode, setIsNightMode] = useState(false);
  
  // 🛣️ NEW STATE: Stores ALL routes (Safe, Fast, Balanced)
  const [allRoutes, setAllRoutes] = useState([]); 
  
  // Search State
  const [fromText, setFromText] = useState('Current Location');
  const [toText, setToText] = useState('');
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let userLoc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: userLoc.coords.latitude,
        longitude: userLoc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  // --- 🧠 SMART GEOCODING (With Aliases) ---
  // --- 🧠 ROBUST GEOCODING (Fixes "Not Found") ---
  // --- 🧠 INSTANT & ACCURATE GEOCODING ---
  const geocodeLocation = async (placeName) => {
    // 1. Handle "Current Location"
    if (placeName.toLowerCase() === 'current location' && location) {
      return { lat: location.latitude, lon: location.longitude };
    }

    const searchTerm = placeName.toLowerCase().trim();

    // 2. HARDCODED COORDINATES (100% Success Rate)
    // These are the exact GPS points for Bhubaneswar's key spots.
    // 2. HARDCODED COORDINATES (Updated to be On-Road)
    const knownLocations = {
      // AIRPORT (Snapped to the Roundabout on Airport Rd)
      "airport": { lat: 20.2562, lon: 85.8202 }, 
      "biju patnaik international airport": { lat: 20.2562, lon: 85.8202 },
      
      // ITER (Snapped to Jagamara - Sundarpada Road)
      "iter": { lat: 20.2505, lon: 85.8005 }, 
      "soa": { lat: 20.2505, lon: 85.8005 },

      // KIIT (Snapped to Patia Main Road)
      "kiit": { lat: 20.3540, lon: 85.8193 },
      
      // RAILWAY STATION (Master Canteen Square)
      "station": { lat: 20.2667, lon: 85.8432 },
      "railway station": { lat: 20.2667, lon: 85.8432 },

      // OTHER HOTSPOTS
      "patia": { lat: 20.3547, lon: 85.8188 },
      "esplanade": { lat: 20.2882, lon: 85.8618 },
      "master canteen": { lat: 20.2667, lon: 85.8432 },
      "jaydev vihar": { lat: 20.2913, lon: 85.8207 },
      "rasulgarh": { lat: 20.2925, lon: 85.8625 },
    };

    // CHECK HARDCODED LIST FIRST
    if (knownLocations[searchTerm]) {
      console.log(`Instant Match for: ${searchTerm}`);
      return knownLocations[searchTerm];
    }

    // 3. FALLBACK: USE API (For unknown places like "Dominos")
    try {
      console.log(`Searching API for: ${placeName}`);
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName + ", Bhubaneswar")}`;
      let response = await fetch(url);
      let data = await response.json();

      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      }
      
      Alert.alert("Not Found", `Could not find "${placeName}". Try "ITER", "Airport", or "Patia".`);
      return null;
    } catch (e) {
      Alert.alert("Connection Error", "Check internet.");
      return null;
    }
  };

  // --- 🛣️ GET MULTIPLE ROUTES ---
  const handleSearchRoute = async () => {
    Keyboard.dismiss();
    setIsSearching(true);
    setAllRoutes([]); // Clear old routes

    let startCoords = await geocodeLocation(fromText);
    let endCoords = destinationMarker 
        ? { lat: destinationMarker.latitude, lon: destinationMarker.longitude }
        : await geocodeLocation(toText);

    if (!startCoords || !endCoords) {
      Alert.alert("Error", "Location not found");
      setIsSearching(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/get-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_lat: startCoords.lat,
          start_lng: startCoords.lon,
          end_lat: endCoords.lat,
          end_lng: endCoords.lon,
          mode: 'safe'
        })
      });
      
      const json = await response.json();
      
      // Handle New Response Format: { routes: [...] }
      if (json.routes && json.routes.length > 0) {
         setAllRoutes(json.routes);
         
         // Zoom to the start
         setLocation({
             latitude: startCoords.lat,
             longitude: startCoords.lon,
             latitudeDelta: 0.05,
             longitudeDelta: 0.05
         });
         
         // Show summary of what we found
         const safeRoute = json.routes.find(r => r.color === '#00E676');
         if(safeRoute) {
             Alert.alert("Route Found", "The GREEN path is the safest option recommended by Abhaya.");
         }
      } else {
          Alert.alert("No Path", "Could not find a route.");
      }

    } catch (error) { Alert.alert("Error", "Backend unreachable"); }
    setIsSearching(false);
  };

  const handleLongPress = (e) => {
      setDestinationMarker(e.nativeEvent.coordinate);
      setToText("Selected Location");
  };

  return (
    <View style={styles.container}>
      {location ? (
        <MapView style={styles.map} region={location} showsUserLocation={true} onLongPress={handleLongPress}>
          <UrlTile 
             urlTemplate={isNightMode 
               ? "https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
               : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
             }
             maximumZ={19} flipY={false}
          />

          {/* 🚀 RENDER ALL 3 ROUTES (Green, Yellow, Red) */}
          {allRoutes.map((route, i) => (
             <React.Fragment key={`route-group-${i}`}>
                {route.segments.map((segment, j) => (
                   <Polyline
                     key={`r-${i}-s-${j}`}
                     coordinates={[
                         { latitude: segment.coords[0][0], longitude: segment.coords[0][1] },
                         { latitude: segment.coords[1][0], longitude: segment.coords[1][1] }
                     ]}
                     // Use Dynamic Color from Backend
                     strokeColor={route.color} 
                     // Safe path is thicker
                     strokeWidth={route.color === '#00E676' ? 6 : 4} 
                     // Safe path is drawn ON TOP (Higher Z-Index)
                     zIndex={route.z_index} 
                   />
                ))}
             </React.Fragment>
          ))}
          
          {destinationMarker && <Marker coordinate={destinationMarker} title="Destination" />}
        </MapView>
      ) : <View style={styles.loading}><Text>Loading Map...</Text></View>}

      <View style={styles.searchContainer}>
        <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
            <Text style={{fontWeight:'bold', fontSize: 16}}>Abhaya Search</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={{fontSize: 10, marginRight: 5}}>{isNightMode ? "Night" : "Day"}</Text>
                <Switch value={isNightMode} onValueChange={setIsNightMode} />
            </View>
        </View>
        <TextInput style={styles.input} value={fromText} onChangeText={setFromText} placeholder="From" />
        <TextInput style={styles.input} value={toText} onChangeText={setToText} placeholder="To (or Long Press Map)" />
        <TouchableOpacity style={styles.btn} onPress={handleSearchRoute}>
            <Text style={{color:'white', fontWeight: 'bold'}}>{isSearching ? "Calculating Paths..." : "Find Safe Path"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { position: 'absolute', top: 50, left: 15, right: 15, backgroundColor: 'white', padding: 15, borderRadius: 15, elevation: 10 },
  input: { backgroundColor: '#f5f5f5', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#ddd' },
  btn: { backgroundColor: '#2979FF', padding: 12, borderRadius: 8, alignItems: 'center' }
});