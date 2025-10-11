import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Course, Document } from '@/types/database';
import { useFocusEffect, useRouter } from 'expo-router';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, View, useColorScheme as useRNColorScheme, Pressable, Linking, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '@/constants/theme';

type DocumentWithProfile = Document & {
  profiles: {
    full_name: string;
  } | null;
};

export default function DocumentsScreen() {
  const { session } = useAuth();
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = useMemo(() => getStyles(colorScheme), [colorScheme]);
  const themeColors = Colors[colorScheme];

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | 'all'>('all');
  const [documents, setDocuments] = useState<DocumentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('user_courses')
      .select('courses(*)')
      .eq('user_id', session.user.id);
    if (data) {
      const userCourses = data.map(item => item.courses).filter((c): c is Course => c !== null && typeof c === 'object');
      setCourses(userCourses);
    }
  }, [session]);

  const fetchDocuments = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      let query = supabase.from('documents').select('*, profiles(full_name)');
      if (selectedCourse !== 'all') {
        query = query.eq('course_id', selectedCourse);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  }, [session, selectedCourse]);

  useFocusEffect(
    useCallback(() => {
      fetchCourses();
      fetchDocuments();
    }, [fetchCourses, fetchDocuments])
  );

  const handleDownload = (url: string) => {
    Linking.openURL(url).catch(err => Alert.alert("Erreur", "Impossible d'ouvrir le fichier."));
  };

  const renderItem = ({ item }: { item: DocumentWithProfile }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.cardSubtitle}>Partagé par: {item.profiles?.full_name || 'Inconnu'}</ThemedText>
        <ThemedText style={styles.cardDate}>Le {new Date(item.created_at!).toLocaleDateString('fr-FR')}</ThemedText>
      </View>
      <Pressable style={({ pressed }) => [styles.downloadButton, pressed && styles.buttonPressed]} onPress={() => handleDownload(item.file_url)}>
        <Feather name="download" size={24} color={themeColors.primary} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.header}>Bibliothèque</ThemedText>
      
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCourse}
          onValueChange={(itemValue) => setSelectedCourse(itemValue)}
          dropdownIconColor={themeColors.text}
          style={{ color: themeColors.text }}
        >
          <Picker.Item label="Toutes les matières" value="all" />
          {courses.map(course => <Picker.Item key={course.id} label={course.title || 'Sans titre'} value={course.id} />)}
        </Picker>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 20 }}/>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: Spacing.lg }}
          ListEmptyComponent={() => (
            <ThemedText style={styles.emptyText}>Aucun document trouvé pour cette sélection.</ThemedText>
          )}
        />
      )}
    </View>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
  const themeColors = Colors[colorScheme];
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background, paddingTop: 60 },
    header: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, fontSize: FontSizes.title, fontWeight: 'bold', color: themeColors.text },
    pickerContainer: {
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 12,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
      backgroundColor: themeColors.card,
    },
    card: {
      backgroundColor: themeColors.card,
      borderRadius: 16,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    cardContent: { flex: 1, marginRight: Spacing.md },
    cardTitle: { fontSize: FontSizes.subtitle, color: themeColors.text },
    cardSubtitle: { color: themeColors.textSecondary, marginVertical: 2 },
    cardDate: { fontSize: FontSizes.caption, color: themeColors.textSecondary },
    downloadButton: { padding: Spacing.sm },
    buttonPressed: { opacity: 0.7 },
    emptyText: { textAlign: 'center', marginTop: Spacing.xl, color: themeColors.textSecondary, fontSize: FontSizes.body },
  });
}
