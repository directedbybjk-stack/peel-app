import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { SymbolView } from 'expo-symbols';

import Colors, { brand } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: brand.primary,
        tabBarInactiveTintColor: '#B0B8B0',
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
          borderTopColor: 'rgba(0,0,0,0.04)',
          borderTopWidth: 0.5,
          height: 90,
          paddingBottom: 30,
          paddingTop: 8,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: -4 },
            },
            android: {
              elevation: 8,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.1,
        },
        headerStyle: {
          backgroundColor: Colors[colorScheme].background,
        },
        headerTintColor: Colors[colorScheme].text,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'house.fill', android: 'home', web: 'home' }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.scanButton, focused && styles.scanButtonFocused]}>
              <SymbolView
                name={{ ios: 'barcode.viewfinder', android: 'camera', web: 'camera' }}
                tintColor="#FFFFFF"
                size={28}
              />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'clock.fill', android: 'history', web: 'history' }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} tintColor={color} size={24} />
          ),
        }}
      />
      {/* Hide the old two.tsx tab */}
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanButton: {
    backgroundColor: brand.primary,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  scanButtonFocused: {
    backgroundColor: brand.primaryDark,
    transform: [{ scale: 1.06 }],
    shadowOpacity: 0.45,
  },
});
