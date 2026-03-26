import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { brand } from '@/constants/Colors';
import { getScanHistory, getDailyScanCount, getPreferences, type ScanHistoryItem } from '@/lib/storage';
import { FALLBACK_CATALOG } from '@/lib/fallback-products';

const FREE_SCAN_LIMIT = 10;

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

  // Get featured products from fallback catalog
  const featuredProducts = [
    ...FALLBACK_CATALOG['protein-bars'].slice(0, 2),
    ...FALLBACK_CATALOG['snacks'].slice(0, 2),
    ...FALLBACK_CATALOG['drinks'].slice(0, 2),
  ];

  // Calculate overall Peel Score from history
  const peelScore = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length)
    : 70;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
            <Ionicons name="person" size={22} color={brand.primary} />
          </View>
        </View>
      </View>

      {/* Rank Card */}
      <LinearGradient
        colors={['#15803D', '#166534']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.rankCard}
      >
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
      <View style={styles.scoreCard}>
        <View style={styles.scoreCardLeft}>
          <Text style={styles.scoreCardLabel}>PEEL SCORE</Text>
          <View style={[styles.scoreCardBadge, { backgroundColor: getScoreColor(peelScore) + '20' }]}>
            <Text style={[styles.scoreCardBadgeText, { color: getScoreColor(peelScore) }]}>
              {getScoreLabel(peelScore)}
            </Text>
          </View>
          <Text style={styles.scoreCardSub}>
            Based on {history.length} item{history.length !== 1 ? 's' : ''} scanned
          </Text>
        </View>
        <View style={styles.scoreCardRight}>
          <Text style={[styles.scoreCardNum, { color: getScoreColor(peelScore) }]}>{peelScore}</Text>
          <Text style={styles.scoreCardDenom}>/100</Text>
        </View>
      </View>

      {/* Featured Products */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Products</Text>
        <Pressable onPress={() => router.push('/(tabs)/search')}>
          <Text style={styles.seeAll}>See all  ›</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
        {featuredProducts.map((product) => {
          const score = getScoreFromGrade(product.nutriscoreGrade);
          return (
            <Pressable
              key={product.barcode}
              style={({ pressed }) => [styles.productCard, pressed && { opacity: 0.8 }]}
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
            <Pressable onPress={() => router.push('/(tabs)/history')}>
              <Text style={styles.seeAll}>See all  ›</Text>
            </Pressable>
          </View>
          {history.slice(0, 3).map((item, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.recentCard, pressed && { opacity: 0.8 }]}
              onPress={() => router.push(`/product/${item.barcode}`)}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.recentImage} />
              ) : (
                <View style={[styles.recentImage, styles.recentPlaceholder]}>
                  <Text style={{ color: '#D1D5DB', fontSize: 12 }}>N/A</Text>
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
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Upgrade CTA */}
      <Pressable
        testID="home-upgrade-button"
        style={({ pressed }) => [styles.upgradeCTA, pressed && { opacity: 0.9 }]}
        onPress={() => router.push('/paywall')}
      >
        <View>
          <Text style={styles.upgradeTitle}>Upgrade to Peel Pro</Text>
          <Text style={styles.upgradeSubtitle}>Unlimited scans & personalized insights</Text>
        </View>
        <Text style={styles.upgradeArrow}>→</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F5' },
  content: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 120 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 15, fontWeight: '500', color: '#9CA3AF', marginBottom: 2 },
  userName: { fontSize: 28, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  streakCount: { fontSize: 14, fontWeight: '800', color: '#111827' },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: brand.primary,
  },

  // Rank Card
  rankCard: { borderRadius: 20, padding: 22, marginBottom: 14 },
  rankTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  rankLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: 1, marginBottom: 4 },
  rankName: { fontSize: 30, fontWeight: '900', color: '#FFFFFF' },
  rankEmojiCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  rankBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rankScans: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  rankNext: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  rankProgressOuter: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  rankProgressInner: { height: 6, backgroundColor: '#FFFFFF', borderRadius: 3 },

  // Score Card
  scoreCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, marginBottom: 28,
    borderWidth: 1.5, borderColor: '#DCFCE7',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  scoreCardLeft: {},
  scoreCardLabel: { fontSize: 12, fontWeight: '800', color: '#6B7280', letterSpacing: 1, marginBottom: 8 },
  scoreCardBadge: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 12, alignSelf: 'flex-start', marginBottom: 6 },
  scoreCardBadgeText: { fontSize: 13, fontWeight: '700' },
  scoreCardSub: { fontSize: 12, color: '#9CA3AF' },
  scoreCardRight: { flexDirection: 'row', alignItems: 'baseline' },
  scoreCardNum: { fontSize: 48, fontWeight: '900' },
  scoreCardDenom: { fontSize: 20, fontWeight: '600', color: '#9CA3AF' },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  seeAll: { fontSize: 14, fontWeight: '600', color: '#6B7280' },

  // Product Cards
  productRow: { gap: 12, paddingBottom: 4 },
  productCard: { width: 155 },
  productImageWrap: {
    width: 155, height: 140, borderRadius: 16, backgroundColor: '#FFFFFF', overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  scoreDot: { position: 'absolute', bottom: 10, left: 10, width: 12, height: 12, borderRadius: 6 },
  productName: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 19, marginBottom: 2 },
  productBrand: { fontSize: 12, color: '#9CA3AF' },

  // Recent Scans
  recentSection: { marginTop: 28 },
  recentCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 14, marginBottom: 10, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 1 },
  },
  recentImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#F3F4F6' },
  recentPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  recentBrand: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
  recentScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreDotSmall: { width: 10, height: 10, borderRadius: 5 },
  recentScoreNum: { fontSize: 14, fontWeight: '700', color: '#374151' },
  recentScoreLabel: { fontSize: 13, fontWeight: '600' },
  chevron: { fontSize: 22, color: '#D1D5DB' },

  // Upgrade
  upgradeCTA: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: brand.primary, borderRadius: 18, padding: 20, marginTop: 24,
  },
  upgradeTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  upgradeSubtitle: { fontSize: 13, color: '#DCFCE7', marginTop: 2 },
  upgradeArrow: { fontSize: 20, color: '#FFFFFF', fontWeight: '600' },
});
