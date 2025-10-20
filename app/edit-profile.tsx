import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { TextInput, StyleSheet, Alert, ActivityIndicator, ScrollView, View, useColorScheme as useRNColorScheme, Image, Pressable } from 'react-native';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import * as DocumentPicker from 'expo-document-picker';

export default function EditProfileScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const themeColors = Colors[colorScheme];

  const [fullName, setFullName] = useState('');
  const [level, setLevel] = useState('');
  const [university, setUniversity] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [pole, setPole] = useState('');
  const [filiere, setFiliere] = useState('');
  const [option, setOption] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        if (data) {
          setFullName(data.full_name || '');
          setLevel(data.level || '');
          setUniversity(data.university || '');
          setAcademicYear(data.academic_year || '');
          setPole(data.pole || '');
          setFiliere(data.filiere || '');
          setOption(data.option || '');
          setAvatarUrl(data.avatar_url || null);

          if (data.profile_last_updated_at) {
            const lastUpdate = new Date(data.profile_last_updated_at);
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            if (new Date().getTime() - lastUpdate.getTime() > oneWeek) {
              setCanEdit(true);
            } else {
              setCanEdit(false);
            }
          } else {
            setCanEdit(true);
          }
        }
      } catch (error: any) {
        Alert.alert('Erreur', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [session]);

  const handlePickAvatar = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewAvatar(result.assets[0]);
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    if (!session) return;

    try {
      setLoading(true);
      let newAvatarUrl = avatarUrl;

      if (newAvatar) {
        const file = newAvatar;
        const response = await fetch(file.uri);
        const arrayBuffer = await response.arrayBuffer();
        const fileName = `${session.user.id}_${Date.now()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, arrayBuffer, {
            upsert: true,
            contentType: file.mimeType,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        newAvatarUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName, 
          level, 
          university, 
          academic_year: academicYear, 
          pole,
          filiere,
          option,
          avatar_url: newAvatarUrl,
          profile_last_updated_at: new Date().toISOString() 
        })
        .eq('id', session.user.id);

      if (error) throw error;

      Alert.alert('Succès', 'Votre profil a été mis à jour.');
      router.back();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={themeColors.primary} style={{ flex: 1 }} />;
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Modifier le profil</ThemedText>
      {canEdit ? (
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUrl || undefined }} style={styles.avatar} />
            <Pressable style={styles.avatarEditButton} onPress={handlePickAvatar}>
              <ThemedText style={{color: 'white'}}>Changer</ThemedText>
            </Pressable>
          </View>

          <ThemedText style={styles.label}>Nom complet</ThemedText>
          <TextInput value={fullName} onChangeText={setFullName} style={styles.input} placeholderTextColor={themeColors.textSecondary} />

          <ThemedText style={styles.label}>Université</ThemedText>
          <TextInput value={university} onChangeText={setUniversity} style={styles.input} placeholderTextColor={themeColors.textSecondary} />

          <ThemedText style={styles.label}>Année académique</ThemedText>
          <TextInput value={academicYear} onChangeText={setAcademicYear} style={styles.input} placeholderTextColor={themeColors.textSecondary} />

          <ThemedText style={styles.label}>Pôle</ThemedText>
          <TextInput value={pole} onChangeText={handlePoleChange} style={styles.input} placeholderTextColor={themeColors.textSecondary} />

          <ThemedText style={styles.label}>Filière</ThemedText>
          <TextInput value={filiere} onChangeText={setFiliere} style={styles.input} placeholderTextColor={themeColors.textSecondary} editable={!isFiliereDisabled} />
          {isFiliereDisabled && (
            <ThemedText style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
              aller choisis votre option la fonction filière est bloqué
            </ThemedText>
          )}

          <ThemedText style={styles.label}>Option</ThemedText>
          <TextInput value={option} onChangeText={setOption} style={styles.input} placeholderTextColor={themeColors.textSecondary} />

          <ThemedText style={styles.label}>Niveau</ThemedText>
          <TextInput value={level} onChangeText={setLevel} style={styles.input} placeholderTextColor={themeColors.textSecondary} />

          <Button title={loading ? 'Enregistrement...' : 'Enregistrer'} onPress={handleUpdate} disabled={loading} />
          <View style={{ marginTop: Spacing.sm }}>
            <Button title="Annuler" onPress={() => router.back()} variant="secondary" />
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <ThemedText style={styles.cantEditMessage}>Vous ne pouvez modifier votre profil qu&apos;une fois par semaine.</ThemedText>
        </View>
      )}
    </ScrollView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
  const themeColors = Colors[colorScheme];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      paddingTop: 50,
    },
    title: {
      marginBottom: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      color: themeColors.text,
      fontSize: FontSizes.title,
      fontWeight: 'bold',
    },
    card: {
      backgroundColor: themeColors.card,
      borderRadius: 16,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    label: {
      fontSize: FontSizes.body,
      color: themeColors.text,
      marginBottom: Spacing.sm,
      fontWeight: 'bold',
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.border,
      padding: Spacing.md,
      borderRadius: 12,
      marginBottom: Spacing.md,
      backgroundColor: themeColors.background,
      color: themeColors.text,
      fontSize: FontSizes.body,
    },
    cantEditMessage: {
      textAlign: 'center',
      fontSize: FontSizes.body,
      color: themeColors.textSecondary,
      padding: Spacing.lg,
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: themeColors.border,
    },
    avatarEditButton: {
      position: 'absolute',
      bottom: 0,
      right: 100,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: 12,
    },
  });
}
