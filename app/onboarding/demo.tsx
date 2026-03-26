import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { brand } from '@/constants/Colors';
import { lookupProduct, type ProductData } from '@/lib/openfoodfacts';
import { savePreferences, setOnboardingComplete } from '@/lib/storage';

const DEMO_BARCODES = ['0044000032197', '0028400064057', '0049000006346'];

export default function DemoScreen() {
  const { goals, allergies } = useLocalSearchParams<{ goals: string; allergies: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function tryBarcodes() {
      for (const barcode of DEMO_BARCODES) {
        const p = await lookupProduct(barcode);
        if (p) { setProduct(p); setLoading(false); return; }
      }
      setLoading(false);
    }
    tryBarcodes();
  }, []);

  const handleStart = async () => {
    await savePreferences({ goal: goals || '', allergies: (allergies || '').split(',').filter(Boolean) });
    await setOnboardingComplete();
    router.replace('/(tabs)');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return brand.score.excellent;
    if (score >= 60) return brand.score.good;
    if (score >= 30) return brand.score.limit;
    return brand.score.avoid;
  };

  const getScoreBg = (score: number): [string, string] => {
    if (score >= 80) return ['#DCFCE7', '#BBF7D0'];
    if (score >= 60) return ['#DCFCE7', '#D1FAE5'];
    if (score >= 30) return ['#FEF3C7', '#FDE68A'];
    return ['#FEE2E2', '#FECACA'];
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <LinearGradient colors={['#16A34A', '#22C55E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: '100%' }]} />
        </View>
        <Text style={styles.step}>Step 3 of 3</Text>
      </View>

      <Text style={styles.title}>Here's what Peel{'\n'}can do for you</Text>
      <Text style={styles.subtitle}>Real product analysis — no sign-up needed</Text>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.loadingText}>Analyzing a real product...</Text>
          </View>
        ) : product ? (
          <>
            {/* Product Card */}
            <View style={styles.productCard}>
              <View style={styles.productRow}>
                {product.imageUrl ? (
                  <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                ) : (
                  <View style={[styles.productImage, styles.productImagePlaceholder]}>
                    <Text style={styles.placeholderText}>No Image</Text>
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{product.productName}</Text>
                  <Text style={styles.productBrand}>{product.brand}</Text>
                  <LinearGradient colors={getScoreBg(product.score)} style={styles.scoreBadge}>
                    <Text style={[styles.scoreNumber, { color: getScoreColor(product.score) }]}>{product.score}</Text>
                    <Text style={[styles.scoreOf, { color: getScoreColor(product.score) }]}>/100</Text>
                    <View style={styles.scoreDivider} />
                    <Text style={[styles.scoreLabel, { color: getScoreColor(product.score) }]}>{product.scoreLabel}</Text>
                  </LinearGradient>
                </View>
              </View>
            </View>

            {/* Analysis */}
            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <View style={styles.analysisDot} />
                <Text style={styles.analysisTitle}>Peel's Analysis</Text>
              </View>
              <Text style={styles.analysisText}>{product.analysis}</Text>
            </View>

            {/* Flags */}
            {product.flags.length > 0 && (
              <View style={styles.flagsSection}>
                {product.flags.map((flag, i) => (
                  <View
                    key={i}
                    style={[styles.flagRow, {
                      backgroundColor: flag.severity === 'danger' ? '#FEF2F2' : '#FFFBEB',
                      borderLeftColor: flag.severity === 'danger' ? '#EF4444' : '#F59E0B',
                    }]}
                  >
                    <View style={[styles.flagDot, { backgroundColor: flag.severity === 'danger' ? '#EF4444' : '#F59E0B' }]} />
                    <Text style={styles.flagText}>{flag.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Breakdown */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Quick Breakdown</Text>
              <BreakdownRow label="Seed Oils" value={product.hasSeedOils ? 'Present' : 'None'} color={product.hasSeedOils ? '#EF4444' : '#22C55E'} />
              <BreakdownRow label="Processing" value={product.processingLevel} color={product.processingLevel === 'High' ? '#EF4444' : product.processingLevel === 'Medium' ? '#F59E0B' : '#22C55E'} />
              <BreakdownRow label="Additives" value={product.hasAdditives ? `${product.additives.length} found` : 'None'} color={product.hasAdditives ? '#F59E0B' : '#22C55E'} />
            </View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Could not load demo product.{'\n'}No worries — you can still continue!</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable testID="start-scanning-button" onPress={handleStart}>
          <LinearGradient
            colors={['#16A34A', '#15803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Start Scanning</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function BreakdownRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={bStyles.row}>
      <Text style={bStyles.label}>{label}</Text>
      <View style={bStyles.valueContainer}>
        <Text style={[bStyles.value, { color }]}>{value}</Text>
        <View style={[bStyles.dot, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

const bStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
  valueContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { fontSize: 15, fontWeight: '700' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', paddingTop: 60 },
  progressContainer: { paddingHorizontal: 28, marginBottom: 24 },
  progressTrack: { height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  step: { fontSize: 13, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '900', color: '#111827', lineHeight: 38, paddingHorizontal: 28, marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', paddingHorizontal: 28, lineHeight: 22 },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 14 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 },
  loadingText: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  productRow: { flexDirection: 'row', gap: 16 },
  productImage: { width: 85, height: 85, borderRadius: 16, backgroundColor: '#F3F4F6' },
  productImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 11, color: '#9CA3AF' },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 3 },
  productBrand: { fontSize: 13, color: '#9CA3AF', marginBottom: 10 },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14, gap: 3 },
  scoreNumber: { fontSize: 22, fontWeight: '900' },
  scoreOf: { fontSize: 14, fontWeight: '600' },
  scoreDivider: { width: 1, height: 16, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 6 },
  scoreLabel: { fontSize: 14, fontWeight: '700' },
  analysisCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  analysisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  analysisDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  analysisTitle: { fontSize: 16, fontWeight: '700', color: '#15803D' },
  analysisText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  flagsSection: { gap: 8 },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderLeftWidth: 4,
  },
  flagDot: { width: 8, height: 8, borderRadius: 4 },
  flagText: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  breakdownTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  bottom: { paddingHorizontal: 20, paddingBottom: 50, paddingTop: 8 },
  buttonGradient: {
    flexDirection: 'row',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  buttonArrow: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
});
