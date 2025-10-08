import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, View, useColorScheme as useRNColorScheme, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '@/constants/theme';

type GradeWithDetails = {
  grade: number | null;
  assignments: {
    title: string;
    courses: {
      title: string;
    } | null;
  } | null;
};

export default function GradesScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const themeColors = Colors[colorScheme];

  const [grades, setGrades] = useState<GradeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGrades = useCallback(async () => {
    if (!session) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('grades')
        .select('grade, assignments(*, courses(title))')
        .eq('user_id', session.user.id);

      if (error) throw error;
      setGrades(data || []);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      fetchGrades();
    }, [fetchGrades])
  );

  const renderItem = ({ item }: { item: GradeWithDetails }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
          {item.assignments?.title || 'Devoir non défini'}
        </ThemedText>
        <ThemedText style={styles.cardSubtitle}>
          Matière: {item.assignments?.courses?.title || 'Matière non définie'}
        </ThemedText>
      </View>
      <ThemedText style={styles.gradeText}>{item.grade ?? 'N/A'}</ThemedText>
    </View>
  );

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.header}>Mes Notes</ThemedText>
      {loading ? (
        <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 20 }}/>
      ) : (
        <FlatList
          data={grades}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.assignments?.title}-${index}`}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={() => (
            <ThemedText style={styles.emptyText}>Appuyez sur le bouton + pour ajouter une note.</ThemedText>
          )}
        />
      )}
      <Pressable style={({ pressed }) => [styles.fab, pressed && styles.buttonPressed]} onPress={() => router.push('/add-grade')}>
        <Feather name="plus" size={30} color={Colors.dark.text} />
      </Pressable>
    </View>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
  const themeColors = Colors[colorScheme];
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background, paddingTop: 60 },
    header: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg, fontSize: FontSizes.title, fontWeight: 'bold', color: themeColors.text },
    card: {
      backgroundColor: themeColors.card,
      borderRadius: 16,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: FontSizes.subtitle, color: themeColors.text },
    cardSubtitle: { color: themeColors.textSecondary, marginVertical: Spacing.xs },
    gradeText: { fontSize: 24, fontWeight: 'bold', color: themeColors.primary },
    emptyText: { textAlign: 'center', marginTop: Spacing.xl, color: themeColors.textSecondary, fontSize: FontSizes.body },
    fab: {
      position: 'absolute',
      right: 30,
      bottom: 40,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 8,
    },
    buttonPressed: { opacity: 0.7 },
  });
}
