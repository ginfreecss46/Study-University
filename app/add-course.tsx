import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { TextInput, StyleSheet, Alert, ScrollView, View, useColorScheme as useRNColorScheme } from 'react-native';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

export default function AddCourseScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const themeColors = Colors[colorScheme];
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!session) {
      Alert.alert('Erreur', 'Vous devez être connecté pour ajouter une matière.');
      return;
    }
    if (!title) {
      Alert.alert('Erreur', 'Le titre de la matière est obligatoire.');
      return;
    }

    try {
      setLoading(true);

      // 1. Insert into courses table
      const { data: newCourse, error: courseError } = await supabase
        .from('courses')
        .insert({ title, description, owner_id: session.user.id })
        .select()
        .single();

      if (courseError) throw courseError;
      if (!newCourse) throw new Error('La création de la matière a échoué.');

      // 2. Insert into user_courses table
      const { error: userCourseError } = await supabase
        .from('user_courses')
        .insert({ user_id: session.user.id, course_id: newCourse.id });

      if (userCourseError) throw userCourseError;

      Alert.alert('Succès', 'La matière a été ajoutée.');
      router.back();

    } catch (error: any) {
      console.error('Error adding course:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Ajouter une matière</ThemedText>
      <View style={styles.card}>
        <ThemedText style={styles.label}>Titre de la matière</ThemedText>
        <TextInput
          placeholder="Titre de la matière (ex: Mathématiques)"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholderTextColor={themeColors.textSecondary}
        />
        <ThemedText style={styles.label}>Description (optionnel)</ThemedText>
        <TextInput
          placeholder="Description (optionnel)"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          multiline
          placeholderTextColor={themeColors.textSecondary}
        />
        <Button title={loading ? 'Enregistrement...' : 'Enregistrer'} onPress={handleSave} disabled={loading} />
        <View style={{ marginTop: Spacing.sm }}>
          <Button title="Annuler" onPress={() => router.back()} variant="secondary" />
        </View>
      </View>
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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 5,
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
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
  });
}