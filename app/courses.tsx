import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Course } from '@/types/database';
import { useFocusEffect, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, View, useColorScheme as useRNColorScheme, Pressable, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '@/constants/theme';

export default function CoursesScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const themeColors = Colors[colorScheme];

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserCourses = useCallback(async () => {
    if (!session) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from('user_courses').select('courses(*)').eq('user_id', session.user.id);
      if (error) throw error;
      if (data) {
        const userCourses = data.map(item => item.courses).filter((c): c is Course => c !== null && typeof c === 'object');
        setCourses(userCourses);
      }
    } catch (error) {
      console.error('Error fetching user courses:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { fetchUserCourses(); }, [fetchUserCourses]));

  const handleDelete = async (courseId: string) => {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer cette matière ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('courses').delete().eq('id', courseId);
              if (error) throw error;
              setCourses(courses.filter(c => c.id !== courseId));
              Alert.alert("Succès", "La matière a été supprimée.");
            } catch (error: any) {
              Alert.alert("Erreur", error.message);
            }
          },
        },
      ]
    );
  };

  const renderCourse = ({ item }: { item: Course }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{item.title}</ThemedText>
        {item.description && <ThemedText style={styles.cardDescription}>{item.description}</ThemedText>}
      </View>
      <View style={styles.buttonsContainer}>
        <Pressable style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]} onPress={() => router.push(`/edit-course/${item.id}`)}>
          <Feather name="edit-2" size={20} color={themeColors.primary} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]} onPress={() => handleDelete(item.id)}>
          <Feather name="trash-2" size={20} color={themeColors.error} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.header}>Mes Matières</ThemedText>
      {loading ? (
        <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 20 }}/>
      ) : (
        <FlatList
          data={courses}
          renderItem={renderCourse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }} // To make space for FAB
          ListEmptyComponent={() => (
            <ThemedText style={styles.emptyText}>Appuyez sur le bouton + pour ajouter votre première matière.</ThemedText>
          )}
        />
      )}
      <Pressable style={({ pressed }) => [styles.fab, pressed && styles.buttonPressed]} onPress={() => router.push('/add-course')}>
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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: FontSizes.subtitle, color: themeColors.text },
    cardDescription: { color: themeColors.textSecondary, marginTop: Spacing.xs },
    buttonsContainer: {
      flexDirection: 'row',
    },
    editButton: { padding: Spacing.sm },
    deleteButton: {
      padding: Spacing.sm,
      marginLeft: Spacing.sm,
    },
    buttonPressed: { opacity: 0.7 },
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
  });
}