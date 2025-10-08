import { useState } from 'react';
import { View, TextInput, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts, Spacing, FontSizes } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Erreur de connexion', error.message);
      showToast('Erreur de connexion', 'error');
    } else {
      showToast('Connexion réussie !', 'success');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
      <ThemedView style={styles.container}>
        <View style={{flex: 1, justifyContent: 'center'}}>
          <View style={styles.logoContainer}>
            <Feather name="book-open" size={60} color={Colors.light.primary} />
          </View>

          <ThemedText type="title" style={styles.header}>Study Loock</ThemedText>
          <ThemedText style={styles.subtitle}>Ravi de vous revoir !</ThemedText>

          <View style={styles.card}>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              placeholderTextColor={Colors.light.textSecondary}
            />
            <TextInput
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor={Colors.light.textSecondary}
            />
            <Button title={loading ? 'Connexion...' : 'Se connecter'} onPress={signInWithEmail} disabled={loading} />
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <ThemedText style={styles.dividerText}>Ou</ThemedText>
            <View style={styles.divider} />
          </View>

          <Button title="Créer un compte" onPress={() => router.push('/register')} variant="secondary" />
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>Créé par KANG JINHUYK</ThemedText>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  container: { flex: 1, padding: Spacing.lg, backgroundColor: Colors.light.background },
  logoContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  header: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: Spacing.sm, color: Colors.light.primary, fontFamily: Fonts.rounded },
  subtitle: { textAlign: 'center', marginBottom: Spacing.xl, fontSize: FontSizes.body, color: Colors.light.textSecondary },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  input: { height: 50, backgroundColor: Colors.light.background, borderWidth: 1, borderColor: Colors.light.border, borderRadius: 12, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, fontSize: FontSizes.body },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  divider: { flex: 1, height: 1, backgroundColor: Colors.light.border },
  dividerText: { marginHorizontal: Spacing.md, color: Colors.light.textSecondary },
  footer: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSizes.caption,
    color: Colors.light.textSecondary,
  },
});