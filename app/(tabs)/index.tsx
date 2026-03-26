import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { brand } from '@/constants/Colors';
import { getScanHistory, getDailyScanCount, type ScanHistoryItem } from '@/lib/storage';

const FREE_SCAN_LIMIT = 10;

export default function HomeScreen() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [dailyScans, setDailyScans] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setHistory((await getScanHistory()).slice(0, 10));
        setDailyScans(await getDailyScanCount());
      };
      load();
    }, [])
  );

  const getScoreColor = (s: number) => s >= 80 ? brand.score.excellent : s >= 60 ? brand.score.good : s >= 30 ? brand.score.limit : brand.score.avoid;
  const getScoreLabel = (s: number) => s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 30 ? 'Limit' : 'Avoid';

  const remaining = FREE_SCAN_LIMIT - dailyScans;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getTimeOfDay()}</Text>
          <Text style={styles.appName}>Peel</Text>
        </View>
        <LinearGradient colors={['#16A34A', '#15803D']} style={styles.headerLogo}>
          <Text style={styles.headerLogoText}>P</Text>
        </LinearGradient>
      </View>

      {/* Scan Counter Card */}
      <View style={styles.scanCounterCard}>
        <View style={styles.scanCounterTop}>
          <Text style={styles.scanCounterLabel}>Today's Scans</Text>
          <Text style={styles.scanCounterValue}>{dailyScans}/{FREE_SCAN_LIMIT}</Text>
        </View>
        <View style={styles.progressOuter}>
          <LinearGradient
            colors={remaining > 3 ? ['#16A34A', '#22C55E'] : ['#F59E0B', '#EAB308']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressInner, { width: `${Math.min((dailyScans / FREE_SCAN_LIMIT) * 100, 100)}%` }]}
          />
        </View>
        <Text style={styles.scanCounterHint}>
          {remaining > 0 ? `${remaining} free scans remaining today` : 'Upgrade to Peel Pro for unlimited'}
        </Text>
      </View>

      {/* Scan CTA */}
      <Pressable testID="home-scan-button" style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]} onPress={() => router.push('/(tabs)/scan')}>
        <LinearGradient colors={['#16A34A', '#15803D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.scanCTA}>
          <View style={styles.scanCTAIcon}>
            <Text style={styles.scanCTAIconText}>Scan</Text>
          </View>
          <View style={styles.scanCTAText}>
            <Text style={styles.scanCTATitle}>Scan a Product</Text>
            <Text style={styles.scanCTASubtitle}>Point your camera at any barcode</Text>
          </View>
          <Text style={styles.scanCTAArrow}>→</Text>
        </LinearGradient>
      </Pressable>

      {/* Recent Scans */}
      {history.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <Pressable onPress={() => router.push('/(tabs)/history')}>
              <Text style={styles.seeAll}>See all →</Text>
            </Pressable>
          </View>
          {history.slice(0, 5).map((item, i) => (
            <Pressable key={i} style={({ pressed }) => [styles.historyItem, pressed && styles.historyItemPressed]} onPress={() => router.push(`/product/${item.barcode}`)}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.historyImage} />
              ) : (
                <View style={[styles.historyImage, styles.historyPlaceholder]}>
                  <Text style={styles.historyPlaceholderText}>N/A</Text>
                </View>
              )}
              <View style={styles.historyInfo}>
                <Text style={styles.historyName} numberOfLines={1}>{item.productName}</Text>
                <Text style={styles.historyBrand}>{item.brand}</Text>
              </View>
              <View style={[styles.historyScore, { backgroundColor: getScoreColor(item.score) + '18' }]}>
                <Text style={[styles.historyScoreNum, { color: getScoreColor(item.score) }]}>{item.score}</Text>
                <Text style={[styles.historyScoreLabel, { color: getScoreColor(item.score) }]}>{getScoreLabel(item.score)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>?</Text>
          </View>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptySubtitle}>Scan your first product to see{'\n'}what's really inside</Text>
        </View>
      )}
    </ScrollView>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 2 },
  appName: { fontSize: 34, fontWeight: '900', color: '#111827', letterSpacing: -1 },
  headerLogo: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  headerLogoText: { fontSize: 22, fontWeight: '900', color: '#FFF' },

  scanCounterCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  scanCounterTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  scanCounterLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  scanCounterValue: { fontSize: 14, fontWeight: '800', color: '#111827' },
  progressOuter: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, marginBottom: 10, overflow: 'hidden' },
  progressInner: { height: 8, borderRadius: 4 },
  scanCounterHint: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

  scanCTA: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 20, marginBottom: 28, gap: 14,
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  scanCTAIcon: {
    width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  scanCTAIconText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  scanCTAText: { flex: 1 },
  scanCTATitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  scanCTASubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  scanCTAArrow: { fontSize: 22, color: '#FFF', fontWeight: '600' },

  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  seeAll: { fontSize: 14, fontWeight: '700', color: '#16A34A' },

  historyItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  historyItemPressed: { transform: [{ scale: 0.98 }], backgroundColor: '#F9FAFB' },
  historyImage: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#F3F4F6' },
  historyPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  historyPlaceholderText: { fontSize: 11, color: '#D1D5DB', fontWeight: '600' },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  historyBrand: { fontSize: 13, color: '#9CA3AF', marginTop: 3 },
  historyScore: { alignItems: 'center', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14, minWidth: 52 },
  historyScoreNum: { fontSize: 20, fontWeight: '900' },
  historyScoreLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyIconText: { fontSize: 28, color: '#D1D5DB', fontWeight: '700' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
});
