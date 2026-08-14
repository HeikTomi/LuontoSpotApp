import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useCallback, useState } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { StyleSheet, FlatList, Alert, Image, View, TextInput, useColorScheme, Dimensions } from 'react-native';
import { Surface, Text, TouchableRipple, Modal, IconButton, Card } from 'react-native-paper';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ListTag from './ListTag';
import { Host } from 'react-native-portalize';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/userAppSelector';
import { initializeDb, fetchItems, deleteItem, updateItem } from './sqliteSlice';
import { deleteLocation, deleteLocationDb } from '../map/locationSlice';
import {
    setModalVisible,
    setNoteModalVisible,
    updateSelectedPhotoNote,
} from './photoNoteSlice';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
// @ts-ignore
import ImageZoom from 'react-native-image-pan-zoom';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhotoNoteManager'>;
//type PhotoNoteManagerRouteProp = RouteProp<RootStackParamList, 'PhotoNoteManager'>;

const windowWidth = Dimensions.get('window').width;
const windowHeight = 300;

interface NoteListEntry {
    id: string;
    locationId: number;
    noteId: number | null;
    name: string;
    note: string;
    lastUpdated: string;
    tagType: string;
    latitude: number;
    longitude: number;
    hasNote: boolean;
}

export const PhotoNoteManager: React.FC<{ setAutoFollowOnStart?: (val: boolean) => void }> = ({ setAutoFollowOnStart }) => {

    const locations = useAppSelector((state) => state.location.locations);
    const notes = useAppSelector((state) => state.sqlite.items);
    // Käyttäjän reaaliaikainen GPS-sijainti
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined);

    useEffect(() => {
        const watchId = Geolocation.watchPosition(
            (position) => {
                setUserLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                console.warn('GPS-paikannus epäonnistui:', error);
            },
            { enableHighAccuracy: true, distanceFilter: 5, interval: 2000 }
        );
        return () => {
            if (typeof watchId === 'number') {
                Geolocation.clearWatch(watchId);
            }
        };
    }, []);
    const formatTagTimestamp = (value?: string) => {
        if (!value) { return '-'; }
        const parsed = new Date(value);
        if (isNaN(parsed.getTime())) { return value; }
        return parsed.toLocaleString('fi-FI');
    };

        // Sorttaus
    const [sortType, setSortType] = useState<'distance' | 'newest' | 'oldest'>('newest');

    // Laske etäisyys käyttäjään (käytetään sorttaukseen)
    function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const toRad = (value: number) => (value * Math.PI) / 180;
        const R = 6371e3;
        const φ1 = toRad(lat1);
        const φ2 = toRad(lat2);
        const Δφ = toRad(lat2 - lat1);
        const Δλ = toRad(lon2 - lon1);
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d;
    }

    //const route = useRoute<PhotoNoteManagerRouteProp>();
    //const { prefilledTitle } = route.params || {};

    //const [title, setTitle] = useState(prefilledTitle || '');
    const [noteFocused, setNoteFocused] = useState(false);
    //const [editNoteMode] = useState(false);
    //const [inputFocused, setInputFocused] = useState(false);

    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const navigation = useNavigation<NavigationProp>();

    // Hae käyttäjän sijainti pyynnöstä (esim. Picker tai ListTag)
    const getCurrentLocation = () => {
        Geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                console.warn('GPS-paikannus epäonnistui:', error);
            },
            { enableHighAccuracy: true }
        );
    };

    // Muodosta lista suoraan tageista, jotta myös ilman muistiinpanoa olevat tagit näkyvät.
    let filteredItems: NoteListEntry[] = locations
        .map((location: any) => {
            const note = location.noteId ? notes.find((n: any) => n.id === location.noteId) : null;
            const locationTimestamp = location.lastUpdated || '';
            return {
                id: `loc-${location.id}`,
                locationId: location.id,
                noteId: note?.id ?? null,
                name: note?.name?.trim() ? note.name : `Tagi ${formatTagTimestamp(locationTimestamp)}`,
                note: note?.note || '',
                lastUpdated: note?.lastUpdated || note?.createdAt || locationTimestamp,
                tagType: location.tagType,
                latitude: location.latitude,
                longitude: location.longitude,
                hasNote: !!note,
            };
        });

    // Sorttaus
    filteredItems = filteredItems.slice();
    if (sortType === 'distance' && userLocation) {
        filteredItems.sort((a, b) => {
            const distA = getDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
            const distB = getDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
            return distA - distB;
        });
    } else if (sortType === 'newest') {
        filteredItems.sort((a, b) => {
            const dateA = new Date(a.lastUpdated || 0).getTime();
            const dateB = new Date(b.lastUpdated || 0).getTime();
            return dateB - dateA;
        });
    } else if (sortType === 'oldest') {
        filteredItems.sort((a, b) => {
            const dateA = new Date(a.lastUpdated || 0).getTime();
            const dateB = new Date(b.lastUpdated || 0).getTime();
            return dateA - dateB;
        });
    }
    //const note = useAppSelector((state) => state.photoNote.note);
    const modalVisible = useAppSelector((state) => state.photoNote.modalVisible);
    const noteModalVisible = useAppSelector((state) => state.photoNote.noteModalVisible);
    const selectedPhotoUrl = useAppSelector((state) => state.photoNote.selectedPhotoUrl);
    const selectedPhotoTitle = useAppSelector((state) => state.photoNote.selectedPhotoTitle);
    const selectedPhotoNote = useAppSelector((state) => state.photoNote.selectedPhotoNote);
    const selectedPhotoId = useAppSelector((state) => state.photoNote.selectedPhotoId);

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Pickerin dynaamiset värit (isDark jälkeen)
    const pickerTextColor = isDark ? '#fff' : '#222';
    //const pickerBgColor = isDark ? '#222' : '#fff';

    // Lataa tietokannan tiedot
    const loadItems = useCallback(() => {
        dispatch(fetchItems()).catch((error) => console.error('Failed to fetch items:', error));
    }, [dispatch]);

    useEffect(() => {
        dispatch(initializeDb()).then(() => {
            loadItems();
        });
    }, [dispatch, loadItems]);

    // Lisää uusi tietue tietokantaan
    /*const handleAddPhotoNote = () => {
        if (!title.trim()) {
            Alert.alert(t('alertEmptyTitle'));
            return;
        }
        if (!selectedLocationId) {
            Alert.alert('Virhe', 'Yhtään sijaintia ei ole lisätty!');
            return;
        }
        const newPhotoNote = {
            name: title,
            note,
            locationId: selectedLocationId, // Linkitys location.id
            // Placeholder kentät
            quantity: 1,
            photoFileName: '',
            photoUrl: '',
        };

        dispatch(addItem(newPhotoNote))
            .then(() => {
                setTitle('');
                dispatch(setNote(''));
                loadItems();
            })
            .catch((error) => console.error('Error adding photo note:', error));
    };
    */

    // Ota valokuva ja päivitä tietokantaan
    // Poista tagi (sekä mahdollinen muistiinpano)
    const handleDeleteTag = (entry: NoteListEntry) => {
        Alert.alert(
            t('deleteTitle'),
            t('deleteText'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('deleteLabel'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (entry.noteId) {
                                await dispatch(deleteItem(entry.noteId));
                            }
                            dispatch(deleteLocation(entry.locationId));
                            await dispatch(deleteLocationDb(entry.locationId));
                            loadItems();
                        } catch (error) {
                            console.error('Error deleting tag:', error);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const handleSaveNote = () => {
        if (selectedPhotoId && selectedPhotoNote) {
            const updatedItem = {
                id: selectedPhotoId, // Käytä Redux-tilasta haettua id:tä
                note: selectedPhotoNote,
                name: selectedPhotoTitle || '', // Add the required 'name' property
            };

            console.log('Saving note with ID:', selectedPhotoId); // Log the ID
            console.log('Saving note content:', selectedPhotoNote); // Log the note content

            dispatch(updateItem(updatedItem))
                .then(() => {
                    loadItems();
                    dispatch(setNoteModalVisible(false));
                })
                .catch((error) => console.error('Error updating note:', error));
        } else {
            console.error('Error: Missing selectedPhotoId or selectedPhotoNote');
        }
    };

    // Avaa valokuva modaalissa
    const handleGotoLocation = (entry: NoteListEntry) => {
        const location = {
            latitude: entry.latitude,
            longitude: entry.longitude,
            heading: null,
        };
        if (setAutoFollowOnStart) {
            setAutoFollowOnStart(false);
        }
        if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
            navigation.navigate('Map', { location, autoFollowOnStart: false });
        } else {
            Alert.alert('Virhe', 'Sijaintia ei löytynyt!');
        }
    };

    // Avaa muistiinpano modaalissa
    return (
        <Host>
            <Surface style={[styles.container, isDark ? styles.surfaceDark : styles.surfaceLight]}>
                <View style={styles.headerSpacer} />
                <View style={styles.header}>
                    <Text style={[styles.notesTitle, isDark ? styles.notesTitleDark : styles.notesTitleLight]}>{t('notes')}</Text>
                </View>
                <View style={styles.filterHeaderRow}>
                    <Picker
                        selectedValue={sortType}
                        style={[styles.sortPicker, isDark ? styles.sortPickerDark : styles.sortPickerLight]}
                        dropdownIconColor={pickerTextColor}
                        onValueChange={(itemValue: 'distance' | 'newest' | 'oldest') => {
                            setSortType(itemValue);
                            if (itemValue === 'distance') {
                                getCurrentLocation();
                            }
                        }}
                        mode="dropdown"
                    >
                        <Picker.Item label={t('sortDefault', 'Järjestä...')} value="" color={isDark ? '#bbb' : '#888'} />
                        <Picker.Item label={t('sortNewest', 'Uusin ensin')} value="newest" color={pickerTextColor} />
                        <Picker.Item label={t('sortOldest', 'Vanhin ensin')} value="oldest" color={pickerTextColor} />
                        <Picker.Item label={t('sortNearest', 'Lähimmät ensin')} value="distance" color={pickerTextColor} />
                    </Picker>
                </View>
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Surface style={[styles.listItem, isDark ? styles.listItemDark : styles.listItemLight]}>
                            <ListTag item={item} locations={locations} isDark={isDark} userLocation={userLocation} onRequestLocation={getCurrentLocation} />
                            <Text style={[styles.notetitle, isDark ? styles.titleDark : styles.titleLight, styles.titleMoreSpace]}>{item.name}</Text>
                            <View style={styles.icons}>
                                <TouchableRipple style={styles.iconButton} onPress={() => handleGotoLocation(item)}>
                                    <FontAwesome name="map" size={15} style={isDark ? styles.iconCameraDark : styles.iconCameraLight} />
                                </TouchableRipple>
                                <TouchableRipple style={styles.iconButton} onPress={() => handleDeleteTag(item)}>
                                    <FontAwesome name="trash" size={15} style={isDark ? styles.iconTrashDark : styles.iconTrashLight} />
                                </TouchableRipple>
                            </View>
                        </Surface>
                    )}
                    ListEmptyComponent={<Text style={isDark ? styles.emptyTextDark : styles.emptyTextLight}>{t('noPhotoNotes')}</Text>}
                />
                <Modal
                    visible={modalVisible}
                    onDismiss={() => dispatch(setModalVisible(false))}
                    contentContainerStyle={[styles.modalContainer]}
                >
                    <Surface style={[styles.modalContent, isDark ? styles.modalContentDark : styles.modalContentLight]}>
                        {selectedPhotoTitle && (
                            <Text style={[styles.modalTitle, isDark ? styles.titleDark : styles.titleLight]}>{selectedPhotoTitle}</Text>
                        )}
                        {selectedPhotoUrl && (
                            <Image
                                source={{ uri: selectedPhotoUrl }}
                                style={[styles.modalImage, isDark ? styles.imageDark : styles.imageLight]}
                                resizeMode="contain"
                            />
                        )}
                        {!selectedPhotoUrl && (
                            <Text style={[styles.modalTitle, isDark ? styles.emptyTextDark : styles.emptyTextLight]}>
                                {t('noImageText')}
                            </Text>
                        )}
                        <View style={styles.buttonRow}>
                            <IconButton
                                icon="close"
                                mode="outlined"
                                onPress={() => dispatch(setModalVisible(false))}
                                style={[styles.modalButton, isDark ? styles.buttonDark : styles.buttonLight]}
                                iconColor={isDark ? '#fffbe6' : '#fff'}
                            />
                        </View>
                    </Surface>
                </Modal>
                <Modal
                    visible={noteModalVisible}
                    onDismiss={() => dispatch(setNoteModalVisible(false))}
                    contentContainerStyle={[styles.modalContainer]}
                >
                    <Card style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
                        {selectedPhotoUrl ? (
                            <View style={styles.imageContainer}>
                                {/* @ts-ignore: ImageZoom children type issue */}
                                <ImageZoom
                                    cropWidth={windowWidth - 32}
                                    cropHeight={windowHeight}
                                    imageWidth={windowWidth - 32}
                                    imageHeight={windowHeight}
                                    minScale={1}
                                    maxScale={3}
                                    enableCenterFocus={false}
                                >
                                    <Image
                                        source={{ uri: selectedPhotoUrl }}
                                        style={[styles.image, isDark ? styles.imageDark : styles.imageLight]}
                                        resizeMode="contain"
                                    />
                                </ImageZoom>
                            </View>
                        ) : null}
                        <TextInput
                            style={[
                                styles.textInput,
                                isDark ? styles.textInputDark : styles.textInputLight,
                                noteFocused
                                    ? (isDark ? styles.textInputFocusedDark : styles.textInputFocusedLight)
                                    : (isDark ? styles.textInputUnfocusedDark : styles.textInputUnfocusedLight),
                                styles.textInputBottom,
                            ]}
                            value={selectedPhotoNote || ''}
                            onChangeText={(text) => dispatch(updateSelectedPhotoNote(text))}
                            multiline={true}
                            numberOfLines={4}
                            placeholder={t('placeholderNote')}
                            placeholderTextColor={isDark ? '#bbb' : '#888'}
                            onFocus={() => setNoteFocused(true)}
                            onBlur={() => setNoteFocused(false)}
                        />
                        <View style={styles.buttonRow}>
                            <IconButton
                                icon="close"
                                mode="outlined"
                                onPress={() => dispatch(setNoteModalVisible(false))}
                                style={[styles.modalButton, isDark ? styles.buttonDark : styles.buttonLight]}
                                iconColor={isDark ? '#fffbe6' : '#fff'}
                            />
                            <IconButton
                                icon="check"
                                mode="contained"
                                onPress={handleSaveNote}
                                style={[styles.modalButton, isDark ? styles.buttonDark : styles.buttonLight]}
                                iconColor={isDark ? '#fffbe6' : '#fff'}
                            />
                        </View>
                    </Card>
                </Modal>
            </Surface>
        </Host>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
    },
    titleMoreSpace: {
        marginLeft: 8,
        flexShrink: 1,
    },
    filterButtonDark: {
        backgroundColor: '#222',
    },
    filterContainerDark: {
        backgroundColor: '#333',
    },
    filterHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sortPicker: {
        width: 140,
        marginLeft: 8,
        borderRadius: 8,
        height: 36,
        borderWidth: 1,
    },
    sortPickerDark: {
        borderColor: '#444',
    },
    sortPickerLight: {
        borderColor: '#bbb',
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 8,
        elevation: 4,
        alignSelf: 'center',
    },
    filterButton: {
        marginHorizontal: 4,
        padding: 4,
        borderRadius: 6,
        backgroundColor: '#f5f5f5',
    },
    filterIconActive: {
        opacity: 1,
    },
    filterIconInactive: {
        opacity: 0.5,
    },

    container: {
        flex: 1,
        padding: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    greenBackground: {
        backgroundColor: '#E8F5E9', // Vaaleanvihreä taustaväri
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        height: 100,
        width: '100%',
        textAlignVertical: 'top', // Ensures text starts at the top of the TextInput
    },
    button: {
        marginBottom: 20,
        backgroundColor: '#4CAF50', // Vihreä teema
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        position: 'relative',
        overflow: 'visible',
    },
    notetitle: {
        fontSize: 12,
        flex: 3,
        marginLeft: 10,
    },
    icons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 8,
        width: 80,
        marginLeft: 2,
    },
    iconButton: {
        marginHorizontal: 2, // Lisää vaakasuora marginaali
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '100%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalImage: {
        width: '100%',
        height: 300,
        marginBottom: 20,
    },
    modalNote: {
        fontSize: 16,
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        flex: 1,
        marginHorizontal: 5,
        backgroundColor: '#4CAF50', // Vihreä teema myös modaalin painikkeille
    },
    card: {
        width: '100%',
        borderRadius: 10,
    },
    cardDark: {
        backgroundColor: '#222',
    },
    cardLight: {
        backgroundColor: '#fff',
    },
    imageContainer: {
        width: '100%',
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: 300,
        borderRadius: 10,
    },
    imageDark: {
        backgroundColor: '#222',
    },
    imageLight: {
        backgroundColor: '#fff',
    },
    textInput: {
        height: 120,
        width: '100%',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginBottom: 10,
        textAlignVertical: 'top',
    },
    textInputDark: {
        backgroundColor: '#222',
        color: '#fff',
        borderColor: '#925821ff',
    },
    textInputLight: {
        backgroundColor: '#E8F5E9',
        color: '#222',
        borderColor: '#4CAF50',
    },
    textInputFocusedDark: {
        borderBottomColor: '#388E3C',
        borderColor: '#388E3C',
    },
    textInputFocusedLight: {
        borderBottomColor: '#4CAF50',
    },
    textInputUnfocusedDark: {
        borderBottomColor: '#925821ff',
    },
    textInputUnfocusedLight: {
        borderBottomColor: '#ccc',
    },
    textInputBottom: {
        borderBottomWidth: 2,
    },
    modalNoteDark: {
        color: '#fff',
    },
    modalNoteLight: {
        color: '#222',
    },
    modalTitleDark: {
        color: '#bbb',
    },
    modalTitleLight: {
        color: '#222',
    },
    // Dark mode styles
    darkContainer: {
        backgroundColor: '#181818',
    },
    darkInput: {
        borderColor: '#555',
        color: '#fff',
        backgroundColor: '#222',
    },
    darkTextArea: {
        borderColor: '#555',
        color: '#fff',
        backgroundColor: '#222',
    },
    darkGreenBackground: {
        backgroundColor: '#222',
    },
    surfaceDark: {
        backgroundColor: '#181818',
    },
    surfaceLight: {
        backgroundColor: '#f5f5f5',
    },
    buttonDark: {
        backgroundColor: '#925821ff',
    },
    buttonLight: {
        backgroundColor: '#4CAF50',
    },
    labelDark: {
        color: '#fffbe6',
    },
    labelLight: {
        color: '#222',
    },
    listItemDark: {
        borderBottomColor: '#444',
    },
    listItemLight: {
        borderBottomColor: '#ccc',
    },
    titleDark: {
        color: '#fff',
    },
    titleLight: {
        color: '#222',
    },
    emptyTextDark: {
        color: '#bbb',
    },
    emptyTextLight: {
        color: '#222',
    },
    modalContentDark: {
        backgroundColor: '#222',
    },
    modalContentLight: {
        backgroundColor: '#fff',
    },
    iconCameraDark: {
        color: '#925821ff',
    },
    iconCameraLight: {
        color: '#4CAF50',
    },
    iconTrashDark: {
        color: '#e57373',
    },
    iconTrashLight: {
        color: '#d32f2f',
    },
    headerSpacer: {
        height: 40,
    },
    notesTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 0.2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 4,
    },
    notesTitleDark: {
        color: '#fff',
    },
    notesTitleLight: {
        color: '#222',
    },
});

export default PhotoNoteManager;

