import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ClassSchedule } from '@/types/database';
import { useFocusEffect, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, Alert, View, useColorScheme as useRNColorScheme, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '@/constants/theme';

const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function ManageSchedulesScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const themeColors = Colors[colorScheme];

  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    if (!session) return;
    try {
      setLoading(true);
      const { data: userCourses, error: userCoursesError } = await supabase.from('user_courses').select('course_id').eq('user_id', session.user.id);
      if (userCoursesError) throw userCoursesError;
      const courseIds = userCourses.map(uc => uc.course_id);

      if (courseIds.length === 0) {
        setSchedules([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from('class_schedules').select('*, courses(title)').in('course_id', courseIds).order('day_of_week').order('start_time');
      if (error) throw error;
      setSchedules(data || []);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { fetchSchedules(); }, [fetchSchedules]));

  const handleDelete = async (scheduleId: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cet horaire ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('class_schedules').delete().eq('id', scheduleId);
            if (error) {
              Alert.alert('Erreur', error.message);
            } else {
              fetchSchedules();
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ClassSchedule }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{item.courses.title}</ThemedText>
        <ThemedText style={styles.cardSubtitle}>{daysOfWeek[item.day_of_week]} de {item.start_time.slice(0, 5)} à {item.end_time.slice(0, 5)}</ThemedText>
        {item.location && <ThemedText style={styles.locationText}>Lieu: {item.location}</ThemedText>}
      </View>
      <Pressable onPress={() => handleDelete(item.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}>
        <Feather name="trash-2" size={20} color={themeColors.destructive} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.header}>Gérer les Horaires</ThemedText>
      {loading ? (
        <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 20 }}/>
      ) : (
        <FlatList
          data={schedules}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={() => (
            <ThemedText style={styles.emptyText}>Aucun horaire de cours récurrent défini.</ThemedText>
          )}
        />
      )}
      <Pressable style={({ pressed }) => [styles.fab, pressed && styles.buttonPressed]} onPress={() => router.push('/add-schedule')}>
        <Feather name="plus" size={30} color={Colors.dark.text} />
      </Pressable>
      <Pressable style={({ pressed }) => [styles.fab, {bottom: 110}, pressed && styles.buttonPressed]} onPress={() => router.push('/add-schedule-visual')}>
        <Feather name="calendar" size={30} color={Colors.dark.text} />
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
    cardSubtitle: { fontSize: FontSizes.body, color: themeColors.textSecondary, marginTop: Spacing.xs },
    locationText: { fontSize: FontSizes.caption, color: themeColors.textSecondary, marginTop: Spacing.xs },
    deleteButton: { padding: Spacing.sm },
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
