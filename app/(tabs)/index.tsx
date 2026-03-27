import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Dimensions, Modal, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { brand } from '@/constants/Colors';
import { getScanHistory, getDailyScanCount, getPreferences, type ScanHistoryItem } from '@/lib/storage';
import { FALLBACK_CATALOG } from '@/lib/fallback-products';

const FREE_SCAN_LIMIT = 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RANK_TIERS: { name: string; min: number; next: string | null; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'Seed', min: 0, next: 'Sprout', icon: 'leaf-outline' },
  { name: 'Sprout', min: 10, next: 'Sapling', icon: 'leaf' },
  { name: 'Sapling', min: 25, next: 'Tree', icon: 'flower-outline' },
  { name: 'Tree', min: 50, next: 'Forest', icon: 'flower' },
  { name: 'Forest', min: 100, next: 'Legend', icon: 'globe-outline' },
  { name: 'Legend', min: 250, next: null, icon: 'trophy' },
];

function getRank(totalScans: number) {
  let tier = RANK_TIERS[0];
  let nextTier = RANK_TIERS[1];
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (totalScans >= RANK_TIERS[i].min) {
      tier = RANK_TIERS[i];
      nextTier = RANK_TIERS[i + 1] || null;
      break;
    }
  }
  const progress = nextTier
    ? (totalScans - tier.min) / (nextTier.min - tier.min)
    : 1;
  return { tier, nextTier, progress: Math.min(progress, 1) };
}

function getTimeOfDay() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

function getScoreColor(s: number) {
  return s >= 80 ? brand.score.excellent : s >= 60 ? brand.score.good : s >= 30 ? brand.score.limit : brand.score.avoid;
}

function getScoreLabel(s: number) {
  return s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 30 ? 'Limit' : 'Avoid';
}

function getScoreFromGrade(grade?: string) {
  if (!grade) return null;
  const map: Record<string, number> = { a: 90, b: 70, c: 50, d: 30, e: 10 };
  return map[grade] || null;
}

export default function HomeScreen() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [dailyScans, setDailyScans] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [showScoreInfo, setShowScoreInfo] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const h = await getScanHistory();
        setHistory(h.slice(0, 10));
        setTotalScans(h.length);
        setDailyScans(await getDailyScanCount());
      };
      load();
    }, [])
  );

  const { tier, nextTier, progress } = getRank(totalScans);

  const featuredProducts = [
    ...FALLBACK_CATALOG['protein-bars'].slice(0, 2),
    ...FALLBACK_CATALOG['snacks'].slice(0, 2),
    ...FALLBACK_CATALOG['drinks'].slice(0, 2),
  ];

  const peelScore = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length)
    : 70;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F0FDF4', '#F5F7F5', '#F5F7F5']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StatusBar style="dark" />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()}</Text>
            <Text style={styles.userName}>Peel User</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color="#F59E0B" />
              <Text style={styles.streakCount}>{dailyScans || 1}</Text>
            </View>
            <View style={styles.avatarCircle}>
              <LinearGradient
                colors={['#DCFCE7', '#BBF7D0']}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={22} color={brand.primary} />
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Rank Card */}
        <LinearGradient
          colors={['#166534', '#15803D', '#14532D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rankCard}
        >
          {/* Decorative circles */}
          <View style={styles.rankDecorCircle1} />
          <View style={styles.rankDecorCircle2} />

          <View style={styles.rankTop}>
            <View>
              <Text style={styles.rankLabel}>CURRENT RANK</Text>
              <Text style={styles.rankName}>{tier.name}</Text>
            </View>
            <View style={styles.rankEmojiCircle}>
              <Ionicons name={tier.icon} size={28} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.rankBottom}>
            <Text style={styles.rankScans}>{totalScans} Scans</Text>
            {nextTier && <Text style={styles.rankNext}>Next: {nextTier.name}</Text>}
          </View>
          <View style={styles.rankProgressOuter}>
            <View style={[styles.rankProgressInner, { width: `${progress * 100}%` }]} />
          </View>
        </LinearGradient>

        {/* Peel Score Card */}
        <Pressable
          testID="peel-score-card"
          style={({ pressed }) => [styles.scoreCard, pressed && { opacity: 0.9 }]}
          onPress={() => setShowScoreInfo(true)}
        >
          {history.length > 0 ? (
            <>
              <View style={styles.scoreCardLeft}>
                <View style={styles.scoreCardLabelRow}>
                  <Text style={styles.scoreCardLabel}>PEEL SCORE</Text>
                  <View style={[styles.scoreCardBadge, { backgroundColor: getScoreColor(peelScore) + '18' }]}>
                    <Text style={[styles.scoreCardBadgeText, { color: getScoreColor(peelScore) }]}>
                      {getScoreLabel(peelScore)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.scoreCardSub}>
                  Based on {history.length} item{history.length !== 1 ? 's' : ''} in your pantry
                </Text>
              </View>
              <View style={styles.scoreCardRight}>
                <Text style={[styles.scoreCardNum, { color: getScoreColor(peelScore) }]}>{peelScore}</Text>
                <Text style={styles.scoreCardDenom}>/100</Text>
              </View>
            </>
          ) : (
            <View style={styles.scoreCardEmpty}>
              <View style={styles.scoreCardLabelRow}>
                <Text style={styles.scoreCardLabel}>PEEL SCORE</Text>
                <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" />
              </View>
              <Text style={styles.scoreCardEmptyText}>
                Scan a product to start building your score
              </Text>
            </View>
          )}
        </Pressable>

        {/* Featured Products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lab Tested Products</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/search')}
            style={({ pressed }) => [styles.seeAllBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.seeAll}>See all</Text>
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
          {featuredProducts.map((product) => {
            const score = getScoreFromGrade(product.nutriscoreGrade);
            return (
              <Pressable
                key={product.barcode}
                style={({ pressed }) => [styles.productCard, pressed && { transform: [{ scale: 0.97 }] }]}
                onPress={() => router.push(`/product/${product.barcode}`)}
              >
                <View style={styles.productImageWrap}>
                  <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                  {score != null && (
                    <View style={[styles.scoreDot, { backgroundColor: getScoreColor(score) }]} />
                  )}
                </View>
                <Text style={styles.productName} numberOfLines={2}>{product.productName}</Text>
                <Text style={styles.productBrand} numberOfLines={1}>{product.brand}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Recent Scans */}
        {history.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Scans</Text>
              <Pressable
                onPress={() => router.push('/(tabs)/history')}
                style={({ pressed }) => [styles.seeAllBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.seeAll}>See all</Text>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </Pressable>
            </View>
            {history.slice(0, 3).map((item, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [styles.recentCard, pressed && { transform: [{ scale: 0.98 }] }]}
                onPress={() => router.push(`/product/${item.barcode}`)}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.recentImage} />
                ) : (
                  <View style={[styles.recentImage, styles.recentPlaceholder]}>
                    <Ionicons name="image-outline" size={20} color="#D1D5DB" />
                  </View>
                )}
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName} numberOfLines={1}>{item.productName}</Text>
                  <Text style={styles.recentBrand}>{item.brand}</Text>
                  <View style={styles.recentScoreRow}>
                    <View style={[styles.scoreDotSmall, { backgroundColor: getScoreColor(item.score) }]} />
                    <Text style={styles.recentScoreNum}>{item.score}/100</Text>
                    <Text style={[styles.recentScoreLabel, { color: getScoreColor(item.score) }]}>
                      {getScoreLabel(item.score)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </Pressable>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Score Info Modal */}
      <Modal
        visible={showScoreInfo}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowScoreInfo(false)}
      >
        <View style={styles.modalOuter}>
          <SafeAreaView style={styles.modalSafe}>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Peel Score</Text>
                <Pressable onPress={() => setShowScoreInfo(false)} hitSlop={16}>
                  <Ionicons name="close-circle" size={28} color="#D1D5DB" />
                </Pressable>
              </View>

              <View style={styles.modalScoreCircle}>
                <Text style={[styles.modalScoreNum, { color: history.length > 0 ? getScoreColor(peelScore) : '#9CA3AF' }]}>
                  {history.length > 0 ? peelScore : '--'}
                </Text>
                <Text style={styles.modalScoreDenom}>/100</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>How is your Peel Score calculated?</Text>
                <Text style={styles.modalSectionText}>
                  Your Peel Score is the average score of all products in your pantry. Each product is scored 0–100 based on:
                </Text>
              </View>

              <View style={styles.modalFactors}>
                <View style={styles.modalFactor}>
                  <View style={[styles.modalFactorIcon, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="water-outline" size={18} color="#EF4444" />
                  </View>
                  <View style={styles.modalFactorInfo}>
                    <Text style={styles.modalFactorTitle}>Seed Oils</Text>
                    <Text style={styles.modalFactorDesc}>Products with seed oils (canola, sunflower, soybean) score lower</Text>
                  </View>
                </View>
                <View style={styles.modalFactor}>
                  <View style={[styles.modalFactorIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="flask-outline" size={18} color="#F59E0B" />
                  </View>
                  <View style={styles.modalFactorInfo}>
                    <Text style={styles.modalFactorTitle}>Processing Profile</Text>
                    <Text style={styles.modalFactorDesc}>Ultra-processed foods (NOVA 4) reduce your score significantly</Text>
                  </View>
                </View>
                <View style={styles.modalFactor}>
                  <View style={[styles.modalFactorIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="warning-outline" size={18} color="#3B82F6" />
                  </View>
                  <View style={styles.modalFactorInfo}>
                    <Text style={styles.modalFactorTitle}>Additives</Text>
                    <Text style={styles.modalFactorDesc}>Artificial colors, preservatives, and sweeteners lower the score</Text>
                  </View>
                </View>
                <View style={styles.modalFactor}>
                  <View style={[styles.modalFactorIcon, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="nutrition-outline" size={18} color={brand.primary} />
                  </View>
                  <View style={styles.modalFactorInfo}>
                    <Text style={styles.modalFactorTitle}>Nutri-Score</Text>
                    <Text style={styles.modalFactorDesc}>Products with A or B Nutri-Score ratings get a bonus</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalTip}>
                <Text style={styles.modalTipText}>
                  Scan more products and add them to your pantry to get a more accurate Peel Score!
                </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 120 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 15, fontWeight: '500', color: '#9CA3AF', marginBottom: 2 },
  userName: { fontSize: 28, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  streakCount: { fontSize: 14, fontWeight: '800', color: '#111827' },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23, overflow: 'hidden',
    shadowColor: '#16A34A', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  avatarGradient: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: brand.primary,
  },

  // Rank Card
  rankCard: {
    borderRadius: 22, padding: 22, marginBottom: 14, overflow: 'hidden',
    shadowColor: '#14532D', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  rankDecorCircle1: {
    position: 'absolute', top: -20, right: -20, width: 100, height: 100,
    borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  rankDecorCircle2: {
    position: 'absolute', bottom: -30, left: -10, width: 80, height: 80,
    borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rankTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  rankLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, marginBottom: 6 },
  rankName: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  rankEmojiCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
  },
  rankBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rankScans: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  rankNext: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
  rankProgressOuter: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' },
  rankProgressInner: { height: 6, backgroundColor: '#FFFFFF', borderRadius: 3 },

  // Score Card
  scoreCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 28,
    borderWidth: 1.5, borderColor: '#E8F5E9',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
  },
  scoreCardLeft: { flex: 1 },
  scoreCardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  scoreCardLabel: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.2 },
  scoreCardBadge: { borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10 },
  scoreCardBadgeText: { fontSize: 12, fontWeight: '700' },
  scoreCardSub: { fontSize: 12, color: '#9CA3AF' },
  scoreCardRight: { flexDirection: 'row', alignItems: 'baseline' },
  scoreCardNum: { fontSize: 52, fontWeight: '900', letterSpacing: -2 },
  scoreCardDenom: { fontSize: 20, fontWeight: '600', color: '#C4C4C4' },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { fontSize: 14, fontWeight: '600', color: '#6B7280' },

  // Product Cards
  productRow: { gap: 12, paddingBottom: 4 },
  productCard: { width: 160 },
  productImageWrap: {
    width: 160, height: 148, borderRadius: 18, backgroundColor: '#FFFFFF', overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
  },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  scoreDot: {
    position: 'absolute', bottom: 10, left: 10, width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  productName: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 19, marginBottom: 3 },
  productBrand: { fontSize: 12, color: '#9CA3AF' },

  // Recent Scans
  recentSection: { marginTop: 28 },
  recentCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18,
    padding: 14, marginBottom: 10, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 },
  },
  recentImage: { width: 68, height: 68, borderRadius: 14, backgroundColor: '#F3F4F6' },
  recentPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  recentBrand: { fontSize: 13, color: '#9CA3AF', marginBottom: 6 },
  recentScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreDotSmall: { width: 10, height: 10, borderRadius: 5 },
  recentScoreNum: { fontSize: 14, fontWeight: '700', color: '#374151' },
  recentScoreLabel: { fontSize: 13, fontWeight: '600' },

  // Upgrade
  upgradeCTA: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 20, padding: 20, marginTop: 24,
    shadowColor: '#16A34A', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  upgradeLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  upgradeIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  upgradeTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  upgradeSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Score Card Empty
  scoreCardEmpty: { flex: 1 },
  scoreCardEmptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },

  // Score Info Modal
  modalOuter: { flex: 1, backgroundColor: '#FFFFFF' },
  modalSafe: { flex: 1 },
  modalScroll: { flex: 1 },
  modalScrollContent: { paddingHorizontal: 28, paddingTop: 16, paddingBottom: 40 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  modalScoreCircle: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center',
    marginBottom: 32,
  },
  modalScoreNum: { fontSize: 64, fontWeight: '900' },
  modalScoreDenom: { fontSize: 24, fontWeight: '600', color: '#C4C4C4' },
  modalSection: { marginBottom: 20 },
  modalSectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  modalSectionText: { fontSize: 15, color: '#6B7280', lineHeight: 22 },
  modalFactors: { gap: 16, marginBottom: 24 },
  modalFactor: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  modalFactorIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  modalFactorInfo: { flex: 1 },
  modalFactorTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  modalFactorDesc: { fontSize: 13, color: '#6B7280', lineHeight: 19 },
  modalTip: {
    backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16, marginTop: 'auto', marginBottom: 20,
  },
  modalTipText: { fontSize: 14, color: brand.primary, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
});
