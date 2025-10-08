import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { TextInput, StyleSheet, Alert, ActivityIndicator, ScrollView, View, useColorScheme as useRNColorScheme } from 'react-native';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

export default function EditCourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const themeColors = Colors[colorScheme];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setTitle(data.title || '');
          setDescription(data.description || '');
        }
      } catch (error: any) {
        Alert.alert('Erreur', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleUpdate = async () => {
    if (!id) return;
    if (!title) {
      Alert.alert('Erreur', 'Le titre est obligatoire.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('courses')
        .update({ title, description })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Succès', 'La matière a été mise à jour.');
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
      <ThemedText type="title" style={styles.title}>Modifier la matière</ThemedText>
      <View style={styles.card}>
        <ThemedText style={styles.label}>Titre de la matière</ThemedText>
        <TextInput
          placeholder="Titre de la matière"
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
        <Button title={loading ? 'Enregistrement...' : 'Enregistrer les modifications'} onPress={handleUpdate} disabled={loading} />
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