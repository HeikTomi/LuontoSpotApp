import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { PhotoNoteManager } from '../features/notes/PhotoNoteManager';

const NotesScreen: React.FC<{ setAutoFollowOnStart?: (val: boolean) => void }> = ({ setAutoFollowOnStart }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#181818' : '#fff' }]}> 
            {/* PhotoNoteManager-komponentti */}
            <PhotoNoteManager setAutoFollowOnStart={setAutoFollowOnStart} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default NotesScreen;
