import { ThemedText } from '@/components/themed-text';
import { View, StyleSheet, useColorScheme as useRNColorScheme, Alert, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ClassSchedule } from '@/types/database';

const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7am to 10pm

export default function AddScheduleVisualScreen() {
  const router = useRouter();
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const themeColors = Colors[colorScheme];
  const { session } = useAuth();

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

      const { data, error } = await supabase.from('class_schedules').select('*, courses(title)').in('course_id', courseIds);
      if (error) throw error;
      setSchedules(data || []);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleCellPress = (day: number, hour: number) => {
    const today = new Date();
    const dayIndex = today.getDay();
    const diff = day - dayIndex;
    const eventDate = new Date(today.setDate(today.getDate() + diff));
    eventDate.setHours(hour, 0, 0, 0);
    router.push({ pathname: '/add-schedule', params: { date: eventDate.toISOString() } });
  };

  const renderSchedule = (schedule: ClassSchedule) => {
    const [startHour, startMinute] = schedule.start_time.split(':').map(Number);
    const [endHour, endMinute] = schedule.end_time.split(':').map(Number);
    const top = (startHour - 7 + startMinute / 60) * 60;
    const height = (endHour - startHour + (endMinute - startMinute) / 60) * 60;

    return (
      <View key={schedule.id} style={[styles.event, { top, height, left: `${(100 / 7) * schedule.day_of_week}%`, width: `${100 / 7}%` }]}>
        <ThemedText style={styles.eventText}>{schedule.courses.title}</ThemedText>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color={themeColors.primary} style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.header}>Emploi du temps</ThemedText>
      <ScrollView>
        <View style={styles.gridContainer}>
          <View style={styles.timeColumn}>
            {hours.map(hour => <ThemedText key={hour} style={styles.timeLabel}>{`${hour}:00`}</ThemedText>)}
          </View>
          <View style={styles.daysContainer}>
            {daysOfWeek.map((day, dayIndex) => (
              <View key={dayIndex} style={styles.dayColumn}>
                <ThemedText style={styles.dayHeader}>{day}</ThemedText>
                {hours.map(hour => (
                  <Pressable key={hour} style={styles.cell} onPress={() => handleCellPress(dayIndex, hour)} />
                ))}
                {schedules.filter(s => s.day_of_week === dayIndex).map(renderSchedule)}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
  const themeColors = Colors[colorScheme];
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background, paddingTop: 60 },
    header: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg, fontSize: FontSizes.title, fontWeight: 'bold', color: themeColors.text },
    gridContainer: { flexDirection: 'row', flex: 1 },
    timeColumn: { paddingTop: 30, alignItems: 'center' },
    timeLabel: { height: 60, fontSize: FontSizes.caption, color: themeColors.textSecondary },
    daysContainer: { flexDirection: 'row', flex: 1 },
    dayColumn: { flex: 1, borderLeftWidth: 1, borderLeftColor: themeColors.border },
    dayHeader: { textAlign: 'center', height: 30, color: themeColors.text, fontWeight: 'bold' },
    cell: { height: 60, borderTopWidth: 1, borderTopColor: themeColors.border },
    event: { position: 'absolute', backgroundColor: themeColors.primary, padding: Spacing.xs, borderRadius: 4, opacity: 0.8 },
    eventText: { color: Colors.dark.text, fontSize: FontSizes.caption },
  });
}