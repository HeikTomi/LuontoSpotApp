import React, { useEffect, useState } from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { navigationStyles } from '../styles/navigationStyles';
import { MAP_FILTER_KEY } from '../features/settings/MapFilterToggle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet, Alert, useColorScheme, TouchableOpacity } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import CompassHeading from 'react-native-compass-heading';
import { RouteProp, ParamListBase } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import MapComponent from '../features/map/MapComponent';
import Filters from '../features/map/Filters';
import Compass from '../features/map/Compass';
import OnlineIndicator from '../features/map/OnlineIndicator';
import TagButton from '../features/map/TagButton';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { saveLocation } from '../features/map/locationSlice';
import { insertLocation } from '../database/queries/locations';
import CustomDrawer from '../components/CustomDrawer';
import { setAutoFollow } from '../features/map/autoFollowSlice';

//import { resetPhotoNotesTable, resetLocationsTable } from '../database';

interface MapScreenProps {
  route: RouteProp<RootStackParamList, 'Map'> | RouteProp<ParamListBase, string>;
  autoFollowOnStart?: boolean;
}

export const MapScreen: React.FC<MapScreenProps> = ({ route, autoFollowOnStart }) => {
    const navigation = require('@react-navigation/native').useNavigation();
    const [heading, setHeading] = useState(0);
    const dispatch = useDispatch();
    const isAutoFollow = useSelector((state: RootState) => state.autoFollow.enabled);
    const [location, setLocation] = useState<{ latitude: number; longitude: number; heading: number | null } | null>(null);
    // Tallennetaan notesista tullut location, jos sellainen on
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
                'location' in route.params &&
                route.params.location
            ) {
                setLocation(route.params.location);
                console.log('Initial location set from notes:', route.params.location);
            } else {
                Geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude, heading: coordsHeading } = position.coords;
                        setLocation({ latitude, longitude, heading: coordsHeading });
                        // Initial user location fetched
                    },
                    (error) => {
                        console.error('Error fetching initial location:', error);
                    },
                    { enableHighAccuracy: true }
                );
            }
        })();
    }, [route]);
    // Filtteritila
    const [filters, setFilters] = useState({
        mushroom: true,
        berry: true,
        star: true,
    });
    // Filtterien päällä/pois tila
    const [filterEnabled, setFilterEnabled] = useState(false);

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


    useEffect(() => {
        // Päivitä tila vain kun drawerista tullaan
        if (typeof autoFollowOnStart === 'boolean') {
            // setIsAutoFollow removed; Redux now manages auto-follow state
        }
    }, [autoFollowOnStart]);

    // Drawerista siirryttäessä Map-näkymään, aseta auto-follow drawerin tilan mukaan
    const [locationFromNotes, setLocationFromNotes] = useState(false);
    const { useFocusEffect } = require('@react-navigation/native');
    useFocusEffect(
        React.useCallback(() => {
            (async () => {
                if (route && route.params && 'location' in route.params && route.params.location) {
                    setPendingNoteLocation(route.params.location);
                    setLocation(route.params.location);
                    setLocationFromNotes(true); // Merkitään että tullaan notesista
                    dispatch(setAutoFollow(true)); // Aseta auto-follow päälle hetkeksi
                    navigation.setParams({ location: undefined });
                    console.log('Drawer focus: location param, pendingNoteLocation set, location set from notes, auto-follow ON');
                } else {
                    setLocationFromNotes(false);
                    if (typeof autoFollowOnStart === 'boolean') {
                        dispatch(setAutoFollow(autoFollowOnStart));
                        console.log('Drawer focus: auto-follow drawerin tilan mukaan', autoFollowOnStart);
                    }
                }
            })();
    }, [autoFollowOnStart, route, navigation, dispatch])
    );

    // Kun notesista tullut location on asetettu kartalle, sammutetaan seuranta vain jos tullaan notesista
    useEffect(() => {
        if (locationFromNotes && pendingNoteLocation && location &&
            location.latitude === pendingNoteLocation.latitude &&
            location.longitude === pendingNoteLocation.longitude) {
            setPendingNoteLocation(null);
            dispatch(setAutoFollow(false)); // Sammutetaan auto-follow kun location on renderöity
            setLocationFromNotes(false);
            console.log('Auto-follow OFF: location from notes set to map');
        }
    }, [location, pendingNoteLocation, locationFromNotes, dispatch]);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Kompassi-headingin päivitys
    useEffect(() => {
        const degreeUpdateRate = 3;
        CompassHeading.start(degreeUpdateRate, (data: any) => {
            setHeading(data.heading);
        });
        return () => {
            CompassHeading.stop();
        };
    }, []);

    useEffect(() => {
        let watchId: number | null = null;
        (async () => {
            const locationFromMap = await AsyncStorage.getItem('locationFromMap');
            if (locationFromMap === 'true') {
                // Älä päivitä location-tilaa käyttäjän sijainnilla
                return;
            }
            watchId = Geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, heading: coordsHeading } = position.coords;
                    setLocation((prev) => {
                        if (!prev) { return { latitude, longitude, heading: coordsHeading }; }
                        // Päivitä heading aina, pidä sijainti jos auto-follow ei ole päällä
                        if (isAutoFollow) {
                            return { latitude, longitude, heading: coordsHeading };
                        } else {
                            return { ...prev, heading: coordsHeading };
                        }
                    });
                },
                (error) => {
                    console.error('Error fetching location:', error);
                    Alert.alert('Error', 'Failed to fetch location: ' + error.message);
                },
                { enableHighAccuracy: true, distanceFilter: 5, interval: 2500 }
            );
        })();
        return () => {
            if (watchId !== null) { Geolocation.clearWatch(watchId); }
        };
    }, [isAutoFollow]);

    // Kun notesista tullut location on asetettu kartalle, sammutetaan seuranta
    useEffect(() => {
        if (pendingNoteLocation && location &&
            location.latitude === pendingNoteLocation.latitude &&
            location.longitude === pendingNoteLocation.longitude) {
            setPendingNoteLocation(null);
            // Sammutetaan auto-follow heti kun location on renderöity karttaan
            dispatch(setAutoFollow(false));
            console.log('Auto-follow OFF: location from notes set to map');
        }
    }, [location, pendingNoteLocation, dispatch]);

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
    <View style={[styles.container, isDark ? navigationStyles.headerDark : navigationStyles.headerLight]}>
      <View style={styles.drawerIconWrapper}>
        <CustomDrawer />
      </View>
      {/* Kompassi ja indikaattorit ylhäällä keskitetysti vaalealla taustalla */}
      <View style={styles.indicatorWrapper}>
        <View style={[styles.indicatorGroup, isDark ? styles.indicatorGroupDark : styles.indicatorGroupLight]}>
          <Compass heading={heading} />
          <View style={styles.indicatorRow}>
            <View style={styles.indicatorIcon}>
              <MaterialCommunityIcons name="crosshairs-gps" size={28} color={isAutoFollow ? '#2196F3' : '#BDBDBD'} />
            </View>
            <View>
              <OnlineIndicator />
            </View>
          </View>
        </View>
      </View>
      {/* Seuranta toggle: tähtäin-ikoni alas keskelle */}
      <View style={styles.autoFollowToggleWrapper}>
        <TouchableOpacity
          style={styles.autoFollowToggleBtn}
          onPress={async () => {
            dispatch(setAutoFollow(!isAutoFollow));
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={30}
            color={'#2196F3'}
          />
        </TouchableOpacity>
      </View>
      {/* Kartta keskellä */}
      <View style={styles.mapContainer}>
        <MapComponent
          location={location}
          heading={heading}
          zoomLevel={15}
          autoFollowOnStart={isAutoFollow}
          filters={filterEnabled ? { ...filters } : { mushroom: true, berry: true, star: true }}
        />
        {/* Filters-komponentti kartan oikeassa alareunassa */}
        {filterEnabled && (
          <View style={styles.filtersWrapper}>
            <Filters filters={filters} onChange={setFilters} />
          </View>
        )}
      </View>
      <View style={[styles.tagContainer, isDark ? styles.tagContainerDark : styles.tagContainerLight]}>
        <TagButton iconName="mushroom" onPress={() => handleTagPress('Sieni')} />
        <TagButton iconName="fruit-grapes" onPress={() => handleTagPress('Marja')} />
        <TagButton iconName="star" onPress={() => handleTagPress('Mielenkiinto')} />
      </View>
      {/* Kehityskäyössä olleet kannan puhdistus painikkeet */}
    </View>
    );
};

const styles = StyleSheet.create({
    headerDark: {
        backgroundColor: '#181818',
        borderBottomWidth: 0,
        elevation: 2,
    },
    headerLight: {
        backgroundColor: '#fff',
        borderBottomWidth: 0,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 17,
        color: '#222',
        fontWeight: 'bold',
        paddingVertical: 0,
    },
    drawerButton: {
        marginLeft: 16,
        padding: 1,
    },
    container: {
        flex: 1,
    },
    autoFollowToggleWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 110,
        alignItems: 'center',
        zIndex: 30,
    },
    autoFollowToggleBtn: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        padding: 10,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    filtersWrapper: {
        position: 'absolute',
        right: 5,
        bottom: 15,
        zIndex: 50,
    },
    filterBtn: {
        backgroundColor: '#eee',
        padding: 4,
        marginVertical: 2,
        borderRadius: 8,
        alignItems: 'center',
    },
    mapContainer: {
        flex: 2,
    },
    tagContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    indicatorWrapper: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
    },
    indicatorGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        paddingVertical: 2,
        paddingHorizontal: 8,
        marginBottom: 5,
    },
    indicatorGroupDark: {
        backgroundColor: '#222',
    },
    indicatorGroupLight: {
        backgroundColor: '#f0f0f0',
    },
    indicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 24,
    },
    indicatorIcon: {
        marginRight: 16,
    },
    tagContainerDark: {
        backgroundColor: '#222',
    },
    tagContainerLight: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
    },
    drawerIconWrapper: {
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 100,
        backgroundColor: 'transparent',
    },
});

export default MapScreen;

// TODO: Näytä käyttäjälle GPS:n ilmoittama tarkkuus (accuracy) kartalla, esim. tekstinä tai ympyränä sijainnin ympärillä.
// Tämä auttaa käyttäjää arvioimaan sijainnin luotettavuutta erityisesti sisätiloissa ja liikkuessa.
