import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, View, TextInput, useColorScheme as useRNColorScheme, Pressable, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '@/constants/theme';

type PostWithAuthor = {
  id: string;
  created_at: string;
  title: string;
  user_id: string;
  profiles: { full_name: string } | null;
  post_reactions: { user_id: string }[];
  likes_count: number;
};

export default function ForumScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const themeColors = Colors[colorScheme];

  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  // Fetch user role for admin delete privileges
  useEffect(() => {
    if (session) {
      const fetchUserProfile = async () => {
        const { data, error } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (error) console.error('Error fetching user profile:', error);
        else setUserProfile(data);
      };
      fetchUserProfile();
    }
  }, [session]);

  const fetchPosts = useCallback(async (query: string) => {
    try {
      setLoading(true);
      let queryBuilder = supabase.from('forum_posts').select('id, created_at, title, user_id, profiles(full_name), post_reactions(user_id)');
      if (query) {
        queryBuilder = queryBuilder.ilike('title', `%${query}%`);
      }
      const { data, error } = await queryBuilder.order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithLikes = data.map(post => ({
        ...post,
        likes_count: post.post_reactions?.length || 0,
      }));

      setPosts(postsWithLikes);
    } catch (error: any) {
      Alert.alert('Erreur', "Impossible de charger les messages du forum.");
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPosts(searchQuery);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, fetchPosts]);

  // Real-time subscription
  useFocusEffect(
    useCallback(() => {
      const subscription = supabase
        .channel('forum-posts-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' }, () => {
          // Refetch without search query to get the latest list
          fetchPosts('');
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions' }, () => {
          // Refetch without search query to get the latest list
          fetchPosts('');
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }, [fetchPosts])
  );

  const handleLike = async (postId: string) => {
    if (!session) return Alert.alert('Erreur', 'Vous devez être connecté pour aimer un message.');

    // Optimistic UI update
    setPosts(currentPosts => currentPosts.map(p => {
      if (p.id === postId) {
        const userHasLiked = p.post_reactions.some(r => r.user_id === session.user.id);
        if (userHasLiked) {
          return {
            ...p,
            likes_count: p.likes_count - 1,
            post_reactions: p.post_reactions.filter(r => r.user_id !== session.user.id)
          };
        } else {
          return {
            ...p,
            likes_count: p.likes_count + 1,
            post_reactions: [...p.post_reactions, { user_id: session.user.id }]
          };
        }
      }
      return p;
    }));

    try {
      const { data: existingLike, error: fetchError } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', session.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (existingLike) {
        await supabase.from('post_reactions').delete().eq('id', existingLike.id);
      } else {
        await supabase.from('post_reactions').insert({ post_id: postId, user_id: session.user.id, reaction_type: 'like' });
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
      // Revert optimistic update on error
      fetchPosts(searchQuery);
    }
  };

  const handleDelete = async (postId: string) => {
    const performDelete = async () => {
      const { error } = await supabase.from('forum_posts').delete().eq('id', postId);
      if (error) Alert.alert('Erreur', error.message);
      // UI will update automatically via the real-time subscription
    };

    Alert.alert(
      'Supprimer le message',
      'Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: performDelete },
      ]
    );
  };

  const renderItem = ({ item }: { item: PostWithAuthor }) => (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={() => { console.log('Navigating to post with ID:', item.id); router.push(`/post/${item.id}`); }}>
      <View style={styles.cardIcon}>
        <Feather name="message-square" size={24} color={themeColors.primary} />
      </View>
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.cardMeta}>
          par {item.profiles?.full_name || 'Anonyme'} le {new Date(item.created_at).toLocaleDateString('fr-FR')}
        </ThemedText>
        <View style={styles.cardActions}>
          <Pressable onPress={() => handleLike(item.id)} style={({ pressed }) => [styles.likeButton, pressed && styles.buttonPressed]}>
            <Feather name="heart" size={20} color={item.post_reactions?.some(r => r.user_id === session?.user.id) ? themeColors.primary : themeColors.textSecondary} />
            <ThemedText style={styles.likeCount}>{item.likes_count || 0}</ThemedText>
          </Pressable>
          {(session?.user.id === item.user_id || userProfile?.role === 'admin') && (
            <Pressable onPress={(e) => { e.stopPropagation(); handleDelete(item.id); }} style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}>
              <Feather name="trash-2" size={20} color={themeColors.danger} />
            </Pressable>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={themeColors.icon} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.header}>Forum d'entraide</ThemedText>
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={themeColors.icon} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un message..."
          placeholderTextColor={themeColors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 20 }}/>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={() => (
            <ThemedText style={styles.emptyText}>Aucun message trouvé.</ThemedText>
          )}
        />
      )}
      <Pressable style={({ pressed }) => [styles.fab, pressed && styles.buttonPressed]} onPress={() => router.push('/add-post')}>
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
    searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
    searchIcon: { position: 'absolute', left: 15, zIndex: 1 },
    searchInput: {
      flex: 1,
      height: 50,
      backgroundColor: themeColors.card,
      borderRadius: 12,
      paddingLeft: 45,
      paddingRight: 15,
      fontSize: FontSizes.body,
      borderWidth: 1,
      borderColor: themeColors.border,
      color: themeColors.text,
    },
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
    cardTitle: { fontSize: FontSizes.body, fontWeight: 'bold', marginBottom: Spacing.xs, color: themeColors.text },
    cardMeta: { fontSize: FontSizes.caption, color: themeColors.textSecondary },
    cardActions: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
    likeButton: { flexDirection: 'row', alignItems: 'center' },
    likeCount: { marginLeft: Spacing.xs, fontSize: FontSizes.caption, color: themeColors.textSecondary },
    deleteButton: { marginLeft: 'auto', padding: Spacing.xs },
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