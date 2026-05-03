import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        animation: 'shift',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#E8E8E8',
          height: 52 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: '#ABABAB',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={25} color={focused ? '#111' : '#ABABAB'} />
          ),
        }}
      />
      <Tabs.Screen
        name="mate"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'eye' : 'eye-outline'} size={25} color={focused ? '#111' : '#ABABAB'} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              size={32}
              color={focused ? '#E60023' : '#ABABAB'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dm"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={24} color={focused ? '#111' : '#ABABAB'} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={26} color={focused ? '#111' : '#ABABAB'} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
