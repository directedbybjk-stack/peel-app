import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { brand } from '@/constants/Colors';
import { getScanHistory, type ScanHistoryItem } from '@/lib/storage';

type TabType = 'pantry' | 'history';

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('history');

  useFocusEffect(
    useCallback(() => {
      getScanHistory().then(setHistory);
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
        /* My Pantry - Empty State */
        <View style={styles.pantryEmpty}>
          <Text style={styles.pantryEmptyTitle}>Nothing in here...</Text>
          <Text style={styles.pantryEmptySubtitle}>
            Tap the 'Add to Pantry' button on{'\n'}a product to get started.
          </Text>
          {/* Phone mockup placeholder */}
          <View style={styles.phoneMockup}>
            <View style={styles.phoneMockupInner}>
              <View style={styles.mockupHeader}>
                <Text style={styles.mockupHeaderText}>Product Detail</Text>
              </View>
              <View style={styles.mockupRow}>
                <View style={styles.mockupImagePlaceholder} />
                <View style={styles.mockupInfo}>
                  <View style={[styles.mockupLine, { width: '80%' }]} />
                  <View style={[styles.mockupLine, { width: '50%' }]} />
                  <View style={styles.mockupScoreRow}>
                    <View style={[styles.mockupDot, { backgroundColor: brand.primary }]} />
                    <View style={[styles.mockupLine, { width: '30%' }]} />
                  </View>
                </View>
              </View>
              <View style={styles.mockupButton}>
                <Text style={styles.mockupButtonText}>Add to Pantry</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        /* History */
        history.length > 0 ? (
          <FlatList
            data={history}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.historyCard, pressed && { opacity: 0.8 }]}
                onPress={() => router.push(`/product/${item.barcode}`)}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.historyImage} />
                ) : (
                  <View style={[styles.historyImage, styles.placeholder]}>
                    <Text style={{ color: '#D1D5DB', fontSize: 12 }}>N/A</Text>
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
            <Ionicons name="time-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptySubtitle}>Your scanned products will appear here</Text>
            <Pressable
              testID="history-scan-button"
              style={({ pressed }) => [styles.scanButton, pressed && styles.scanButtonPressed]}
              onPress={() => router.push('/(tabs)/scan')}
            >
              <Text style={styles.scanButtonText}>Scan a Product</Text>
            </Pressable>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F5' },

  // Tab Bar
  tabBar: {
    flexDirection: 'row', marginTop: 64, marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#EDEDEE', borderRadius: 12, padding: 3,
  },
  tabItem: {
    flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  tabText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#111827', fontWeight: '700' },

  // History
  listContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 10 },
  historyCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 14, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 1 },
  },
  historyImage: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#F3F4F6' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  historyBrand: { fontSize: 13, color: '#9CA3AF', marginBottom: 6 },
  historyScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreDot: { width: 10, height: 10, borderRadius: 5 },
  historyScoreNum: { fontSize: 14, fontWeight: '700', color: '#374151' },
  historyScoreLabel: { fontSize: 13, fontWeight: '600' },

  // Pantry Empty State
  pantryEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  pantryEmptyTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 10 },
  pantryEmptySubtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 22, marginBottom: 40 },

  // Phone Mockup
  phoneMockup: {
    width: 200, height: 280, borderRadius: 24, backgroundColor: '#111827',
    padding: 8, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
  },
  phoneMockupInner: {
    flex: 1, width: '100%', borderRadius: 18, backgroundColor: '#FFFFFF',
    padding: 14, justifyContent: 'center',
  },
  mockupHeader: { marginBottom: 12 },
  mockupHeaderText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  mockupRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  mockupImagePlaceholder: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#F3F4F6' },
  mockupInfo: { flex: 1, justifyContent: 'center', gap: 5 },
  mockupLine: { height: 8, borderRadius: 4, backgroundColor: '#F3F4F6' },
  mockupScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mockupDot: { width: 6, height: 6, borderRadius: 3 },
  mockupButton: {
    backgroundColor: '#F3F4F6', borderRadius: 8, paddingVertical: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  mockupButtonText: { fontSize: 10, fontWeight: '600', color: '#374151' },

  // Empty State
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 12 },
  emptySubtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', marginBottom: 16 },
  scanButton: { backgroundColor: brand.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  scanButtonPressed: { backgroundColor: brand.primaryDark },
  scanButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
