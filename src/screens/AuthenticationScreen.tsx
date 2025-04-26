import React from 'react';
import { Authentication } from '../features/auth/Authentication';
import { useNavigation } from '@react-navigation/native';
import { LanguageSelector } from '../components/LanguageSelector';
import { AuthenticationScreenNavigationProp } from '../../App';
import { View, StyleSheet } from 'react-native';

export const AuthenticationScreen: React.FC = () => {
    const navigation = useNavigation<AuthenticationScreenNavigationProp>();

    const handleRegister = () => {
        navigation.navigate('Register'); // Navigoi rekisteröintinäkymään
    };

    const handleLogin = () => {
        navigation.navigate('Login'); // Navigoi kirjautumisnäkymään
    };

    const handleSkip = () => {
        navigation.navigate('Drawer'); // Navigoi Drawer-navigaattoriin
    };

    return (
        <View style={styles.container}>
            {/* Kielivalinta */}
            <View style={styles.languageSelector}>
                <LanguageSelector />
            </View>

            {/* Authentication-komponentti */}
            <Authentication
                onRegister={handleRegister}
                onLogin={handleLogin}
                onSkip={handleSkip}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative', // Varmistaa, että sisältö on päällekkäin
    },
    languageSelector: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10, // Asettaa kielivalinnan muiden elementtien päälle
    },
});

export default AuthenticationScreen;
