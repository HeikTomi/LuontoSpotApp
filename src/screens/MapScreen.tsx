import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import MapComponent from '../features/map/MapComponent';
import Compass from '../features/map/Compass';
import TagButton from '../features/map/TagButton';
import { useDispatch } from 'react-redux';
import { saveLocation } from '../features/map/locationSlice';
import { insertLocation } from '../database/queries/locations';

export const MapScreen: React.FC = () => {
    const [location, setLocation] = useState<{ latitude: number; longitude: number; heading: number | null } | null>(null);
    const dispatch = useDispatch();

    useEffect(() => {
        const watchId = Geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, heading } = position.coords;
                console.log('User location updated:', { latitude, longitude, heading });
                setLocation({ latitude, longitude, heading });
            },
            (error) => {
                console.error('Error fetching location:', error);
                Alert.alert('Error', 'Failed to fetch location: ' + error.message);
            },
            { enableHighAccuracy: true, distanceFilter: 5, interval: 2500 }
        );

        return () => Geolocation.clearWatch(watchId);
    }, []);

    const handleTagPress = async (type: string) => {
        if (!location) {
            Alert.alert('Error', 'Location not available');
            return;
        }

        const { latitude, longitude } = location;
        const title = 'New Location:' + type + '::' + latitude + longitude;

         try {
            // Tallenna sijainti SQLite-tietokantaan
            const newLocationID = await insertLocation({
                title: title,
                locationId: null, // Aseta locationId aluksi nulliksi
                latitude,
                longitude,
                tagType: type,
                ownership: 'user',
            });

            console.log('Location saved with ID:', newLocationID);
            // Tallenna sijainti Redux-storeen
            dispatch(
                saveLocation({
                    id: newLocationID,
                    title: title,
                    locationId: null, // Aluksi null
                    latitude,
                    longitude,
                    tagType: type,
                    ownership: 'user',
                    lastUpdated: new Date().toISOString(),
                })
            );

            // Ilmoita onnistumisesta
            Alert.alert('Success', `Location saved with tag: ${type}`);
        } catch (error) {
            console.error('Error saving location:', error);
            Alert.alert('Error', 'Failed to save location.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Kompassi ylhäällä */}
            <View style={styles.compassContainer}>
                <Compass />
            </View>

            {/* Kartta keskellä */}
            <View style={styles.mapContainer}>
                <MapComponent location={location} />
            </View>

            {/* Tagipainikkeet alhaalla */}
            <View style={styles.tagContainer}>
                <TagButton iconName="mushroom" onPress={() => handleTagPress('Sieni')} />
                <TagButton iconName="fruit-grapes" onPress={() => handleTagPress('Marja')} />
                <TagButton iconName="star" onPress={() => handleTagPress('Mielenkiinto')} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    compassContainer: {
        height: 115, // Lisää tilaa kompassille
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    mapContainer: {
        flex: 2, // Kartta vie vähemmän tilaa
    },
    tagContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#f5f5f5',
    },
});

export default MapScreen;
