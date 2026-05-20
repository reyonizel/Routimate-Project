import { Tabs } from 'expo-router';
import { StyleSheet, View, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons, SimpleLineIcons } from '@expo/vector-icons';
import Octicons from '@expo/vector-icons/Octicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom ?? 0;
  const avatarUri = useStore(s => s.user.avatarUri);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        animation: 'shift',
        tabBarStyle: {
          backgroundColor: '#FCF7F0',
          borderTopWidth: 0,
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarActiveTintColor: '#0A3B25',
        tabBarInactiveTintColor: '#B2B7AA',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Octicons name="home" size={24} color={focused ? '#0A3B25' : '#B2B7AA'} />
          ),
        }}
      />
      <Tabs.Screen
        name="mate"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={focused ? '#0A3B25' : '#B2B7AA'} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="store"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={24} color={focused ? '#0A3B25' : '#B2B7AA'} />
          ),
        }}
      />
      <Tabs.Screen
        name="dm"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={24} color={focused ? '#0A3B25' : '#B2B7AA'} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            avatarUri ? (
              <Image 
                source={{ uri: avatarUri }} 
                style={{ 
                  width: 26, 
                  height: 26, 
                  borderRadius: 13, 
                  borderWidth: focused ? 2 : 0, 
                  borderColor: '#0A3B25',
                  opacity: focused ? 1 : 0.8 
                }} 
              />
            ) : (
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={28} color={focused ? '#0A3B25' : '#B2B7AA'} />
            )
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});

