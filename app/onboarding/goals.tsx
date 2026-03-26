import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { brand } from '@/constants/Colors';

const GOALS = [
  { id: 'seed_oils', icon: 'X', iconBg: '#FEE2E2', iconColor: '#EF4444', label: 'Avoid Seed Oils', desc: 'Sunflower, canola, soybean oils' },
  { id: 'clean_family', icon: 'F', iconBg: '#DBEAFE', iconColor: '#3B82F6', label: 'Feed My Family Clean', desc: 'Safe food for the whole family' },
  { id: 'reduce_processed', icon: 'R', iconBg: '#DCFCE7', iconColor: '#16A34A', label: 'Reduce Processed Food', desc: 'Less ultra-processed products' },
  { id: 'general_health', icon: 'H', iconBg: '#F3E8FF', iconColor: '#9333EA', label: 'General Health', desc: 'Make better food choices overall' },
  { id: 'allergies', icon: '!', iconBg: '#FEF3C7', iconColor: '#D97706', label: 'Manage Allergies', desc: 'Track allergens in products' },
  { id: 'weight', icon: 'W', iconBg: '#E0E7FF', iconColor: '#4F46E5', label: 'Watch What I Eat', desc: 'Be more mindful about food' },
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
      <View style={styles.header}>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: '33%' }]} />
        </View>
        <Text style={styles.step}>1 of 3</Text>
        <Text style={styles.title}>What matters most{'\n'}to you?</Text>
        <Text style={styles.subtitle}>Select all that apply</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {GOALS.map((goal) => {
          const isSelected = selected.includes(goal.id);
          return (
            <Pressable
              key={goal.id}
              testID={`goal-${goal.id}`}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => toggle(goal.id)}
            >
              <View style={[styles.cardIcon, { backgroundColor: goal.iconBg }]}>
                <Text style={[styles.cardIconText, { color: goal.iconColor }]}>{goal.icon}</Text>
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                  {goal.label}
                </Text>
                <Text style={styles.cardDesc}>{goal.desc}</Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          testID="goals-continue-button"
          style={({ pressed }) => [
            styles.button,
            selected.length === 0 && styles.buttonDisabled,
            pressed && selected.length > 0 && styles.buttonPressed,
          ]}
          onPress={() => {
            if (selected.length > 0) {
              router.push({
                pathname: '/onboarding/allergies',
                params: { goals: selected.join(',') },
              });
            }
          }}
          disabled={selected.length === 0}
        >
          <Text style={[styles.buttonText, selected.length === 0 && styles.buttonTextDisabled]}>
            Continue
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
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: brand.primary,
    backgroundColor: brand.primaryLight,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  cardIconText: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  cardLabelSelected: {
    color: brand.primaryDark,
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: brand.primary,
    borderColor: brand.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonTextDisabled: {
    color: '#9CA3AF',
  },
});
