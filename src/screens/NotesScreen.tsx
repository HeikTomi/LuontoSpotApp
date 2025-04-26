import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PhotoNoteManager } from '../features/notes/PhotoNoteManager';

const NotesScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            {/* PhotoNoteManager-komponentti */}
            <PhotoNoteManager />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});

export default NotesScreen;
