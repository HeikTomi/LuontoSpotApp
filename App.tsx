/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/store/store';
// import { StyleSheet} from 'react-native';
import { createStackNavigator, StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
/*
import { CitiesScreen } from './src/screens/CitiesScreen/CitiesScreen';
import { LocationsScreen } from './src/screens/LocationsScreen/LocationsScreen';
import { AddCityScreen } from './src/screens/AddCityScreen/AddCityScreen';
import { InfoScreen } from './src/screens/InfoScreen/InfoScreen';
*/

import { CameraScreen } from './src/features/camera/Camera';
import { PhotoNoteManager } from './src/features/notes/PhotoNoteManager';


// Navigation routes parameters
type RootStackParamList = {
  Camera: { id: number; onPhotoTaken: (photoUrl: string) => void };
  PhotoNoteManager: undefined;
  // Add other screens here
};

const Stack = createStackNavigator<RootStackParamList>();

// Define screen component props
export type CameraScreenRouteProp = StackScreenProps<RootStackParamList, 'Camera'>;
export type PhotoNoteManagerRouteProp = StackScreenProps<RootStackParamList, 'PhotoNoteManager'>;

// Define screen navigation props
export type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;
export type PhotoNoteManagerNavigationProp = StackNavigationProp<RootStackParamList, 'PhotoNoteManager'>;

function App(): React.JSX.Element {

  const {t} = useTranslation();
  return (
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="PhotoNoteManager">
            <Stack.Screen name="PhotoNoteManager" component={PhotoNoteManager} options={{title:t('appName')}} />
            <Stack.Screen name="Camera" component={CameraScreen} options={{title:t('camera')}} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ReduxProvider>
  );
}

/*const styles = StyleSheet.create({
});*/

export default App;
