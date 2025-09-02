import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { TouchableRipple } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import flags from 'emoji-flags';

export const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();

    const changeLanguage = async (language: string) => {
        try {
            // Vaihda sovelluksen kieli
            await i18n.changeLanguage(language);

            // Tallenna kielivalinta AsyncStorageen
            await AsyncStorage.setItem('appLanguage', language);
        } catch (error) {
            console.error('Failed to change language:', error);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableRipple onPress={() => changeLanguage('fi')} style={styles.flagButton}>
                <Text style={styles.flag}>{flags.FI.emoji}</Text>
            </TouchableRipple>
            <TouchableRipple onPress={() => changeLanguage('sv')} style={styles.flagButton}>
                <Text style={styles.flag}>{flags.SE.emoji}</Text>
            </TouchableRipple>
            <TouchableRipple onPress={() => changeLanguage('en')} style={styles.flagButton}>
                <Text style={styles.flag}>{flags.GB.emoji}</Text>
            </TouchableRipple>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    flagButton: {
        marginHorizontal: 5,
    },
    flag: {
        fontSize: 24,
    },
});
