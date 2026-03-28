import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const GOALS = [
  { id: 'seed_oils', icon: '✕', iconBg: '#FEE2E2', iconColor: '#DC2626', label: 'Avoid Seed Oils', desc: 'Sunflower, canola, soybean oils' },
  { id: 'clean_family', icon: '♥', iconBg: '#DBEAFE', iconColor: '#2563EB', label: 'Feed My Family Clean', desc: 'Safe food for the whole family' },
  { id: 'reduce_processed', icon: '▼', iconBg: '#DCFCE7', iconColor: '#16A34A', label: 'Reduce Processed Food', desc: 'Less ultra-processed products' },
  { id: 'general_health', icon: '+', iconBg: '#F3E8FF', iconColor: '#7C3AED', label: 'General Health', desc: 'Make better food choices overall' },
  { id: 'allergies', icon: '!', iconBg: '#FEF3C7', iconColor: '#D97706', label: 'Manage Allergies', desc: 'Track allergens in products' },
  { id: 'weight', icon: '◎', iconBg: '#E0E7FF', iconColor: '#4338CA', label: 'Watch What I Eat', desc: 'Be more mindful about food' },
];

export default function GoalsScreen() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
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
            style={[styles.progressFill, { width: '33%' }]}
          />
        </View>
        <Text style={styles.step}>STEP 1 OF 3</Text>
        <Text style={styles.title}>What matters most{'\n'}to you?</Text>
        <Text style={styles.subtitle}>Select all that apply — we'll personalize your experience</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {GOALS.map((goal, index) => {
          const isSelected = selected.includes(goal.id);
          return (
            <AnimatedPressable
              key={goal.id}
              testID={`goal-${goal.id}`}
              entering={FadeInDown.delay(index * 60).duration(400).springify()}
              style={[
                styles.card,
                isSelected && styles.cardSelected,
              ]}
              onPress={() => toggle(goal.id)}
            >
              <View style={[styles.iconContainer, { backgroundColor: goal.iconBg }]}>
                <Text style={[styles.iconText, { color: goal.iconColor }]}>{goal.icon}</Text>
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>{goal.label}</Text>
                <Text style={styles.cardDesc}>{goal.desc}</Text>
              </View>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottom}>
        <Pressable
          testID="goals-continue-button"
          disabled={selected.length === 0}
          style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          onPress={() => {
            if (selected.length > 0) {
              router.push({ pathname: '/onboarding/allergies', params: { goals: selected.join(',') } });
            }
          }}
        >
          <LinearGradient
            colors={selected.length > 0 ? ['#16A34A', '#15803D'] : ['#CBD5E1', '#94A3B8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continue</Text>
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
    paddingTop: 16,
    paddingBottom: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  cardSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 20,
    fontWeight: '900',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardLabelSelected: {
    color: '#15803D',
  },
  cardDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#16A34A',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
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
