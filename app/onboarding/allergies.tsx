import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={['#16A34A', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: '66%' }]}
          />
        </View>
        <Text style={styles.step}>STEP 2 OF 3</Text>
        <Text style={styles.title}>Any allergies or{'\n'}sensitivities?</Text>
        <Text style={styles.subtitle}>We'll flag these in every scan so you never miss them</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {ALLERGIES.map((allergy, index) => {
            const isSelected = selected.includes(allergy.id);
            return (
              <AnimatedPressable
                key={allergy.id}
                testID={`allergy-${allergy.id}`}
                entering={FadeInDown.delay(index * 40).duration(350).springify()}
                style={[
                  styles.chip,
                  isSelected && styles.chipSelected,
                ]}
                onPress={() => toggle(allergy.id)}
              >
                {isSelected && (
                  <View style={styles.chipCheck}>
                    <Text style={styles.chipCheckText}>✓</Text>
                  </View>
                )}
                <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                  {allergy.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {selected.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.selectedInfo}>
            <View style={styles.selectedInfoDot} />
            <Text style={styles.selectedInfoText}>
              {selected.length} {selected.length === 1 ? 'allergen' : 'allergens'} selected — we'll alert you when products contain these
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottom}>
        <Pressable
          testID="allergies-continue-button"
          style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  step: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  chipSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  chipCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCheckText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  chipLabelSelected: {
    color: '#15803D',
    fontWeight: '700',
  },
  selectedInfo: {
    marginTop: 28,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  selectedInfoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginTop: 6,
  },
  selectedInfoText: {
    fontSize: 14,
    color: '#15803D',
    lineHeight: 20,
    flex: 1,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    paddingTop: 8,
  },
  buttonGradient: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
