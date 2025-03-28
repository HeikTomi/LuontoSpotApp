import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PhotoNoteState {
    title: string;
    note: string;
    modalVisible: boolean;
    noteModalVisible: boolean;
    selectedPhotoUrl: string | null;
    selectedPhotoTitle: string | null;
    selectedPhotoNote: string | null;
    selectedPhotoId: number | null; // Lisää tämä
}

const initialState: PhotoNoteState = {
    title: '',
    note: '',
    modalVisible: false,
    noteModalVisible: false,
    selectedPhotoUrl: null,
    selectedPhotoTitle: null,
    selectedPhotoNote: null,
    selectedPhotoId: null, // Lisää tämä
};

const photoNoteSlice = createSlice({
    name: 'photoNote',
    initialState,
    reducers: {
        setTitle(state, action: PayloadAction<string>) {
            state.title = action.payload;
        },
        setNote(state, action: PayloadAction<string>) {
            state.note = action.payload;
        },
        setModalVisible(state, action: PayloadAction<boolean>) {
            state.modalVisible = action.payload;
        },
        setNoteModalVisible(state, action: PayloadAction<boolean>) {
            state.noteModalVisible = action.payload;
        },
        setSelectedPhotoUrl(state, action: PayloadAction<string | null>) {
            state.selectedPhotoUrl = action.payload;
        },
        setSelectedPhotoTitle(state, action: PayloadAction<string | null>) {
            state.selectedPhotoTitle = action.payload;
        },
        setSelectedPhotoNote(state, action: PayloadAction<string | null>) {
            state.selectedPhotoNote = action.payload;
        },
        setSelectedPhotoId(state, action: PayloadAction<number | null>) { // Lisää tämä
            state.selectedPhotoId = action.payload;
        },
        updateSelectedPhotoNote(state, action: PayloadAction<string>) {
            state.selectedPhotoNote = action.payload;
        },
    },
});

export const {
    setTitle,
    setNote,
    setModalVisible,
    setNoteModalVisible,
    setSelectedPhotoUrl,
    setSelectedPhotoTitle,
    setSelectedPhotoNote,
    setSelectedPhotoId, // Vie tämä
    updateSelectedPhotoNote,
} = photoNoteSlice.actions;

export default photoNoteSlice.reducer;
