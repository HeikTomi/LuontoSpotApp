import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { initializeDatabase } from '../../database';
import { addNote, fetchNotes, updateNote, updatePhotoUrl, deleteNote } from '../../database/queries/notes';

interface SqliteState {
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    items: any[];
}

export const initializeDb = createAsyncThunk('sqlite/initializeDatabase', async () => {
    await initializeDatabase();
});

export const addItem = createAsyncThunk('sqlite/addItem', async (item: any) => {
    console.log('addItem called with:', item); // Logi lisäyksen alussa
    await addNote(item);
    console.log('addItem completed for:', item); // Logi lisäyksen jälkeen
    return item;
});

export const fetchItems = createAsyncThunk('sqlite/fetchItems', async () => {
    return await fetchNotes();
});

export const updateItem = createAsyncThunk('sqlite/updateItem', async ({ id, note }: { id: number; note: string }) => {
    await updateNote(id, note);
    return { id, note };
});

export const updatePhoto = createAsyncThunk('sqlite/updatePhotoUrl', async ({ id, photoUrl }: { id: number; photoUrl: string }) => {
    await updatePhotoUrl(id, photoUrl);
});

export const deleteItem = createAsyncThunk('sqlite/deleteItem', async (id: number) => {
    await deleteNote(id);
    return id;
});

const sqliteSlice = createSlice({
    name: 'sqlite',
    initialState: {
        status: 'idle',
        error: null,
        items: [],
    } as SqliteState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchItems.fulfilled, (state, action) => {
                state.items = action.payload;
            })
            .addCase(deleteItem.fulfilled, (state, action) => {
                state.items = state.items.filter((item) => item.id !== action.payload);
            })
            .addCase(initializeDb.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(initializeDb.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(initializeDb.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message || 'Failed to initialize database';
            });
    },
});

export default sqliteSlice.reducer;
