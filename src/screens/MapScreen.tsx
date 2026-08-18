import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
    View,
    StyleSheet,
    Alert,
    useColorScheme,
    TouchableOpacity,
    Text,
    ActivityIndicator,
} from 'react-native';

import Geolocation from '@react-native-community/geolocation';
import CompassHeading from 'react-native-compass-heading';

import {
    RouteProp,
    ParamListBase,
    useFocusEffect,
} from '@react-navigation/native';

import { RootStackParamList } from '../../App';

import MapComponent from '../features/map/MapComponent';
import Compass from '../features/map/Compass';
import OnlineIndicator from '../features/map/OnlineIndicator';
import LocationAccuracyIndicator from '../features/map/LocationAccuracyIndicator';
import TagButton from '../features/map/TagButton';

import {
    useSelector,
    useDispatch,
} from 'react-redux';

import { RootState } from '../store/store';

import { saveLocation } from '../features/map/locationSlice';
import { insertLocation } from '../database/queries/locations';
import { resolveMapRouteState } from './mapScreenLocation';

import CustomDrawer from '../components/CustomDrawer';

import {
    setAutoFollow,
} from '../features/map/autoFollowSlice';

interface MapScreenProps {
    route:
        | RouteProp<RootStackParamList, 'Map'>
        | RouteProp<ParamListBase, string>;

    autoFollowOnStart?: boolean;
}

interface MapLocation {
    latitude: number;
    longitude: number;
    heading: number | null;
}

const DEFAULT_MAP_ZOOM = 15;
const MIN_MAP_ZOOM = 0;
const MAX_MAP_ZOOM = 18;

export const MapScreen: React.FC<MapScreenProps> = ({
    route,
    autoFollowOnStart,
}) => {
    const dispatch = useDispatch();

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const isAutoFollow = useSelector(
        (state: RootState) =>
            state.autoFollow.enabled
    );

    const [heading, setHeading] =
        useState(0);

    /*
     * ---------------------------------------------------------
     * LOCATION
     * ---------------------------------------------------------
     */

    const [location, setLocation] =
        useState<MapLocation | null>(null);

    const locationRef =
        useRef<MapLocation | null>(null);

    const [zoomLevel, setZoomLevel] =
        useState(DEFAULT_MAP_ZOOM);

    const [locationAccuracy, setLocationAccuracy] =
        useState<number | null>(null);

    const [gpsAvailable, setGpsAvailable] =
        useState(false);

    const [
        isLocationRequesting,
        setIsLocationRequesting,
    ] = useState(false);

    /*
     * ---------------------------------------------------------
     * INITIALIZATION REFS
     * ---------------------------------------------------------
     *
     * Näillä estetään se, että MapScreenin renderöityminen
     * tai sijainnin muuttuminen käynnistää alkulogiikan uudelleen.
     */

    const hasInitializedRef =
        useRef(false);

    const hasAppliedStartAutoFollowRef =
        useRef(false);

    /*
     * ---------------------------------------------------------
     * GPS LOG
     * ---------------------------------------------------------
     */

    const logGps = (
        message: string,
        data?: unknown
    ) => {
        if (data !== undefined) {
            console.log(
                `[GPS] ${message}`,
                data
            );
        } else {
            console.log(
                `[GPS] ${message}`
            );
        }
    };

    /*
     * ---------------------------------------------------------
     * LOCATION STATE HELPER
     * ---------------------------------------------------------
     */

    const updateLocation = useCallback(
        (
            nextLocation: MapLocation
        ) => {
            locationRef.current =
                nextLocation;

            setLocation(
                nextLocation
            );
        },
        []
    );

    /*
     * ---------------------------------------------------------
     * CURRENT LOCATION
     * ---------------------------------------------------------
     *
     * Tämä funktio EI riipu location-statesta.
     *
     * Tämä on tärkeää:
     *
     * location muuttuu jatkuvasti GPS-watchin kautta,
     * mutta se ei saa aiheuttaa uuden requestCurrentLocation-
     * funktion syntymistä eikä initial useEffectin uudelleenajoa.
     */

    const requestCurrentLocation =
        useCallback(
            (
                label: string,
                enableAutoFollow = false
            ) => {
                const isManualRequest =
                    label ===
                    'manual-button';

                logGps(
                    '========================================'
                );

                logGps(
                    `Sijainnin haku aloitettu: ${label}`
                );

                const options = {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 0,
                };

                logGps(
                    'Location request options',
                    options
                );

                logGps(
                    isManualRequest
                        ? 'Mode: MANUAL / FAST LOCATION'
                        : 'Mode: INITIAL / FAST LOCATION'
                );

                setIsLocationRequesting(
                    true
                );

                Geolocation.getCurrentPosition(
                    (position) => {
                        const {
                            latitude,
                            longitude,
                            heading:
                                coordsHeading,
                            accuracy,
                            altitude,
                            speed,
                        } = position.coords;

                        const nextLocation: MapLocation =
                            {
                                latitude,
                                longitude,
                                heading:
                                    coordsHeading ??
                                    null,
                            };

                        logGps(
                            'SIJAINTI SAATU',
                            {
                                label,
                                latitude,
                                longitude,
                                heading:
                                    coordsHeading,
                                accuracy,
                                altitude,
                                speed,
                            }
                        );

                        /*
                         * Päivitetään sijainti.
                         */
                        updateLocation(
                            nextLocation
                        );

                        setGpsAvailable(true);

                        setLocationAccuracy(
                            Number.isFinite(accuracy)
                                ? accuracy
                                : null
                        );

                        /*
                         * Vain pyytäjä voi halutessaan
                         * ottaa AutoFollowin käyttöön.
                         *
                         * Tämä ei koskaan sammuta sitä.
                         */
                        if (
                            enableAutoFollow
                        ) {
                            logGps(
                                'Location löytyi -> Auto-follow ON'
                            );

                            dispatch(
                                setAutoFollow(
                                    true
                                )
                            );
                        }

                        setIsLocationRequesting(
                            false
                        );

                        logGps(
                            'Sijainnin haku valmis onnistuneesti'
                        );
                    },
                    (error) => {
                        logGps(
                            'SIJAINTIHaku EPÄONNISTUI',
                            {
                                label,
                                code: error.code,
                                message:
                                    error.message,
                            }
                        );

                        if (
                            error.code === 1
                        ) {
                            logGps(
                                'GPS ERROR 1 = käyttöoikeus puuttuu / estetty'
                            );
                        }

                        if (
                            error.code === 2
                        ) {
                            logGps(
                                'GPS ERROR 2 = sijaintia ei saatavilla'
                            );
                        }

                        if (
                            error.code === 3
                        ) {
                            logGps(
                                'GPS ERROR 3 = sijainnin haku timeouttasi'
                            );
                        }

                        setGpsAvailable(false);

                        setIsLocationRequesting(
                            false
                        );

                        /*
                         * Jos AutoFollow oli jo päällä,
                         * sitä EI sammuteta timeoutin vuoksi.
                         *
                         * watchPosition saa jatkaa GPS:n hakemista.
                         */
                        if (
                            enableAutoFollow &&
                            error.code !== 1
                        ) {
                            logGps(
                                'Location request epäonnistui -> Auto-follow pidetään päällä'
                            );

                            dispatch(
                                setAutoFollow(
                                    true
                                )
                            );
                        }

                        /*
                         * Manuaalinen haku:
                         *
                         * Näytetään virhe vain jos meillä
                         * ei ole ennestään sijaintia.
                         */
                        if (
                            isManualRequest &&
                            !locationRef.current
                        ) {
                            Alert.alert(
                                'Sijaintia ei voitu hakea',
                                error.message ||
                                    'Nykyistä sijaintia ei voitu hakea.'
                            );
                        }

                        logGps(
                            'GPS-haku päättyi virheeseen'
                        );
                    },
                    options
                );
            },
            [
                dispatch,
                updateLocation,
            ]
        );

    /*
     * ---------------------------------------------------------
     * INITIAL LOCATION + INITIAL AUTOFOLLOW
     * ---------------------------------------------------------
     *
     * Tämä ajetaan vain kerran MapScreenin elinkaaren aikana.
     *
     * Tärkeää:
     *
     * ÄLÄ dispatchaa setAutoFollow(false) joka renderillä.
     */

    const routeLocation =
        route &&
        route.params &&
        'location' in route.params
            ? route.params.location
            : undefined;

    const routeAutoFollow =
        route &&
        route.params &&
        typeof route.params ===
            'object' &&
        route.params !== null &&
        'autoFollowOnStart' in route.params &&
        typeof route.params
            .autoFollowOnStart ===
            'boolean'
            ? route.params.autoFollowOnStart
            : false;

    useEffect(() => {
        const resolvedRoute =
            resolveMapRouteState(
                route,
                hasInitializedRef.current
            );

        if (resolvedRoute.location) {
            logGps(
                'Route-parametri sisältää ulkopuolisen sijainnin',
                resolvedRoute.location
            );

            updateLocation(
                resolvedRoute.location as MapLocation
            );

            dispatch(
                setAutoFollow(
                    typeof resolvedRoute.autoFollowOnStart ===
                        'boolean'
                        ? resolvedRoute.autoFollowOnStart
                        : false
                )
            );

            return;
        }

        if (
            hasInitializedRef.current
        ) {
            return;
        }

        hasInitializedRef.current =
            true;

        logGps(
            'MapScreen avautui ilman route-sijaintia'
        );

        const initialAutoFollow =
            typeof autoFollowOnStart ===
            'boolean'
                ? autoFollowOnStart
                : false;

        logGps(
            'Initial AutoFollow:',
            initialAutoFollow
        );

        dispatch(
            setAutoFollow(
                initialAutoFollow
            )
        );

        requestCurrentLocation(
            'initial',
            initialAutoFollow
        );
    }, [
        route,
        routeLocation,
        routeAutoFollow,
        autoFollowOnStart,
        dispatch,
        requestCurrentLocation,
        updateLocation,
    ]);

    /*
     * ---------------------------------------------------------
     * FOCUS
     * ---------------------------------------------------------
     *
     * ÄLÄ synkronoi Redux AutoFollow -tilaa tähän jokaisella
     * fokuksella.
     *
     * Muuten käyttäjän toggle-painallus voidaan kumota,
     * kun navigaatio/focus tapahtuu.
     *
     * autoFollowOnStart tarkoittaa vain alkutilaa.
     */

    useFocusEffect(
        useCallback(() => {
            if (
                !hasAppliedStartAutoFollowRef.current &&
                typeof autoFollowOnStart ===
                    'boolean'
            ) {
                hasAppliedStartAutoFollowRef.current =
                    true;

                logGps(
                    'Applying initial autoFollowOnStart:',
                    autoFollowOnStart
                );

                dispatch(
                    setAutoFollow(
                        autoFollowOnStart
                    )
                );
            }

            if (!routeLocation) {
                requestCurrentLocation(
                    'focus-refresh',
                    false
                );
            }
        }, [
            dispatch,
            autoFollowOnStart,
            requestCurrentLocation,
            routeLocation,
        ])
    );

    /*
     * ---------------------------------------------------------
     * AUTO FOLLOW GPS WATCH
     * ---------------------------------------------------------
     *
     * Tämä effect reagoi AINOASTAAN Reduxin AutoFollow-tilaan.
     *
     * ON  -> watch käynnistyy
     * OFF -> watch pysähtyy
     *
     * Mikään sijaintihaku ei suoraan sammuta watchia.
     */

    useEffect(() => {
        if (!isAutoFollow) {
            logGps(
                'Auto-follow OFF -> GPS watch ei käynnistetä'
            );

            return;
        }

        logGps(
            'Auto-follow ON -> GPS watch käynnistyy'
        );

        const watchId =
            Geolocation.watchPosition(
                (position) => {
                    const {
                        latitude,
                        longitude,
                        heading:
                            coordsHeading,
                        accuracy,
                    } = position.coords;

                    logGps(
                        'Auto-follow GPS update',
                        {
                            latitude,
                            longitude,
                            heading:
                                coordsHeading,
                            accuracy,
                        }
                    );

                    setLocation(
                        (previous) => {
                            const nextLocation: MapLocation =
                                {
                                    latitude,
                                    longitude,
                                    heading:
                                        coordsHeading ??
                                        previous?.heading ??
                                        null,
                                };

                            locationRef.current =
                                nextLocation;

                            return nextLocation;
                        }
                    );

                    setGpsAvailable(true);

                    setLocationAccuracy(
                        Number.isFinite(accuracy)
                            ? accuracy
                            : null
                    );
                },
                (error) => {
                    setGpsAvailable(false);

                    logGps(
                        'Auto-follow GPS ERROR',
                        {
                            code: error.code,
                            message:
                                error.message,
                        }
                    );
                },
                {
                    enableHighAccuracy:
                        true,

                    distanceFilter: 5,

                    interval: 2500,

                    fastestInterval: 1500,
                }
            );

        logGps(
            'GPS watchId luotu',
            watchId
        );

        return () => {
            logGps(
                'Auto-follow OFF -> GPS watch pysäytetään',
                watchId
            );

            Geolocation.clearWatch(
                watchId
            );
        };
    }, [isAutoFollow]);

    /*
     * ---------------------------------------------------------
     * COMPASS
     * ---------------------------------------------------------
     */

    useEffect(() => {
        const degreeUpdateRate = 3;

        logGps(
            'Compass käynnistetään'
        );

        CompassHeading.start(
            degreeUpdateRate,
            (data: any) => {
                setHeading(
                    data.heading
                );
            }
        );

        return () => {
            logGps(
                'Compass pysäytetään'
            );

            CompassHeading.stop();
        };
    }, []);

    /*
     * ---------------------------------------------------------
     * TAG
     * ---------------------------------------------------------
     */

    const handleTagPress = async (
        type: string
    ) => {
        if (!location) {
            Alert.alert(
                'Sijaintia ei ole saatavilla',
                'Odota, että GPS-sijainti löytyy.'
            );

            return;
        }

        const {
            latitude,
            longitude,
        } = location;

        try {
            const newLocationID =
                await insertLocation({
                    noteId: null,
                    latitude,
                    longitude,
                    tagType: type,
                    ownership: 'user',
                });

            dispatch(
                saveLocation({
                    id: newLocationID,
                    noteId: null,
                    latitude,
                    longitude,
                    tagType: type,
                    ownership: 'user',
                    lastUpdated:
                        new Date().toISOString(),
                })
            );
        } catch (error) {
            console.error(
                '[MapScreen] Error saving location:',
                error
            );

            Alert.alert(
                'Virhe',
                'Sijainnin tallentaminen epäonnistui.'
            );
        }
    };

    /*
     * ---------------------------------------------------------
     * ZOOM
     * ---------------------------------------------------------
     */

    const handleZoomIn = () => {
        setZoomLevel(
            (previous) =>
                Math.min(
                    previous + 1,
                    MAX_MAP_ZOOM
                )
        );
    };

    const handleZoomOut = () => {
        setZoomLevel(
            (previous) =>
                Math.max(
                    previous - 1,
                    MIN_MAP_ZOOM
                )
        );
    };

    /*
     * ---------------------------------------------------------
     * LOCATE ME
     * ---------------------------------------------------------
     *
     * TÄMÄ NAPPI EI MUUTA AUTOFOLLOW-TILAA.
     *
     * Se tekee vain uuden sijaintipyynnön.
     *
     * Jos AutoFollow oli päällä:
     *     watch jatkaa normaalisti.
     *
     * Jos AutoFollow oli pois:
     *     se pysyy pois päältä.
     *
     * Uusi sijainti päivittää MapComponentin location-propin,
     * jolloin kartta keskittää itsensä uuteen sijaintiin.
     */

    const handleLocateMe = () => {
        if (
            isLocationRequesting
        ) {
            logGps(
                'Sijaintihaku on jo käynnissä -> uusi haku ohitetaan'
            );

            return;
        }

        logGps(
            '========================================'
        );

        logGps(
            'SIJAINTINAPPI PAINETTU'
        );

        logGps(
            'Nykyinen AutoFollow-tila säilytetään:',
            isAutoFollow
        );

        /*
         * Vain uusi sijaintihaku.
         *
         * false = älä muuta AutoFollow-tilaa.
         */
        requestCurrentLocation(
            'manual-button',
            false
        );
    };

    /*
     * ---------------------------------------------------------
     * MARKER VISIBILITY
     * ---------------------------------------------------------
     *
     * Tarkoituksella vain sienet näkyvät.
     */

    const markerVisibility = {
        mushroom: true,
        berry: false,
        star: false,
    };

    /*
     * ---------------------------------------------------------
     * MAIN SCREEN
     * ---------------------------------------------------------
     */

    return (
        <View
            style={[
                styles.container,
                isDark
                    ? styles.headerDark
                    : styles.headerLight,
            ]}
        >
            {/* DRAWER */}

            <View
                style={
                    styles.drawerIconWrapper
                }
            >
                <CustomDrawer />
            </View>

            {/* YLÄOSAN INDIKAATTORIT */}

            <View
                style={
                    styles.indicatorWrapper
                }
            >
                <View
                    style={[
                        styles.indicatorGroup,
                        isDark
                            ? styles.indicatorGroupDark
                            : styles.indicatorGroupLight,
                    ]}
                >
                    <Compass
                        heading={heading}
                    />

                    <View
                        style={
                            styles.indicatorRow
                        }
                    >
                        <View
                            style={
                                styles.indicatorIcon
                            }
                        >
                            <MaterialCommunityIcons
                                name="crosshairs-gps"
                                size={28}
                                color={
                                    isAutoFollow
                                        ? '#2196F3'
                                        : '#BDBDBD'
                                }
                            />
                        </View>

                        <OnlineIndicator gpsAvailable={gpsAvailable} />

                        <View style={styles.accuracyIndicatorWrapper}>
                            <LocationAccuracyIndicator
                                accuracy={locationAccuracy}
                                isDark={isDark}
                            />
                        </View>
                    </View>
                </View>
            </View>

            {/* AUTO FOLLOW TOGGLE */}

            <View
                style={
                    styles.autoFollowToggleWrapper
                }
            >
                <TouchableOpacity
                    style={[
                        styles.autoFollowToggleBtn,
                        isAutoFollow &&
                            styles.autoFollowToggleBtnActive,
                    ]}
                    onPress={() => {
                        const nextValue =
                            !isAutoFollow;

                        logGps(
                            '========================================'
                        );

                        logGps(
                            'AUTO-FOLLOW TOGGLE PAINETTU'
                        );

                        logGps(
                            'Auto-follow:',
                            isAutoFollow
                        );

                        logGps(
                            'Uusi Auto-follow:',
                            nextValue
                        );

                        /*
                         * TÄMÄ on ainoa paikka,
                         * jossa käyttäjä togglella
                         * muuttaa AutoFollow-tilaa.
                         */
                        dispatch(
                            setAutoFollow(
                                nextValue
                            )
                        );
                    }}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={
                        isAutoFollow
                            ? 'Poista automaattinen seuranta käytöstä'
                            : 'Ota automaattinen seuranta käyttöön'
                    }
                >
                    <MaterialCommunityIcons
                        name="crosshairs-gps"
                        size={30}
                        color={
                            isAutoFollow
                                ? '#2196F3'
                                : '#888888'
                        }
                    />
                </TouchableOpacity>
            </View>

            {/* KARTTA */}

            <View
                style={
                    styles.mapContainer
                }
            >
                <MapComponent
                    location={location}
                    heading={heading}
                    zoomLevel={zoomLevel}
                    /*
                     * ÄLÄ anna tähän isAutoFollow-arvoa.
                     *
                     * MapComponentin ei pidä kontrolloida
                     * Redux AutoFollow -tilaa.
                     *
                     * Se saa sijainnin location-propina.
                     */
                    autoFollowOnStart={
                        undefined
                    }
                    filters={
                        markerVisibility
                    }
                />

                {/* SIJAINTINAPPI */}

                <View
                    pointerEvents="box-none"
                    style={[
                        StyleSheet.absoluteFillObject,
                        styles.locationButtonLayer,
                    ]}
                >
                    <TouchableOpacity
                        style={[
                            styles.locationButton,
                            isDark &&
                                styles.locationButtonDark,
                        ]}
                        onPress={
                            handleLocateMe
                        }
                        disabled={
                            isLocationRequesting
                        }
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Hae nykyinen sijainti ja keskitä kartta"
                    >
                        {isLocationRequesting ? (
                            <ActivityIndicator
                                size="small"
                                color={
                                    isDark
                                        ? '#FFFFFF'
                                        : '#222222'
                                }
                            />
                        ) : (
                            <MaterialCommunityIcons
                                name="crosshairs-gps"
                                size={30}
                                color={
                                    isDark
                                        ? '#FFFFFF'
                                        : '#222222'
                                }
                            />
                        )}
                    </TouchableOpacity>
                </View>

                {/* ZOOM */}

                <View
                    style={
                        styles.zoomControlsWrapper
                    }
                >
                    <TouchableOpacity
                        style={
                            styles.zoomButton
                        }
                        onPress={
                            handleZoomIn
                        }
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Lähennä karttaa"
                    >
                        <Text
                            style={
                                styles.zoomButtonText
                            }
                        >
                            +
                        </Text>
                    </TouchableOpacity>

                    <View
                        style={styles.zoomBadge}
                    >
                        <Text
                            style={
                                styles.zoomBadgeText
                            }
                        >
                            {`${
                                zoomLevel >=
                                DEFAULT_MAP_ZOOM
                                    ? '+'
                                    : ''
                            }${
                                zoomLevel -
                                DEFAULT_MAP_ZOOM
                            }`}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={
                            styles.zoomButton
                        }
                        onPress={
                            handleZoomOut
                        }
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Loitonna karttaa"
                    >
                        <Text
                            style={
                                styles.zoomButtonText
                            }
                        >
                            -
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* TAG */}

            <View
                style={[
                    styles.tagContainer,
                    isDark
                        ? styles.tagContainerDark
                        : styles.tagContainerLight,
                ]}
            >
                <TagButton
                    iconName="mushroom"
                    onPress={() =>
                        handleTagPress(
                            'Sieni'
                        )
                    }
                    backgroundColor="#F2C94C"
                    iconColor="#2A2A2A"
                    buttonSize={84}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

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

    drawerIconWrapper: {
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 100,
        elevation: 100,
        backgroundColor: 'transparent',
    },

    indicatorWrapper: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
        zIndex: 90,
        elevation: 90,
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

    accuracyIndicatorWrapper: {
        marginLeft: 10,
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
        backgroundColor:
            'rgba(255,255,255,0.92)',
        padding: 10,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },

    autoFollowToggleBtnActive: {
        borderColor: '#2196F3',
    },

    mapContainer: {
        flex: 2,
        zIndex: 1,
        overflow: 'hidden',
    },

    locationButtonLayer: {
        zIndex: 1000,
        elevation: 1000,
    },

    locationButton: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.35,
        shadowRadius: 5,
        zIndex: 1000,
    },

    locationButtonDark: {
        backgroundColor: '#303030',
    },

    zoomControlsWrapper: {
        position: 'absolute',
        right: 10,
        top: '35%',
        zIndex: 60,
        alignItems: 'center',
        gap: 8,
    },

    zoomButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor:
            'rgba(255,255,255,0.92)',
        borderWidth: 1,
        borderColor: '#d0d0d0',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 2,
        elevation: 3,
    },

    zoomButtonText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f1f1f',
        lineHeight: 30,
    },

    zoomBadge: {
        minWidth: 44,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor:
            'rgba(255,255,255,0.92)',
        borderWidth: 1,
        borderColor: '#d0d0d0',
        alignItems: 'center',
    },

    zoomBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1f1f1f',
    },

    tagContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        zIndex: 95,
        elevation: 95,
    },

    tagContainerDark: {
        backgroundColor: '#222',
    },

    tagContainerLight: {
        backgroundColor:
            'rgba(255, 255, 255, 1)',
    },
});

export default MapScreen;