// src/hooks/useAppDispatch.ts
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store/store';
// Tämä on tyypillisesti määritelty Reduxin store-tiedostossa
// ja se kuvaa Reduxin dispatch-funktion tyyppiä
export const useAppDispatch = () => useDispatch<AppDispatch>();
