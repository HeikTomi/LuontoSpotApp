// src/hooks/useAppSelector.ts
import { TypedUseSelectorHook, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
/// Tyyppi, joka kuvaa Reduxin tilan rakennetta
/// Tämä on tyypillisesti määritelty Reduxin store-tiedostossa
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
