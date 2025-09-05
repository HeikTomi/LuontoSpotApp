import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, PhotoFile, useCameraDevice } from 'react-native-vision-camera';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { CameraScreenRouteProp, RootStackParamList } from '../../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { updatePhoto, fetchItems } from '../notes/sqliteSlice';

type CameraScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Camera'>;

type CameraScreenProps = {
  navigation: CameraScreenNavigationProp;
  route: CameraScreenRouteProp;
};

type CameraProps = {
  onTakePhoto: (photoUrl: string) => void;
};

export const CameraComponent: React.FC<CameraProps & { navigation: any }> = ({ onTakePhoto, navigation }) => {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo: PhotoFile = await cameraRef.current.takePhoto({});
      const photoUrl = `file://${photo.path}`;
      console.log(photoUrl);

      // Kutsu callbackia
      onTakePhoto(photoUrl);
    }
  };

  if (!device) {
    return null; // Voit näyttää latausindikaattorin tässä
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <FontAwesome name="arrow-left" size={28} color="#fff" />
      </TouchableOpacity>
      <Camera
        ref={cameraRef}
        style={styles.preview}
        device={device}
        isActive={true}
        photo={true}
      />
      <View style={styles.captureContainer}>
        <TouchableOpacity onPress={takePicture} style={styles.capture}>
          <FontAwesome name="camera" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const CameraScreen: React.FC<CameraScreenProps> = ({ navigation, route }) => {
  const { id } = route.params;

  // Check if the camera is available and request permissions
  console.log(id);

  useEffect(() => {
    const requestCameraPermission = async () => {
      await Camera.requestCameraPermission();
      await Camera.requestMicrophonePermission();
    };
    requestCameraPermission().catch((error) => console.warn(error.message));
  }, []);

  // Käytetään AppDispatch-tyyppiä, jotta thunkit toimivat oikein
  // @ts-ignore
  const dispatch: any = useDispatch();
  const handleTakePhoto = async (photoUrl: string) => {
    // Tallennetaan kuva kantaan oikeaan noteen ja päivitetään store
    console.log("Kuva otettu:", photoUrl);
    await dispatch(updatePhoto({ id, photoUrl }));
    await dispatch(fetchItems());
    navigation.goBack();
  };

  return <CameraComponent onTakePhoto={handleTakePhoto} navigation={navigation} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  captureContainer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 0,
    margin: 0,
  },
  capture: {
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 15,
    alignSelf: 'center',
    margin: 0,
    elevation: 4,
  },
  backButton: {
    position: 'absolute',
    top: 32,
    left: 18,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 6,
  },
});
