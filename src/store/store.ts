// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';

import sqliteReducer from '../features/notes/sqliteSlice';
import photoNoteReducer from '../features/notes/photoNoteSlice';
import locationReducer from '../features/map/locationSlice';

export const store = configureStore({
  reducer: {
    // Komponenttikohtaiset slice-reducerit
    sqlite: sqliteReducer,
    photoNote: photoNoteReducer,
    location: locationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
