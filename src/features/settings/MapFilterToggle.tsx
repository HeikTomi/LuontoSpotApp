import React, { useEffect, useState } from 'react';
import { View, Switch, StyleSheet, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const MAP_FILTER_KEY = 'showMapFilters';

const MapFilterToggle: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showMapFilters, setShowMapFilters] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(MAP_FILTER_KEY).then((val) => {
      if (val !== null) {
        setShowMapFilters(val === 'true');
      }
    });
  }, []);

  const handleToggle = async (value: boolean) => {
    setShowMapFilters(value);
    await AsyncStorage.setItem(MAP_FILTER_KEY, value ? 'true' : 'false');
  };

  return (
    <View style={styles.iconSwitchRow}>
      <View style={[styles.iconCircle, isDark ? styles.iconCircleDark : styles.iconCircleLight]}>
        <MaterialCommunityIcons name="filter-variant" size={24} color={isDark ? '#4CAF50' : '#388E3C'} />
      </View>
      <Switch
        value={showMapFilters}
        onValueChange={handleToggle}
        trackColor={{ false: isDark ? '#555' : '#bbb', true: '#4CAF50' }}
        thumbColor={showMapFilters ? '#4CAF50' : (isDark ? '#222' : '#ccc')}
        style={styles.switch}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 2,
    letterSpacing: 0.2,
  },
  cardTitleDark: {
    color: '#fff',
  },
  cardTitleLight: {
    color: '#222',
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#222',
  },
  cardLight: {
    backgroundColor: '#f7f7f7',
  },
  iconSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 8,
  },
  iconWrap: {
    marginRight: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDark: {
    backgroundColor: '#333',
  },
  iconCircleLight: {
    backgroundColor: '#e0e0e0',
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  labelDark: {
    color: '#fff',
  },
  labelLight: {
    color: '#222',
  },
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
});

export default MapFilterToggle;
