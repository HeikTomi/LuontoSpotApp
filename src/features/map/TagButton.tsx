import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface TagButtonProps {
    iconName: string;
    onPress: () => void;
}

const TagButton: React.FC<TagButtonProps> = ({ iconName, onPress }) => {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Icon name={iconName} size={30} color="#fff" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 50, // Pyöreä painike
        marginHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default TagButton;
