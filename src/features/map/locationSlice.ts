import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Location {
    id: number; // Automaattisesti generoitu ID
    title: string; // Sijainnin otsikko
    locationId: number | null; // Viittaus PhotoNotes-tauluun, voi olla null
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
        updateLocation: (state, action: PayloadAction<{ id: number; locationId: number }>) => {
            const location = state.locations.find((loc) => loc.id === action.payload.id);
            if (location) {
                location.locationId = action.payload.locationId;
            }
        },
        setLocations: (state, action: PayloadAction<Location[]>) => {
            state.locations = action.payload;
        },
    },
});

export const { saveLocation, updateLocation, setLocations } = locationSlice.actions;
export default locationSlice.reducer;
