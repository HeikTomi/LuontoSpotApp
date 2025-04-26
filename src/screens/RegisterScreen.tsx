import { t } from 'i18next';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export const RegisterScreen: React.FC = () => {
    const [isRegistering, setIsRegistering] = useState(false);

    const handleRegister = () => {
        setIsRegistering(true);

        // Simuloi rekisteröintiprosessia
        setTimeout(() => {
            setIsRegistering(false);
            Alert.alert('Registration Successful', 'You have successfully registered!');
        }, 2000); // Mockattu viive
        // TODO: Navigoi karttanäkymään tai muuhun näkymään rekisteröinnin jälkeen
        // navigation.navigate('MapScreen'); // Esimerkki navigoinnista karttanäkymään
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('register')}</Text>
            <Text style={styles.subtitle}>Simulate OAuth2 Registration</Text>

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isRegistering}>
                <Text style={styles.buttonText}>{isRegistering ? 'Registering...' : 'Register with OAuth2'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 30,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});