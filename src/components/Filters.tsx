import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface FiltersProps {
  filters?: Record<'mushroom' | 'berry' | 'star', boolean>;
  onChange?: (filters: { mushroom: boolean; berry: boolean; star: boolean }) => void;
}

const Filters: React.FC<FiltersProps> = ({ onChange, filters }) => {
  const toggleFilter = async (key: 'mushroom' | 'berry' | 'star') => {
    if (!filters) { return; }
    const newFilters = { ...filters, [key]: !filters[key] };
    await AsyncStorage.setItem(`filter_${key}`, newFilters[key] ? 'true' : 'false');
    console.log(`Filter ${key}:`, newFilters[key] ? 'ON' : 'OFF');
    if (onChange) { onChange(newFilters); }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, filters && !filters.mushroom && styles.inactive]}
        onPress={() => toggleFilter('mushroom')}
      >
        <MaterialCommunityIcons name="mushroom" size={20} color={filters && filters.mushroom ? '#8D4F2A' : '#bbb'} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, filters && !filters.berry && styles.inactive]}
        onPress={() => toggleFilter('berry')}
      >
        <MaterialCommunityIcons name="fruit-grapes" size={20} color={filters && filters.berry ? '#6A1B9A' : '#bbb'} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, filters && !filters.star && styles.inactive]}
        onPress={() => toggleFilter('star')}
      >
        <MaterialCommunityIcons name="star" size={20} color={filters && filters.star ? '#FFD700' : '#bbb'} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    elevation: 4,
    alignSelf: 'center',
  },
  button: {
    marginHorizontal: 4,
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  inactive: {
    opacity: 0.5,
  },
});

export default Filters;
