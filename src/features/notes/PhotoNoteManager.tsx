import React, { useEffect, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, FlatList, Alert, Image, View, TextInput, useColorScheme, Dimensions } from 'react-native';
import { Surface, TextInput as PaperTextInput, Text, TouchableRipple, Modal, Button, IconButton, Card } from 'react-native-paper';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/userAppSelector';
import { initializeDb, addItem, fetchItems, deleteItem, updateItem } from './sqliteSlice';
import {
    setNote,
    setModalVisible,
    setSelectedPhotoTitle,
    setSelectedPhotoNote,
    setNoteModalVisible,
    updateSelectedPhotoNote,
    setSelectedPhotoId,
    setSelectedPhotoUrl,
} from './photoNoteSlice';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
// @ts-ignore
import ImageZoom from 'react-native-image-pan-zoom';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhotoNoteManager'>;
type PhotoNoteManagerRouteProp = RouteProp<RootStackParamList, 'PhotoNoteManager'>;

const windowWidth = Dimensions.get('window').width;
const windowHeight = 300;

export const PhotoNoteManager: React.FC<{ setAutoFollowOnStart?: (val: boolean) => void }> = ({ setAutoFollowOnStart }) => {

    const locations = useAppSelector((state) => state.location.locations);
    const notes = useAppSelector((state) => state.sqlite.items);
    // Valitse automaattisesti viimeisin location id
    const selectedLocationId = locations.length > 0 ? locations[locations.length - 1].id : null;
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
    const route = useRoute<PhotoNoteManagerRouteProp>();
    const { prefilledTitle } = route.params || {};

    const [title, setTitle] = useState(prefilledTitle || '');
    const [noteFocused, setNoteFocused] = useState(false);
    const [editNoteMode, setEditNoteMode] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);

    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const navigation = useNavigation<NavigationProp>();

    const items = useAppSelector((state) => state.sqlite.items);
    const note = useAppSelector((state) => state.photoNote.note);
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
    const handleAddPhotoNote = () => {
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
        // Aseta locationFromMap AsyncStoreen
        AsyncStorage.setItem('locationFromMap', 'true').then(() => {
            if (setAutoFollowOnStart) {
                console.log('PhotoNoteManager: Navigating to Map from notes, autoFollowOnStart set to false');
                setAutoFollowOnStart(false);
            }
            if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
                console.log('Navigating to Map with location:', location);
                navigation.navigate('Map', { location });
            } else {
                console.log('Location missing or invalid:', location);
                Alert.alert('Virhe', 'Sijaintia ei löytynyt!');
            }
        });
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
        <Surface style={[styles.container, isDark ? styles.surfaceDark : styles.surfaceLight]}>
            <PaperTextInput
                    style={[
                        styles.input,
                        isDark ? styles.textInputDark : styles.textInputLight,
                        inputFocused
                            ? (isDark ? styles.textInputFocusedDark : styles.textInputFocusedLight)
                            : (isDark ? styles.textInputUnfocusedDark : styles.textInputUnfocusedLight),
                        styles.textInputBottom,
                    ]}
                placeholder={t('placeholderTitle')}
                value={title}
                onChangeText={(text) => setTitle(text)}
                theme={{ colors: { text: isDark ? '#fff' : '#222', placeholder: isDark ? '#bbb' : '#888', background: isDark ? '#222' : '#E8F5E9', primary: isDark ? '#388E3C' : '#4CAF50' } }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
            />
            <TextInput
                    style={[
                        styles.textArea,
                        isDark ? styles.textInputDark : styles.textInputLight,
                        noteFocused
                            ? (isDark ? styles.textInputFocusedDark : styles.textInputFocusedLight)
                            : (isDark ? styles.textInputUnfocusedDark : styles.textInputUnfocusedLight),
                        styles.textInputBottom,
                    ]}
                placeholder={t('placeholderNote')}
                value={note}
                onChangeText={(text) => dispatch(setNote(text))}
                multiline={true}
                numberOfLines={4}
                placeholderTextColor={isDark ? '#bbb' : '#888'}
                onFocus={() => setNoteFocused(true)}
                onBlur={() => setNoteFocused(false)}
            />
            <Button
                mode="contained"
                onPress={handleAddPhotoNote}
                style={[styles.button, isDark ? styles.buttonDark : styles.buttonLight]}
                labelStyle={isDark ? styles.labelDark : styles.labelLight}
            >
                {t('buttonAddNote')}
            </Button>
            <FlatList
                data={items}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <Surface style={[styles.listItem, isDark ? styles.listItemDark : styles.listItemLight]}>
                        <Text style={[styles.title, isDark ? styles.titleDark : styles.titleLight]}>{item.name}</Text>
                        <View style={styles.icons}>
                            <TouchableRipple style={styles.iconButton} onPress={() => handleTakePhoto(item.id)}>
                                <FontAwesome name="camera" size={24} style={isDark ? styles.iconCameraDark : styles.iconCameraLight} />
                            </TouchableRipple>
                            <TouchableRipple style={styles.iconButton} onPress={() => handleGotoLocation(item.id)}>
                                <FontAwesome name="map" size={24} style={isDark ? styles.iconCameraDark : styles.iconCameraLight} />
                            </TouchableRipple>
                            <TouchableRipple style={styles.iconButton} onPress={() => handleOpenNote(item.id, item.name, item.note)}>
                                <FontAwesome name="pencil" size={24} style={isDark ? styles.iconCameraDark : styles.iconCameraLight} />
                            </TouchableRipple>
                            <TouchableRipple style={styles.iconButton} onPress={() => handleDeletePhotoNote(item.id)}>
                                <FontAwesome name="trash" size={24} style={isDark ? styles.iconTrashDark : styles.iconTrashLight} />
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
                    ) : (
                        <Card.Content>
                            <Text style={[styles.modalTitle, isDark ? styles.modalTitleDark : styles.modalTitleLight]}>{t('noImageText')}</Text>
                        </Card.Content>
                    )}
                    <Card.Content>
                        {!editNoteMode ? (
                            <TouchableRipple onPress={() => setEditNoteMode(true)}>
                                <Text style={[styles.modalNote, isDark ? styles.modalNoteDark : styles.modalNoteLight]}>
                                    {selectedPhotoNote || t('placeholderNote')}
                                </Text>
                            </TouchableRipple>
                        ) : null}
                        {editNoteMode ? (
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
                        ) : null}
                        <View style={styles.buttonRow}>
                            <IconButton
                                icon="close"
                                mode="outlined"
                                onPress={() => dispatch(setNoteModalVisible(false))}
                                style={[styles.modalButton, isDark ? styles.buttonDark : styles.buttonLight]}
                                iconColor={isDark ? '#fffbe6' : '#fff'}
                            />
                            {editNoteMode && (
                                <IconButton
                                    icon="check"
                                    mode="contained"
                                    onPress={handleSaveNote}
                                    style={[styles.modalButton, isDark ? styles.buttonDark : styles.buttonLight]}
                                    iconColor={isDark ? '#fffbe6' : '#fff'}
                                />
                            )}
                        </View>
                    </Card.Content>
                </Card>
            </Modal>
        </Surface>
    );
};

const styles = StyleSheet.create({
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
    },
    title: {
        fontSize: 16,
        flex: 1,
    },
    icons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: 150,
    },
    iconButton: {
        marginHorizontal: 5, // Lisää vaakasuora marginaali
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
});

export default PhotoNoteManager;

