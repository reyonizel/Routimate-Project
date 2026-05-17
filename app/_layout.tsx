import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

// Hold the splash until we finish initializing
SplashScreen.preventAutoHideAsync().catch(() => {});

SystemUI.setBackgroundColorAsync('#FFFFFF');

export default function RootLayout() {
  const router = useRouter();
  const loadUserData   = useStore(s => s.loadUserData);
  const setLoggedIn    = useStore(s => s.setLoggedIn);
  const setInitialized = useStore(s => s.setInitialized);
  const updateUser     = useStore(s => s.updateUser);

  // Prevent the auth-state listener from running loadUserData a second time
  // during the initial SIGNED_IN event that fires right after getSession()
  const didInit = useRef(false);

  const finish = async (result?: 'ok' | 'unverified' | 'onboarding' | 'no_user' | 'error') => {
    setInitialized();
    await SplashScreen.hideAsync().catch(() => {});
    if (result === 'onboarding') router.replace('/onboarding');
    if (result === 'unverified') router.replace('/auth');
  };

  useEffect(() => {
    // Initial session — reads from AsyncStorage, works offline
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      didInit.current = true;
      if (!session) {
        setLoggedIn(false);
        finish();
        return;
      }
      if (!session.user.email_confirmed_at) {
        setLoggedIn(false);
        finish('unverified');
        return;
      }
      // Set user.id immediately from session so Supabase inserts work
      // even before loadUserData fully completes
      const currentId = useStore.getState().user.id;
      if (!currentId) updateUser({ id: session.user.id });
      const result = await loadUserData();
      finish(result);
    }).catch(() => {
      didInit.current = true;
      setLoggedIn(false);
      finish();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!didInit.current) return; // Skip the echo of the initial session

      if (event === 'SIGNED_OUT') {
        setLoggedIn(false);
        router.replace('/welcome');
      } else if (event === 'SIGNED_IN' && session) {
        const result = await loadUserData();
        if (result === 'onboarding') router.replace('/onboarding');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        loadUserData().catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: '#FFFFFF' } }}>
        <Stack.Screen name="index"       options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)"      options={{ animation: 'fade' }} />
        <Stack.Screen name="modal"       options={{ presentation: 'modal' }} />
        <Stack.Screen name="pro-upgrade" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="product-detail" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="mate-profile" />
        <Stack.Screen name="debug" options={{ href: null } as any} />
        <Stack.Screen name="welcome"     options={{ animation: 'fade' }} />
        <Stack.Screen name="auth"        options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="onboarding"  options={{ animation: 'slide_from_right', gestureEnabled: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#FFFFFF' } });
