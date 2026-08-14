import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './src/translations/en.json';
import fi from './src/translations/fi.json';
import sv from './src/translations/sv.json';

const resources = {
  en: { translation: en },
  fi: { translation: fi },
  sv: { translation: sv },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fi', // Oletuskieli
    fallbackLng: 'fi',
    debug: false,
    interpolation: {
      escapeValue: false, // React käsittelee XSS-suojauksen automaattisesti
    },
  });

export default i18n;
