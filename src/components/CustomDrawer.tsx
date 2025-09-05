import React from 'react';
import { TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const CustomDrawer: React.FC = () => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const openDrawer = () => {
    // @ts-ignore
    navigation.openDrawer();
  };

  return (
    <TouchableOpacity
      style={[
        styles.burgerButton,
        isDark ? styles.burgerButtonDark : styles.burgerButtonLight,
      ]}
      onPress={openDrawer}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name="menu"
        size={32}
        color={isDark ? '#fafafa' : '#222'}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  burgerButton: {
    padding: 8,
    marginLeft: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  burgerButtonDark: {
    backgroundColor: 'rgba(30,30,30,0.7)',
  },
  burgerButtonLight: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});

export default CustomDrawer;
