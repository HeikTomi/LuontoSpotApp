import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface TagButtonProps {
    iconName: string;
    onPress: () => void;
    backgroundColor?: string;
    iconColor?: string;
    buttonSize?: number;
}

const TagButton: React.FC<TagButtonProps> = ({ iconName, onPress, backgroundColor = '#4CAF50', iconColor = '#ffffffff', buttonSize = 60 }) => {
    return (
        <TouchableOpacity style={[styles.button, { backgroundColor, width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]} onPress={onPress}>
            <Icon name={iconName} size={Math.round(buttonSize * 0.5)} color={iconColor} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#4CAF50',
        marginHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
});

export default TagButton;
