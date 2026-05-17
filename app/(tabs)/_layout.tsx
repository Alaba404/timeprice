import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '../../src/store/profileStore';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { colors } from '../../src/theme';

type TabIconProps = { focused: boolean; icon: string };

function TabIcon({ focused, icon }: TabIconProps) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.35 }]}>
        {icon}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const profiles = useProfileStore((s) => s.profiles);
  const hydrated  = useProfileStore((s) => s.hydrated);
  const insets = useSafeAreaInsets();

  const tabBarHeight = 52 + insets.bottom;

  useEffect(() => {
    if (hydrated && profiles.length === 0) {
      router.replace('/onboarding');
    }
  }, [hydrated, profiles.length, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="⏱" />,
          tabBarAccessibilityLabel: 'Convertisseur',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="📋" />,
          tabBarAccessibilityLabel: 'Historique',
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="📊" />,
          tabBarAccessibilityLabel: 'Tableau de bord',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="⚙️" />,
          tabBarAccessibilityLabel: 'Réglages',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 24,
  },
});
