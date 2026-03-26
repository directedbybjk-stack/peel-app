import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Switch, Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { brand } from '@/constants/Colors';
import { getPreferences, savePreferences, getScanHistory, type UserPreferences } from '@/lib/storage';

const GOAL_OPTIONS: { id: string; label: string; icon: string }[] = [
  { id: 'seed_oils', label: 'Avoid Seed Oils', icon: 'water-outline' },
  { id: 'clean_family', label: 'Feed Family Clean', icon: 'people-outline' },
  { id: 'reduce_processed', label: 'Reduce Processed Food', icon: 'leaf-outline' },
  { id: 'general_health', label: 'General Health', icon: 'heart-outline' },
  { id: 'allergies', label: 'Manage Allergies', icon: 'alert-circle-outline' },
  { id: 'weight', label: 'Watch What I Eat', icon: 'scale-outline' },
];

const ALLERGY_OPTIONS: { id: string; label: string }[] = [
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

const ANALYSIS_AVOID: { id: string; label: string }[] = [
  { id: 'seed_oils', label: 'Seed Oils' },
  { id: 'artificial_additives', label: 'Artificial Additives' },
  { id: 'heavy_metals', label: 'Heavy Metals' },
  { id: 'all_above', label: 'All of the Above' },
];

const SHOPPING_FOR: { id: string; label: string }[] = [
  { id: 'myself', label: 'Myself' },
  { id: 'kids', label: 'My Kids' },
  { id: 'family', label: 'Me and My Family' },
];

type SheetType = 'goals' | 'allergies' | 'analysis' | null;

export default function ProfileScreen() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [totalScans, setTotalScans] = useState(0);
  const [notifications, setNotifications] = useState(true);

  // Editable state
  const [editGoals, setEditGoals] = useState<string[]>([]);
  const [editAllergies, setEditAllergies] = useState<string[]>([]);
  const [editAvoid, setEditAvoid] = useState<string[]>(['seed_oils']);
  const [editShoppingFor, setEditShoppingFor] = useState('myself');
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);

  useFocusEffect(
    useCallback(() => {
      getPreferences().then((p) => {
        setPrefs(p);
        if (p) {
          setEditGoals(p.goal.split(',').filter(Boolean));
          setEditAllergies(p.allergies || []);
        }
      });
      getScanHistory().then((h) => setTotalScans(h.length));
    }, [])
  );

  const goalLabels: Record<string, string> = {};
  GOAL_OPTIONS.forEach((g) => { goalLabels[g.id] = g.label; });
  const allergyLabels: Record<string, string> = {};
  ALLERGY_OPTIONS.forEach((a) => { allergyLabels[a.id] = a.label; });

  const goals = (prefs?.goal || '').split(',').filter(Boolean);
  const allergies = (prefs?.allergies || []).filter(Boolean);

  const toggleInList = (list: string[], item: string): string[] =>
    list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

  const saveAndClose = async () => {
    const updated: UserPreferences = {
      goal: editGoals.join(','),
      allergies: editAllergies,
    };
    await savePreferences(updated);
    setPrefs(updated);
    setActiveSheet(null);
  };

  const openSheet = (type: SheetType) => {
    if (type === 'goals') setEditGoals(goals);
    if (type === 'allergies') setEditAllergies([...allergies]);
    setActiveSheet(type);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar} testID="profile-avatar">
            <Ionicons name="person" size={36} color={brand.primary} />
          </View>
          <Text style={styles.name}>Peel User</Text>
          <Text style={styles.email}>Free Plan</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalScans}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{goals.length}</Text>
            <Text style={styles.statLabel}>Goals Set</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{allergies.length}</Text>
            <Text style={styles.statLabel}>Allergies</Text>
          </View>
        </View>

        {/* Upgrade CTA */}
        <Pressable
          testID="upgrade-button"
          style={({ pressed }) => [styles.upgradeCTA, pressed && styles.upgradeCTAPressed]}
          onPress={() => router.push('/paywall')}
        >
          <View>
            <Text style={styles.upgradeTitle}>Upgrade to Peel Pro</Text>
            <Text style={styles.upgradeSubtitle}>Unlimited scans, no daily limits</Text>
          </View>
          <Text style={styles.upgradePrice}>$5.83/mo</Text>
        </Pressable>

        {/* Preferences Section */}
        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.card}>
          <Pressable
            testID="edit-goals-button"
            style={styles.menuRow}
            onPress={() => openSheet('goals')}
          >
            <View style={styles.menuRowLeft}>
              <Ionicons name="leaf-outline" size={20} color="#6B7280" />
              <Text style={styles.menuRowText}>Dietary Preferences</Text>
            </View>
            <View style={styles.menuRowRight}>
              {goals.length > 0 && (
                <Text style={styles.menuRowBadge}>{goals.length}</Text>
              )}
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </View>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            testID="edit-allergies-button"
            style={styles.menuRow}
            onPress={() => openSheet('allergies')}
          >
            <View style={styles.menuRowLeft}>
              <Ionicons name="alert-circle-outline" size={20} color="#6B7280" />
              <Text style={styles.menuRowText}>Allergies</Text>
            </View>
            <View style={styles.menuRowRight}>
              {allergies.length > 0 && (
                <Text style={styles.menuRowBadge}>{allergies.length}</Text>
              )}
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </View>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            testID="edit-analysis-button"
            style={styles.menuRow}
            onPress={() => openSheet('analysis')}
          >
            <View style={styles.menuRowLeft}>
              <Ionicons name="analytics-outline" size={20} color="#6B7280" />
              <Text style={styles.menuRowText}>Personalized Analysis</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </Pressable>

          <View style={styles.menuDivider} />

          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <Ionicons name="globe-outline" size={20} color="#6B7280" />
              <Text style={styles.menuRowText}>Language</Text>
            </View>
            <Text style={styles.menuRowValue}>English</Text>
          </View>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.card}>
          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <Ionicons name="notifications-outline" size={20} color="#6B7280" />
              <Text style={styles.menuRowText}>Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ true: brand.primary }}
            />
          </View>

          <View style={styles.menuDivider} />

          <Pressable style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />
              <Text style={styles.menuRowText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <Ionicons name="document-text-outline" size={20} color="#6B7280" />
              <Text style={styles.menuRowText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#6B7280" />
              <Text style={styles.menuRowText}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </Pressable>
        </View>

        <Text style={styles.version}>Peel v1.0.0</Text>
      </ScrollView>

      {/* Dietary Preferences Sheet */}
      <Modal
        visible={activeSheet === 'goals'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveSheet(null)}
      >
        <SafeAreaView style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Dietary Preferences</Text>
            <Pressable testID="goals-close" onPress={() => setActiveSheet(null)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>
          <Text style={styles.sheetSubtitle}>What are your health goals?</Text>
          <View style={styles.sheetChips}>
            {GOAL_OPTIONS.map((g) => {
              const selected = editGoals.includes(g.id);
              return (
                <Pressable
                  key={g.id}
                  testID={`edit-goal-${g.id}`}
                  style={[styles.selectChip, selected && styles.selectChipActive]}
                  onPress={() => setEditGoals(toggleInList(editGoals, g.id))}
                >
                  <Text style={[styles.selectChipText, selected && styles.selectChipTextActive]}>
                    {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            testID="goals-save"
            style={styles.sheetSaveBtn}
            onPress={saveAndClose}
          >
            <Text style={styles.sheetSaveBtnText}>Save Changes</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>

      {/* Allergies Sheet */}
      <Modal
        visible={activeSheet === 'allergies'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveSheet(null)}
      >
        <SafeAreaView style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Allergies & Sensitivities</Text>
            <Pressable testID="allergies-close" onPress={() => setActiveSheet(null)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>
          <Text style={styles.sheetSubtitle}>Select any food allergies or sensitivities</Text>
          <View style={styles.sheetChips}>
            {ALLERGY_OPTIONS.map((a) => {
              const selected = editAllergies.includes(a.id);
              return (
                <Pressable
                  key={a.id}
                  testID={`edit-allergy-${a.id}`}
                  style={[styles.selectChip, selected && styles.selectChipDanger]}
                  onPress={() => setEditAllergies(toggleInList(editAllergies, a.id))}
                >
                  <Text style={[styles.selectChipText, selected && styles.selectChipTextDanger]}>
                    {a.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            testID="allergies-save"
            style={styles.sheetSaveBtn}
            onPress={saveAndClose}
          >
            <Text style={styles.sheetSaveBtnText}>Save Changes</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>

      {/* Personalized Analysis Sheet */}
      <Modal
        visible={activeSheet === 'analysis'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveSheet(null)}
      >
        <SafeAreaView style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Personalized Analysis</Text>
            <Pressable testID="analysis-close" onPress={() => setActiveSheet(null)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <Text style={styles.sheetSubtitle}>What do you want to avoid most?</Text>
          <View style={styles.sheetChips}>
            {ANALYSIS_AVOID.map((a) => {
              const selected = editAvoid.includes(a.id);
              return (
                <Pressable
                  key={a.id}
                  testID={`avoid-${a.id}`}
                  style={[styles.selectChip, selected && styles.selectChipActive]}
                  onPress={() => setEditAvoid(toggleInList(editAvoid, a.id))}
                >
                  <Text style={[styles.selectChipText, selected && styles.selectChipTextActive]}>
                    {a.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sheetSubtitle, { marginTop: 24 }]}>Who are you shopping for?</Text>
          <View style={styles.sheetChips}>
            {SHOPPING_FOR.map((s) => {
              const selected = editShoppingFor === s.id;
              return (
                <Pressable
                  key={s.id}
                  testID={`shopping-${s.id}`}
                  style={[styles.selectChip, selected && styles.selectChipActive]}
                  onPress={() => setEditShoppingFor(s.id)}
                >
                  <Text style={[styles.selectChipText, selected && styles.selectChipTextActive]}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            testID="analysis-save"
            style={styles.sheetSaveBtn}
            onPress={() => setActiveSheet(null)}
          >
            <Text style={styles.sheetSaveBtnText}>Save Changes</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F5' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 120 },

  // Header
  header: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 3, borderColor: brand.primary,
  },
  name: { fontSize: 22, fontWeight: '800', color: '#111827' },
  email: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },

  // Stats
  statsRow: {
    flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 16,
    padding: 16, marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E5E7EB' },

  // Upgrade CTA
  upgradeCTA: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: brand.primary, borderRadius: 16, padding: 20, marginBottom: 24,
  },
  upgradeCTAPressed: { backgroundColor: brand.primaryDark },
  upgradeTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  upgradeSubtitle: { fontSize: 13, color: '#DCFCE7', marginTop: 2 },
  upgradePrice: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },

  // Sections
  sectionHeader: {
    fontSize: 13, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 8, marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  menuRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16,
  },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuRowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuRowText: { fontSize: 16, color: '#374151', fontWeight: '500' },
  menuRowValue: { fontSize: 15, color: '#9CA3AF' },
  menuRowBadge: {
    fontSize: 12, fontWeight: '700', color: brand.primary,
    backgroundColor: '#F0FDF4', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
    overflow: 'hidden',
  },
  menuDivider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 48 },

  version: { textAlign: 'center', fontSize: 13, color: '#D1D5DB', marginTop: 12 },

  // Sheet
  sheetContainer: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 12 },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  sheetSubtitle: { fontSize: 15, color: '#6B7280', marginBottom: 16 },
  sheetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  selectChip: {
    borderRadius: 20, paddingVertical: 10, paddingHorizontal: 18,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF',
  },
  selectChipActive: {
    borderColor: brand.primary, backgroundColor: brand.primaryLight,
  },
  selectChipDanger: {
    borderColor: brand.danger, backgroundColor: brand.dangerLight,
  },
  selectChipText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  selectChipTextActive: { color: brand.primary },
  selectChipTextDanger: { color: brand.danger },
  sheetSaveBtn: {
    backgroundColor: brand.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 'auto', marginBottom: 20,
  },
  sheetSaveBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
