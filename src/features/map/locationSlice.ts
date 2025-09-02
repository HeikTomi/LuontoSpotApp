import { createAsyncThunk } from '@reduxjs/toolkit';
import { deleteLocation as deleteLocationDbQuery } from '../../database/queries/locations';

export const deleteLocationDb = createAsyncThunk('location/deleteLocationDb', async (id: number) => {
    await deleteLocationDbQuery(id);
    return id;
});
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Location {
    id: number; // Automaattisesti generoitu ID
    noteId: number | null; // Viittaus PhotoNotes-tauluun, voi olla null
    latitude: number; // Leveysaste
    longitude: number; // Pituusaste
    tagType: string; // Sijainnin tyyppi
    ownership: string; // Omistajuustieto
    lastUpdated: string; // Päivitetty aikaleima
}

interface LocationState {
    locations: Location[];
}

const initialState: LocationState = {
    locations: [],
};

const locationSlice = createSlice({
    name: 'location',
    initialState,
    reducers: {
        saveLocation: (state, action: PayloadAction<Location>) => {
            state.locations.push(action.payload);
        },
        updateLocation: (state, action: PayloadAction<{ id: number; noteId: number }>) => {
            const location = state.locations.find((loc) => loc.id === action.payload.id);
            if (location) {
                location.noteId = action.payload.noteId;
            }
        },
        setLocations: (state, action: PayloadAction<Location[]>) => {
            state.locations = action.payload;
        },
        deleteLocation: (state, action: PayloadAction<number>) => {
            state.locations = state.locations.filter((loc) => loc.id !== action.payload);
        },
    },
    extraReducers: (builder) => {
        builder.addCase(deleteLocationDb.fulfilled, (state, action) => {
            state.locations = state.locations.filter((loc) => loc.id !== action.payload);
        });
    },
});

export const { saveLocation, updateLocation, setLocations, deleteLocation } = locationSlice.actions;
export default locationSlice.reducer;
