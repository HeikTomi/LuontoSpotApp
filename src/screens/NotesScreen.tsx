import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { PhotoNoteManager } from '../features/notes/PhotoNoteManager';
import CustomDrawer from '../components/CustomDrawer';

const NotesScreen: React.FC<{ setAutoFollowOnStart?: (val: boolean) => void }> = ({ setAutoFollowOnStart }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}> 
            <View style={styles.drawerIconWrapper}>
                <CustomDrawer />
            </View>
            {/* PhotoNoteManager-komponentti */}
            <PhotoNoteManager setAutoFollowOnStart={setAutoFollowOnStart} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bgDark: {
        backgroundColor: '#181818',
    },
    bgLight: {
        backgroundColor: '#fff',
    },
    drawerIconWrapper: {
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 100,
        backgroundColor: 'transparent',
    },
});

export default NotesScreen;
