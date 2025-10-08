import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { FlatList, StyleSheet, ActivityIndicator, View, Pressable, useColorScheme } from "react-native";
import { Colors, Spacing, FontSizes } from "@/constants/theme";
import { Feather } from '@expo/vector-icons';

type Group = {
  id: string;
  name: string;
  description: string;
  group_type: string;
};

const getGroupIcon = (groupType: string) => {
  switch (groupType) {
    case 'level':
      return 'users';
    case 'major':
      return 'book';
    case 'option':
      return 'tag';
    default:
      return 'message-circle';
  }
};

export default function GroupsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const themeColors = Colors[colorScheme];

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!session) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('group_members')
        .select('chat_groups(id, name, description, group_type)')
        .eq('user_id', session.user.id);

      if (error) throw error;

      const userGroups = data.map(item => item.chat_groups).filter(Boolean) as Group[];
      setGroups(userGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  const renderItem = ({ item }: { item: Group }) => (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={() => router.push(`/chat/${item.id}`)}>
      <View style={styles.cardIcon}>
        <Feather name={getGroupIcon(item.group_type) as any} size={24} color={themeColors.primary} />
      </View>
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{item.name}</ThemedText>
        <ThemedText style={styles.cardDescription}>{item.description || 'Appuyez pour voir les messages'}</ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={themeColors.icon} />
    </Pressable>
  );

  if (loading) {
    return <ActivityIndicator size="large" color={themeColors.primary} style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.header}>Mes Groupes</ThemedText>
      <FlatList
        data={groups}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={() => (
          <ThemedText style={styles.emptyText}>Vous n'êtes dans aucun groupe pour le moment.</ThemedText>
        )}
      />
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
      padding: Spacing.md,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    cardPressed: { transform: [{ scale: 0.99 }], backgroundColor: themeColors.border },
    cardIcon: { marginRight: Spacing.md },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: FontSizes.body, fontWeight: 'bold', color: themeColors.text },
    cardDescription: { fontSize: FontSizes.caption, color: themeColors.textSecondary, marginTop: 4 },
    emptyText: { textAlign: 'center', marginTop: Spacing.xl, color: themeColors.textSecondary, fontSize: FontSizes.body },
  });
};