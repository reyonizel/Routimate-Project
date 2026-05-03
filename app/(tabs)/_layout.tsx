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
            <Octicons name="home" size={24} color={focused ? '#111' : '#ABABAB'} />
          ),
        }}
      />
      <Tabs.Screen
        name="mate"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={26} color={focused ? '#111' : '#ABABAB'} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: '#E60023',
              width: 44,
              height: 32,
              borderRadius: 10,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: focused ? 0.8 : 1
            }}>
              <Ionicons
                name="add"
                size={26}
                color="#FFFFFF"
                style={{ fontWeight: 'bold' }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="dm"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={24} color={focused ? '#111' : '#ABABAB'} />
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
                  borderColor: '#111',
                  opacity: focused ? 1 : 0.8 
                }} 
              />
            ) : (
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={28} color={focused ? '#111' : '#ABABAB'} />
            )
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
