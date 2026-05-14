import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useStore } from '../store/useStore';

export default function Index() {
  const isLoggedIn     = useStore(s => s.isLoggedIn);
  const isInitializing = useStore(s => s.isInitializing);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#00bf63" />
      </View>
    );
  }

  return <Redirect href={isLoggedIn ? '/(tabs)' : '/welcome'} />;
}
