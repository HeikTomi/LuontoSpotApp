import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useCallback, useState } from 'react';
import { StyleSheet, FlatList, Alert, Image, View, TextInput, useColorScheme, Dimensions } from 'react-native';
import { Surface, Text, TouchableRipple, Modal, IconButton, Card } from 'react-native-paper';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ListTag from './ListTag';
import { Host } from 'react-native-portalize';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/userAppSelector';
import { initializeDb, fetchItems, deleteItem, updateItem } from './sqliteSlice';
import {
    //setNote,
    setModalVisible,
    setSelectedPhotoTitle,
    setSelectedPhotoNote,
    setNoteModalVisible,
    updateSelectedPhotoNote,
    setSelectedPhotoId,
    setSelectedPhotoUrl,
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

export const PhotoNoteManager: React.FC<{ setAutoFollowOnStart?: (val: boolean) => void }> = ({ setAutoFollowOnStart }) => {

    const locations = useAppSelector((state) => state.location.locations);
    const notes = useAppSelector((state) => state.sqlite.items);
    // Valitse automaattisesti viimeisin location id
    //const selectedLocationId = locations.length > 0 ? locations[locations.length - 1].id : null;
    // Käyttäjän sijainti (voit vaihtaa logiikan tarpeen mukaan)
    const userLocation = locations.length > 0 ? {
        latitude: locations[locations.length - 1].latitude,
        longitude: locations[locations.length - 1].longitude,
    } : undefined;
    const fetchNoteLocation = (noteId: number) => {
        console.log('DEBUG notes:', notes);
        console.log('DEBUG locations:', locations);
        const note = notes.find((n: any) => n.id === noteId);
        if (!note) {
            console.log('DEBUG: note missing');
            return null;
        }
        // locationin haku noteId:llä
        const location = locations.find((l: any) => l.noteId === note.id);
        console.log('DEBUG location:', location);
        if (!location) {
            console.log('DEBUG: location not found');
            return null;
        }
        return {
            latitude: location.latitude,
            longitude: location.longitude,
            heading: null,
        };
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
    const items = useAppSelector((state) => state.sqlite.items);

    // Filter-tilat
    const [showInterest, setShowInterest] = useState(true);
    const [showBerry, setShowBerry] = useState(true);
    const [showMushroom, setShowMushroom] = useState(true);

    // Filter-ikonien tyylit
    const filterIconSize = 20;

    // Suodatettu ja lajiteltu lista
    let filteredItems = items.filter((item: any) => {
        const location = locations.find((l: any) => l.noteId === item.id);
        if (!location || !location.tagType) { return true; }
        if (location.tagType === 'Mielenkiinto' && showInterest) { return true; }
        if (location.tagType === 'Marja' && showBerry) { return true; }
        if (location.tagType === 'Sieni' && showMushroom) { return true; }
        return false;
    });
    // Sorttaus
    filteredItems = filteredItems.slice();
    if (sortType === 'distance' && userLocation) {
        filteredItems.sort((a, b) => {
            const locA = locations.find((l: any) => l.noteId === a.id);
            const locB = locations.find((l: any) => l.noteId === b.id);
            if (!locA || !locB) return 0;
            const distA = getDistance(userLocation.latitude, userLocation.longitude, locA.latitude, locA.longitude);
            const distB = getDistance(userLocation.latitude, userLocation.longitude, locB.latitude, locB.longitude);
            return distA - distB;
        });
    } else if (sortType === 'newest') {
        filteredItems.sort((a, b) => {
            const dateA = new Date(a.lastUpdated || a.createdAt || 0).getTime();
            const dateB = new Date(b.lastUpdated || b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    } else if (sortType === 'oldest') {
        filteredItems.sort((a, b) => {
            const dateA = new Date(a.lastUpdated || a.createdAt || 0).getTime();
            const dateB = new Date(b.lastUpdated || b.createdAt || 0).getTime();
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
    const handleTakePhoto = (id: number) => {
        // @ts-ignore: React Navigation param typing workaround
        navigation.navigate('Camera', { id });
    };

    // Poista tietue tietokannasta
    const handleDeletePhotoNote = (id: number) => {
        Alert.alert(
            t('deleteTitle'),
            t('deleteText'),
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => {
                    dispatch(deleteItem(id))
                        .then(() => loadItems())
                        .catch((error) => console.error('Error deleting photo note:', error));
                }},
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
    const handleGotoLocation = (noteId: number) => {
        const location = fetchNoteLocation(noteId);
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
    const handleOpenNote = (photoId: number, photoTitle: string, photoNote: string) => {
        const noteObj = notes.find((n: any) => n.id === photoId);
        console.log(notes);
        dispatch(setSelectedPhotoId(photoId));
        dispatch(setSelectedPhotoTitle(photoTitle));
        dispatch(setSelectedPhotoNote(photoNote));
        dispatch(setSelectedPhotoUrl(noteObj?.photoUrl || ''));
        dispatch(setNoteModalVisible(true));
    };
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
                        style={{
                            width: 140,
                            color: isDark ? '#fff' : '#222',
                            backgroundColor: isDark ? '#222' : '#fff',
                            marginLeft: 8,
                            borderRadius: 8,
                            height: 36,
                            borderWidth: 1,
                            borderColor: isDark ? '#444' : '#bbb',
                        }}
                        dropdownIconColor={isDark ? '#fff' : '#222'}
                        itemStyle={{ color: isDark ? '#fff' : '#222', backgroundColor: isDark ? '#222' : '#fff' }}
                        onValueChange={(itemValue: 'distance' | 'newest' | 'oldest') => setSortType(itemValue)}
                        mode="dropdown"
                    >
                        <Picker.Item label={t('sortDefault', 'Järjestä...')} value="" color={isDark ? '#bbb' : '#888'} />
                        <Picker.Item label={t('sortNewest', 'Uusin ensin')} value="newest" />
                        <Picker.Item label={t('sortOldest', 'Vanhin ensin')} value="oldest" />
                        <Picker.Item label={t('sortNearest', 'Lähimmät ensin')} value="distance" />
                    </Picker>
                    <View style={[styles.filterContainer, isDark && styles.filterContainerDark]}> 
                        <TouchableRipple onPress={() => setShowMushroom((v) => !v)} style={[styles.filterButton, isDark && styles.filterButtonDark]}>
                            <Icon name="mushroom" size={filterIconSize} color={showMushroom ? (isDark ? '#FFD39B' : '#8D4F2A') : (isDark ? '#888' : '#bbb')} style={showMushroom ? styles.filterIconActive : styles.filterIconInactive} />
                        </TouchableRipple>
                        <TouchableRipple onPress={() => setShowBerry((v) => !v)} style={[styles.filterButton, isDark && styles.filterButtonDark]}>
                            <Icon name="fruit-grapes" size={filterIconSize} color={showBerry ? (isDark ? '#CBA3FF' : '#6A1B9A') : (isDark ? '#888' : '#bbb')} style={showBerry ? styles.filterIconActive : styles.filterIconInactive} />
                        </TouchableRipple>
                        <TouchableRipple onPress={() => setShowInterest((v) => !v)} style={[styles.filterButton, isDark && styles.filterButtonDark]}>
                            <Icon name="star" size={filterIconSize} color={showInterest ? (isDark ? '#FFFACD' : '#FFD700') : (isDark ? '#888' : '#bbb')} style={showInterest ? styles.filterIconActive : styles.filterIconInactive} />
                        </TouchableRipple>
                    </View>
                </View>
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <Surface style={[styles.listItem, isDark ? styles.listItemDark : styles.listItemLight]}>
                            <ListTag item={item} locations={locations} isDark={isDark} userLocation={userLocation} />
                            <Text style={[styles.notetitle, isDark ? styles.titleDark : styles.titleLight, styles.titleMoreSpace]}>{item.name}</Text>
                            <View style={styles.icons}>
                                <TouchableRipple style={styles.iconButton} onPress={() => handleTakePhoto(item.id)}>
                                    <FontAwesome name="camera" size={15} style={isDark ? styles.iconCameraDark : styles.iconCameraLight} />
                                </TouchableRipple>
                                <TouchableRipple style={styles.iconButton} onPress={() => handleGotoLocation(item.id)}>
                                    <FontAwesome name="map" size={15} style={isDark ? styles.iconCameraDark : styles.iconCameraLight} />
                                </TouchableRipple>
                                <TouchableRipple style={styles.iconButton} onPress={() => handleOpenNote(item.id, item.name, item.note)}>
                                    <FontAwesome name="pencil" size={15} style={isDark ? styles.iconCameraDark : styles.iconCameraLight} />
                                </TouchableRipple>
                                <TouchableRipple style={styles.iconButton} onPress={() => handleDeletePhotoNote(item.id)}>
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

