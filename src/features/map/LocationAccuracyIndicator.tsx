import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface LocationAccuracyIndicatorProps {
    accuracy: number | null;
    isDark?: boolean;
}

function getAccuracyLevel(accuracy: number | null): number {
    if (accuracy === null || !Number.isFinite(accuracy)) {
        return 0;
    }

    if (accuracy <= 5) {
        return 5;
    }

    if (accuracy <= 10) {
        return 4;
    }

    if (accuracy <= 20) {
        return 3;
    }

    if (accuracy <= 40) {
        return 2;
    }

    return 1;
}

function getAccuracyTone(level: number): {
    color: string;
    label: string;
} {
    if (level <= 0) {
        return {
            color: '#9E9E9E',
            label: 'NA',
        };
    }

    if (level >= 5) {
        return {
            color: '#2E7D32',
            label: 'Excellent',
        };
    }

    if (level >= 4) {
        return {
            color: '#43A047',
            label: 'Good',
        };
    }

    if (level >= 3) {
        return {
            color: '#F9A825',
            label: 'OK',
        };
    }

    if (level >= 2) {
        return {
            color: '#FB8C00',
            label: 'Weak',
        };
    }

    return {
        color: '#E53935',
        label: 'Poor',
    };
}

const LocationAccuracyIndicator: React.FC<LocationAccuracyIndicatorProps> = ({
    accuracy,
    isDark,
}) => {
    const level = getAccuracyLevel(accuracy);
    const tone = getAccuracyTone(level);
    const meterText =
        accuracy !== null && Number.isFinite(accuracy)
            ? `+/-${Math.round(accuracy)}m`
            : 'NA';

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: isDark
                        ? 'rgba(25, 25, 25, 0.75)'
                        : 'rgba(255, 255, 255, 0.85)',
                    borderColor: isDark
                        ? '#3a3a3a'
                        : '#d9d9d9',
                },
            ]}
            accessibilityRole="image"
            accessibilityLabel={`Paikannustarkkuus ${level}/5, ${meterText}`}
        >
            <View
                style={[
                    styles.iconCircle,
                    {
                        backgroundColor: `${tone.color}22`,
                        borderColor: `${tone.color}66`,
                    },
                ]}
            >
                <MaterialCommunityIcons
                    name="crosshairs-gps"
                    size={13}
                    color={tone.color}
                />
            </View>

            <View style={styles.textColumn}>
                <Text
                    style={[
                        styles.meterText,
                        {
                            color: isDark ? '#F5F5F5' : '#1A1A1A',
                        },
                    ]}
                >
                    {meterText}
                </Text>
                <Text
                    style={[
                        styles.labelText,
                        { color: tone.color },
                    ]}
                >
                    {tone.label}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 82,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 14,
        borderWidth: 1,
        gap: 6,
    },
    iconCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textColumn: {
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    meterText: {
        fontSize: 11,
        fontWeight: '700',
        lineHeight: 13,
    },
    labelText: {
        fontSize: 9,
        fontWeight: '600',
        lineHeight: 11,
    },
});

export default LocationAccuracyIndicator;
