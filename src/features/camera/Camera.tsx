import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, PhotoFile, useCameraDevice } from 'react-native-vision-camera';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { CameraScreenRouteProp, RootStackParamList } from '../../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type CameraScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Camera'>;

type CameraScreenProps = {
  navigation: CameraScreenNavigationProp;
  route: CameraScreenRouteProp;
};

type CameraProps = {
  onTakePhoto: (photoUrl: string) => void;
};

export const CameraComponent: React.FC<CameraProps> = ({ onTakePhoto }) => {
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
  const { id, onPhotoTaken } = route.params;

  // Check if the camera is available and request permissions
  console.log(id);

  useEffect(() => {
    const requestCameraPermission = async () => {
      await Camera.requestCameraPermission();
      await Camera.requestMicrophonePermission();
    };
    requestCameraPermission().catch((error) => console.warn(error.message));
  }, []);

  const handleTakePhoto = (photoUrl: string) => {
    // Call the callback with the captured photo URL
    onPhotoTaken(photoUrl);

    // Navigate back to the previous screen
    navigation.goBack();
  };

  return <CameraComponent onTakePhoto={handleTakePhoto} />;
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
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 20,
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 15,
    alignSelf: 'center',
    margin: 20,
  },
});
