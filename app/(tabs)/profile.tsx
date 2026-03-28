import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Switch, Modal,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { brand } from '@/constants/Colors';
import { CONTACT_URL, PRIVACY_POLICY_URL, SUPPORT_URL, TERMS_OF_SERVICE_URL } from '@/lib/appConfig';
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
      <LinearGradient colors={['#F0FDF4', '#F5F7F5']} style={styles.topGradient} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarOuter}>
            <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={styles.avatar}>
              <Ionicons name="person" size={36} color={brand.primary} />
            </LinearGradient>
          </View>
          <Text style={styles.name}>Peel User</Text>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>Peel Pro</Text>
          </View>
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

        {/* Preferences Section */}
        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.card}>
          <Pressable
            testID="edit-goals-button"
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
            onPress={() => openSheet('goals')}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="leaf-outline" size={18} color={brand.primary} />
              </View>
              <Text style={styles.menuRowText}>Dietary Preferences</Text>
            </View>
            <View style={styles.menuRowRight}>
              {goals.length > 0 && (
                <View style={styles.menuRowBadge}>
                  <Text style={styles.menuRowBadgeText}>{goals.length}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </View>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            testID="edit-allergies-button"
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
            onPress={() => openSheet('allergies')}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              </View>
              <Text style={styles.menuRowText}>Allergies</Text>
            </View>
            <View style={styles.menuRowRight}>
              {allergies.length > 0 && (
                <View style={styles.menuRowBadge}>
                  <Text style={styles.menuRowBadgeText}>{allergies.length}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </View>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            testID="edit-analysis-button"
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
            onPress={() => openSheet('analysis')}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="analytics-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.menuRowText}>Personalized Analysis</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </Pressable>

          <View style={styles.menuDivider} />

          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="globe-outline" size={18} color="#8B5CF6" />
              </View>
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
              <View style={[styles.menuIconWrap, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="notifications-outline" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.menuRowText}>Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ true: brand.primary }}
            />
          </View>

          <View style={styles.menuDivider} />

          <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={brand.primary} />
              </View>
              <Text style={styles.menuRowText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]} onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#F3F4F6' }]}>
                <Ionicons name="document-text-outline" size={18} color="#6B7280" />
              </View>
              <Text style={styles.menuRowText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]} onPress={() => Linking.openURL(SUPPORT_URL)}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.menuRowText}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]} onPress={() => Linking.openURL(CONTACT_URL)}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="mail-outline" size={18} color="#EF4444" />
              </View>
              <Text style={styles.menuRowText}>Contact Peel</Text>
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
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Dietary Preferences</Text>
              <Pressable testID="goals-close" onPress={() => setActiveSheet(null)} style={styles.sheetCloseBtn} hitSlop={12}>
                <Ionicons name="close" size={20} color="#6B7280" />
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
              style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}
              onPress={saveAndClose}
            >
              <LinearGradient colors={['#16A34A', '#15803D']} style={styles.sheetSaveBtn}>
                <Text style={styles.sheetSaveBtnText}>Save Changes</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Allergies Sheet */}
      <Modal
        visible={activeSheet === 'allergies'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveSheet(null)}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Allergies & Sensitivities</Text>
              <Pressable testID="allergies-close" onPress={() => setActiveSheet(null)} style={styles.sheetCloseBtn} hitSlop={12}>
                <Ionicons name="close" size={20} color="#6B7280" />
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
              style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}
              onPress={saveAndClose}
            >
              <LinearGradient colors={['#16A34A', '#15803D']} style={styles.sheetSaveBtn}>
                <Text style={styles.sheetSaveBtnText}>Save Changes</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Personalized Analysis Sheet */}
      <Modal
        visible={activeSheet === 'analysis'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveSheet(null)}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Personalized Analysis</Text>
              <Pressable testID="analysis-close" onPress={() => setActiveSheet(null)} style={styles.sheetCloseBtn} hitSlop={12}>
                <Ionicons name="close" size={20} color="#6B7280" />
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

            <Text style={[styles.sheetSubtitle, { marginTop: 8 }]}>Who are you shopping for?</Text>
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
              style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}
              onPress={() => setActiveSheet(null)}
            >
              <LinearGradient colors={['#16A34A', '#15803D']} style={styles.sheetSaveBtn}>
                <Text style={styles.sheetSaveBtnText}>Save Changes</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F5' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 120 },

  // Header
  header: { alignItems: 'center', marginBottom: 20 },
  avatarOuter: {
    marginBottom: 14,
    shadowColor: '#16A34A', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: brand.primary,
  },
  name: { fontSize: 24, fontWeight: '800', color: '#111827' },
  planBadge: {
    marginTop: 6, backgroundColor: '#F3F4F6', borderRadius: 10,
    paddingVertical: 4, paddingHorizontal: 14,
  },
  planBadgeText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },

  // Stats
  statsRow: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 18,
    padding: 18, marginBottom: 18,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 },
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 3 },
  statDivider: { width: 1, backgroundColor: '#F3F4F6' },

  // Sections
  sectionHeader: {
    fontSize: 13, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 10, marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 },
  },
  menuRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  menuRowPressed: { backgroundColor: '#F9FAFB' },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuRowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuIconWrap: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  menuRowText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  menuRowValue: { fontSize: 15, color: '#9CA3AF' },
  menuRowBadge: {
    backgroundColor: '#F0FDF4', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  menuRowBadgeText: { fontSize: 12, fontWeight: '700', color: brand.primary },
  menuDivider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 62 },

  version: { textAlign: 'center', fontSize: 13, color: '#D1D5DB', marginTop: 16 },

  // Sheet
  sheetContainer: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 0, paddingTop: 16 },
  sheetContent: { flex: 1, paddingHorizontal: 28 },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB',
    alignSelf: 'center', marginBottom: 16,
  },
  sheetDragHandle: {
    width: 36, height: 5, borderRadius: 3, backgroundColor: '#E5E7EB',
    alignSelf: 'center', marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  sheetCloseBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetSubtitle: { fontSize: 15, color: '#9CA3AF', marginBottom: 20 },
  sheetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  selectChip: {
    borderRadius: 24, paddingVertical: 12, paddingHorizontal: 20,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#FAFAFA',
  },
  selectChipActive: {
    borderColor: brand.primary, backgroundColor: '#F0FDF4',
  },
  selectChipDanger: {
    borderColor: brand.danger, backgroundColor: '#FEF2F2',
  },
  selectChipText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  selectChipTextActive: { color: brand.primary, fontWeight: '700' },
  selectChipTextDanger: { color: brand.danger, fontWeight: '700' },
  sheetSaveBtn: {
    borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 'auto', marginBottom: 20,
    shadowColor: '#16A34A', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  sheetSaveBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
