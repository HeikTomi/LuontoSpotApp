import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, findNodeHandle, UIManager } from 'react-native';
import { Portal } from 'react-native-portalize';
import { useTranslation } from 'react-i18next';
import { TouchableRipple } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Haversine distance calculation
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371e3; // metres
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
}

interface ListTagProps {
    item: any;
    locations: any[];
    isDark: boolean;
    userLocation?: { latitude: number; longitude: number };
    onRequestLocation?: () => void;
}

const ListTag: React.FC<ListTagProps> = ({ item, locations, isDark, userLocation, onRequestLocation }) => {
    const [showBubble, setShowBubble] = useState(false);
    const [bubblePos, setBubblePos] = useState<{x: number, y: number} | null>(null);
    const iconRef = useRef<View>(null);
    const { t } = useTranslation();
    const location = locations.find((l: any) => l.noteId === item.id);

    let iconName = 'map-marker';
    if (location && location.tagType) {
        if (location.tagType === 'Mielenkiinto') { iconName = 'star'; }
        else if (location.tagType === 'Marja') { iconName = 'fruit-grapes'; }
        else if (location.tagType === 'Sieni') { iconName = 'mushroom'; }
    }

    // Muokkaus päivämäärä
    let date = item.lastUpdated;
    console.log('ListTag item:', item);
    console.log('ListTag date value:', date);
    // Try to parse ISO string, fallback to raw value
    let dateString = '-';
    if (date) {
        try {
            const d = new Date(date);
            dateString = isNaN(d.getTime()) ? date : d.toLocaleDateString();
        } catch {
            dateString = date;
        }
    }
    // Etäisyys käyttäjän sijaintiin
    let distance = null;
    if (userLocation && location) {
        distance = getDistance(
            userLocation.latitude,
            userLocation.longitude,
            location.latitude,
            location.longitude
        );
    }
    const handleIconPress = () => {
        if (onRequestLocation) {
            onRequestLocation();
        }
        if (!showBubble) {
            // Mitataan ikonin sijainti ruudulla
            if (iconRef.current) {
                const node = findNodeHandle(iconRef.current);
                if (node) {
                    UIManager.measureInWindow(node, (x, y, width, _height) => {
                        setBubblePos({ x: x + width + 4, y: y });
                        setShowBubble(true);
                    });
                } else {
                    setShowBubble(true);
                }
            } else {
                setShowBubble(true);
            }
        } else {
            setShowBubble(false);
        }
    };

    return (
        <View style={styles.relativeContainer}>
            <TouchableRipple style={styles.iconButton} onPress={handleIconPress}>
                <View ref={iconRef} collapsable={false}>
                    <Icon
                        name={iconName}
                        size={18}
                        style={isDark ? styles.iconCameraDark : styles.iconCameraLight}
                    />
                </View>
            </TouchableRipple>
            {showBubble && bubblePos && (
                <Portal>
                    <View style={[
                        styles.bubble,
                        isDark ? styles.bubbleDark : styles.bubbleLight,
                        styles.bubblePortal,
                        { left: bubblePos.x, top: bubblePos.y },
                    ]}>
                        <Text style={isDark ? styles.bubbleTextDark : styles.bubbleTextLight}>
                            {t('dateLabel')}: {dateString}
                        </Text>
                        {distance !== null && (
                            <Text style={isDark ? styles.bubbleTextDark : styles.bubbleTextLight}>
                                {t('distanceLabel')}: {distance < 1000 ? `${distance.toFixed(0)} m` : `${(distance / 1000).toFixed(2)} km`}
                            </Text>
                        )}
                    </View>
                </Portal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    iconButton: {
        marginHorizontal: 5,
    },
    iconCameraDark: {
        color: '#925821ff',
    },
    iconCameraLight: {
        color: '#4CAF50',
    },
    bubble: {
        minWidth: 120,
        padding: 8,
        borderRadius: 8,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
    },
    bubblePortal: {
        position: 'absolute',
        zIndex: 1000,
    },
    bubbleDark: {
        backgroundColor: '#222',
        borderColor: '#925821ff',
        borderWidth: 1,
    },
    bubbleLight: {
        backgroundColor: '#fff',
        borderColor: '#4CAF50',
        borderWidth: 1,
    },
    bubbleTextDark: {
        color: '#fff',
    },
    bubbleTextLight: {
        color: '#222',
    },
    relativeContainer: {
        position: 'relative',
    },
});

export default ListTag;
