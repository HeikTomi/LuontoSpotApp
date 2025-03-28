// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';

// TODO: Komponenttikohtaiset slice-reducerit voidaan lisätä tähän
// Esimerkiksi:
import sqliteReducer from '../features/notes/sqliteSlice';
import photoNoteReducer from '../features/notes/photoNoteSlice';

export const store = configureStore({
  reducer: {
    // Komponenttikohtaiset slice-reducerit
    // Esimerkiksi:
    sqlite: sqliteReducer,
    photoNote: photoNoteReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
