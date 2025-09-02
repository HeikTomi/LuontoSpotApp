import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';

const OnlineIndicator: React.FC = () => {
    const [gpsAvailable, setGpsAvailable] = React.useState(true);
    React.useEffect(() => {
        let watchId: number | null = null;
        let timeoutId: NodeJS.Timeout | null = null;
    const TIMEOUT_MS = 5000; // 5 sekuntia
        const resetTimeout = () => {
            if (timeoutId) { clearTimeout(timeoutId); }
            timeoutId = setTimeout(() => {
                setGpsAvailable(false);
            }, TIMEOUT_MS);
        };
        watchId = Geolocation.watchPosition(
            () => {
                setGpsAvailable(true);
                resetTimeout();
            },
            (error) => {
                console.log('Geolocation error:', error);
                if (error.code === 2 || error.code === 3) {
                    setGpsAvailable(false);
                }
            },
            { enableHighAccuracy: true, distanceFilter: 10, interval: 5000 }
        );
        // Timeout käynnistetään vain kun sijaintia ei saada
        resetTimeout();
        return () => {
            if (watchId !== null) { Geolocation.clearWatch(watchId); }
            if (timeoutId) { clearTimeout(timeoutId); }
        };
    }, []);
    return (
        <MaterialCommunityIcons
            name="map-marker"
            size={20}
            color={gpsAvailable ? '#4CAF50' : '#d32f2f'}
        />
    );
};

export default OnlineIndicator;
