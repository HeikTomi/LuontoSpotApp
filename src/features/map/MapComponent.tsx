import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    View,
    StyleSheet,
    Image,
    ActivityIndicator,
    Alert,
    useColorScheme,
    TouchableOpacity,
    Text,
    TextInput,
    Modal,
    PanResponder,
    Dimensions,
} from 'react-native';

import ImageZoom from 'react-native-image-pan-zoom';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import UserLocationMarker from './UserLocationMarker';

import {
    useSelector,
    useDispatch,
} from 'react-redux';

import {
    RootState,
    AppDispatch,
} from '../../store/store';

import {
    deleteLocation,
    deleteLocationDb,
} from './locationSlice';

import {
    deleteItem,
    addItem,
    initializeDb,
    fetchItems,
    updateItem,
} from '../notes/sqliteSlice';

import {
    fetchTileImageByIndices,
} from '../../services/mml/mmlApi';

import {
    useTranslation,
} from 'react-i18next';

import {
    useNavigation,
} from '@react-navigation/native';

import { getVisibleTileKeys } from './tileVisibility';
import {
    getMarkerSizeForZoom,
    getMarkerUncertaintyHaloForZoom,
} from './markerScale';
import { deleteLocationCascade } from './deleteLocationCascade';
import {
    getViewportMarkerPosition,
    offsetMapCenterByPixels,
} from './viewportMarkerPosition';
import { shouldCenterViewportOnLocation } from '../../screens/mapScreenLocation';

interface Location {
    id: number;
    noteId: number | null;
    latitude: number;
    longitude: number;
    tagType: string;
    ownership: string;
    lastUpdated: string;
}

const formatTagTimestamp = (
    value?: string
) => {
    if (!value) {
        return '';
    }

    const parsed = new Date(value);

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return '';
    }

    return parsed.toLocaleString('fi-FI', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).replace(',', ' klo');
};

interface MapComponentProps {
    location: {
        latitude: number;
        longitude: number;
        heading: number | null;
    } | null;

    heading: number;

    zoomLevel: number;

    autoFollowOnStart?: boolean;

    filters?: {
        mushroom: boolean;
        berry: boolean;
        star: boolean;
    };
}

const MapComponent: React.FC<
    MapComponentProps
> = ({
    location,
    heading,
    zoomLevel,
    filters,
}) => {
    const initialWindow =
        Dimensions.get('window');

    const dispatch: AppDispatch =
        useDispatch();

    const { t } =
        useTranslation();

    const navigation =
        useNavigation();

    const colorScheme =
        useColorScheme();

    const isDark =
        colorScheme === 'dark';

    /*
     * ---------------------------------------------------------
     * MAP LOCATION
     * ---------------------------------------------------------
     *
     * Location voi aluksi olla null.
     *
     * MapComponent toimii myös silloin,
     * kun GPS ei ole vielä palauttanut sijaintia.
     */

    const [mapLocation, setMapLocation] =
        useState(location);

    const [viewportCenter, setViewportCenter] =
        useState<{
            latitude: number;
            longitude: number;
        } | null>(location ?? null);

    useEffect(() => {
        if (!location) {
            return;
        }

        console.log(
            '[MapComponent] Location prop updated:',
            location
        );

        setMapLocation(location);

        setViewportCenter((previous) => {
            const previousCenter = previous
                ? {
                    latitude: previous.latitude,
                    longitude: previous.longitude,
                                        heading: null,
                  }
                : undefined;

            if (
                !shouldCenterViewportOnLocation(
                    previousCenter,
                    location
                )
            ) {
                return previous ?? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                };
            }

            return {
                latitude: location.latitude,
                longitude: location.longitude,
            };
        });
    }, [location]);

    /*
     * ---------------------------------------------------------
     * DATABASE
     * ---------------------------------------------------------
     */

    useEffect(() => {
        dispatch(
            initializeDb()
        ).then(() => {
            dispatch(
                fetchItems()
            );
        });
    }, [dispatch]);

    useEffect(() => {
        async function fetchLocationsAndSet() {
            try {
                const {
                    fetchLocations,
                } = await import(
                    '../../database/queries/locations'
                );

                const locs =
                    await fetchLocations();

                dispatch({
                    type:
                        'location/setLocations',
                    payload: locs,
                });
            } catch (err) {
                console.error(
                    'Paikkatietojen haku epäonnistui:',
                    err
                );
            }
        }

        fetchLocationsAndSet();
    }, [dispatch]);

    const notes = useSelector(
        (state: RootState) =>
            state.sqlite.items
    );

    const noteNameById =
        useMemo(() => {
            const byId = new Map<
                number,
                string
            >();

            notes.forEach((note: any) => {
                if (
                    typeof note?.id ===
                        'number' &&
                    typeof note?.name ===
                        'string' &&
                    note.name.trim()
                ) {
                    byId.set(
                        note.id,
                        note.name
                    );
                }
            });

            return byId;
        }, [notes]);

    const locations = useSelector(
        (state: RootState) =>
            state.location.locations
    );

    /*
     * ---------------------------------------------------------
     * NOTE STATE
     * ---------------------------------------------------------
     */

    const [
        editNoteId,
        _setEditNoteId,
    ] = useState<number | null>(null);

    const noteObj =
        notes &&
        editNoteId
            ? notes.find(
                  (n) =>
                      n.id ===
                      editNoteId
              )
            : null;

    const [
        noteTitle,
        setNoteTitle,
    ] = useState('');

    const [
        noteModalVisible,
        setNoteModalVisible,
    ] = useState(false);

    const [
        noteText,
        setNoteText,
    ] = useState('');

    const [
        noteLocationId,
        setNoteLocationId,
    ] = useState<number | null>(
        null
    );

    const [
        activeMarkerId,
        setActiveMarkerId,
    ] = useState<number | null>(
        null
    );

    const [
        editModalVisible,
        setEditModalVisible,
    ] = useState(false);

    const [
        editNoteTitle,
        setEditNoteTitle,
    ] = useState('');

    const [
        editNoteText,
        setEditNoteText,
    ] = useState('');

    const [
        fullscreenImageVisible,
        setFullscreenImageVisible,
    ] = useState(false);

    const markerTapTimeoutRef =
        useRef<ReturnType<typeof setTimeout> | null>(
            null
        );

    const markerLastTapRef =
        useRef<{
            markerId: number;
            timestamp: number;
        } | null>(null);

    /*
     * ---------------------------------------------------------
     * MARKER
     * ---------------------------------------------------------
     */

    const handleMarkerPress = (
        loc: Location
    ) => {
        const now = Date.now();

        const lastTap =
            markerLastTapRef.current;

        const isDoubleTap =
            lastTap !== null &&
            lastTap.markerId ===
                loc.id &&
            now - lastTap.timestamp <
                280;

        if (isDoubleTap) {
            if (
                markerTapTimeoutRef.current
            ) {
                clearTimeout(
                    markerTapTimeoutRef.current
                );
                markerTapTimeoutRef.current =
                    null;
            }

            markerLastTapRef.current =
                null;

            // Tuplatap: keskita kartta markeriin kuten listasta valittaessa.
            setViewportCenter({
                latitude: loc.latitude,
                longitude: loc.longitude,
            });

            setMapLocation((previous) => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
                heading:
                    previous?.heading ??
                    null,
            }));

            setActiveMarkerId(
                loc.id
            );

            return;
        }

        markerLastTapRef.current = {
            markerId: loc.id,
            timestamp: now,
        };

        if (
            markerTapTimeoutRef.current
        ) {
            clearTimeout(
                markerTapTimeoutRef.current
            );
        }

        // Yksi tap: avaa/sulje markerin toiminnot.
        markerTapTimeoutRef.current =
            setTimeout(() => {
                setActiveMarkerId(
                    (previous) =>
                        previous ===
                        loc.id
                            ? null
                            : loc.id
                );

                markerTapTimeoutRef.current =
                    null;
            }, 280);
    };

    useEffect(() => {
        return () => {
            if (
                markerTapTimeoutRef.current
            ) {
                clearTimeout(
                    markerTapTimeoutRef.current
                );
            }
        };

    }, []);

    /*
     * ---------------------------------------------------------
     * NOTES
     * ---------------------------------------------------------
     */

    const handleSaveNote =
        async () => {
            if (
                !noteLocationId ||
                !noteTitle.trim()
            ) {
                return;
            }

            const newNote = {
                name: noteTitle,
                photoFileName: '',
                photoUrl: '',
                note: noteText,
                locationId:
                    noteLocationId,
            };

            const result =
                await dispatch(
                    addItem(newNote)
                );

            const noteId =
                result.payload?.id ||
                result.payload
                    ?.insertId;

            if (noteId) {
                const {
                    updateLocation,
                } = await import(
                    '../../database/queries/locations'
                );

                await updateLocation(
                    noteLocationId,
                    noteId
                );

                const {
                    fetchLocations,
                } = await import(
                    '../../database/queries/locations'
                );

                const locs =
                    await fetchLocations();

                dispatch({
                    type:
                        'location/setLocations',
                    payload: locs,
                });
            }

            await dispatch(
                fetchItems()
            );

            setNoteModalVisible(
                false
            );

            setNoteText('');
            setNoteTitle('');
            setNoteLocationId(
                null
            );
        };

    const handleSaveEditNote =
        () => {
            if (
                editNoteId &&
                editNoteTitle.trim()
            ) {
                dispatch(
                    updateItem({
                        id: editNoteId,
                        note: editNoteText,
                        name: editNoteTitle,
                    })
                );

                dispatch(
                    fetchItems()
                );

                setEditModalVisible(
                    false
                );
            }
        };

    /*
     * ---------------------------------------------------------
     * CAMERA
     * ---------------------------------------------------------
     *
     * Kamera oli kommentoituna pois,
     * mutta edit-modal käyttää sitä edelleen.
     *
     * Pidetään toiminto mukana,
     * jotta TypeScript ei ilmoita
     * handleOpenCamera puuttuvaksi.
     */

    const handleOpenCamera =
        () => {
            if (editNoteId) {
                (navigation as any).navigate(
                    'Camera',
                    {
                        id: editNoteId,
                    }
                );
            }
        };

    const handleDeletePress = async (
        loc: Location
    ) => {
        try {
            await deleteLocationCascade({
                location: loc,
                deleteItem: async (
                    noteId
                ) => {
                    await dispatch(
                        deleteItem(
                            noteId
                        )
                    );
                },
                deleteLocationDb: async (
                    locationId
                ) => {
                    await dispatch(
                        deleteLocationDb(
                            locationId
                        )
                    );
                },
                deleteLocation: (
                    locationId
                ) => {
                    dispatch(
                        deleteLocation(
                            locationId
                        )
                    );
                },
                fetchItems: async () => {
                    await dispatch(
                        fetchItems()
                    );
                },
                getLocations: async () => {
                    const {
                        fetchLocations,
                    } = await import(
                        '../../database/queries/locations'
                    );
                    return fetchLocations();
                },
                setLocations: (
                    locationsList
                ) => {
                    dispatch({
                        type: 'location/setLocations',
                        payload:
                            locationsList,
                    });
                },
            });

            setActiveMarkerId(null);
        } catch (error) {
            console.error(
                '[MapComponent] Delete failed:',
                error
            );
            Alert.alert(
                'Virhe',
                'Merkinnän poistaminen epäonnistui.'
            );
        }
    };

    /*
     * ---------------------------------------------------------
     * TILE STATE
     * ---------------------------------------------------------
     */

    const [
        tileImages,
        setTileImages,
    ] = useState<
        Record<string, string>
    >({});

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        tileIndices,
        setTileIndices,
    ] = useState<{
        tileX: number;
        tileY: number;
    } | null>(null);

    const [
        mapSize,
        setMapSize,
    ] = useState({
        width: Math.max(
            256,
            Math.round(
                initialWindow.width
            )
        ),

        height: Math.max(
            256,
            Math.round(
                initialWindow.height
            )
        ),
    });

    const [
        panOffset,
        setPanOffset,
    ] = useState({
        x: 0,
        y: 0,
    });

    const panOffsetRef =
        useRef({
            x: 0,
            y: 0,
        });

    const [
        isDragging,
        setIsDragging,
    ] = useState(false);

    const [
        hasShownTileError,
        setHasShownTileError,
    ] = useState(false);

    const dragStartCenterRef =
        useRef<{
            latitude: number;
            longitude: number;
        } | null>(null);

    const panFinalizeDoneRef =
        useRef(true);

    /*
     * ---------------------------------------------------------
     * WEB MERCATOR
     * ---------------------------------------------------------
     */

    const calculateTileIndices = (
        latitude: number,
        longitude: number,
        zLevel: number
    ) => {
        const tileSize = 256;

        const earthCircumference =
            40075016.68557849;

        const initialResolution =
            earthCircumference /
            tileSize;

        const originShift =
            earthCircumference / 2;

        const mx =
            (longitude *
                originShift) /
            180;

        const my =
            Math.log(
                Math.tan(
                    ((90 +
                        latitude) *
                        Math.PI) /
                        360
                )
            ) /
            (Math.PI / 180);

        const myMeters =
            (my * originShift) /
            180;

        const resolution =
            initialResolution /
            Math.pow(
                2,
                zLevel
            );

        const tileX =
            Math.floor(
                (mx +
                    originShift) /
                    (tileSize *
                        resolution)
            );

        const tileY =
            Math.floor(
                (originShift -
                    myMeters) /
                    (tileSize *
                        resolution)
            );

        return {
            tileX,
            tileY,
        };
    };

    /*
     * ---------------------------------------------------------
     * LOCATION -> TILE CENTER
     * ---------------------------------------------------------
     */

    const mapLatitude =
        viewportCenter?.latitude ??
        mapLocation?.latitude ??
        null;

    const mapLongitude =
        viewportCenter?.longitude ??
        mapLocation?.longitude ??
        null;

    const hasViewportCenter =
        mapLatitude !== null &&
        mapLongitude !== null;

    useEffect(() => {
        if (
            !hasViewportCenter
        ) {
            return;
        }

        const {
            tileX,
            tileY,
        } =
            calculateTileIndices(
                mapLatitude,
                mapLongitude,
                zoomLevel
            );

        console.log(
            '[MapComponent] Center tile updated:',
            {
                tileX,
                tileY,
                zoomLevel,
                latitude:
                    mapLatitude,
                longitude:
                    mapLongitude,
            }
        );

        setTileIndices({
            tileX,
            tileY,
        });
    }, [
        hasViewportCenter,
        mapLatitude,
        mapLongitude,
        zoomLevel,
    ]);

    /*
     * ---------------------------------------------------------
     * PAN
     * ---------------------------------------------------------
     */

    const finalizePan = useCallback(
        (
            dx: number,
            dy: number
        ) => {
            if (panFinalizeDoneRef.current) {
                return;
            }

            panFinalizeDoneRef.current =
                true;

            const baseCenter =
                dragStartCenterRef.current;

            if (baseCenter) {
                setViewportCenter(
                    offsetMapCenterByPixels(
                        baseCenter.latitude,
                        baseCenter.longitude,
                        dx,
                        dy,
                        zoomLevel
                    )
                );
            }

            dragStartCenterRef.current =
                null;

            panOffsetRef.current = {
                x: 0,
                y: 0,
            };

            setPanOffset({
                x: 0,
                y: 0,
            });

            setIsDragging(false);
        },
        [zoomLevel]
    );

    const panResponder =
        useMemo(
            () =>
                PanResponder.create({
                    onStartShouldSetPanResponder:
                        () => true,

                    onMoveShouldSetPanResponder:
                        () => true,

                    onPanResponderGrant: () => {
                        const baseCenter =
                            viewportCenter ??
                            mapLocation ??
                            null;

                        panFinalizeDoneRef.current =
                            false;

                        dragStartCenterRef.current =
                            baseCenter
                                ? {
                                      latitude:
                                          baseCenter.latitude,
                                      longitude:
                                          baseCenter.longitude,
                                  }
                                : null;

                        setIsDragging(true);
                    },

                    onPanResponderMove:
                        (
                            _,
                            gestureState
                        ) => {
                            panOffsetRef.current = {
                                x: gestureState.dx,
                                y: gestureState.dy,
                            };

                            setPanOffset({
                                x: gestureState.dx,
                                y: gestureState.dy,
                            });
                        },

                    onPanResponderRelease:
                        (
                            _,
                            _gestureState
                        ) => {
                            finalizePan(
                                panOffsetRef.current.x,
                                panOffsetRef.current.y
                            );
                        },

                    onPanResponderTerminate:
                        () => {
                            finalizePan(
                                panOffsetRef.current.x,
                                panOffsetRef.current.y
                            );
                        },
                }),
            [
                finalizePan,
                viewportCenter,
                mapLocation,
            ]
        );

    /*
     * ---------------------------------------------------------
     * LOAD TILES
     * ---------------------------------------------------------
     */

    useEffect(() => {
        if (!tileIndices) {
            return;
        }

        let cancelled = false;

        const fetchMapData =
            async () => {
                try {
                    if (!cancelled) {
                        setLoading(
                            true
                        );
                    }

                    const viewportWidth =
                        mapSize.width ||
                        256;

                    const viewportHeight =
                        mapSize.height ||
                        256;

                    const radiusX =
                        Math.ceil(
                            viewportWidth /
                                512
                        ) + 1;

                    const radiusY =
                        Math.ceil(
                            viewportHeight /
                                512
                        ) + 1;

                    const requests: Promise<
                        [string, string]
                    >[] = [];

                    const visibleTileKeys = getVisibleTileKeys(
                        tileIndices,
                        radiusX,
                        radiusY,
                        zoomLevel
                    );

                    for (const key of visibleTileKeys) {
                        if (!tileImages[key]) {
                            const [xText, yText] = key.split(':');
                            const x = Number(xText);
                            const y = Number(yText);

                            requests.push(
                                fetchTileImageByIndices(
                                    x,
                                    y,
                                    zoomLevel
                                ).then(
                                    (uri) => [
                                        key,
                                        uri,
                                    ]
                                )
                            );
                        }
                    }

                    if (
                        requests.length ===
                        0
                    ) {
                        if (
                            !cancelled
                        ) {
                            setLoading(
                                false
                            );
                        }

                        return;
                    }

                    const settled =
                        await Promise.allSettled(
                            requests
                        );

                    const loadedTiles =
                        settled
                            .filter(
                                (
                                    result
                                ): result is PromiseFulfilledResult<
                                    [
                                        string,
                                        string
                                    ]
                                > =>
                                    result.status ===
                                    'fulfilled'
                            )
                            .map(
                                (
                                    result
                                ) =>
                                    result.value
                            );

                    if (
                        !cancelled &&
                        loadedTiles.length >
                            0
                    ) {
                        setTileImages(
                            (
                                previous
                            ) => ({
                                ...previous,
                                ...Object.fromEntries(
                                    loadedTiles
                                ),
                            })
                        );

                        setHasShownTileError(
                            false
                        );
                    }

                    const failedCount =
                        settled.length -
                        loadedTiles.length;

                    if (
                        !cancelled &&
                        failedCount > 0 &&
                        loadedTiles.length ===
                            0 &&
                        Object.keys(
                            tileImages
                        ).length ===
                            0 &&
                        !hasShownTileError
                    ) {
                        Alert.alert(
                            'Error',
                            'Failed to load map tile.'
                        );

                        setHasShownTileError(
                            true
                        );
                    }

                    if (!cancelled) {
                        setLoading(
                            false
                        );
                    }
                } catch (error) {
                    console.error(
                        'Error fetching map data:',
                        error
                    );

                    if (
                        !cancelled &&
                        !hasShownTileError &&
                        Object.keys(
                            tileImages
                        ).length ===
                            0
                    ) {
                        Alert.alert(
                            'Error',
                            'Failed to load map tile.'
                        );

                        setHasShownTileError(
                            true
                        );
                    }

                    if (!cancelled) {
                        setLoading(
                            false
                        );
                    }
                }
            };

        fetchMapData();

        return () => {
            cancelled = true;
        };
    }, [
        tileIndices,
        zoomLevel,
        mapSize.width,
        mapSize.height,
        hasShownTileError,
        tileImages,
    ]);

    /*
     * ---------------------------------------------------------
     * MARKER POSITION
     * ---------------------------------------------------------
     */

    const calculateMarkerPosition = (
        latitude: number,
        longitude: number,
        tileX: number,
        tileY: number,
        zLevel: number
    ) => {
        return getViewportMarkerPosition(
            latitude,
            longitude,
            { tileX, tileY },
            zLevel,
            128
        );
    };

    /*
     * ---------------------------------------------------------
     * SAVED MARKERS
     * ---------------------------------------------------------
     *
     * VAIN SIENI-MARKKERIT NÄYTETÄÄN.
     *
     * Tämä on tarkoituksellista.
     */

    const renderMarkers = () => {
        const fallbackTileIndices =
            tileIndices ??
            (mapLocation
                ? calculateTileIndices(
                    mapLocation.latitude,
                    mapLocation.longitude,
                    zoomLevel
                  )
                : null);

        if (!fallbackTileIndices) {
            return null;
        }

        const visibleTileKeys = getVisibleTileKeys(
            fallbackTileIndices,
            tileRadiusX,
            tileRadiusY,
            zoomLevel
        );

        const filteredLocations =
            locations.filter(
                (loc) => {
                    if (
                        loc.tagType !==
                        'Sieni'
                    ) {
                        return false;
                    }

                    if (
                        filters &&
                        !filters.mushroom
                    ) {
                        return false;
                    }

                    const {
                        tileX,
                        tileY,
                    } =
                        calculateTileIndices(
                            loc.latitude,
                            loc.longitude,
                            zoomLevel
                        );

                    return visibleTileKeys.has(
                        `${tileX}:${tileY}:${zoomLevel}`
                    );
                }
            );

        return filteredLocations.map(
            (loc) => {
                const pos =
                    calculateMarkerPosition(
                        loc.latitude,
                        loc.longitude,
                        fallbackTileIndices.tileX,
                        fallbackTileIndices.tileY,
                        zoomLevel
                    );

                const isActive =
                    activeMarkerId ===
                    loc.id;
                const markerSize =
                    getMarkerSizeForZoom(
                        zoomLevel
                    );
                const markerName =
                    typeof loc.noteId ===
                    'number'
                        ? noteNameById.get(
                              loc.noteId
                          )
                        : undefined;
                const fallbackMarkerName =
                    `${formatTagTimestamp(loc.lastUpdated)} Tagi`.trim();
                const actionButtonLeftStyle = {
                    left:
                        Math.round(
                            (markerSize + 8) /
                                2
                        ) + 8,
                };
                const uncertaintyHalo =
                    getMarkerUncertaintyHaloForZoom(
                        zoomLevel
                    );

                return (
                    <View
                        key={loc.id}
                        style={[
                            styles.markerContainer,
                            {
                                left:
                                    viewportWidth /
                                        2 -
                                    128 +
                                    pos.x -
                                    (markerSize / 2) +
                                    visualPanOffset.x,
                                top:
                                    viewportHeight /
                                        2 -
                                    128 +
                                    pos.y -
                                    (markerSize / 2) +
                                    visualPanOffset.y,
                            },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() =>
                                handleMarkerPress(
                                    loc
                                )
                            }
                            activeOpacity={
                                0.7
                            }
                            style={[
                                styles.markerIconContainer,
                                {
                                    width: markerSize + 8,
                                    height: markerSize + 8,
                                    borderRadius:
                                        (markerSize + 8) / 2,
                                },
                            ]}
                        >
                            <View
                                style={
                                    styles.markerRelative
                                }
                            >
                                {uncertaintyHalo > 0 && (
                                    <View
                                        style={[
                                            styles.markerHalo,
                                            {
                                                width:
                                                    markerSize +
                                                    uncertaintyHalo,
                                                height:
                                                    markerSize +
                                                    uncertaintyHalo,
                                                borderRadius:
                                                    (markerSize +
                                                        uncertaintyHalo) /
                                                    2,
                                            },
                                        ]}
                                    />
                                )}

                                <View
                                    style={
                                        styles.markerZ1
                                    }
                                >
                                    {loc.tagType ===
                                        'Sieni' && (
                                        <MaterialCommunityIcons
                                            name="mushroom"
                                            size={
                                                markerSize
                                            }
                                            style={
                                                styles.markerIconSieni
                                            }
                                        />
                                    )}

                                    {loc.tagType ===
                                        'Marja' && (
                                        <MaterialCommunityIcons
                                            name="fruit-grapes"
                                            size={
                                                markerSize
                                            }
                                            style={
                                                styles.markerIconMarja
                                            }
                                        />
                                    )}

                                    {loc.tagType ===
                                        'Mielenkiinto' && (
                                        <MaterialCommunityIcons
                                            name="star"
                                            size={
                                                markerSize
                                            }
                                            style={
                                                styles.markerIconMielenkiinto
                                            }
                                        />
                                    )}
                                </View>

                                {isActive && (
                                    <>
                                        <View
                                            style={
                                                styles.markerTagNameBadge
                                            }
                                        >
                                            <Text
                                                numberOfLines={
                                                    1
                                                }
                                                ellipsizeMode="tail"
                                                style={
                                                    styles.markerTagNameText
                                                }
                                            >
                                                {markerName ??
                                                    (fallbackMarkerName ||
                                                        'Tagi')}
                                            </Text>
                                        </View>

                                        <View
                                            style={[
                                                styles.actionButtonWrapper,
                                                styles.actionButtonSide,
                                                actionButtonLeftStyle,
                                            ]}
                                        >
                                            <TouchableOpacity
                                                style={
                                                    styles.actionButtonDelete
                                                }
                                                onPress={() =>
                                                    handleDeletePress(
                                                        loc
                                                    )
                                                }
                                            >
                                                <MaterialCommunityIcons
                                                    name="trash-can"
                                                    size={
                                                        Math.max(
                                                            14,
                                                            markerSize * 0.6
                                                        )
                                                    }
                                                    color="#fff"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                );
            }
        );
    };

    /*
     * ---------------------------------------------------------
     * VIEWPORT
     * ---------------------------------------------------------
     */

    const viewportWidth =
        mapSize.width || 256;

    const viewportHeight =
        mapSize.height || 256;

    const currentCenterTile =
        tileIndices ??
        (mapLocation
            ? calculateTileIndices(
                mapLocation.latitude,
                mapLocation.longitude,
                zoomLevel
              )
            : null);

    const userMarkerPosition =
        mapLocation &&
        currentCenterTile
            ? getViewportMarkerPosition(
                  mapLocation.latitude,
                  mapLocation.longitude,
                  currentCenterTile,
                  zoomLevel,
                  128
              )
            : {
                  x: 0,
                  y: 0,
              };

    const tileRadiusX =
        Math.ceil(
            viewportWidth /
                512
        ) + 1;

    const tileRadiusY =
        Math.ceil(
            viewportHeight /
                512
        ) + 1;

    const visualPanOffset =
        isDragging
            ? panOffset
            : { x: 0, y: 0 };

    /*
     * ---------------------------------------------------------
     * RENDER
     * ---------------------------------------------------------
     */

    return (
        <View
            style={[
                styles.container,
                isDark
                    ? styles.bgDark
                    : styles.bgLight,
            ]}
            onLayout={(event) => {
                const width =
                    Math.round(
                        event.nativeEvent
                            .layout.width
                    );

                const height =
                    Math.round(
                        event.nativeEvent
                            .layout.height
                    );

                if (
                    width !==
                        mapSize.width ||
                    height !==
                        mapSize.height
                ) {
                    setMapSize({
                        width,
                        height,
                    });
                }
            }}
            {...panResponder.panHandlers}
        >
            {/* TILE LAYER */}

            <View
                style={
                    styles.tileLayer
                }
            >
                {tileIndices &&
                    Array.from({
                        length:
                            tileRadiusY *
                                2 +
                            1,
                    }).flatMap(
                        (_, row) =>
                            Array.from({
                                length:
                                    tileRadiusX *
                                        2 +
                                    1,
                            }).map(
                                (
                                    __,
                                    column
                                ) => {
                                    const tileX =
                                        tileIndices.tileX -
                                        tileRadiusX +
                                        column;

                                    const tileY =
                                        tileIndices.tileY -
                                        tileRadiusY +
                                        row;

                                    const tileUri =
                                        tileImages[
                                            `${tileX}:${tileY}:${zoomLevel}`
                                        ];

                                    return tileUri ? (
                                        <Image
                                            key={`${tileX}:${tileY}`}
                                            source={{
                                                uri: tileUri,
                                            }}
                                            style={[
                                                styles.tileImage,
                                                {
                                                    left:
                                                        viewportWidth /
                                                            2 -
                                                        128 +
                                                        (tileX -
                                                            tileIndices.tileX) *
                                                            256 +
                                                        visualPanOffset.x,

                                                    top:
                                                        viewportHeight /
                                                            2 -
                                                        128 +
                                                        (tileY -
                                                            tileIndices.tileY) *
                                                            256 +
                                                        visualPanOffset.y,
                                                },
                                            ]}
                                        />
                                    ) : null;
                                }
                            )
                    )}
            </View>

            {/* MARKERS + USER */}

            <View
                style={[
                    styles.markerLayer,
                    styles.markerLayerAnchor,
                ]}
            >
                {renderMarkers()}

                {mapLocation && currentCenterTile && (
                    <UserLocationMarker
                        x={
                            viewportWidth /
                                2 -
                            128 +
                            userMarkerPosition.x +
                            visualPanOffset.x
                        }
                        y={
                            viewportHeight /
                                2 -
                            128 +
                            userMarkerPosition.y +
                            visualPanOffset.y
                        }
                        latitude={
                            mapLocation.latitude
                        }
                        longitude={
                            mapLocation.longitude
                        }
                        heading={
                            heading
                        }
                        isDark={
                            isDark
                        }
                    />
                )}
            </View>

            {/* LOADER */}

            {(!tileIndices ||
                (loading &&
                    Object.keys(
                        tileImages
                    ).length ===
                        0)) && (
                <View
                    style={
                        styles.loaderOverlay
                    }
                >
                    <ActivityIndicator
                        size="large"
                        color="#4CAF50"
                    />
                </View>
            )}

            {/* NOTE MODAL */}

            {noteModalVisible && (
                <View
                    style={
                        styles.noteModalOverlay
                    }
                >
                    <View
                        style={[
                            styles.noteModalCard,
                            isDark
                                ? styles.noteModalCardDark
                                : styles.noteModalCardLight,
                        ]}
                    >
                        <Text
                            style={[
                                styles.noteModalTitle,
                                isDark
                                    ? styles.noteModalTitleDark
                                    : styles.noteModalTitleLight,
                            ]}
                        >
                            {t(
                                'addNoteTitle',
                                'Lisää muistiinpano'
                            )}
                        </Text>

                        <View
                            style={
                                styles.noteModalInputWrapper
                            }
                        >
                            <TextInput
                                value={
                                    noteTitle
                                }
                                onChangeText={
                                    setNoteTitle
                                }
                                placeholder={t(
                                    'noteTitlePlaceholder',
                                    'Otsikko...'
                                )}
                                style={[
                                    styles.noteModalInput,
                                    isDark
                                        ? styles.noteModalInputDark
                                        : styles.noteModalInputLight,
                                ]}
                                placeholderTextColor={
                                    isDark
                                        ? '#aaa'
                                        : '#888'
                                }
                            />
                        </View>

                        <View
                            style={
                                styles.noteModalInputWrapper
                            }
                        >
                            <TextInput
                                value={
                                    noteText
                                }
                                onChangeText={
                                    setNoteText
                                }
                                placeholder={t(
                                    'noteContentPlaceholder',
                                    'Muistiinpanon sisältö...'
                                )}
                                style={[
                                    styles.noteModalInput,
                                    styles.noteModalNoteInput,
                                    isDark
                                        ? styles.noteModalInputDark
                                        : styles.noteModalInputLight,
                                ]}
                                multiline
                                numberOfLines={
                                    4
                                }
                                placeholderTextColor={
                                    isDark
                                        ? '#aaa'
                                        : '#888'
                                }
                            />
                        </View>

                        <View
                            style={
                                styles.noteModalActions
                            }
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    setNoteModalVisible(
                                        false
                                    );
                                }}
                                style={
                                    styles.iconButton
                                }
                            >
                                <MaterialCommunityIcons
                                    name="close"
                                    size={
                                        28
                                    }
                                    color={
                                        isDark
                                            ? '#ff6666'
                                            : '#d32f2f'
                                    }
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={
                                    handleSaveNote
                                }
                                style={[
                                    styles.iconButton,
                                    !noteTitle.trim() &&
                                        styles.iconButtonDisabled,
                                ]}
                                disabled={
                                    !noteTitle.trim()
                                }
                            >
                                <MaterialCommunityIcons
                                    name="check"
                                    size={
                                        28
                                    }
                                    color={
                                        !noteTitle.trim()
                                            ? isDark
                                                ? '#555'
                                                : '#ccc'
                                            : isDark
                                            ? '#90ee90'
                                            : '#4CAF50'
                                    }
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* EDIT NOTE */}

            {editModalVisible && (
                <View
                    style={[
                        styles.noteModalOverlay,
                        styles.noteModalOverlayCentered,
                    ]}
                >
                    <View
                        style={[
                            styles.noteModalCard,
                            isDark
                                ? styles.noteModalCardDark
                                : styles.noteModalCardLight,
                            styles.noteModalCardEdit,
                        ]}
                    >
                        <View
                            style={
                                styles.noteModalEditHeader
                            }
                        >
                            <TouchableOpacity
                                onPress={
                                    handleOpenCamera
                                }
                                style={
                                    styles.iconButton
                                }
                            >
                                <MaterialCommunityIcons
                                    name="camera"
                                    size={
                                        28
                                    }
                                    color={
                                        isDark
                                            ? '#2196F3'
                                            : '#1976D2'
                                    }
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={
                                    handleSaveEditNote
                                }
                                style={[
                                    styles.iconButton,
                                    !editNoteTitle.trim() &&
                                        styles.iconButtonDisabled,
                                ]}
                                disabled={
                                    !editNoteTitle.trim()
                                }
                            >
                                <MaterialCommunityIcons
                                    name="check"
                                    size={
                                        28
                                    }
                                    color={
                                        !editNoteTitle.trim()
                                            ? isDark
                                                ? '#555'
                                                : '#ccc'
                                            : isDark
                                            ? '#90ee90'
                                            : '#4CAF50'
                                    }
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() =>
                                    setEditModalVisible(
                                        false
                                    )
                                }
                                style={
                                    styles.iconButton
                                }
                            >
                                <MaterialCommunityIcons
                                    name="close"
                                    size={
                                        28
                                    }
                                    color={
                                        isDark
                                            ? '#ff6666'
                                            : '#d32f2f'
                                    }
                                />
                            </TouchableOpacity>
                        </View>

                        {noteObj &&
                        noteObj.photoUrl ? (
                            (() => {
                                const maxWidth =
                                    250;

                                const maxHeight =
                                    200;

                                return (
                                    <View
                                        style={[
                                            styles.imageZoomContainer,
                                            styles.imageZoomContainerCustom,
                                        ]}
                                    >
                                        {React.createElement(
                                            ImageZoom as any,
                                            {
                                                cropWidth:
                                                    maxWidth,
                                                cropHeight:
                                                    maxHeight,
                                                imageWidth:
                                                    maxWidth,
                                                imageHeight:
                                                    maxHeight,
                                                minScale: 1,
                                                maxScale: 3,
                                                enableCenterFocus:
                                                    false,
                                                onDoubleClick:
                                                    () =>
                                                        setFullscreenImageVisible(
                                                            true
                                                        ),
                                            },
                                            <Image
                                                source={{
                                                    uri: noteObj.photoUrl,
                                                }}
                                                style={[
                                                    styles.zoomedImage,
                                                    isDark &&
                                                        styles.zoomedImageDark,
                                                    {
                                                        width: maxWidth,
                                                        height: maxHeight,
                                                    },
                                                ]}
                                                resizeMode="contain"
                                            />
                                        )}
                                    </View>
                                );
                            })()
                        ) : (
                            <View
                                style={
                                    styles.noImageContainer
                                }
                            >
                                <MaterialCommunityIcons
                                    name="image-off-outline"
                                    size={
                                        40
                                    }
                                    color={
                                        isDark
                                            ? '#aaa'
                                            : '#888'
                                    }
                                />
                            </View>
                        )}

                        <View
                            style={
                                styles.noteModalInputWrapper
                            }
                        >
                            <TextInput
                                value={
                                    editNoteTitle
                                }
                                onChangeText={
                                    setEditNoteTitle
                                }
                                placeholder={t(
                                    'noteTitlePlaceholder',
                                    'Otsikko...'
                                )}
                                style={[
                                    styles.noteModalInput,
                                    isDark
                                        ? styles.noteModalInputDark
                                        : styles.noteModalInputLight,
                                ]}
                                placeholderTextColor={
                                    isDark
                                        ? '#aaa'
                                        : '#888'
                                }
                            />
                        </View>

                        <View
                            style={
                                styles.noteModalInputWrapper
                            }
                        >
                            <TextInput
                                value={
                                    editNoteText
                                }
                                onChangeText={
                                    setEditNoteText
                                }
                                placeholder={t(
                                    'noteContentPlaceholder',
                                    'Muistiinpanon sisältö...'
                                )}
                                style={[
                                    styles.noteModalInput,
                                    styles.noteModalNoteInput,
                                    isDark
                                        ? styles.noteModalInputDark
                                        : styles.noteModalInputLight,
                                ]}
                                multiline
                                numberOfLines={
                                    4
                                }
                                placeholderTextColor={
                                    isDark
                                        ? '#aaa'
                                        : '#888'
                                }
                            />
                        </View>
                    </View>
                </View>
            )}

            {/* FULLSCREEN IMAGE */}

            {fullscreenImageVisible && (
                <Modal
                    visible={
                        fullscreenImageVisible
                    }
                    transparent
                    animationType="fade"
                >
                    <View
                        style={
                            styles.fullscreenImageContainer
                        }
                    >
                        <Image
                            source={{
                                uri: noteObj?.photoUrl,
                            }}
                            style={
                                styles.fullscreenImage
                            }
                            resizeMode="contain"
                        />

                        <TouchableOpacity
                            style={
                                styles.closeButton
                            }
                            onPress={() =>
                                setFullscreenImageVisible(
                                    false
                                )
                            }
                        >
                            <MaterialCommunityIcons
                                name="close"
                                size={
                                    32
                                }
                                color="#fff"
                            />
                        </TouchableOpacity>
                    </View>
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    bgDark: {
        backgroundColor: '#181818',
    },

    bgLight: {
        backgroundColor: '#f5f5f5',
    },

    tileLayer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        zIndex: 1,
    },

    tileImage: {
        position: 'absolute',
        width: 256,
        height: 256,
        zIndex: 1,
    },

    markerLayer: {
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        overflow: 'visible',
        zIndex: 20,
    },

    markerContainer: {
        position: 'absolute',
        zIndex: 30,
    },

    markerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2C94C',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },

    markerRelative: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },

    markerHalo: {
        position: 'absolute',
        backgroundColor: 'rgba(242, 201, 76, 0.25)',
        borderWidth: 1,
        borderColor: 'rgba(242, 201, 76, 0.45)',
    },

    markerZ1: {
        zIndex: 1,
    },

    markerIconSieni: {
        color: '#2A2A2A',
    },

    markerIconMarja: {
        color: 'white',
    },

    markerIconMielenkiinto: {
        color: 'white',
    },

    markerTagNameBadge: {
        position: 'absolute',
        top: -36,
        left: '50%',
        transform: [
            {
                translateX: -72,
            },
        ],
        width: 144,
        backgroundColor: 'rgba(33, 33, 33, 0.88)',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        zIndex: 2,
    },

    markerTagNameText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },

    markerLayerAnchor: {
        left: 0,
        top: 0,
    },

    actionButtonWrapper: {
        position: 'absolute',
        zIndex: 2,
    },

    actionButtonSide: {
        top: -16,
    },

    actionButtonDelete: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#d32f2f',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },

    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor:
            'rgba(0,0,0,0.25)',
        zIndex: 15,
    },

    noteModalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor:
            'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },

    noteModalOverlayCentered: {
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },

    noteModalCard: {
        backgroundColor: '#fff',
        padding: 20,
        paddingTop: 10,
        borderRadius: 10,
        width: '90%',
        maxWidth: 400,
        alignSelf: 'center',
        borderWidth: 2,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },

    noteModalCardEdit: {
        maxHeight: '98%',
        minHeight: 120,
        width: '96%',
        alignSelf: 'center',
        justifyContent: 'flex-start',
        paddingBottom: 4,
    },

    noteModalCardDark: {
        backgroundColor: '#232323',
    },

    noteModalCardLight: {
        backgroundColor: '#fff',
    },

    noteModalTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 10,
    },

    noteModalTitleDark: {
        color: '#fff',
    },

    noteModalTitleLight: {
        color: '#232323',
    },

    noteModalInputWrapper: {
        marginBottom: 10,
    },

    noteModalInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 8,
        minHeight: 40,
    },

    noteModalInputDark: {
        backgroundColor: '#181818',
        color: '#fff',
        borderColor: '#444',
    },

    noteModalInputLight: {
        backgroundColor: '#fff',
        color: '#232323',
        borderColor: '#ccc',
    },

    noteModalNoteInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },

    noteModalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 8,
    },

    noteModalEditHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 8,
    },

    iconButton: {
        marginHorizontal: 8,
        padding: 6,
        borderRadius: 20,
        backgroundColor:
            'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },

    iconButtonDisabled: {
        opacity: 0.5,
    },

    imageZoomContainer: {
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 350,
        alignSelf: 'center',
    },

    imageZoomContainerCustom: {
        width: '100%',
    },

    zoomedImage: {
        maxWidth: 320,
        maxHeight: 220,
        borderRadius: 6,
        backgroundColor: '#eee',
        alignSelf: 'center',
    },

    zoomedImageDark: {
        backgroundColor: '#232323',
    },

    noImageContainer: {
        marginBottom: 12,
        alignItems: 'center',
    },

    fullscreenImageContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor:
            'rgba(0,0,0,0.98)',
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },

    fullscreenImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },

    closeButton: {
        position: 'absolute',
        top: 32,
        right: 32,
        backgroundColor:
            'rgba(0,0,0,0.6)',
        borderRadius: 24,
        padding: 8,
        zIndex: 10000,
    },
});

export default MapComponent;
