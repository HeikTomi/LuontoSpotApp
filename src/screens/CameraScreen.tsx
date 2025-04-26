import React from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { CameraComponent } from '../features/camera/Camera';

type CameraRouteProp = RouteProp<RootStackParamList, 'Camera'>;

export const CameraScreen: React.FC = () => {
  const route = useRoute<CameraRouteProp>();
  const { id, onPhotoTaken } = route.params;
  console.log(id); // Tämä on vain esimerkki, voit käyttää id:tä haluamallasi tavalla

  const handlePhotoTaken = (photoUrl: string) => {
    if (onPhotoTaken) {
      onPhotoTaken(photoUrl);
    }
  };

  return <CameraComponent onTakePhoto={handlePhotoTaken} />;
};
