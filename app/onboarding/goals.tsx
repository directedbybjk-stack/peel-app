import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const GOALS = [
  { id: 'seed_oils', icon: '✕', iconBg: ['#FEE2E2', '#FECACA'], iconColor: '#DC2626', label: 'Avoid Seed Oils', desc: 'Sunflower, canola, soybean oils' },
  { id: 'clean_family', icon: '♥', iconBg: ['#DBEAFE', '#BFDBFE'], iconColor: '#2563EB', label: 'Feed My Family Clean', desc: 'Safe food for the whole family' },
  { id: 'reduce_processed', icon: '▼', iconBg: ['#DCFCE7', '#BBF7D0'], iconColor: '#16A34A', label: 'Reduce Processed Food', desc: 'Less ultra-processed products' },
  { id: 'general_health', icon: '+', iconBg: ['#F3E8FF', '#E9D5FF'], iconColor: '#7C3AED', label: 'General Health', desc: 'Make better food choices overall' },
  { id: 'allergies', icon: '!', iconBg: ['#FEF3C7', '#FDE68A'], iconColor: '#D97706', label: 'Manage Allergies', desc: 'Track allergens in products' },
  { id: 'weight', icon: '◎', iconBg: ['#E0E7FF', '#C7D2FE'], iconColor: '#4338CA', label: 'Watch What I Eat', desc: 'Be more mindful about food' },
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

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <LinearGradient colors={['#16A34A', '#22C55E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: '33%' }]} />
        </View>
        <Text style={styles.step}>Step 1 of 3</Text>
      </View>

      <Text style={styles.title}>What matters most{'\n'}to you?</Text>
      <Text style={styles.subtitle}>Select all that apply — we'll personalize your experience</Text>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {GOALS.map((goal) => {
          const isSelected = selected.includes(goal.id);
          return (
            <Pressable
              key={goal.id}
              testID={`goal-${goal.id}`}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
              onPress={() => toggle(goal.id)}
            >
              <LinearGradient colors={goal.iconBg as [string, string]} style={styles.iconContainer}>
                <Text style={[styles.iconText, { color: goal.iconColor }]}>{goal.icon}</Text>
              </LinearGradient>
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>{goal.label}</Text>
                <Text style={styles.cardDesc}>{goal.desc}</Text>
              </View>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          testID="goals-continue-button"
          disabled={selected.length === 0}
          onPress={() => {
            if (selected.length > 0) {
              router.push({ pathname: '/onboarding/allergies', params: { goals: selected.join(',') } });
            }
          }}
        >
          <LinearGradient
            colors={selected.length > 0 ? ['#16A34A', '#15803D'] : ['#D1D5DB', '#9CA3AF']}
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
  container: { flex: 1, backgroundColor: '#FAFAFA', paddingTop: 60 },
  progressContainer: { paddingHorizontal: 28, marginBottom: 24 },
  progressTrack: { height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  step: { fontSize: 13, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '900', color: '#111827', lineHeight: 38, paddingHorizontal: 28, marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', paddingHorizontal: 28, marginBottom: 8, lineHeight: 22 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
    shadowColor: '#16A34A',
    shadowOpacity: 0.1,
  },
  cardPressed: { transform: [{ scale: 0.98 }] },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconText: { fontSize: 22, fontWeight: '900' },
  cardTextContainer: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardLabelSelected: { color: '#15803D' },
  cardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: '#16A34A' },
  radioInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#16A34A' },
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
