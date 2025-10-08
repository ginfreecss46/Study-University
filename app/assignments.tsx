import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Assignment } from '@/types/database';
import { useFocusEffect, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, View, useColorScheme as useRNColorScheme, Pressable, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { Colors, Spacing, FontSizes } from '@/constants/theme';

export default function AssignmentsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const themeColors = Colors[colorScheme];

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    if (!session) return;
    try {
      setLoading(true);
      const { data: userCourses, error: userCoursesError } = await supabase.from('user_courses').select('course_id').eq('user_id', session.user.id);
      if (userCoursesError) throw userCoursesError;
      if (!userCourses || userCourses.length === 0) {
        setAssignments([]);
        return;
      }
      const courseIds = userCourses.map((uc) => uc.course_id);
      const { data: assignmentsData, error: assignmentsError } = await supabase.from('assignments').select('*, courses(title)').in('course_id', courseIds).order('due_date', { ascending: true });
      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { fetchAssignments(); }, [fetchAssignments]));

  const handleDeleteAssignment = async (assignmentId: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce devoir ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('assignments').delete().eq('id', assignmentId);
              if (error) throw error;

              await Notifications.cancelScheduledNotificationAsync(assignmentId);
              Alert.alert('Succès', 'Devoir supprimé et notification annulée.');
              fetchAssignments();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Assignment }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.cardSubtitle}>{item.courses.title}</ThemedText>
                {item.due_date && <ThemedText style={styles.dueDate}>Pour le {new Date(item.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</ThemedText>}
      </View>
      <View style={styles.cardActions}>
        <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]} onPress={() => router.push(`/edit-assignment/${item.id}`)}>
          <Feather name="edit-2" size={20} color={themeColors.primary} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]} onPress={() => handleDeleteAssignment(item.id)}>
          <Feather name="trash-2" size={20} color={themeColors.destructive} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.header}>Mes Devoirs</ThemedText>
      {loading ? (
        <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 20 }}/>
      ) : (
        <FlatList
          data={assignments}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={() => (
            <ThemedText style={styles.emptyText}>Appuyez sur le bouton + pour ajouter un devoir.</ThemedText>
          )}
        />
      )}
      <Pressable style={({ pressed }) => [styles.fab, pressed && styles.buttonPressed]} onPress={() => router.push('/add-assignment')}>
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
    cardSubtitle: { color: themeColors.textSecondary, marginVertical: Spacing.xs },
    dueDate: { fontSize: FontSizes.caption, color: themeColors.textSecondary, fontWeight: 'bold', marginTop: Spacing.sm },
    cardActions: { flexDirection: 'row', gap: Spacing.sm },
    actionButton: { padding: Spacing.sm },
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