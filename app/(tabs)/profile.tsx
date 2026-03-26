import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { brand } from '@/constants/Colors';
import { getPreferences, getScanHistory, type UserPreferences } from '@/lib/storage';

export default function ProfileScreen() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [totalScans, setTotalScans] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getPreferences().then(setPrefs);
      getScanHistory().then((h) => setTotalScans(h.length));
    }, [])
  );

  const goalLabels: Record<string, string> = {
    seed_oils: 'Avoid Seed Oils',
    clean_family: 'Feed Family Clean',
    reduce_processed: 'Reduce Processed Food',
    general_health: 'General Health',
    allergies: 'Manage Allergies',
    weight: 'Watch What I Eat',
  };

  const allergyLabels: Record<string, string> = {
    gluten: 'Gluten', dairy: 'Dairy', nuts: 'Tree Nuts', peanuts: 'Peanuts',
    soy: 'Soy', shellfish: 'Shellfish', eggs: 'Eggs', fish: 'Fish',
    wheat: 'Wheat', sesame: 'Sesame',
  };

  const goals = (prefs?.goal || '').split(',').filter(Boolean);
  const allergies = (prefs?.allergies || []).filter(Boolean);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={[styles.avatarText, { color: '#16A34A' }]}>P</Text>
        </View>
        <Text style={styles.name}>Peel User</Text>
        <Text style={styles.plan}>Free Plan</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalScans}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>Free</Text>
          <Text style={styles.statLabel}>Plan</Text>
        </View>
      </View>

      {/* Upgrade CTA */}
      <Pressable
        testID="upgrade-button"
        style={({ pressed }) => [styles.upgradeCTA, pressed && styles.upgradeCTAPressed]}
      >
        <View>
          <Text style={styles.upgradeTitle}>Upgrade to Peel Pro</Text>
          <Text style={styles.upgradeSubtitle}>Unlimited scans, no daily limits</Text>
        </View>
        <Text style={styles.upgradePrice}>$5.83/mo</Text>
      </Pressable>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Goals</Text>
        <View style={styles.chipContainer}>
          {goals.length > 0 ? goals.map((g) => (
            <View key={g} style={styles.chip}>
              <Text style={styles.chipText}>{goalLabels[g] || g}</Text>
            </View>
          )) : (
            <Text style={styles.noData}>No goals set</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allergies & Sensitivities</Text>
        <View style={styles.chipContainer}>
          {allergies.length > 0 ? allergies.map((a) => (
            <View key={a} style={[styles.chip, styles.chipDanger]}>
              <Text style={[styles.chipText, styles.chipTextDanger]}>{allergyLabels[a] || a}</Text>
            </View>
          )) : (
            <Text style={styles.noData}>None set</Text>
          )}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch
            testID="dark-mode-switch"
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ true: brand.primary }}
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <Switch
            value={true}
            trackColor={{ true: brand.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuItemText}>Scoring Method</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuItemText}>Privacy Policy</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuItemText}>Terms of Service</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuItemText}>Contact Support</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </Pressable>
      </View>

      <Text style={styles.version}>Peel v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 120 },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 36 },
  name: { fontSize: 22, fontWeight: '800', color: '#111827' },
  plan: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 16,
    padding: 20, marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#E5E7EB' },
  upgradeCTA: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: brand.primary, borderRadius: 16, padding: 20, marginBottom: 24,
  },
  upgradeCTAPressed: { backgroundColor: brand.primaryDark },
  upgradeTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  upgradeSubtitle: { fontSize: 13, color: '#DCFCE7', marginTop: 2 },
  upgradePrice: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F0FDF4', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  chipText: { fontSize: 14, fontWeight: '600', color: brand.primary },
  chipDanger: { backgroundColor: '#FEE2E2' },
  chipTextDanger: { color: '#EF4444' },
  noData: { fontSize: 14, color: '#9CA3AF' },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  settingLabel: { fontSize: 16, color: '#374151' },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  menuItemText: { fontSize: 16, color: '#374151' },
  menuItemArrow: { fontSize: 22, color: '#D1D5DB' },
  version: { textAlign: 'center', fontSize: 13, color: '#D1D5DB', marginTop: 20 },
});
