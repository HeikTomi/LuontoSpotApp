import './gesture-handler';
import 'react-native-get-random-values';
/**
 * @format
 */
import {AppRegistry, useColorScheme} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { PaperProvider, MD3DarkTheme, MD3LightTheme  } from 'react-native-paper';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n.config';

export default function Main() {
    // const isDarkMode = true; // Change this dynamically based on user preference or system settings
    const colorScheme = useColorScheme(); // 'light' | 'dark'

  return (
    // <PaperProvider  theme={isDarkMode ? MD3DarkTheme : MD3LightTheme}>
    <PaperProvider  theme={colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme}>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </PaperProvider>
  );
}

AppRegistry.registerComponent(appName, () => Main);
