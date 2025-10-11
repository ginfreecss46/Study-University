import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { TextInput, StyleSheet, Alert, ActivityIndicator, ScrollView, View, useColorScheme as useRNColorScheme, Platform } from 'react-native';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddEventScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = useMemo(() => getStyles(colorScheme), [colorScheme]);
  const themeColors = Colors[colorScheme];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!session || !title) {
      Alert.alert('Erreur', 'Veuillez renseigner au moins un titre.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from('user_events').insert({
        user_id: session.user.id,
        title,
        description,
        date: date.toISOString().split('T')[0],
        start_time: startTime.toTimeString().split(' ')[0],
        end_time: endTime.toTimeString().split(' ')[0],
      });

      if (error) throw error;

      Alert.alert('Succès', 'Événement ajouté.');
      router.back();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Ajouter un événement</ThemedText>
      <View style={styles.card}>
        <ThemedText style={styles.label}>Titre</ThemedText>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholderTextColor={themeColors.textSecondary} />

        <ThemedText style={styles.label}>Description</ThemedText>
        <TextInput value={description} onChangeText={setDescription} style={styles.input} multiline placeholderTextColor={themeColors.textSecondary} />

        <ThemedText style={styles.label}>Date</ThemedText>
        <Pressable onPress={() => setShowDatePicker(true)}>
          <TextInput value={date.toLocaleDateString('fr-FR')} style={styles.input} editable={false} />
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        <View style={styles.timeRow}>
          <View style={{flex: 1, marginRight: Spacing.md}}>
            <ThemedText style={styles.label}>Début</ThemedText>
            <Pressable onPress={() => setShowStartTimePicker(true)}>
              <TextInput value={startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} style={styles.input} editable={false} />
            </Pressable>
            {showStartTimePicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowStartTimePicker(false);
                  if (selectedTime) setStartTime(selectedTime);
                }}
              />
            )}
          </View>
          <View style={{flex: 1}}>
            <ThemedText style={styles.label}>Fin</ThemedText>
            <Pressable onPress={() => setShowEndTimePicker(true)}>
              <TextInput value={endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} style={styles.input} editable={false} />
            </Pressable>
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowEndTimePicker(false);
                  if (selectedTime) setEndTime(selectedTime);
                }}
              />
            )}
          </View>
        </View>

        <Button title={loading ? 'Enregistrement...' : 'Enregistrer'} onPress={handleSave} disabled={loading} />
        <View style={{ marginTop: Spacing.sm }}>
          <Button title="Annuler" onPress={() => router.back()} variant="secondary" />
        </View>
      </View>
    </ScrollView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
  const themeColors = Colors[colorScheme];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      paddingTop: 50,
    },
    title: {
      marginBottom: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      color: themeColors.text,
      fontSize: FontSizes.title,
      fontWeight: 'bold',
    },
    card: {
      backgroundColor: themeColors.card,
      borderRadius: 16,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    label: {
      fontSize: FontSizes.body,
      color: themeColors.text,
      marginBottom: Spacing.sm,
      fontWeight: 'bold',
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.border,
      padding: Spacing.md,
      borderRadius: 12,
      marginBottom: Spacing.md,
      backgroundColor: themeColors.background,
      color: themeColors.text,
      fontSize: FontSizes.body,
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  });
}
