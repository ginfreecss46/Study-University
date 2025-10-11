import { useState, useMemo } from 'react';
import { View, TextInput, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Spacing, FontSizes } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { useToast } from '@/context/ToastContext';
import * as Linking from 'expo-linking';
import { Button } from '@/components/ui/Button';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [level, setLevel] = useState('');
  const [university, setUniversity] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [pole, setPole] = useState('');
  const [filiere, setFiliere] = useState('');
  const [option, setOption] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();
  const colorScheme = useColorScheme() ?? 'light';
  const styles = useMemo(() => getStyles(colorScheme), [colorScheme]);

  async function signUpWithEmail() {
    if (!fullName || !level || !email || !password || !university || !academicYear || !pole || !filiere || !option) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs.');
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: fullName, 
          level, 
          university,
          academic_year: academicYear,
          pole,
          filiere,
          option
        },
        emailRedirectTo: Linking.createURL('/login'),
      },
    });
    if (error) {
      Alert.alert("Erreur lors de l'inscription", error.message);
      showToast("Erreur lors de l'inscription", 'error');
    } else if (!data.session) {
      Alert.alert('Inscription réussie', 'Veuillez vérifier votre boîte de réception pour valider votre email.');
      showToast('Vérifiez votre email pour valider votre compte', 'info');
      router.push('/login');
    } else {
      showToast('Inscription réussie !', 'success');
    }
    setLoading(false);
  }


  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={{flex: 1, justifyContent: 'center'}}>
          <View style={styles.logoContainer}>
            <Feather name="user-plus" size={50} color={styles.header.color} />
          </View>

          <ThemedText type="title" style={styles.header}>Créer un compte</ThemedText>

          <View style={styles.card}>
            <TextInput placeholder="Nom complet" value={fullName} onChangeText={setFullName} style={styles.input} placeholderTextColor={styles.input.placeholderTextColor} />
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} placeholderTextColor={styles.input.placeholderTextColor} />
            <TextInput placeholder="Mot de passe (6+ caractères)" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} placeholderTextColor={styles.input.placeholderTextColor} />
            <TextInput placeholder="Université" value={university} onChangeText={setUniversity} style={styles.input} placeholderTextColor={styles.input.placeholderTextColor} />
            <TextInput placeholder="Année Académique (ex: 2024-2025)" value={academicYear} onChangeText={setAcademicYear} style={styles.input} placeholderTextColor={styles.input.placeholderTextColor} />
            <TextInput placeholder="Pôle (ex: Polytechnique)" value={pole} onChangeText={setPole} style={styles.input} placeholderTextColor={styles.input.placeholderTextColor} />
            <TextInput placeholder="Filière (ex: Génie Informatique)" value={filiere} onChangeText={setFiliere} style={styles.input} placeholderTextColor={styles.input.placeholderTextColor} />
            <TextInput placeholder="Option (ex: Génie Logiciel)" value={option} onChangeText={setOption} style={styles.input} placeholderTextColor={styles.input.placeholderTextColor} />
            <TextInput placeholder="Niveau (ex: L3)" value={level} onChangeText={setLevel} style={styles.input} placeholderTextColor={styles.input.placeholderTextColor} />
            
            <Button title={loading ? 'Création...' : "S'inscrire"} onPress={signUpWithEmail} disabled={loading} />
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <ThemedText style={styles.dividerText}>Ou</ThemedText>
            <View style={styles.divider} />
          </View>

          <Button title="J'ai déjà un compte" onPress={() => router.push('/login')} variant="secondary" />
        </View>
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>Créé par KANG JINHUYK</ThemedText>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
  const themeColors = Colors[colorScheme];
  return StyleSheet.create({
    keyboardView: { flex: 1, backgroundColor: themeColors.background },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg, paddingVertical: Spacing.xl },
    logoContainer: { alignItems: 'center', marginBottom: Spacing.lg },
    header: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: Spacing.lg, color: themeColors.primary, fontFamily: Fonts.rounded },
    card: { backgroundColor: themeColors.card, borderRadius: 16, padding: Spacing.lg, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 5 },
    input: { height: 52, backgroundColor: themeColors.background, borderWidth: 1, borderColor: themeColors.border, borderRadius: 12, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, fontSize: FontSizes.body, color: themeColors.text, placeholderTextColor: themeColors.textSecondary },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
    divider: { flex: 1, height: 1, backgroundColor: themeColors.border },
    dividerText: { marginHorizontal: Spacing.md, color: themeColors.textSecondary },
    footer: {
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    footerText: {
      fontSize: FontSizes.caption,
      color: themeColors.textSecondary,
    },
  });
};

