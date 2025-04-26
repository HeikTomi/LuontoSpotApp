import React, { useEffect, useCallback, useState } from 'react';
import { StyleSheet, FlatList, Alert, Image, View, TextInput } from 'react-native';
import { Surface, TextInput as PaperTextInput, Text, TouchableRipple, Modal, Button, IconButton } from 'react-native-paper';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/userAppSelector';
import { initializeDb, addItem, fetchItems, updatePhoto, deleteItem, updateItem } from './sqliteSlice';
import {
    setNote,
    setSelectedPhotoUrl,
    setModalVisible,
    setSelectedPhotoTitle,
    setSelectedPhotoNote,
    setNoteModalVisible,
    updateSelectedPhotoNote,
    setSelectedPhotoId,
} from './photoNoteSlice';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhotoNoteManager'>;
type PhotoNoteManagerRouteProp = RouteProp<RootStackParamList, 'PhotoNoteManager'>;

export const PhotoNoteManager: React.FC = () => {
    const route = useRoute<PhotoNoteManagerRouteProp>();
    const { prefilledTitle } = route.params || {};

    const [title, setTitle] = useState(prefilledTitle || '');

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

        // TODO: poista quantity. Kohde on jo ja tagin tyyppi.. linkitä siihen note
        const newPhotoNote = {
            name: title, // SQLite käyttää tässä "name"-kenttää
            quantity: 1, // Placeholder kenttä
            photoFileName: '', // Placeholder kenttä
            photoUrl: '', // Placeholder
            note, // Placeholder kenttä
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
        navigation.navigate('Camera', {
            id,
            onPhotoTaken: (photoUrl: string) => {
                dispatch(updatePhoto({ id, photoUrl }))
                    .then(() => loadItems())
                    .catch((error) => console.error('Error updating photo URL:', error));
            },
        });
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
    const handleOpenPhoto = (photoTitle: string, photoUrl: string) => {
        console.log('Opening photo URL:', photoUrl); // Log the photo URL
        console.log('Opening photo Title:', photoTitle); // Log the photo title
        dispatch(setSelectedPhotoTitle(photoTitle)); // Aseta valokuvan otsikko
        dispatch(setSelectedPhotoUrl(photoUrl));
        dispatch(setModalVisible(true));
    };

    // Avaa muistiinpano modaalissa
    const handleOpenNote = (photoId: number, photoTitle: string, photoNote: string) => {
        console.log('Opening photo Note:', photoNote); // Log the photo note
        console.log('Opening photo Title:', photoTitle); // Log the photo title
        console.log('Opening photo ID:', photoId); // Log the photo ID
        dispatch(setSelectedPhotoId(photoId)); // Aseta valokuvan id
        dispatch(setSelectedPhotoTitle(photoTitle)); // Aseta valokuvan otsikko
        dispatch(setSelectedPhotoNote(photoNote)); // Aseta valokuvan muistiinpano
        dispatch(setNoteModalVisible(true));
    };

    return (
        <Surface style={styles.container}>
            <PaperTextInput
                style={[styles.input, styles.greenBackground]} // Lisätty vihreä taustaväri
                placeholder={t('placeholderTitle')}
                value={title}
                onChangeText={(text) => setTitle(text)}
            />
            <TextInput
                style={[styles.textArea, styles.greenBackground]} // Lisätty vihreä taustaväri
                placeholder={t('placeholderNote')}
                value={note}
                onChangeText={(text) => dispatch(setNote(text))}
                multiline={true}
                numberOfLines={4}
            />
            <Button mode="contained" onPress={handleAddPhotoNote} style={styles.button}>
                {t('buttonAddNote')}
            </Button>
            <FlatList
                data={items}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <Surface style={styles.listItem}>
                        <Text style={styles.title}>{item.name}</Text>
                        <View style={styles.icons}>
                            <TouchableRipple style={styles.iconButton} onPress={() => handleTakePhoto(item.id)}>
                                <FontAwesome name="camera" size={24} />
                            </TouchableRipple>
                            <TouchableRipple style={styles.iconButton} onPress={() => handleOpenPhoto(item.name, item.photoUrl)}>
                                <FontAwesome name="image" size={24} />
                            </TouchableRipple>
                            <TouchableRipple style={styles.iconButton} onPress={() => handleOpenNote(item.id, item.name, item.note)}>
                                <FontAwesome name="pencil" size={24} />
                            </TouchableRipple>
                            <TouchableRipple style={styles.iconButton} onPress={() => handleDeletePhotoNote(item.id)}>
                                <FontAwesome name="trash" size={24} />
                            </TouchableRipple>
                        </View>
                    </Surface>
                )}
                ListEmptyComponent={<Text>{t('noPhotoNotes')}</Text>}
            />
            <Modal
                visible={modalVisible}
                onDismiss={() => dispatch(setModalVisible(false))}
                contentContainerStyle={styles.modalContainer}
            >
                <Surface style={styles.modalContent}>
                    {selectedPhotoTitle && (
                        <Text style={styles.modalTitle}>{selectedPhotoTitle}</Text>
                    )}
                    {selectedPhotoUrl && (
                        <Image
                            source={{ uri: selectedPhotoUrl }}
                            style={styles.modalImage}
                            resizeMode="contain"
                            onLoad={() => console.log('Image loaded:', selectedPhotoUrl)} // Log when image is loaded
                            onError={(error) => console.error('Image load error:', error)} // Log if there is an error loading the image
                        />
                    )}
                    {!selectedPhotoUrl && (
                        <Text style={styles.modalTitle}>
                            {t('noImageText')}
                        </Text>
                    )}
                    <View style={styles.buttonRow}>
                        <IconButton
                            icon="close"
                            mode="outlined"
                            onPress={() => dispatch(setModalVisible(false))}
                            style={styles.modalButton}
                        />
                    </View>
                </Surface>
            </Modal>
            <Modal
                visible={noteModalVisible}
                onDismiss={() => dispatch(setNoteModalVisible(false))}
                contentContainerStyle={styles.modalContainer}
            >
                <Surface style={styles.modalContent}>
                    {selectedPhotoTitle && (
                        <Text style={styles.modalTitle}>{selectedPhotoTitle}</Text>
                    )}
                    <TextInput
                        style={styles.textArea}
                        value={selectedPhotoNote || ''}
                        onChangeText={(text) => dispatch(updateSelectedPhotoNote(text))} // Päivitä Redux-tilaa
                        multiline={true}
                        numberOfLines={4}
                    />
                    <View style={styles.buttonRow}>
                        <IconButton
                            icon="close"
                            mode="outlined"
                            onPress={() => dispatch(setNoteModalVisible(false))}
                            style={styles.modalButton}
                        />
                        <IconButton
                            icon="check"
                            mode="contained"
                            onPress={handleSaveNote}
                            style={styles.modalButton}
                        />
                    </View>
                </Surface>
            </Modal>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
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
});

export default PhotoNoteManager;
