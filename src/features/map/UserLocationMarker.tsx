import React from 'react';
import { StyleSheet } from 'react-native';
import { View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface UserLocationMarkerProps {
    x: number;
    y: number;
    heading?: number | null; // heading-prop ei enää pakollinen
    isDark?: boolean;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ x, y, heading, isDark }) => {
    return (
        <View
            style={[styles.markerContainer, { left: x, top: y }]}
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
});

export default UserLocationMarker;
