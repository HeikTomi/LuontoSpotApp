import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface UserLocationMarkerProps {
    x: number;
    y: number;
    latitude?: number;
    longitude?: number;
    heading?: number | null;
    isDark?: boolean;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ x, y, latitude, longitude, heading, isDark }) => {
    const lat = Number.isFinite(latitude ?? NaN) ? latitude ?? 0 : 0;
    const lon = Number.isFinite(longitude ?? NaN) ? longitude ?? 0 : 0;

    return (
        <View
            style={[styles.markerContainer, { left: x - 18, top: y - 18 }]}
            pointerEvents="none"
        >
            <View style={[styles.circle, { backgroundColor: isDark ? '#925821ff' : '#4CAF50' }]}
            >
                <MaterialCommunityIcons
                    name="navigation"
                    size={20}
                    color="#fff"
                    style={{ transform: [{ rotate: `${heading ?? 0}deg` }] }}
                />
            </View>
            <View style={styles.debugBox}>
                <Text style={styles.debugText}>{`lat ${lat.toFixed(5)}`}</Text>
                <Text style={styles.debugText}>{`lon ${lon.toFixed(5)}`}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    markerContainer: {
        position: 'absolute',
        zIndex: 99,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        width: 30,
        height: 30,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    debugBox: {
        position: 'absolute',
        top: 34,
        left: -26,
        backgroundColor: 'rgba(0,0,0,0.65)',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
        minWidth: 92,
    },
    debugText: {
        color: '#fff',
        fontSize: 9,
        lineHeight: 12,
        fontWeight: '600',
    },
});

export default UserLocationMarker;
