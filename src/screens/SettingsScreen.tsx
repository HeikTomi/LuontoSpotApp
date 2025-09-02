import React from 'react';
// ...existing code...
import MapFilterToggle from '../features/settings/MapFilterToggle';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

const SettingsScreen: React.FC = () => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();

    return (
        <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
            <Text style={[styles.text, isDark ? styles.textDark : styles.textLight]}>{t('settingsTitle', 'Asetukset')}</Text>
                        <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
                                <Text style={[styles.cardTitle, styles.center, isDark ? styles.cardTitleDark : styles.cardTitleLight]}>{t('language', 'Kielivalinta')}</Text>
                                <View style={styles.langWrap}>
                                    <LanguageSelector />
                                </View>
                        </View>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.cardTitle, styles.center, isDark ? styles.cardTitleDark : styles.cardTitleLight]}>{t('mapFilters', 'Karttasuodattimet')}</Text>
                <MapFilterToggle />
            </View>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.cardTitle, styles.center, isDark ? styles.cardTitleDark : styles.cardTitleLight]}>{t('aboutTitle', 'Tietoa sovelluksesta')}</Text>
                <Text style={[styles.aboutText, isDark ? styles.aboutTextDark : styles.aboutTextLight]}>{t('aboutDescription', 'LuontoSpotApp on luonnon löytöjen ja muistiinpanojen mobiilisovellus.')}</Text>
                <Text style={[styles.aboutContact, isDark ? styles.aboutContactDark : styles.aboutContactLight]}>{t('contactEmail', 'Yhteys')}: heikkinentomi@hotmail.com</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    langWrap: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 8,
    },
    center: {
        textAlign: 'center',
    },
    card: {
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
        width: '90%',
        alignSelf: 'center',
    },
    cardDark: {
        backgroundColor: '#222',
    },
    cardLight: {
        backgroundColor: '#f7f7f7',
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 8,
        marginLeft: 2,
        letterSpacing: 0.2,
    },
    cardTitleDark: {
        color: '#fff',
    },
    cardTitleLight: {
        color: '#222',
    },
    bgDark: {
        backgroundColor: '#181818',
    },
    bgLight: {
        backgroundColor: '#fff',
    },
    textDark: {
        color: '#fff',
        marginBottom: 24,
    },
    textLight: {
        color: '#222',
        marginBottom: 24,
    },
    aboutContainerDark: {
        backgroundColor: '#222',
    },
    aboutContainerLight: {
        backgroundColor: '#f5f5f5',
    },
    aboutTitleDark: {
        color: '#fff',
    },
    aboutTitleLight: {
        color: '#222',
    },
    aboutTextDark: {
        color: '#bbb',
    },
    aboutTextLight: {
        color: '#222',
    },
    aboutContactDark: {
        color: '#fffbe6',
    },
    aboutContactLight: {
        color: '#388E3C',
    },
    aboutContainer: {
        marginTop: 32,
        padding: 16,
        borderRadius: 8,
        width: '90%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    aboutTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    aboutText: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 12,
    },
    aboutContact: {
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default SettingsScreen;
