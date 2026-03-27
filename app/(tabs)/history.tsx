import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { brand } from '@/constants/Colors';
import { getScanHistory, getPantry, type ScanHistoryItem } from '@/lib/storage';

type TabType = 'pantry' | 'history';

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [pantry, setPantry] = useState<ScanHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('history');

  useFocusEffect(
    useCallback(() => {
      getScanHistory().then(setHistory);
      getPantry().then(setPantry);
    }, [])
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return brand.score.excellent;
    if (score >= 60) return brand.score.good;
    if (score >= 30) return brand.score.limit;
    return brand.score.avoid;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 30) return 'Limit';
    return 'Avoid';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F0FDF4', '#F5F7F5']} style={styles.topGradient} />

      {/* Segmented Tab Control */}
      <View style={styles.tabBar}>
        <Pressable
          testID="pantry-tab"
          style={[styles.tabItem, activeTab === 'pantry' && styles.tabItemActive]}
          onPress={() => setActiveTab('pantry')}
        >
          <Text style={[styles.tabText, activeTab === 'pantry' && styles.tabTextActive]}>My Pantry</Text>
        </Pressable>
        <Pressable
          testID="history-tab"
          style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
        </Pressable>
      </View>

      {activeTab === 'pantry' ? (
        pantry.length > 0 ? (
          <FlatList
            data={pantry}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.historyCard, pressed && { transform: [{ scale: 0.98 }] }]}
                onPress={() => router.push(`/product/${item.barcode}`)}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.historyImage} />
                ) : (
                  <View style={[styles.historyImage, styles.placeholder]}>
                    <Ionicons name="image-outline" size={22} color="#D1D5DB" />
                  </View>
                )}
                <View style={styles.historyInfo}>
                  <Text style={styles.historyName} numberOfLines={1}>{item.productName}</Text>
                  <Text style={styles.historyBrand}>{item.brand}</Text>
                  <View style={styles.historyScoreRow}>
                    <View style={[styles.scoreDot, { backgroundColor: getScoreColor(item.score) }]} />
                    <Text style={styles.historyScoreNum}>{item.score}/100</Text>
                    <Text style={[styles.historyScoreLabel, { color: getScoreColor(item.score) }]}>
                      {getScoreLabel(item.score)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </Pressable>
            )}
          />
        ) : (
        <View style={styles.pantryEmpty}>
          <Text style={styles.pantryEmptyTitle}>Nothing in here...</Text>
          <Text style={styles.pantryEmptySubtitle}>
            Tap the 'Add to Pantry' button on{'\n'}a product to get started.
          </Text>
          {/* Phone mockup */}
          <View style={styles.phoneMockup}>
            <View style={styles.phoneNotch} />
            <View style={styles.phoneMockupInner}>
              <View style={styles.mockupHeader}>
                <Ionicons name="chevron-back" size={14} color="#6B7280" />
                <Text style={styles.mockupHeaderText}>History</Text>
              </View>
              <View style={styles.mockupRow}>
                <View style={styles.mockupImagePlaceholder}>
                  <Ionicons name="image-outline" size={16} color="#D1D5DB" />
                </View>
                <View style={styles.mockupInfo}>
                  <Text style={styles.mockupProductName}>Organic Corn Flakes</Text>
                  <Text style={styles.mockupBrandName}>The Real Cereal Co.</Text>
                  <View style={styles.mockupScoreRow}>
                    <View style={[styles.mockupDot, { backgroundColor: brand.primary }]} />
                    <Text style={styles.mockupScoreText}>100/100</Text>
                    <Text style={[styles.mockupScoreLabel, { color: brand.primary }]}>Excellent</Text>
                  </View>
                </View>
              </View>
              <View style={styles.mockupButton}>
                <Text style={styles.mockupButtonText}>Add to Pantry</Text>
              </View>
              <View style={styles.mockupAnalysis}>
                <View style={styles.mockupAnalysisHeader}>
                  <View style={styles.mockupAnalysisIcon} />
                  <Text style={styles.mockupAnalysisTitle}>Peel Says:</Text>
                </View>
                <View style={[styles.mockupLine, { width: '100%' }]} />
                <View style={[styles.mockupLine, { width: '80%' }]} />
                <View style={[styles.mockupLine, { width: '60%' }]} />
              </View>
            </View>
          </View>
        </View>
        )
      ) : (
        /* History */
        history.length > 0 ? (
          <FlatList
            data={history}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.historyCard, pressed && { transform: [{ scale: 0.98 }] }]}
                onPress={() => router.push(`/product/${item.barcode}`)}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.historyImage} />
                ) : (
                  <View style={[styles.historyImage, styles.placeholder]}>
                    <Ionicons name="image-outline" size={22} color="#D1D5DB" />
                  </View>
                )}
                <View style={styles.historyInfo}>
                  <Text style={styles.historyName} numberOfLines={1}>{item.productName}</Text>
                  <Text style={styles.historyBrand}>{item.brand}</Text>
                  <View style={styles.historyScoreRow}>
                    <View style={[styles.scoreDot, { backgroundColor: getScoreColor(item.score) }]} />
                    <Text style={styles.historyScoreNum}>{item.score}/100</Text>
                    <Text style={[styles.historyScoreLabel, { color: getScoreColor(item.score) }]}>
                      {getScoreLabel(item.score)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </Pressable>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="time-outline" size={36} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptySubtitle}>Your scanned products will appear here</Text>
            <Pressable
              testID="history-scan-button"
              style={({ pressed }) => [styles.scanButton, pressed && { transform: [{ scale: 0.97 }] }]}
              onPress={() => router.push('/(tabs)/scan')}
            >
              <LinearGradient
                colors={['#16A34A', '#15803D']}
                style={styles.scanButtonGradient}
              >
                <Ionicons name="scan-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.scanButtonText}>Scan a Product</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F5' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 160 },

  // Tab Bar
  tabBar: {
    flexDirection: 'row', marginTop: 64, marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#EDEDEE', borderRadius: 14, padding: 3,
  },
  tabItem: {
    flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 11,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  tabText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#111827', fontWeight: '700' },

  // History
  listContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 10 },
  historyCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18,
    padding: 14, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 },
  },
  historyImage: { width: 76, height: 76, borderRadius: 14, backgroundColor: '#F3F4F6' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 3 },
  historyBrand: { fontSize: 13, color: '#9CA3AF', marginBottom: 6 },
  historyScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreDot: { width: 10, height: 10, borderRadius: 5 },
  historyScoreNum: { fontSize: 14, fontWeight: '700', color: '#374151' },
  historyScoreLabel: { fontSize: 13, fontWeight: '600' },

  // Pantry Empty State
  pantryEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  pantryEmptyTitle: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 10 },
  pantryEmptySubtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 22, marginBottom: 36 },

  // Phone Mockup — more realistic
  phoneMockup: {
    width: 220, height: 340, borderRadius: 28, backgroundColor: '#1A1A1A',
    padding: 6, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 12 },
  },
  phoneNotch: {
    width: 80, height: 5, borderRadius: 3, backgroundColor: '#333',
    marginTop: 6, marginBottom: 4,
  },
  phoneMockupInner: {
    flex: 1, width: '100%', borderRadius: 22, backgroundColor: '#FFFFFF',
    padding: 14, overflow: 'hidden',
  },
  mockupHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  mockupHeaderText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  mockupRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  mockupImagePlaceholder: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  mockupInfo: { flex: 1, justifyContent: 'center' },
  mockupProductName: { fontSize: 11, fontWeight: '700', color: '#111827', marginBottom: 1 },
  mockupBrandName: { fontSize: 9, color: '#9CA3AF', marginBottom: 3 },
  mockupScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  mockupDot: { width: 5, height: 5, borderRadius: 3 },
  mockupScoreText: { fontSize: 9, fontWeight: '700', color: '#374151' },
  mockupScoreLabel: { fontSize: 9, fontWeight: '600' },
  mockupButton: {
    backgroundColor: '#FFFFFF', borderRadius: 8, paddingVertical: 7,
    alignItems: 'center', borderWidth: 1.5, borderColor: brand.primary, marginBottom: 12,
  },
  mockupButtonText: { fontSize: 10, fontWeight: '700', color: brand.primary },
  mockupAnalysis: {
    backgroundColor: '#F0FDF4', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#DCFCE7',
  },
  mockupAnalysisHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  mockupAnalysisIcon: { width: 16, height: 16, borderRadius: 5, backgroundColor: brand.primary },
  mockupAnalysisTitle: { fontSize: 9, fontWeight: '700', color: '#15803D' },
  mockupLine: { height: 6, borderRadius: 3, backgroundColor: '#E5E7EB', marginBottom: 4 },

  // Empty State
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 6 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 4 },
  emptySubtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', marginBottom: 20 },
  scanButton: { borderRadius: 16, overflow: 'hidden' },
  scanButtonGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, paddingHorizontal: 32, borderRadius: 16,
  },
  scanButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
