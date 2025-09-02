import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet, Image, ActivityIndicator, Alert, useColorScheme, TouchableOpacity, Text, TextInput } from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { gyroscope } from 'react-native-sensors';
import setUpdateInterval from 'react-native-sensors';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { AppDispatch } from '../../store/store';
import { deleteLocation } from './locationSlice';
import { deleteLocationDb } from './locationSlice';
import { useDispatch } from 'react-redux';
import { deleteItem } from '../notes/sqliteSlice';
import { addItem } from '../notes/sqliteSlice';
import { fetchItems } from '../notes/sqliteSlice';
import { useAppSelector } from '../../hooks/userAppSelector';
import { fetchTileImage } from '../../services/mml/mmlApi';
import { useTranslation } from 'react-i18next';
import { updateLocation } from './locationSlice';
import { useNavigation } from '@react-navigation/native';
import { updateItem } from '../notes/sqliteSlice';

interface Location {
    id: number;
    noteId: number | null;
    latitude: number;
    longitude: number;
    tagType: string;
    ownership: string;
    lastUpdated: string;
}

interface MapComponentProps {
    location: { latitude: number; longitude: number; heading: number | null } | null;
    zoomLevel: number;
    autoFollowOnStart?: boolean;
    filters?: {
        mushroom: boolean;
        berry: boolean;
        star: boolean;
    };
}

const MapComponent: React.FC<MapComponentProps> = ({ location, zoomLevel, autoFollowOnStart, filters }) => {
    // Käytetään vain autoFollowOnStart-propseja, ei omaa tilaa
    useEffect(() => {
        console.log('MapComponent render: autoFollowOnStart =', autoFollowOnStart);
    }, [autoFollowOnStart]);

    // Sisäinen tila kartan locationille
    const [mapLocation, setMapLocation] = useState(location);

    // Jos location-prop annetaan (notesista), näytetään se heti, vaikka auto-follow olisi pois päältä
    useEffect(() => {
        if (autoFollowOnStart && location) {
            setMapLocation(location);
        }
        // Jos seuranta on pois päältä, älä päivitä karttaa location-propin muutoksesta
    }, [autoFollowOnStart, location]);

    // Toggle seuranta päälle/pois kun käyttäjä painaa nappia
    // Toggle-painike on nyt MapScreenissä, ei MapComponentissa

    // Haetaan paikkatiedot kannasta mountissa
    const dispatch: AppDispatch = useDispatch();
    useEffect(() => {
        async function fetchLocationsAndSet() {
            try {
                const { fetchLocations } = await import('../../database/queries/locations');
                const locs = await fetchLocations();
                dispatch({ type: 'location/setLocations', payload: locs });
            } catch (err) {
                console.error('Paikkatietojen haku epäonnistui:', err);
            }
        }
        fetchLocationsAndSet();
    }, [dispatch]);
    
    // Gyroskoopin menosuunta
    const [yaw, setYaw] = useState(0);
    useEffect(() => {
        const subscription = gyroscope.subscribe(({ x, y, z }) => {
            const yawDeg = z * (180 / Math.PI);
            setYaw(yawDeg);
        });
        return () => subscription.unsubscribe();
    }, []);
    // Muokkausmodaalin edit-tilat poistettu, ei tarvetta
    const notes = useAppSelector((state) => state.sqlite.items);
    // Haetaan muistiinpanot vain kerran mountissa
    useEffect(() => {
        dispatch({ type: 'sqlite/fetchItems' });
    }, [dispatch]);
    const { t } = useTranslation();
    const [noteTitle, setNoteTitle] = useState('');
    const [noteModalVisible, setNoteModalVisible] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [noteLocationId, setNoteLocationId] = useState<number | null>(null);
    const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);
    const navigation = useNavigation();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editNoteTitle, setEditNoteTitle] = useState('');
    const [editNoteText, setEditNoteText] = useState('');
    const [editNoteId, setEditNoteId] = useState<number | null>(null);
    
    // Markkerin painallus
    const handleMarkerPress = (loc: Location) => {
        console.log('Marker pressed:', loc);
        if (activeMarkerId === loc.id) {
            setActiveMarkerId(null);
        } else {
            setActiveMarkerId(loc.id);
        }
    };

    const handleAddNotePress = (loc: Location) => {
        console.log('Add note icon pressed for marker and modal should open:', loc);
        console.log('Current notes:', notes);
        console.log('Current locations:', locations);
        setNoteLocationId(loc.id);
        setNoteText('');
        setNoteTitle('');
        setNoteModalVisible(true);
    };

    const handleSaveNote = async () => {
        if (!noteLocationId || !noteTitle.trim()) { return; }
        const newNote = {
            name: noteTitle,
            photoFileName: '',
            photoUrl: '',
            note: noteText,
            locationId: noteLocationId,
        };
        console.log('Saving note:', newNote);
        // Tallennetaan note ja odotetaan id
        const result = await dispatch(addItem(newNote));
        const noteId = result.payload?.id || result.payload?.insertId;
        if (noteId) {
            // Päivitä locationin noteId kantaan
            const { updateLocation } = await import('../../database/queries/locations');
            await updateLocation(noteLocationId, noteId);
            // Hae paikkatiedot kannasta ja päivitä Redux
            const { fetchLocations } = await import('../../database/queries/locations');
            const locs = await fetchLocations();
            dispatch({ type: 'location/setLocations', payload: locs });
        }
        await dispatch(fetchItems());
        setNoteModalVisible(false);
        setNoteText('');
        setNoteLocationId(null);
    };

    const handleEditNotePress = (loc: Location) => {
        console.log('Edit note icon pressed for marker:', loc);
        console.log('loc.noteId:', loc.noteId);
        console.log('notes:', notes);
            const noteObj = notes.find((n) => n.id === loc.noteId);
            console.log('handleEditNotePress noteObj:', noteObj);
        if (noteObj) {
            setEditNoteTitle(noteObj.name);
            setEditNoteText(noteObj.note || '');
            setEditNoteId(noteObj.id);
                console.log('handleEditNotePress setEditNoteTitle:', noteObj.name);
                console.log('handleEditNotePress setEditNoteText:', noteObj.note);
            setEditModalVisible(true);
        } else {
            console.log('Note object not found for noteId:', loc.noteId);
        }
    };

    const handleSaveEditNote = () => {
        if (editNoteId && editNoteTitle.trim()) {
            dispatch(updateItem({ id: editNoteId, note: editNoteText, name: editNoteTitle }));
            setEditModalVisible(false);
        }
    };

    const handleOpenCamera = () => {
        if (editNoteId) {
            // @ts-ignore: React Navigation param typing workaround
            navigation.navigate('Camera', { id: editNoteId });
        }
    };

    const handleDeletePress = (loc: Location) => {
    console.log('Delete icon pressed for marker:', loc);
    // Poista note jos sellainen on
    if (loc.noteId) {
        dispatch(deleteItem(loc.noteId));
    }
    dispatch(deleteLocation(loc.id));
    dispatch(deleteLocationDb(loc.id));
    setActiveMarkerId(null);
    };
    // Headingin re-render pakotus
    const [currentHeading, setCurrentHeading] = useState<number>(location?.heading || 0);

    useEffect(() => {
        if (autoFollowOnStart && mapLocation && typeof mapLocation.heading === 'number') {
            setCurrentHeading(mapLocation.heading);
        }
    }, [mapLocation, mapLocation?.heading, autoFollowOnStart]);
    const [tileImage, setTileImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [tileIndices, setTileIndices] = useState<{ tileX: number; tileY: number } | null>(null);
    const locations = useSelector((state: RootState) => state.location.locations);
    // Haetaan notes PhotoNotes-taulusta
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const calculateTileIndices = (latitude: number, longitude: number, zLevel: number) => {
        const tileSize = 256; // Karttatilen koko pikseleinä
        const earthCircumference = 40075016.68557849; // Maan ympärysmitta metreinä Web Mercator -projektion mukaan
        const initialResolution = earthCircumference / tileSize; // Resoluutio zoom-tasolla 0
        const originShift = earthCircumference / 2.0; // Koordinaattien alkuperä Web Mercatorissa

        // Muunna leveys- ja pituusasteet Web Mercator -koordinaatteihin
        const mx = (longitude * originShift) / 180.0;
        const my =
            Math.log(Math.tan(((90 + latitude) * Math.PI) / 360.0)) /
            (Math.PI / 180.0);
        const myMeters = (my * originShift) / 180.0;

        // Laske resoluutio nykyisellä zoom-tasolla
        const resolution = initialResolution / Math.pow(2, zLevel);

        // Laske tileX ja tileY
        const tileX = Math.floor((mx + originShift) / (tileSize * resolution));
        const tileY = Math.floor((originShift - myMeters) / (tileSize * resolution));

        return { tileX, tileY };
    };

    // Päivitä tileIndices aina kun location muuttuu
    useEffect(() => {
        if (!mapLocation) { return; }
        const { latitude, longitude } = mapLocation;
        const { tileX, tileY } = calculateTileIndices(latitude, longitude, zoomLevel);
        setTileIndices({ tileX, tileY });
    }, [mapLocation, zoomLevel]);

    // Päivitä tileImage aina kun location muuttuu
    useEffect(() => {
        if (!mapLocation) { return; }
        const fetchMapData = async () => {
            const { latitude, longitude } = mapLocation;
            try {
                setLoading(true);
                const imageUri = await fetchTileImage(latitude, longitude, zoomLevel);
                setTileImage(imageUri);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching map data:', error);
                Alert.alert('Error', 'Failed to load map tile.');
                setLoading(false);
            }
        };
        fetchMapData();
    }, [mapLocation, zoomLevel]);

    // Lasketaan käyttäjän sijaintimarkkerin sijainti suhteessa karttatileseen
    const calculateMarkerPosition = (latitude: number, longitude: number, tileX: number, tileY: number, zLevel: number) => {
        const tileSize = 256; // Karttatilen koko pikseleinä
        const earthCircumference = 40075016.68557849; // Maan ympärysmitta metreinä Web Mercator -projektion mukaan
        const initialResolution = earthCircumference / tileSize; // Resoluutio zoom-tasolla 0
        const originShift = earthCircumference / 2.0; // Koordinaattien alkuperä Web Mercatorissa

        // Muunna leveys- ja pituusasteet Web Mercator -koordinaatteihin
        const mx = (longitude * originShift) / 180.0;
        const my =
            Math.log(Math.tan(((90 + latitude) * Math.PI) / 360.0)) /
            (Math.PI / 180.0);
        const myMeters = (my * originShift) / 180.0;

        // Laske resoluutio nykyisellä zoom-tasolla
        const resolution = initialResolution / Math.pow(2, zLevel);

        // Laske tileX ja tileY
        const tileXPos = Math.floor((mx + originShift) / (tileSize * resolution));
        const tileYPos = Math.floor((originShift - myMeters) / (tileSize * resolution));

        // Laske markkerin sijainti suhteessa karttatileseen
        const x = (mx - (tileXPos * tileSize * resolution - originShift)) / resolution;
        const y = (originShift - myMeters - tileYPos * tileSize * resolution) / resolution;

        return { x, y };
    };

    // Renderöi tallennetut merkinnät
    const renderMarkers = () => {
        if (!tileIndices) { return null; }
        const allFiltersOff = filters && !filters.mushroom && !filters.berry && !filters.star;
        const allFiltersOn = !filters || (filters.mushroom && filters.berry && filters.star);
        const filteredLocations = locations.filter((loc) => {
            const { tileX, tileY } = calculateTileIndices(loc.latitude, loc.longitude, zoomLevel);
            // Jos filtterit ovat kokonaan pois päältä (kaikki false) TAI kaikki päällä, näytetään kaikki markerit
            if (allFiltersOff || allFiltersOn) {
                return tileX === tileIndices.tileX && tileY === tileIndices.tileY;
            }
            // Muussa tapauksessa filtteröi tagType
            if (filters) {
                if (loc.tagType === 'Sieni' && !filters.mushroom) return false;
                if (loc.tagType === 'Marja' && !filters.berry) return false;
                if (loc.tagType === 'Mielenkiinto' && !filters.star) return false;
            }
            return tileX === tileIndices.tileX && tileY === tileIndices.tileY;
        });
        return filteredLocations.map((loc) => {
            const pos = calculateMarkerPosition(
                loc.latitude,
                loc.longitude,
                tileIndices.tileX,
                tileIndices.tileY,
                zoomLevel
            );
            const isActive = activeMarkerId === loc.id;
            // Etsi note vain noteId:llä
            console.log(loc.noteId);
            const hasNote = loc.noteId != null && loc.noteId !== 0;
            console.log('Render marker:', { loc, hasNote });
            return (
                <View
                    key={loc.id}
                    style={[styles.markerContainer, { left: pos.x, top: pos.y }]}
                >
                    <TouchableOpacity onPress={() => handleMarkerPress(loc)} activeOpacity={0.7} style={styles.markerIconContainer}>
                        <View style={styles.markerRelative}>
                            <View style={styles.markerZ1}>
                                {loc.tagType === 'Sieni' && <MaterialCommunityIcons name="mushroom" size={28} style={styles.markerIconSieni} />}
                                {loc.tagType === 'Marja' && <MaterialCommunityIcons name="fruit-grapes" size={28} style={styles.markerIconMarja} />}
                                {loc.tagType === 'Mielenkiinto' && <MaterialCommunityIcons name="star" size={28} style={styles.markerIconMielenkiinto} />}
                            </View>
                            <View style={styles.markerActions} pointerEvents="box-none">
                                {isActive && hasNote ? (
                                    <>
                                        <View style={styles.actionButtonWrapper}>
                                            <View style={styles.actionButton}>
                                                <MaterialCommunityIcons name="pencil" size={20} color="#fff" onPress={() => handleEditNotePress(loc)} />
                                            </View>
                                        </View>
                                        <View style={styles.actionButtonWrapper}>
                                            <View style={styles.actionButtonDelete}>
                                                <MaterialCommunityIcons name="trash-can" size={20} color="#fff" onPress={() => handleDeletePress(loc)} />
                                            </View>
                                        </View>
                                    </>
                                ) : isActive && !hasNote ? (
                                    <>
                                        <View style={styles.actionButtonWrapper}>
                                            <View style={styles.actionButton}>
                                                <MaterialCommunityIcons name="plus" size={20} color="#fff" onPress={() => handleAddNotePress(loc)} />
                                            </View>
                                        </View>
                                        <View style={styles.actionButtonWrapper}>
                                            <View style={styles.actionButtonDelete}>
                                                <MaterialCommunityIcons name="trash-can" size={20} color="#fff" onPress={() => handleDeletePress(loc)} />
                                            </View>
                                        </View>
                                    </>
                                ) : null}
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            );
        });
    };

    if (loading || !tileIndices) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    const markerPosition = mapLocation
        ? calculateMarkerPosition(
              mapLocation.latitude,
              mapLocation.longitude,
              tileIndices.tileX,
              tileIndices.tileY,
              zoomLevel
          )
        : { x: 0, y: 0 };


    return (
        <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
            {/* Online/offline indikaattori siirretään OnlineIndicator-komponenttiin */}
            <Image source={tileImage ? { uri: tileImage } : undefined} style={styles.mapImage} />
            {renderMarkers()}
            {/* Oma lokaatiomarkkeri tagin päällä, mutta tagi klikattavissa */}
            {location && (
                <View
                    style={[styles.userLocation, styles.userLocationOnTop, { left: markerPosition.x, top: markerPosition.y }]
                    }
                    pointerEvents="none"
                >
                    <View style={isDark ? styles.circleDark : styles.circleLight}>
                        <MaterialCommunityIcons name="navigation" size={20} color="#fff" style={{ transform: [{ rotate: `${yaw}deg` }] }} />
                    </View>
                </View>
            )}
            {/* Tähtäin-ikoni kartan alalaitaan kun seuranta ei ole päällä */}
            {/* Ei enää omaa togglea, vain MapScreenin toggle */}
            {noteModalVisible && (
                <View style={styles.noteModalOverlay}>
                    <View style={[styles.noteModalCard, isDark ? styles.noteModalCardDark : styles.noteModalCardLight]}>
                        <Text style={[styles.noteModalTitle, isDark ? styles.noteModalTitleDark : styles.noteModalTitleLight]}>{t('addNoteTitle', 'Lisää muistiinpano')}</Text>
                        <View style={styles.noteModalInputWrapper}>
                            <TextInput
                                value={noteTitle}
                                onChangeText={setNoteTitle}
                                placeholder={t('noteTitlePlaceholder', 'Otsikko...')}
                                style={[styles.noteModalInput, isDark ? styles.noteModalInputDark : styles.noteModalInputLight]}
                                placeholderTextColor={isDark ? '#aaa' : '#888'}
                            />
                        </View>
                        <View style={styles.noteModalInputWrapper}>
                            <TextInput
                                value={noteText}
                                onChangeText={setNoteText}
                                placeholder={t('noteContentPlaceholder', 'Muistiinpanon sisältö...')}
                                style={[styles.noteModalInput, styles.noteModalNoteInput, isDark ? styles.noteModalInputDark : styles.noteModalInputLight]}
                                multiline
                                numberOfLines={4}
                                placeholderTextColor={isDark ? '#aaa' : '#888'}
                            />
                        </View>
                        <View style={styles.noteModalActions}>
                            <TouchableOpacity onPress={() => setNoteModalVisible(false)} style={styles.iconButton}>
                                <MaterialCommunityIcons name="close" size={28} color={isDark ? '#ff6666' : '#d32f2f'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveNote}
                                style={[styles.iconButton, !noteTitle.trim() && styles.iconButtonDisabled]}
                                disabled={!noteTitle.trim()}
                            >
                                <MaterialCommunityIcons name="check" size={28} color={(!noteTitle.trim()) ? (isDark ? '#555' : '#ccc') : (isDark ? '#90ee90' : '#4CAF50')} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
            {editModalVisible && (
                <View style={styles.noteModalOverlay}>
                    <View style={[styles.noteModalCard, isDark ? styles.noteModalCardDark : styles.noteModalCardLight]}>
                        <Text style={[styles.noteModalTitle, isDark ? styles.noteModalTitleDark : styles.noteModalTitleLight]}>{t('editNoteTitle', 'Muokkaa muistiinpanoa')}</Text>
                        {/* Photo at the top if available */}
                        {(() => {
                            const noteObj = notes.find((n) => n.id === editNoteId);
                            if (noteObj && noteObj.photoUrl) {
                                return (
                                    <View style={styles.imageZoomContainer}>
                                        {/* @ts-ignore: ImageZoom children type issue */}
                                        <ImageZoom
                                            cropWidth={300}
                                            cropHeight={300}
                                            imageWidth={300}
                                            imageHeight={300}
                                            minScale={1}
                                            maxScale={3}
                                            enableCenterFocus={false}
                                        >
                                            <Image
                                                source={{ uri: noteObj.photoUrl }}
                                                style={styles.zoomedImage}
                                                resizeMode="contain"
                                            />
                                        </ImageZoom>
                                    </View>
                                );
                            } else {
                                return (
                                    <View style={styles.noImageContainer}>
                                        <MaterialCommunityIcons name="image-off-outline" size={40} color={isDark ? '#aaa' : '#888'} />
                                    </View>
                                );
                            }
                        })()}
                        {/* Editable title field */}
                        <View style={styles.noteModalInputWrapper}>
                            <TextInput
                                value={editNoteTitle}
                                onChangeText={setEditNoteTitle}
                                placeholder={t('noteTitlePlaceholder', 'Otsikko...')}
                                style={[styles.noteModalInput, isDark ? styles.noteModalInputDark : styles.noteModalInputLight]}
                                placeholderTextColor={isDark ? '#aaa' : '#888'}
                            />
                        </View>
                        {/* Editable note text field */}
                        <View style={styles.noteModalInputWrapper}>
                            <TextInput
                                value={editNoteText}
                                onChangeText={setEditNoteText}
                                placeholder={t('noteContentPlaceholder', 'Muistiinpanon sisältö...')}
                                style={[styles.noteModalInput, styles.noteModalNoteInput, isDark ? styles.noteModalInputDark : styles.noteModalInputLight]}
                                multiline
                                numberOfLines={4}
                                placeholderTextColor={isDark ? '#aaa' : '#888'}
                            />
                        </View>
                        <View style={styles.noteModalActions}>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.iconButton}>
                                <MaterialCommunityIcons name="close" size={28} color={isDark ? '#ff6666' : '#d32f2f'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveEditNote}
                                style={[styles.iconButton, !editNoteTitle.trim() && styles.iconButtonDisabled]}
                                disabled={!editNoteTitle.trim()}
                            >
                                <MaterialCommunityIcons name="check" size={28} color={(!editNoteTitle.trim()) ? (isDark ? '#555' : '#ccc') : (isDark ? '#90ee90' : '#4CAF50')} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleOpenCamera} style={styles.iconButton}>
                                <MaterialCommunityIcons name="camera" size={28} color={isDark ? '#90caf9' : '#1976d2'} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    liveIndicatorContainer: {
        position: 'absolute',
        top: 18,
        right: 18,
        zIndex: 101,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 18,
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulse: {
        // Sykkivä animaatio
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 8,
        // Voit lisätä Animated API:lla oikean sykkeen jos haluat
    },
    crosshairButton: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 24,
        padding: 8,
        elevation: 4,
        zIndex: 100,
    },
    imageZoomContainer: {
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    zoomedImage: {
        width: 300,
        height: 300,
        borderRadius: 6,
        backgroundColor: '#eee',
    },
    noImageContainer: {
        marginBottom: 12,
        alignItems: 'center',
    },
    noImageText: {
        color: '#888',
        fontSize: 13,
    },
    iconButtonDisabled: {
        opacity: 0.5,
    },
    noteModalCardDark: {
        backgroundColor: '#232323',
    },
    noteModalCardLight: {
        backgroundColor: '#fff',
    },
    noteModalTitleDark: {
        color: '#fff',
    },
    noteModalTitleLight: {
        color: '#232323',
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
    iconButton: {
        marginHorizontal: 8,
        padding: 6,
        borderRadius: 20,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    noteModalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    noteModalCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    noteModalTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 10,
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
    noteModalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    noteModalCancelBtn: {
        marginRight: 10,
    },
    noteModalCancelText: {
        color: '#d32f2f',
        fontWeight: 'bold',
    },
    noteModalSaveText: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    markerRelative: {
        position: 'relative',
    },
    markerZ1: {
        zIndex: 1,
    },
    markerActions: {
        position: 'absolute',
        top: -10,
        left: 35,
        flexDirection: 'row',
        zIndex: 2,
    },
    actionButtonWrapper: {
        marginHorizontal: 4,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
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
    markerTouchArea: {
        width: 40,
        height: 40,
        borderRadius: 20,
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
    },
    bgDark: {
        backgroundColor: '#181818',
    },
    bgLight: {
        backgroundColor: '#f5f5f5',
    },
    markerContainer: {
        position: 'absolute',
        zIndex: 2,
    },
    markerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1c7e03ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    markerIconSieni: {
        color: 'white',
    },
    markerIconMarja: {
        color: 'white',
    },
    markerIconMielenkiinto: {
        color: 'white',
    },
    circleDark: {
        width: 30,
        height: 30,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#925821ff',
    },
    circleLight: {
        width: 30,
        height: 30,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userLocation: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userLocationOnTop: {
        zIndex: 99,
        position: 'absolute',
    },
    circle: {
        width: 30,
        height: 30,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagButton: {
        position: 'absolute',
        bottom: 20,
        padding: 10,
        borderRadius: 5,
    },
    tagButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default MapComponent;
