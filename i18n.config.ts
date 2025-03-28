import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './src/translations/en.json';
import fi from './src/translations/fi.json';

const resources = {
  en: { translation: en },
  fi: { translation: fi },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Oletuskieli
    fallbackLng: 'en', // Varmistetaan, että käännökset toimivat, vaikka avain puuttuisi
    debug: true, // Näytä debug-tiedot konsolissa (virheiden jäljittämiseksi)
    interpolation: {
      escapeValue: false, // React käsittelee XSS-suojauksen automaattisesti
    },
  });

export default i18n;
