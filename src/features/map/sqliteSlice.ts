import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchLocations } from '../../database/queries/locations';
import { setLocations } from './locationSlice';

// Async thunk joka hakee kaikki merkinnät kannasta ja päivittää Reduxin
export const fetchLocationsFromDB = createAsyncThunk(
  'sqlite/fetchLocationsFromDB',
  async (_, { dispatch }) => {
    const locations = await fetchLocations();
    dispatch(setLocations(locations));
    return locations;
  }
);
