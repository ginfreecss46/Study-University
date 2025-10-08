import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Assignment, Profile, ClassSchedule } from "@/types/database";
import { useEffect, useState, useCallback } from "react";
import { ScrollView, StyleSheet, ActivityIndicator, View, RefreshControl, useColorScheme as useRNColorScheme, Animated, Pressable } from "react-native";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Fonts, Spacing, FontSizes } from "@/constants/theme";
import { LinearGradient } from 'expo-linear-gradient';

const quickActions = [
  { title: "Matières", icon: "book", route: "/courses" },
  { title: "Devoirs", icon: "check-square-o", route: "/assignments" },
  { title: "Entraide", icon: "users", route: "/forum" },
  { title: "Groupes", icon: "comments-o", route: "/groups" },
];

type UpcomingClass = ClassSchedule & { courses: { title: string } };

export default function HomeScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [upcomingClass, setUpcomingClass] = useState<UpcomingClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const animatedValue = useState(new Animated.Value(0))[0];
  const shimmerAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const checkNewUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const createdAt = new Date(user.created_at);
        const lastSignInAt = user.last_sign_in_at ? new Date(user.last_sign_in_at) : createdAt;
        const diff = lastSignInAt.getTime() - createdAt.getTime();
        if (diff < 5000) { // 5 seconds threshold
          setIsNewUser(true);
        }
      }
    };
    checkNewUser();
  }, []);

  const fetchData = useCallback(async () => {
    if (!session) return;
    try {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(profileData);

      const { data: userCourses, error: userCoursesError } = await supabase.from("user_courses").select("course_id").eq("user_id", session.user.id);
      if (userCoursesError) throw userCoursesError;
      if (!userCourses || userCourses.length === 0) {
        setAssignments([]);
        setUpcomingClass(null);
        return;
      }
      const courseIds = userCourses.map((uc) => uc.course_id);
      
      const today = new Date();
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(today.getDate() + 7);
      
      const { data: assignmentsData, error: assignmentsError } = await supabase.from("assignments").select("*, courses(title)").in("course_id", courseIds).gte("due_date", today.toISOString()).lte("due_date", oneWeekFromNow.toISOString()).order("due_date", { ascending: true });
      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);

      const dayOfWeek = today.getDay();
      const currentTime = today.toTimeString().split(' ')[0];
      const { data: nextClassData, error: nextClassError } = await supabase
        .from('class_schedules')
        .select('*, courses(title)')
        .in('course_id', courseIds)
        .eq('day_of_week', dayOfWeek)
        .gte('start_time', currentTime)
        .order('start_time', { ascending: true })
        .limit(1)
        .single();
      
      if (nextClassError && nextClassError.code !== 'PGRST116') {
        throw nextClassError;
      }
      setUpcomingClass(nextClassData as UpcomingClass);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) fetchData();
  }, [session, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const themeColors = Colors[colorScheme];

  const DynamicHeaderMessage = () => {
    if (isNewUser) {
      return (
        <ThemedText style={styles.headerGreeting}>
          Bienvenue dans Study Loock ! Moi, KANG JINHUYK, vous remercie pour l'installation. J'espère que l'application sera utilisée.
        </ThemedText>
      );
    }

    if (upcomingClass && upcomingClass.courses) {
      const [hours, minutes] = upcomingClass.start_time.split(':');
      const startTime = new Date();
      startTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      const now = new Date();
      const diffMinutes = (startTime.getTime() - now.getTime()) / 60000;

      if (diffMinutes > 0 && diffMinutes <= 30) {
        return (
          <ThemedText style={styles.headerGreeting}>
            <Feather name="clock" size={20} color={Colors.dark.text} style={{ marginRight: 8 }} />
            Votre cours de {upcomingClass.courses.title} commence dans {Math.round(diffMinutes)} minutes !
          </ThemedText>
        );
      }
    }

    if (assignments && assignments.length > 0) {
      const nextAssignment = assignments[0];
      const dueDate = new Date(nextAssignment.due_date);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      if (dueDate.toDateString() === today.toDateString()) {
        return (
          <ThemedText style={styles.headerGreeting}>
            <Feather name="alert-triangle" size={20} color={Colors.dark.text} style={{ marginRight: 8 }} />
            Rappel : Le devoir "{nextAssignment.title}" est à rendre aujourd'hui !
          </ThemedText>
        );
      }
      if (dueDate.toDateString() === tomorrow.toDateString()) {
        return (
          <ThemedText style={styles.headerGreeting}>
            <Feather name="alert-triangle" size={20} color={Colors.dark.text} style={{ marginRight: 8 }} />
            Rappel : Le devoir "{nextAssignment.title}" est à rendre demain.
          </ThemedText>
        );
      }
    }

    return (
      <ThemedText style={styles.headerGreeting}>
        Bonjour, {profile?.full_name || 'Étudiant'} !
        <Feather name="smile" size={24} color={Colors.dark.text} style={{ marginLeft: 8 }} />
      </ThemedText>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color={themeColors.primary} style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />}
    >
      <LinearGradient colors={[themeColors.gradientStart, themeColors.gradientEnd]} style={styles.headerBackground}>
        <Animated.View 
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(255,255,255,0.1)',
            opacity: shimmerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            })
          }} 
        />
        <Animated.View style={[
          styles.headerContent,
          { opacity: animatedValue, transform: [{ translateY: animatedValue.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }
        ]}>
          <DynamicHeaderMessage />
        </Animated.View>
      </LinearGradient>

      <View style={styles.contentArea}>
        <ThemedText style={styles.sectionTitle}>Accès Rapide</ThemedText>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <Pressable key={action.title} style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]} onPress={() => router.push(action.route as any)}>
              <FontAwesome name={action.icon as any} size={28} color={themeColors.primary} />
              <ThemedText style={styles.actionText}>{action.title}</ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.sectionTitle}>Devoirs pour la semaine</ThemedText>
        {assignments.length > 0 ? (
          assignments.map(item => (
            <View key={item.id} style={styles.assignmentCard}>
              <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
              <ThemedText style={styles.assignmentCourse}>{item.courses.title}</ThemedText>
              {item.due_date && <ThemedText style={styles.dueDate}>Pour le {new Date(item.due_date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long' })}</ThemedText>}
            </View>
          ))
        ) : (
          <ThemedText style={styles.emptyText}>Aucun devoir prévu. Profitez-en !</ThemedText>
        )}
      </View>
    </ScrollView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
  const themeColors = Colors[colorScheme];
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    headerBackground: {
      paddingTop: 60,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xl,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      marginBottom: Spacing.lg,
      overflow: 'hidden', // Important for the overlay
    },
    headerContent: {
      alignItems: 'center',
      paddingVertical: Spacing.lg,
    },
    headerGreeting: { 
      fontSize: FontSizes.title,
      fontWeight: 'bold', 
      color: Colors.dark.text, 
      fontFamily: Fonts.rounded,
      textAlign: 'center',
    },
    contentArea: { paddingHorizontal: Spacing.lg },
    sectionTitle: { fontSize: FontSizes.subtitle, fontWeight: 'bold', marginBottom: Spacing.md, color: themeColors.text },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    actionCard: {
      backgroundColor: themeColors.card,
      width: '48%',
      padding: Spacing.lg,
      borderRadius: 16,
      alignItems: 'center',
      marginBottom: Spacing.md,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    actionCardPressed: {
      transform: [{ scale: 0.98 }],
      backgroundColor: themeColors.border,
    },
    actionText: { marginTop: Spacing.sm, fontWeight: '600', fontSize: FontSizes.body, color: themeColors.text },
    assignmentCard: {
      backgroundColor: themeColors.card,
      padding: Spacing.md,
      borderRadius: 12,
      marginBottom: Spacing.sm,
      borderLeftWidth: 5,
      borderLeftColor: themeColors.primary,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    assignmentCourse: { color: themeColors.textSecondary, marginVertical: 2 },
    dueDate: { marginTop: 4, fontSize: FontSizes.caption, color: themeColors.textSecondary },
    emptyText: { textAlign: 'center', marginTop: Spacing.lg, color: themeColors.textSecondary, fontSize: FontSizes.body },
  });
}