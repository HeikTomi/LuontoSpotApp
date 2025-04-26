import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
interface AuthenticationProps {
    onRegister: () => void;
    onLogin: () => void;
    onSkip: () => void;
}

export const Authentication: React.FC<AuthenticationProps> = ({ onRegister, onLogin, onSkip }) => {
    const { t } = useTranslation(); // Käytä useTranslation-hookia
    return (
        <View style={styles.container}>
            {/* Taustakuva */}
            <Image source={require('../../assets/images/background.jpg')} style={styles.backgroundImage} />

            {/* Sisältö */}
            <View style={styles.content}>
                <Text style={styles.title}>{t('welcome')}</Text>
                <Text style={styles.subtitle}>{t('slogan')}</Text>

                {/* Rekisteröinti-painike */}
                <TouchableOpacity style={styles.button} onPress={onRegister}>
                    <Text style={styles.buttonText}>{t('register')}</Text>
                </TouchableOpacity>

                {/* Kirjautuminen-painike */}
                <TouchableOpacity style={styles.button} onPress={onLogin}>
                    <Text style={styles.buttonText}>{t('login')}</Text>
                </TouchableOpacity>

                {/* Skip-painike */}
                <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                    <Text style={styles.skipButtonText}>{t('skipLogin')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backgroundImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.8)', // Tumma varjo
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.8)', // Tumma varjo
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
        marginBottom: 30,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#4CAF50', // Vihreä sävy
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginBottom: 15,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    skipButton: {
        marginTop: 20,
    },
    skipButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        textShadowColor: 'rgba(0, 0, 0, 0.8)', // Tumma varjo
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
});
