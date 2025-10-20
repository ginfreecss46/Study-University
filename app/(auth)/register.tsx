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
import { Picker } from '@react-native-picker/picker';

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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();
  const colorScheme = useColorScheme() ?? 'light';
  const styles = useMemo(() => getStyles(colorScheme), [colorScheme]);

  async function signUpWithEmail() {
    if (!fullName || !level || !email || !password || !university || !academicYear || !pole || !filiere || !option || !phoneNumber || !gender) {
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
          option,
          phone_number: phoneNumber,
          gender,
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
            <TextInput placeholder="Numéro de téléphone" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" style={styles.input} placeholderTextColor={styles.input.placeholderTextColor} />
            
            <View style={styles.pickerContainer}>
              <Picker selectedValue={gender} onValueChange={(itemValue) => setGender(itemValue)} style={styles.picker} dropdownIconColor={styles.picker.color}>
                <Picker.Item label="Sexe" value="" />
                <Picker.Item label="Homme" value="homme" />
                <Picker.Item label="Femme" value="femme" />
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Picker selectedValue={university} onValueChange={(itemValue) => setUniversity(itemValue)} style={styles.picker} dropdownIconColor={styles.picker.color}>
                <Picker.Item label="Université" value="" />
                <Picker.Item label="Université d'Abomey-Calavi" value="UAC" />
                <Picker.Item label="Université de Parakou" value="UP" />
              </Picker>
            </View>

            <TextInput placeholder="Année Académique (ex: 2024-2025)" value={academicYear} onChangeText={setAcademicYear} style={styles.input} placeholderTextColor={styles.input.placeholderTextColor} />

            <View style={styles.pickerContainer}>
              <Picker selectedValue={pole} onValueChange={(itemValue) => setPole(itemValue)} style={styles.picker} dropdownIconColor={styles.picker.color}>
                <Picker.Item label="Pôle" value="" />
                <Picker.Item label="Polytechnique" value="polytechnique" />
                <Picker.Item label="Sciences de la Santé" value="fss" />
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Picker selectedValue={filiere} onValueChange={(itemValue) => setFiliere(itemValue)} style={styles.picker} dropdownIconColor={styles.picker.color}>
                <Picker.Item label="Filière" value="" />
                <Picker.Item label="Génie Informatique" value="gi" />
                <Picker.Item label="Médecine" value="medecine" />
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Picker selectedValue={option} onValueChange={(itemValue) => setOption(itemValue)} style={styles.picker} dropdownIconColor={styles.picker.color}>
                <Picker.Item label="Option" value="" />
                <Picker.Item label="Génie Logiciel" value="gl" />
                <Picker.Item label="Réseaux et Télécommunications" value="rt" />
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Picker selectedValue={level} onValueChange={(itemValue) => setLevel(itemValue)} style={styles.picker} dropdownIconColor={styles.picker.color}>
                <Picker.Item label="Niveau" value="" />
                <Picker.Item label="Licence 1" value="L1" />
                <Picker.Item label="Licence 2" value="L2" />
                <Picker.Item label="Licence 3" value="L3" />
              </Picker>
            </View>
            
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
    pickerContainer: {
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 12,
      marginBottom: Spacing.md,
      height: 52,
      justifyContent: 'center',
    },
    picker: {
      height: 52,
      color: themeColors.text,
    },
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