import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import CompassHeading from 'react-native-compass-heading';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Compass: React.FC = () => {
    const [heading, setHeading] = useState(0);
    const [prevHeading, setPrevHeading] = useState(0);
    const animatedValue = React.useMemo(() => new Animated.Value(0), []);

    useEffect(() => {
        const degreeUpdateRate = 3; // Päivitysnopeus (asteina)
        CompassHeading.start(degreeUpdateRate, (data: any) => {
            setHeading((old) => {
                setPrevHeading(old);
                return data.heading;
            });
        });
        return () => {
            CompassHeading.stop();
        };
    }, []);

    useEffect(() => {
        let delta = heading - prevHeading;
        if (delta > 180) { delta -= 360; }
        if (delta < -180) { delta += 360; }
        const nextValue = prevHeading + delta;
        animatedValue.setValue(prevHeading);
        Animated.timing(animatedValue, {
            toValue: nextValue,
            duration: 300,
            useNativeDriver: true,
        }).start();
        setPrevHeading(nextValue % 360);
    }, [animatedValue, heading, prevHeading]);

    const rotate = animatedValue.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <View style={styles.compassContainer}>
                {/* Ilmansuunnat pysyvät paikoillaan */}
                <Text style={[styles.direction, styles.north]}>N</Text>
                <Text style={[styles.direction, styles.south]}>S</Text>
                <Text style={[styles.direction, styles.east]}>E</Text>
                <Text style={[styles.direction, styles.west]}>W</Text>
                {/* Nuoli pyörii menosuunnan mukaan */}
                <Animated.View style={[styles.iconContainer, { transform: [{ rotate }] }]}> 
                    <MaterialCommunityIcons name="navigation" size={30} color="#4CAF50" />
                </Animated.View>
            </View>
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
