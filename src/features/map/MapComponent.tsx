import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchTileImage } from '../../services/mml/mmlApi';

interface MapComponentProps {
    location: { latitude: number; longitude: number; heading: number | null } | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ location }) => {
    const [tileImage, setTileImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [tileIndices, setTileIndices] = useState<{ tileX: number; tileY: number } | null>(null);

    const calculateTileIndices = (latitude: number, longitude: number, zoomLevel: number) => {
        const tileSize = 256; // Karttatilen koko pikseleinä
        const earthCircumference = 40075016.68557849; // Maan ympärysmitta metreinä Web Mercator -projektion mukaan
        const initialResolution = earthCircumference / tileSize; // Resoluutio zoom-tasolla 0
        const originShift = earthCircumference / 2.0; // Koordinaattien alkuperä Web Mercatorissa

        // Muunna leveys- ja pituusasteet Web Mercator -koordinaatteihin
        const mx = (longitude * originShift) / 180.0;
        const my =
            Math.log(Math.tan(((90 + latitude) * Math.PI) / 360.0)) /
            (Math.PI / 180.0);
        const myMeters = (my * originShift) / 180.0;

        // Laske resoluutio nykyisellä zoom-tasolla
        const resolution = initialResolution / Math.pow(2, zoomLevel);

        // Laske tileX ja tileY
        const tileX = Math.floor((mx + originShift) / (tileSize * resolution));
        const tileY = Math.floor((originShift - myMeters) / (tileSize * resolution));

        return { tileX, tileY };
    };

    useEffect(() => {
        if (!location) {return;}

        const fetchMapData = async () => {
            const { latitude, longitude } = location;

            try {
                setLoading(true);

                // Laske karttatilen indeksit
                const zoomLevel = 15;
                const { tileX, tileY } = calculateTileIndices(latitude, longitude, zoomLevel);
                setTileIndices({ tileX, tileY });

                console.log('Loading new tile:', { tileX, tileY });

                // Hae karttatilen kuva
                const imageUri = await fetchTileImage(latitude, longitude, zoomLevel);
                setTileImage(imageUri);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching map data:', error);
                Alert.alert('Error', 'Failed to load map tile.');
                setLoading(false);
            }
        };

        fetchMapData();
    }, [location]);

    // Lasketaan käyttäjän sijaintimarkkerin sijainti suhteessa karttatileseen
    const calculateMarkerPosition = (latitude: number, longitude: number, tileX: number, tileY: number, zoomLevel: number) => {
        const tileSize = 256; // Karttatilen koko pikseleinä
        const earthCircumference = 40075016.68557849; // Maan ympärysmitta metreinä Web Mercator -projektion mukaan
        const initialResolution = earthCircumference / tileSize; // Resoluutio zoom-tasolla 0
        const originShift = earthCircumference / 2.0; // Koordinaattien alkuperä Web Mercatorissa

        // Muunna leveys- ja pituusasteet Web Mercator -koordinaatteihin
        const mx = (longitude * originShift) / 180.0;
        const my =
            Math.log(Math.tan(((90 + latitude) * Math.PI) / 360.0)) /
            (Math.PI / 180.0);
        const myMeters = (my * originShift) / 180.0;

        // Laske resoluutio nykyisellä zoom-tasolla
        const resolution = initialResolution / Math.pow(2, zoomLevel);

        // Laske tileX ja tileY
        const tileXPos = Math.floor((mx + originShift) / (tileSize * resolution));
        const tileYPos = Math.floor((originShift - myMeters) / (tileSize * resolution));

        // Laske markkerin sijainti suhteessa karttatileseen
        const x = (mx - (tileXPos * tileSize * resolution - originShift)) / resolution;
        const y = (originShift - myMeters - tileYPos * tileSize * resolution) / resolution;

        return { x, y };
    };

    if (loading || !tileIndices) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    const markerPosition = location
        ? calculateMarkerPosition(
              location.latitude,
              location.longitude,
              tileIndices.tileX,
              tileIndices.tileY,
              15 // Zoom-taso
          )
        : { x: 0, y: 0 };

    return (
        <View style={styles.container}>
            {/* Näytä karttatilen kuva */}
            <Image source={tileImage ? { uri: tileImage } : undefined} style={styles.mapImage} />

            {/* Näytä käyttäjän sijaintimarkkeri */}
            {location && (
                <View
                    style={[
                        styles.userLocation,
                        {
                            left: markerPosition.x,
                            top: markerPosition.y,
                        },
                    ]}
                >
                    <View style={styles.circle}>
                        <MaterialCommunityIcons name="navigation" size={20} color="#fff" />
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    mapImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userLocation: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        width: 30,
        height: 30,
        borderRadius: 25,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagButton: {
        position: 'absolute',
        bottom: 20,
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
    },
    tagButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default MapComponent;
