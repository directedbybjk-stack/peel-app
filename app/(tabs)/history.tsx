import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { brand } from '@/constants/Colors';
import { getScanHistory, type ScanHistoryItem } from '@/lib/storage';

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>{history.length} products scanned</Text>
      </View>

      {history.length > 0 ? (
        <FlatList
          data={history}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable style={styles.item} onPress={() => router.push(`/product/${item.barcode}`)}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.placeholder]}><Text style={{ color: '#9CA3AF', fontSize: 12 }}>N/A</Text></View>
              )}
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.productName}</Text>
                <Text style={styles.brand}>{item.brand}</Text>
                <Text style={styles.date}>{formatDate(item.scannedAt)}</Text>
              </View>
              <View style={[styles.score, { backgroundColor: getScoreColor(item.score) + '20' }]}>
                <Text style={[styles.scoreText, { color: getScoreColor(item.score) }]}>{item.score}</Text>
                <Text style={[styles.scoreLabel, { color: getScoreColor(item.score) }]}>{getScoreLabel(item.score)}</Text>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>--</Text>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 32, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12, gap: 12 },
  image: { width: 52, height: 52, borderRadius: 10, backgroundColor: '#E5E7EB' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827' },
  brand: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  date: { fontSize: 12, color: '#D1D5DB', marginTop: 2 },
  score: { alignItems: 'center', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12 },
  scoreText: { fontSize: 18, fontWeight: '800' },
  scoreLabel: { fontSize: 10, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  scanButton: { backgroundColor: brand.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  scanButtonPressed: { backgroundColor: brand.primaryDark },
  scanButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
