import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Assignment, ClassSchedule } from '@/types/database';
import { useFocusEffect, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Pressable, useColorScheme as useRNColorScheme } from 'react-native';
import { Agenda, LocaleConfig } from 'react-native-calendars';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import Animated, { Layout } from 'react-native-reanimated';

LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  monthNamesShort: ['Janv.','Févr.','Mars','Avril','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
  dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  dayNamesShort: ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

const toDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export default function TimetableScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const themeColors = Colors[colorScheme];

  const [items, setItems] = useState<{[key: string]: any[]}>({});
  const [loading, setLoading] = useState(true);

  const loadCalendarData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data: userCourses, error: userCoursesError } = await supabase.from('user_courses').select('course_id').eq('user_id', session.user.id);
      if (userCoursesError) throw userCoursesError;
      const courseIds = userCourses.map(uc => uc.course_id);
      if (courseIds.length === 0) {
        setItems({});
        setLoading(false);
        return;
      }
      const { data: assignments, error: assignmentsError } = await supabase.from('assignments').select('*, courses(title)').in('course_id', courseIds);
      const { data: schedules, error: schedulesError } = await supabase.from('class_schedules').select('*, courses(title)').in('course_id', courseIds);
      if (assignmentsError || schedulesError) throw assignmentsError || schedulesError;

      const newItems: {[key: string]: any[]} = {};
      assignments?.forEach((assignment: Assignment) => {
        if (assignment.due_date) {
          const dateStr = toDateString(new Date(assignment.due_date));
          if (!newItems[dateStr]) newItems[dateStr] = [];
          newItems[dateStr].push({ name: `Devoir: ${assignment.title}`, time: `Pour le ${new Date(assignment.due_date).toLocaleDateString('fr-FR')}`, location: assignment.courses.title, type: 'assignment' });
        }
      });
      const today = new Date();
      const twoMonthsLater = new Date(today);
      twoMonthsLater.setMonth(today.getMonth() + 2);
      for (let d = new Date(today); d <= twoMonthsLater; d.setDate(d.getDate() + 1)) {
        const dateStr = toDateString(d);
        if (!newItems[dateStr]) newItems[dateStr] = [];
        const dayOfWeek = d.getDay();
        schedules?.forEach((schedule: ClassSchedule) => {
          if (schedule.day_of_week === dayOfWeek) {
            newItems[dateStr].push({ name: schedule.courses.title, time: `${schedule.start_time.slice(0, 5)} - ${schedule.end_time.slice(0, 5)}`, location: schedule.location, type: 'class' });
          }
        });
      }
      setItems(newItems);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { loadCalendarData(); }, [loadCalendarData]));

  const renderItem = (item: any) => (
    <Pressable style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
      <ThemedText style={styles.itemText}>{item.name}</ThemedText>
      <ThemedText style={styles.itemTime}>{item.time}</ThemedText>
      {item.location && <ThemedText style={styles.itemLocation}>{item.location}</ThemedText>}
    </Pressable>
  );

  const renderEmptyData = () => (
    <Animated.View style={styles.emptyDataContainer} layout={Layout.springify().damping(20).stiffness(100)}>
      <Feather name="calendar" size={40} color={themeColors.textSecondary} />
      <ThemedText style={styles.emptyDataTitle}>Pas de cours cette semaine 🎉</ThemedText>
      <ThemedText style={styles.emptyDataSubtitle}>Vos journées sont libres pour le moment. Profitez-en !</ThemedText>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <ThemedText type="title" style={styles.headerTitle}>Emploi du temps</ThemedText>
        <Pressable onPress={() => router.push('/manage-schedules')} style={({ pressed }) => [styles.manageButton, pressed && styles.buttonPressed]}>
          <Feather name="settings" size={20} color={themeColors.primary} />
          <ThemedText style={styles.manageButtonText}>Gérer</ThemedText>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 20 }}/>
      ) : (
        <Agenda
          items={items}
          renderItem={renderItem}
          renderEmptyData={renderEmptyData}
          showClosingKnob={true}
          pastScrollRange={2}
          futureScrollRange={2}
          theme={{
            backgroundColor: themeColors.background,
            calendarBackground: themeColors.background,
            dayTextColor: themeColors.text,
            textSectionTitleColor: themeColors.textSecondary,
            selectedDayBackgroundColor: themeColors.primary,
            selectedDayTextColor: Colors.dark.text,
            todayTextColor: themeColors.primary,
            dotColor: themeColors.primary,
            selectedDotColor: Colors.dark.text,
            arrowColor: themeColors.primary,
            monthTextColor: themeColors.text,
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13,
            agendaDayTextColor: themeColors.text,
            agendaDayNumColor: themeColors.text,
            agendaTodayColor: themeColors.primary,
            agendaKnobColor: themeColors.primary,
          }}
        />
      )}
    </View>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
  const themeColors = Colors[colorScheme];
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: 60,
      paddingBottom: Spacing.md,
      backgroundColor: themeColors.background,
    },
    headerTitle: {
      fontSize: FontSizes.title,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    manageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.sm,
      borderRadius: 12,
      backgroundColor: themeColors.card,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    manageButtonText: {
      marginLeft: Spacing.sm,
      color: themeColors.primary,
      fontWeight: 'bold',
    },
    buttonPressed: { opacity: 0.7 },
    item: {
      backgroundColor: themeColors.card,
      flex: 1,
      borderRadius: 16,
      padding: Spacing.md,
      marginRight: Spacing.md,
      marginTop: 17,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    itemPressed: { transform: [{ scale: 0.99 }], backgroundColor: themeColors.border },
    itemText: { fontWeight: 'bold', marginBottom: Spacing.xs, color: themeColors.text },
    itemTime: { fontSize: FontSizes.caption, color: themeColors.textSecondary },
    itemLocation: { fontSize: FontSizes.caption, color: themeColors.textSecondary, marginTop: Spacing.xs },
    emptyDataContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    emptyDataTitle: {
      fontSize: FontSizes.subtitle,
      fontWeight: 'bold',
      color: themeColors.text,
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
    },
    emptyDataSubtitle: {
      fontSize: FontSizes.body,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
  });
}