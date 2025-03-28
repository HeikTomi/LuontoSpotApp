import React, { useRef, useEffect } from 'react';
import { CameraScreenRouteProp} from '../../../App';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Camera, PhotoFile, useCameraDevice } from 'react-native-vision-camera';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

export const CameraScreen: React.FC<CameraScreenRouteProp> = ({ navigation, route }) => {
    const cameraRef = useRef<Camera>(null);
    const device = useCameraDevice('back');
    const { onPhotoTaken } = route.params;

    useEffect(() => {
        const requestCameraPermission = async () => {
            await Camera.requestCameraPermission();
            await Camera.requestMicrophonePermission();
        };
        requestCameraPermission().catch((error) => console.warn(error.message));
    }, []);

    const takePicture = async () => {
        if (cameraRef.current) {
            const photo: PhotoFile = await cameraRef.current.takePhoto({});
            const photoUrl = `file://${photo.path}`;
            console.log(photoUrl);

            // Call the callback with the captured photo URL
            onPhotoTaken(photoUrl);

            // Navigate back to the previous screen
            navigation.goBack();
        }
    };

    if (device == null) {
        return <Text>Loading...</Text>;
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
        borderRadius: 50, // Muutetaan pyöreäksi
        padding: 15,
        alignSelf: 'center',
        margin: 20,
    },
    captureText: {
        fontSize: 14,
    },
});
