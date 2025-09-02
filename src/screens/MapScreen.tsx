import React, { useEffect, useState } from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MAP_FILTER_KEY } from '../features/settings/MapFilterToggle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet, Alert, useColorScheme, TouchableOpacity } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import MapComponent from '../features/map/MapComponent';
import Filters from '../components/Filters';
import Compass from '../features/map/Compass';
import OnlineIndicator from '../features/map/OnlineIndicator';
import TagButton from '../features/map/TagButton';
import { useDispatch } from 'react-redux';
import { saveLocation } from '../features/map/locationSlice';
import { insertLocation } from '../database/queries/locations';
//import { resetPhotoNotesTable, resetLocationsTable } from '../database';

export const MapScreen: React.FC<{ autoFollowOnStart?: boolean }> = ({ autoFollowOnStart }) => {
    // Tallennetaan notesista tullut location, jos sellainen on
    const route = useRoute<RouteProp<RootStackParamList, 'Map'>>();
    const [pendingNoteLocation, setPendingNoteLocation] = useState<{ latitude: number; longitude: number; heading: number | null } | null>(null);
    // Hae käyttäjän sijainti kerran mountissa, jotta kartta saa locationin
    // Jos tullaan notesista, location-parametri asetetaan, muuten haetaan käyttäjän sijainti
    useEffect(() => {
        (async () => {
            const locationFromMap = await AsyncStorage.getItem('locationFromMap');
            if (
                locationFromMap === 'true' &&
                route &&
                route.params &&
                route.params.location
            ) {
                setLocation(route.params.location);
                console.log('Initial location set from notes:', route.params.location);
            } else {
                Geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude, heading } = position.coords;
                        setLocation({ latitude, longitude, heading });
                        console.log('Initial user location fetched:', { latitude, longitude, heading });
                    },
                    (error) => {
                        console.error('Error fetching initial location:', error);
                    },
                    { enableHighAccuracy: true }
                );
            }
        })();
    }, [route]);
    // Seuranta-tila drawerin focus-eventille
    // Auto-follow on aina pois päältä kun Map-näkymä avataan
    const [isAutoFollow, setIsAutoFollow] = useState(false);
    const [lastAutoFollow, setLastAutoFollow] = useState(false);

    // Lue seuranta-tila AsyncStoresta mountissa
    useEffect(() => {
        (async () => {
            try {
                const locationFromMap = await AsyncStorage.getItem('locationFromMap');
                if (locationFromMap === 'true') {
                    setIsAutoFollow(false);
                    setLastAutoFollow(false);
                    await AsyncStorage.setItem('locationFromMap', 'false');
                    console.log('MapScreen: locationFromMap true, seuranta pois päältä');
                } else {
                    const val = await AsyncStorage.getItem('autoFollow');
                    setIsAutoFollow(val === 'true');
                    setLastAutoFollow(val === 'true');
                    console.log('MapScreen: autoFollow loaded from AsyncStore:', val);
                }
            } catch (e) {
                console.log('MapScreen autoFollow load error', e);
            }
        })();
    }, []);
    // Filtteritila
    const [filters, setFilters] = useState({
        mushroom: true,
        berry: true,
        star: true,
    });
    // Filtterien päällä/pois tila
    const [filterEnabled, setFilterEnabled] = useState(true);

    // Lue filterEnabled AsyncStoragesta mountissa
    useEffect(() => {
        (async () => {
            try {
                const val = await AsyncStorage.getItem(MAP_FILTER_KEY);
                if (val !== null) {
                    setFilterEnabled(val === 'true');
                }
            } catch (e) {
                console.log('MapScreen filterEnabled load error', e);
            }
        })();
    }, []);

    // Päivitä filterEnabled jos asetusta muutetaan muualla
    useEffect(() => {
        const interval = setInterval(async () => {
            const val = await AsyncStorage.getItem(MAP_FILTER_KEY);
            if (val !== null) {
                setFilterEnabled(val === 'true');
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Logitus filterEnabled-tilan muutokseen
    useEffect(() => {
        console.log('filterEnabled:', filterEnabled);
    }, [filterEnabled]);

    // Lataa filtterit AsyncStoragesta mountissa
    useEffect(() => {
        (async () => {
            try {
                const mushroom = await AsyncStorage.getItem('filter_mushroom');
                const berry = await AsyncStorage.getItem('filter_berry');
                const star = await AsyncStorage.getItem('filter_star');
                setFilters({
                    mushroom: mushroom !== 'false',
                    berry: berry !== 'false',
                    star: star !== 'false',
                });
            } catch (e) {
                console.log('MapScreen filter load error', e);
            }
        })();
    }, []);

    const navigation = require('@react-navigation/native').useNavigation();

    useEffect(() => {
        // Päivitä tila vain kun drawerista tullaan
        if (typeof autoFollowOnStart === 'boolean') {
            setIsAutoFollow(autoFollowOnStart);
        }
    }, [autoFollowOnStart]);

    // Drawerista siirryttäessä Map-näkymään, aseta auto-follow drawerin tilan mukaan
    const { useFocusEffect } = require('@react-navigation/native');
    useFocusEffect(
        React.useCallback(() => {
            (async () => {
                const locationFromMap = await AsyncStorage.getItem('locationFromMap');
                if (
                    locationFromMap === 'true' &&
                    route &&
                    route.params &&
                    route.params.location
                ) {
                    setPendingNoteLocation(route.params.location);
                    setLocation(route.params.location);
                    navigation.setParams({ location: undefined });
                    await AsyncStorage.setItem('locationFromMap', 'false');
                    console.log('Drawer focus: locationFromMap true, pendingNoteLocation set, location set from notes');
                } else {
                    setIsAutoFollow(lastAutoFollow);
                    console.log('Drawer focus: auto-follow palautettu käyttäjän valintaan (drawer navigation)', lastAutoFollow);
                }
            })();
    }, [lastAutoFollow, route, navigation])
    );
    const [location, setLocation] = useState<{ latitude: number; longitude: number; heading: number | null } | null>(null);
    const dispatch = useDispatch();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(() => {
        let watchId: number | null = null;
        (async () => {
            const locationFromMap = await AsyncStorage.getItem('locationFromMap');
            if (locationFromMap === 'true') {
                // Älä päivitä location-tilaa käyttäjän sijainnilla
                console.log('Location updates disabled (notes navigation)');
                return;
            }
            watchId = Geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, heading } = position.coords;
                    if (isAutoFollow) {
                        console.log('User location updated (auto-follow ON):', { latitude, longitude, heading });
                        setLocation({ latitude, longitude, heading });
                    } else {
                        console.log('User location updated (auto-follow OFF):', { latitude, longitude, heading });
                        // Ei päivitetä location-tilaa
                    }
                },
                (error) => {
                    console.error('Error fetching location:', error);
                    Alert.alert('Error', 'Failed to fetch location: ' + error.message);
                },
                { enableHighAccuracy: true, distanceFilter: 5, interval: 2500 }
            );
        })();
        return () => {
            if (watchId !== null) Geolocation.clearWatch(watchId);
        };
    }, [isAutoFollow]);

    // Kun notesista tullut location on asetettu kartalle, sammutetaan seuranta
    useEffect(() => {
        if (pendingNoteLocation && location &&
            location.latitude === pendingNoteLocation.latitude &&
            location.longitude === pendingNoteLocation.longitude) {
            setIsAutoFollow(false);
            setLastAutoFollow(false);
            setPendingNoteLocation(null);
            console.log('Auto-follow OFF: location from notes set to map');
        }
    }, [location, pendingNoteLocation]);

    const handleTagPress = async (type: string) => {
        if (!location) {
            Alert.alert('Error', 'Location not available');
            return;
        }

        const { latitude, longitude } = location;
        try {
            // Tallenna sijainti SQLite-tietokantaan
            const newLocationID = await insertLocation({
                noteId: null, // Aseta noteId aluksi nulliksi
                latitude,
                longitude,
                tagType: type,
                ownership: 'user',
            });

            console.log('Location saved with ID:', newLocationID);
            // Tallenna sijainti Redux-storeen
            dispatch(
                saveLocation({
                    id: newLocationID,
                    noteId: null, // Aluksi null
                    latitude,
                    longitude,
                    tagType: type,
                    ownership: 'user',
                    lastUpdated: new Date().toISOString(),
                })
            );

        } catch (error) {
            console.error('Error saving location:', error);
            Alert.alert('Error', 'Failed to save location.');
        }
    };
    /*
    const handleResetNotesTable = async () => {
        try {
            await resetPhotoNotesTable();
            dispatch({ type: 'sqlite/clearNotes' }); // Tyhjennä Redux-storen items
            Alert.alert('PhotoNotes-taulu nollattu ja luotu uudelleen!');
        } catch (err) {
            Alert.alert('Virhe PhotoNotes-taulun nollauksessa:', String(err));
        }
    };

    const handleResetLocationsTable = async () => {
        try {
            await resetLocationsTable();
            dispatch({ type: 'location/clearLocations' }); // Tyhjennä Redux-storen locations
            Alert.alert('Locations-taulu nollattu ja luotu uudelleen!');
        } catch (err) {
            Alert.alert('Virhe Locations-taulun nollauksessa:', String(err));
        }
    };
    */
    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#181818' : '#fff' }]}> 
            {/* Kompassi ylhäällä */}
            <View style={[styles.compassContainer, { backgroundColor: isDark ? '#222' : '#f5f5f5', position: 'relative', height: 115, justifyContent: 'center', alignItems: 'center' }]}> 
                {/* Kompassi keskelle */}
                <Compass />
                {/* Indikaattorit oikeaan reunaan */}
                <View style={{ position: 'absolute', right: 18, top: 48, flexDirection: 'row', alignItems: 'center', zIndex: 10 }}>
                    {/* Auto-follow-indikaattori */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginRight: 4,
                        borderRadius: 16,
                        padding: 2,
                        backgroundColor: 'rgba(255,255,255,0.7)',
                    }}>
                        <MaterialCommunityIcons name="crosshairs-gps" size={20} color={isAutoFollow ? '#2196F3' : '#BDBDBD'} style={{ marginRight: 2 }} />
                    </View>
                    {/* GPS-indikaattori */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{
                                borderRadius: 16,
                                padding: 2,
                                backgroundColor: 'rgba(255,255,255,0.7)',
                            }}>
                                <OnlineIndicator />
                            </View>
                    </View>
                </View>
            </View>
            {/* Seuranta toggle: tähtäin-ikoni alas keskelle */}
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 130, alignItems: 'center', zIndex: 30 }}>
                <TouchableOpacity
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        padding: 16,
                        borderRadius: 32,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        borderWidth: 1,
                        borderColor: '#e0e0e0',
                    }}
                    onPress={async () => {
                        setIsAutoFollow((prev) => {
                            const newVal = !prev;
                            setLastAutoFollow(newVal);
                            AsyncStorage.setItem('autoFollow', newVal ? 'true' : 'false');
                            return newVal;
                        });
                    }}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons
                        name="crosshairs-gps"
                        size={40}
                        color={'#2196F3'}
                    />
                </TouchableOpacity>
            </View>

            {/* Kartta keskellä */}
            <View style={styles.mapContainer}>
                <MapComponent
                    location={location}
                    zoomLevel={15}
                    autoFollowOnStart={isAutoFollow}
                    filters={filterEnabled ? filters : { mushroom: true, berry: true, star: true }}
                />
                {/* Filters-komponentti kartan oikeassa alareunassa */}
                {filterEnabled && (
                    <View style={{ position: 'absolute', right: 10, bottom: 20, zIndex: 1000 }}>
                        <Filters filters={filters} onChange={setFilters} />
                    </View>
                )}
            </View>

            <View style={[styles.tagContainer, { backgroundColor: isDark ? '#222' : '#f5f5f5' }]}> 
                <TagButton iconName="mushroom" onPress={() => handleTagPress('Sieni')} />
                <TagButton iconName="fruit-grapes" onPress={() => handleTagPress('Marja')} />
                <TagButton iconName="star" onPress={() => handleTagPress('Mielenkiinto')} />
            </View>
            {/* Tagipainikkeet alhaalla 
                <Button title="Reset PhotoNotes-taulu" onPress={handleResetNotesTable} />
                <Button title="Reset Locations-taulu" onPress={handleResetLocationsTable} />
            */}

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterBtn: {
        backgroundColor: '#eee',
        padding: 8,
        marginVertical: 4,
        borderRadius: 8,
        alignItems: 'center',
    },
    compassContainer: {
        height: 115,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapContainer: {
        flex: 2,
    },
    tagContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
});

export default MapScreen;
