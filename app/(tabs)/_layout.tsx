import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { useStore } from '../../store/useStore';
import { Colors } from '../../constants/theme';

interface TabIconProps {
  name: string;
  focused: boolean;
  accentColor: string;
}

function TabIcon({ name, focused, accentColor }: TabIconProps) {
  const icons: Record<string, string> = {
    home: '⬡',
    mate: '👁',
    create: '✦',
    dm: '◈',
    profile: '◉',
  };

  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.icon, focused && { color: accentColor }]}>
        {icons[name] ?? '●'}
      </Text>
      {focused && <View style={[styles.dot, { backgroundColor: accentColor }]} />}
    </View>
  );
}

export default function TabsLayout() {
  const user = useStore((s) => s.user);
  const accentColor = user.gender === 'female' ? Colors.female : Colors.male;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} accentColor={accentColor} />
          ),
        }}
      />
      <Tabs.Screen
        name="mate"
        options={{
          title: 'Mate',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="mate" focused={focused} accentColor={accentColor} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="create" focused={focused} accentColor={accentColor} />
          ),
        }}
      />
      <Tabs.Screen
        name="dm"
        options={{
          title: 'DM',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="dm" focused={focused} accentColor={accentColor} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="profile" focused={focused} accentColor={accentColor} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0A0A0A',
    borderTopColor: '#1E1E1E',
    borderTopWidth: 0.5,
    height: 72,
    paddingBottom: 10,
    paddingTop: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 28,
  },
  icon: {
    fontSize: 20,
    color: '#5A5A5A',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
