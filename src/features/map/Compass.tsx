import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import CompassHeading from 'react-native-compass-heading';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Compass: React.FC = () => {
    const [heading, setHeading] = useState(0);
    const animatedValue = React.useMemo(() => new Animated.Value(0), []);

    useEffect(() => {
        const degreeUpdateRate = 3; // Päivitysnopeus (asteina)
        CompassHeading.start(degreeUpdateRate, (data: any) => {
            setHeading(data.heading); // Päivitä suunta
        });

        return () => {
            CompassHeading.stop(); // Lopeta kompassin seuranta komponentin poistuessa
        };
    }, []);

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: heading,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [animatedValue, heading]);

    const rotate = animatedValue.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.compassContainer,
                    {
                        transform: [{ rotate }], // Pyöritetään koko kompassia
                    },
                ]}
            >
                {/* Ilmansuunnat */}
                <Text style={[styles.direction, styles.north]}>N</Text>
                <Text style={[styles.direction, styles.south]}>S</Text>
                <Text style={[styles.direction, styles.east]}>E</Text>
                <Text style={[styles.direction, styles.west]}>W</Text>

                {/* Nuoli */}
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="navigation" size={30} color="#4CAF50" />
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    compassContainer: {
        width: 100,
        height: 100,
        borderRadius: 100, // Pallon muoto
        borderWidth: 3,
        borderColor: '#4CAF50', // Vihreä reunus
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
    },
    direction: {
        position: 'absolute',
        fontSize: 15,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    north: {
        top: 10,
        alignSelf: 'center',
    },
    south: {
        bottom: 10,
        alignSelf: 'center',
    },
    east: {
        right: 10,
        alignSelf: 'center',
    },
    west: {
        left: 10,
        alignSelf: 'center',
    },
});

export default Compass;
