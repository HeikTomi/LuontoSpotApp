import React, { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/store/store';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text, StyleSheet } from 'react-native';

import { CameraScreen } from './src/features/camera/Camera';
import { AuthenticationScreen } from './src/screens/AuthenticationScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { MapScreen } from './src/screens/MapScreen';
import NotesScreen from './src/screens/NotesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Authentication: undefined;
  Register: undefined;
  Login: undefined;
  Drawer: undefined;
  Camera: { id: number; onPhotoTaken: (photoUrl: string) => void }; // Päivitetty Camera-parametrit
  PhotoNoteManager: {prefilledTitle: string};
  Settings: undefined;
  Map: undefined;
};

export type AuthenticationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Authentication'
>;

export type PhotoNoteManagerRouteProp = RouteProp<RootStackParamList, 'PhotoNoteManager'>;
export type CameraScreenRouteProp = RouteProp<RootStackParamList, 'Camera'>;

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Drawer-navigaattori (Map, Notes, Settings)
const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Map" // Asetetaan Map oletusnäkymäksi
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: '#4CAF50',
        drawerInactiveTintColor: '#333',
        drawerLabelStyle: { fontSize: 16 },
      }}
    >
      <Drawer.Screen
        name="Map"
        component={MapScreen}
        options={{
          drawerLabel: 'Kartta',
          drawerIcon: ({ color, size }) => <Icon name="map" color={color} size={size} />,
          headerTitle: 'Kartta', // Otsikko Drawer-näkymässä
        }}
      />
      <Drawer.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          drawerLabel: 'Muistiinpanot',
          drawerIcon: ({ color, size }) => <Icon name="note" color={color} size={size} />,
          headerTitle: 'Muistiinpanot',
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerLabel: 'Asetukset',
          drawerIcon: ({ color, size }) => <Icon name="cog" color={color} size={size} />,
          headerTitle: 'Asetukset',
        }}
      />
    </Drawer.Navigator>
  );
};

function App(): React.JSX.Element {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('appLanguage');
        if (savedLanguage) {
          await i18n.changeLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Failed to load language:', error);
      }
    };

    loadLanguage();
  }, [i18n]);

  return (
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Authentication">
            {/* Authentication and other screens */}
            <Stack.Screen
              name="Authentication"
              component={AuthenticationScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                headerTitle: () => <Text style={styles.headerTitle}>{t('register')}</Text>,
              }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                headerTitle: () => <Text style={styles.headerTitle}>{t('login')}</Text>,
              }}
            />
            <Stack.Screen
              name="Camera"
              component={CameraScreen as React.ComponentType<any>}
              options={{
                headerTitle: () => <Text style={styles.headerTitle}>{t('camera')}</Text>,
              }}
            />
            {/* Drawer-navigaatio alkaa tästä */}
            <Stack.Screen
              name="Drawer"
              component={DrawerNavigator}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ReduxProvider>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default App;
