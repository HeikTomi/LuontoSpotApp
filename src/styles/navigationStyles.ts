import { StyleSheet } from 'react-native';

export const NAV_HEADER_HEIGHT = 36;

export const navigationStyles = StyleSheet.create({
  headerDark: {
    backgroundColor: '#181818',
    borderBottomWidth: 0,
    elevation: 2,
    height: NAV_HEADER_HEIGHT,
    minHeight: 32,
  },
  headerLight: {
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    elevation: 2,
    height: NAV_HEADER_HEIGHT,
    minHeight: 32,
  },
  headerTitleDark: {
    fontSize: 16,
    color: '#fafafa',
    fontWeight: 'bold',
    paddingVertical: 0,
  },
  headerTitleLight: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
    paddingVertical: 0,
  },
  drawerButton: {
    marginLeft: 12,
    padding: 2,
  },
});
