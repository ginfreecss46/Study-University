import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator, View, useColorScheme as useRNColorScheme, Pressable, LayoutAnimation, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '@/constants/theme';

type GradeWithDetails = {
  id: string;
  grade: number | null;
  assignments: {
    title: string;
    courses: {
      title: string;
    } | null;
  } | null;
};

type CourseGradeSummary = {
  courseTitle: string;
  average: number;
  grades: { id: string; assignmentTitle: string; grade: number | null }[];
};

export default function GradesScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const themeColors = Colors[colorScheme];

  const [rawGrades, setRawGrades] = useState<GradeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const fetchGrades = useCallback(async () => {
    if (!session) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('grades')
        .select('id, grade, assignments(*, courses(title))')
        .eq('user_id', session.user.id);

      if (error) throw error;
      setRawGrades(data || []);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { fetchGrades(); }, [fetchGrades]));

  const processedData = useMemo(() => {
    if (rawGrades.length === 0) {
      return { overallAverage: 0, courses: [] };
    }

    const gradesByCourse: { [key: string]: { grades: { id: string; assignmentTitle: string; grade: number | null }[], total: number, count: number } } = {};
    let totalOverall = 0;
    let countOverall = 0;

    rawGrades.forEach(g => {
      const courseTitle = g.assignments?.courses?.title || 'Matière non définie';
      if (!gradesByCourse[courseTitle]) {
        gradesByCourse[courseTitle] = { grades: [], total: 0, count: 0 };
      }
      if (g.grade !== null) {
        gradesByCourse[courseTitle].grades.push({ id: g.id, assignmentTitle: g.assignments?.title || 'N/A', grade: g.grade });
        gradesByCourse[courseTitle].total += g.grade;
        gradesByCourse[courseTitle].count++;
        totalOverall += g.grade;
        countOverall++;
      }
    });

    const courses: CourseGradeSummary[] = Object.entries(gradesByCourse).map(([courseTitle, data]) => ({
      courseTitle,
      average: data.count > 0 ? data.total / data.count : 0,
      grades: data.grades,
    }));

    return {
      overallAverage: countOverall > 0 ? totalOverall / countOverall : 0,
      courses,
    };
  }, [rawGrades]);

  const toggleExpand = (courseTitle: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCourse(expandedCourse === courseTitle ? null : courseTitle);
  };

  if (loading) {
    return <ActivityIndicator size="large" color={themeColors.primary} style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.header}>Mes Notes</ThemedText>
      
      <View style={styles.overallCard}>
        <ThemedText style={styles.overallTitle}>Moyenne Générale</ThemedText>
        <ThemedText style={styles.overallGrade}>{processedData.overallAverage.toFixed(2)}</ThemedText>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {processedData.courses.length > 0 ? processedData.courses.map(course => (
          <View key={course.courseTitle} style={styles.card}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => toggleExpand(course.courseTitle)}>
              <View style={styles.cardHeader}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{course.courseTitle}</ThemedText>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <ThemedText style={styles.gradeText}>{course.average.toFixed(2)}</ThemedText>
                  <Feather name={expandedCourse === course.courseTitle ? 'chevron-up' : 'chevron-down'} size={24} color={themeColors.text} style={{marginLeft: Spacing.md}}/>
                </View>
              </View>
            </TouchableOpacity>
            {expandedCourse === course.courseTitle && (
              <View style={styles.detailsContainer}>
                {course.grades.map(grade => (
                  <View key={grade.id} style={styles.detailRow}>
                    <ThemedText style={styles.detailText}>{grade.assignmentTitle}</ThemedText>
                    <ThemedText style={styles.detailGrade}>{grade.grade}</ThemedText>
                  </View>
                ))}
              </View>
            )}
          </View>
        )) : (
          <ThemedText style={styles.emptyText}>Appuyez sur le bouton + pour ajouter une note.</ThemedText>
        )}
      </ScrollView>

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
    overallCard: {
      backgroundColor: themeColors.primary,
      borderRadius: 16,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
      alignItems: 'center',
    },
    overallTitle: { fontSize: FontSizes.subtitle, color: 'white', fontWeight: 'bold' },
    overallGrade: { fontSize: 42, color: 'white', fontWeight: 'bold', marginTop: Spacing.sm },
    card: {
      backgroundColor: themeColors.card,
      borderRadius: 16,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: themeColors.border,
      overflow: 'hidden',
    },
    cardHeader: {
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitle: { fontSize: FontSizes.subtitle, color: themeColors.text, flex: 1 },
    gradeText: { fontSize: 22, fontWeight: 'bold', color: themeColors.primary },
    emptyText: { textAlign: 'center', marginTop: Spacing.xl, color: themeColors.textSecondary, fontSize: FontSizes.body },
    detailsContainer: {
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      padding: Spacing.lg,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    detailText: { fontSize: FontSizes.body, color: themeColors.textSecondary },
    detailGrade: { fontSize: FontSizes.body, fontWeight: 'bold', color: themeColors.text },
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