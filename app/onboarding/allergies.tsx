import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const ALLERGIES = [
  { id: 'gluten', label: 'Gluten' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'nuts', label: 'Tree Nuts' },
  { id: 'peanuts', label: 'Peanuts' },
  { id: 'soy', label: 'Soy' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'fish', label: 'Fish' },
  { id: 'wheat', label: 'Wheat' },
  { id: 'sesame', label: 'Sesame' },
];

export default function AllergiesScreen() {
  const { goals } = useLocalSearchParams<{ goals: string }>();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <LinearGradient colors={['#16A34A', '#22C55E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: '66%' }]} />
        </View>
        <Text style={styles.step}>Step 2 of 3</Text>
      </View>

      <Text style={styles.title}>Any allergies or{'\n'}sensitivities?</Text>
      <Text style={styles.subtitle}>We'll flag these in every scan so you never miss them</Text>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {ALLERGIES.map((allergy) => {
            const isSelected = selected.includes(allergy.id);
            return (
              <Pressable
                key={allergy.id}
                testID={`allergy-${allergy.id}`}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected && styles.chipSelected,
                  pressed && styles.chipPressed,
                ]}
                onPress={() => toggle(allergy.id)}
              >
                {isSelected && <View style={styles.chipCheck}><Text style={styles.chipCheckText}>✓</Text></View>}
                <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{allergy.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {selected.length > 0 && (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedInfoText}>
              {selected.length} {selected.length === 1 ? 'allergen' : 'allergens'} selected — we'll alert you when products contain these
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          testID="allergies-continue-button"
          onPress={() => router.push({ pathname: '/onboarding/demo', params: { goals, allergies: selected.join(',') } })}
        >
          <LinearGradient
            colors={['#16A34A', '#15803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {selected.length > 0 ? 'Continue' : 'No Allergies — Continue'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', paddingTop: 60 },
  progressContainer: { paddingHorizontal: 28, marginBottom: 24 },
  progressTrack: { height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  step: { fontSize: 13, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '900', color: '#111827', lineHeight: 38, paddingHorizontal: 28, marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', paddingHorizontal: 28, marginBottom: 8, lineHeight: 22 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chipSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
    shadowColor: '#16A34A',
    shadowOpacity: 0.1,
  },
  chipPressed: { transform: [{ scale: 0.96 }] },
  chipCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCheckText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  chipLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  chipLabelSelected: { color: '#15803D' },
  selectedInfo: {
    marginTop: 24,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
  },
  selectedInfoText: { fontSize: 14, color: '#15803D', lineHeight: 20 },
  bottom: { paddingHorizontal: 20, paddingBottom: 50, paddingTop: 8 },
  buttonGradient: {
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
});
