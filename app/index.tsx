import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useStore } from '../store/useStore';

export default function Index() {
  const isLoggedIn     = useStore(s => s.isLoggedIn);
  const isInitializing = useStore(s => s.isInitializing);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FCF7F0', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2A6151" />
      </View>
    );
  }

  return <Redirect href={isLoggedIn ? '/(tabs)' : '/welcome'} />;
}

