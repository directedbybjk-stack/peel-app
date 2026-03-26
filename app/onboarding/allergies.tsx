import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { brand } from '@/constants/Colors';

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

  const handleContinue = () => {
    router.push({
      pathname: '/onboarding/demo',
      params: { goals, allergies: selected.join(',') },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: '66%' }]} />
        </View>
        <Text style={styles.step}>2 of 3</Text>
        <Text style={styles.title}>Any allergies or{'\n'}sensitivities?</Text>
        <Text style={styles.subtitle}>We'll flag these in every scan</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {ALLERGIES.map((allergy) => {
            const isSelected = selected.includes(allergy.id);
            return (
              <Pressable
                key={allergy.id}
                testID={`allergy-${allergy.id}`}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggle(allergy.id)}
              >
                <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                  {allergy.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          testID="allergies-continue-button"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>
            {selected.length > 0 ? 'Continue' : 'No Allergies — Continue'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  progress: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: brand.primary,
    borderRadius: 2,
  },
  step: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  list: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listContent: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  chipSelected: {
    borderColor: brand.primary,
    backgroundColor: brand.primaryLight,
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  chipLabelSelected: {
    color: brand.primaryDark,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    paddingTop: 12,
  },
  button: {
    backgroundColor: brand.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: brand.primaryDark,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
