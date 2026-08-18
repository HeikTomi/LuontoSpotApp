import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface OnlineIndicatorProps {
    gpsAvailable: boolean;
}

const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
    gpsAvailable,
}) => {
    return (
        <MaterialCommunityIcons
            name="map-marker"
            size={20}
            color={gpsAvailable ? '#4CAF50' : '#d32f2f'}
        />
    );
};

export default OnlineIndicator;
