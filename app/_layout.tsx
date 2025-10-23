import { DarkTheme, DefaultTheme, ThemeProvider, useTheme } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

const AppLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.primary,
  },
};

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.primary,
  },
};

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const isAtRoot = segments.length === 0;
    if (session && isAtRoot) {
      router.replace('/(tabs)');
    } else if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
    SplashScreen.hideAsync();
  }, [session, loading, segments, router]);

  if (loading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Modifier le profil' }} />
      <Stack.Screen name="add-event" options={{ title: 'Ajouter un événement' }} />
      <Stack.Screen name="add-assignment" options={{ title: 'Ajouter un devoir' }} />
      <Stack.Screen name="add-course" options={{ title: 'Ajouter une matière' }} />
      <Stack.Screen name="add-grade" options={{ title: 'Ajouter une note' }} />
      <Stack.Screen name="add-post" options={{ title: 'Nouveau Post' }} />
      <Stack.Screen name="add-schedule" options={{ title: 'Ajouter un cours' }} />
      <Stack.Screen name="assignments" options={{ title: 'Devoirs' }} />
      <Stack.Screen name="courses" options={{ title: 'Matières' }} />
      <Stack.Screen name="edit-assignment/[id]" options={{ title: 'Modifier le devoir' }} />
      <Stack.Screen name="edit-course/[id]" options={{ title: 'Modifier la matière' }} />
      <Stack.Screen name="edit-post/[id]" options={{ title: 'Modifier le post' }} />
      <Stack.Screen name="forum" options={{ title: 'Forum' }} />
      <Stack.Screen name="grades" options={{ title: 'Notes' }} />
      <Stack.Screen name="groups" options={{ title: 'Groupes' }} />
      <Stack.Screen name="manage-schedules" options={{ title: "Gérer l'emploi du temps" }} />
      <Stack.Screen name="upload-document" options={{ title: 'Téléverser un document' }} />
      <Stack.Screen name="documents" options={{ title: 'Bibliothèque' }} />
      <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
              <Stack.Screen name="post/[id]" options={{ title: 'Post' }} />
        <Stack.Screen name="profile/[id]" options={{ title: 'Profil' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ToastProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? AppDarkTheme : AppLightTheme}>
          <RootLayoutNav />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}