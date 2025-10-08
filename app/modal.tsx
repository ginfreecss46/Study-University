import { Link } from 'expo-router';
import { StyleSheet, useColorScheme as useRNColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

export default function ModalScreen() {
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={{ color: Colors[colorScheme].text }}>This is a modal</ThemedText>
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link" style={{ color: Colors[colorScheme].tint }}>Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors[colorScheme].background,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
