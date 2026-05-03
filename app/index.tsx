import { Redirect } from 'expo-router';
import { useStore } from '../store/useStore';

export default function Index() {
  const isLoggedIn = useStore(s => s.isLoggedIn);
  return <Redirect href={isLoggedIn ? '/(tabs)' : '/welcome'} />;
}
