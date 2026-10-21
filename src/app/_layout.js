
import { Tabs } from 'expo-router';
import { Provider } from 'react-redux';
import { Text } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { store } from '../store/store';

const COLORS = {
  background: '#0d1b2a',
  surface: '#1b2d45',
  border: '#1e3a5f',
  gold: '#c9a84c',
  muted: '#7a8fa6',
};

function AppTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        sceneStyle: {
          backgroundColor: COLORS.background,
        },

        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 64 + Math.max(insets.bottom, 20),
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 20),
        },

        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.muted,

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Prayer Times',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>
              🕌
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="qibla"
        options={{
          title: 'Qibla',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>
              🧭
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <AppTabs />
      </Provider>
    </SafeAreaProvider>
  );
}
