/* eslint-disable react/no-unstable-nested-components */
import React, { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/store/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
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
import { fetchLocationsFromDB } from './src/features/map/sqliteSlice';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Authentication: undefined;
  Register: undefined;
  Login: undefined;
  Drawer: undefined;
  Camera: { id: number }; // Ei callbackia navigationissa
  PhotoNoteManager: {prefilledTitle: string};
  Settings: undefined;
  Map: { location?: { latitude: number; longitude: number; heading: number | null }; autoFollowOnStart?: boolean };
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { t } = useTranslation();
  // Drawer Map-ikonin dynaaminen väri ja auto-follow state drawerin tasolla
  const [autoFollowOnStart, setAutoFollowOnStart] = React.useState(true);

  React.useEffect(() => {
    console.log('DrawerNavigator: Navigating to Map, autoFollowOnStart =', autoFollowOnStart);
  }, [autoFollowOnStart]);
  // Drawer Map-ikoni: vihreä kun auto-follow päällä, harmaa kun pois
  const MapIcon = (props: { color: string; size: number }) => {
  // Vaalea tila: harmaa #888, tumma tila: tummanharmaa #333
  const inactiveColor = isDark ? '#333' : '#888';
  return <Icon name="map" color={autoFollowOnStart ? '#4CAF50' : inactiveColor} size={props.size} />;
  };
  const NoteIcon = (props: { color: string; size: number }) => <Icon name="note" color={props.color} size={props.size} />;
  const CogIcon = (props: { color: string; size: number }) => <Icon name="cog" color={props.color} size={props.size} />;

  return (
    <Drawer.Navigator
      initialRouteName="Map"
      screenOptions={{
        headerShown: false, // Piilota header kaikista drawerin screeneistä
        drawerActiveTintColor: isDark ? '#fffbe6' : '#4CAF50',
        drawerInactiveTintColor: isDark ? '#fff' : '#333',
        drawerLabelStyle: { fontSize: 15, color: isDark ? '#fffbe6' : '#333' },
        drawerStyle: { backgroundColor: isDark ? '#181818' : '#fff' },
      }}
    >
      <Drawer.Screen
        name="Map"
        options={{
          drawerLabel: t('map'),
          drawerIcon: MapIcon,
          headerTitle: t('map'),
        }}
        listeners={{
          focus: () => {
            setAutoFollowOnStart(true);
            console.log('DrawerNavigator: Map screen focused, autoFollowOnStart set to true (drawer default)');
          },
        }}
      >
        {props => {
          let autoFollow = autoFollowOnStart;
          if (
            props.route &&
            typeof props.route === 'object' &&
            'params' in props.route &&
            props.route.params &&
            typeof props.route.params === 'object' &&
            'autoFollowOnStart' in props.route.params
          ) {
            autoFollow = (props.route.params as { autoFollowOnStart?: boolean }).autoFollowOnStart ?? autoFollowOnStart;
          }
          return <MapScreen {...props} autoFollowOnStart={autoFollow} />;
        }}
      </Drawer.Screen>
      <Drawer.Screen
        name="Notes"
        options={{
          drawerLabel: t('notes'),
          drawerIcon: NoteIcon,
          headerTitle: t('notes'),
        }}
        listeners={{
          focus: () => {
            setAutoFollowOnStart(false);
            console.log('DrawerNavigator: Notes screen focused, autoFollowOnStart set to false');
          },
        }}
      >
        {props => (
          <NotesScreen {...props} setAutoFollowOnStart={setAutoFollowOnStart} />
        )}
      </Drawer.Screen>
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerLabel: t('settingsTitle'),
          drawerIcon: CogIcon,
          headerTitle: t('settingsTitle'),
        }}
        listeners={{
          focus: () => {
            setAutoFollowOnStart(false);
            console.log('DrawerNavigator: Settings screen focused, autoFollowOnStart set to false');
          },
        }}
      />
    </Drawer.Navigator>
  );
};

function App(): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const dispatch = store.dispatch;

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
    // Haetaan kannasta merkinnät ja synkronoidaan Redux-storeen
    dispatch(fetchLocationsFromDB());
  }, [i18n, dispatch]);

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.safeArea}>
        <ReduxProvider store={store}>
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
                options={{ headerShown: false }}
              />
              {/* Drawer-navigaatio alkaa tästä */}
              <Stack.Screen
                name="Drawer"
                component={DrawerNavigator}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </ReduxProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  safeArea: {
    flex: 1,
  },
});

export default App;
