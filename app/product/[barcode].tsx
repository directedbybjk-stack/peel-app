import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Pressable, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { brand } from '@/constants/Colors';
import { lookupProduct, type ProductData } from '@/lib/openfoodfacts';
import { addToScanHistory } from '@/lib/storage';

export default function ProductDetailScreen() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!barcode) return;
    lookupProduct(barcode).then(async (p) => {
      if (p) {
        setProduct(p);
        await addToScanHistory({
          barcode: p.barcode,
          productName: p.productName,
          brand: p.brand,
          score: p.score,
          imageUrl: p.imageUrl,
          scannedAt: new Date().toISOString(),
        });
      } else {
        setError(true);
      }
      setLoading(false);
    });
  }, [barcode]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return brand.score.excellent;
    if (score >= 60) return brand.score.good;
    if (score >= 30) return brand.score.limit;
    return brand.score.avoid;
  };

  const handleShare = async () => {
    if (!product) return;
    await Share.share({
      message: `${product.productName} scored ${product.score}/100 (${product.scoreLabel}) on Peel`,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.primary} />
        <Text style={styles.loadingText}>Analyzing product...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>?</Text>
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <Text style={styles.errorText}>
          We couldn't find this product in our database. Try scanning again or searching by name.
        </Text>
      </View>
    );
  }

  const scoreColor = getScoreColor(product.score);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Product Header */}
      <View style={styles.productHeader}>
        {product.imageUrl && (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.productName}</Text>
          <Text style={styles.productBrand}>{product.brand}</Text>
          <View style={styles.scoreRow}>
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
              <Text style={[styles.scoreNumber, { color: scoreColor }]}>{product.score}/100</Text>
            </View>
            <Text style={[styles.scoreLabel, { color: scoreColor }]}>{product.scoreLabel}</Text>
          </View>
        </View>
      </View>

      {/* Share Button */}
      <Pressable testID="share-button" style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareText}>Share Result</Text>
      </Pressable>

      {/* Analysis */}
      <View style={styles.analysisCard}>
        <Text style={styles.cardTitle}>Peel's Analysis</Text>
        <Text style={styles.analysisText}>{product.analysis}</Text>
      </View>

      {/* Flags */}
      {product.flags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.cardTitle}>Personalized Alerts</Text>
          {product.flags.map((flag, i) => (
            <View
              key={i}
              style={[
                styles.flagRow,
                { backgroundColor: flag.severity === 'danger' ? brand.dangerLight : brand.warningLight },
              ]}
            >
              <Text style={styles.flagIcon}>{flag.severity === 'danger' ? '●' : '●'}</Text>
              <Text style={styles.flagText}>{flag.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.cardTitle}>Breakdown</Text>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLeft}>
            <Text style={styles.breakdownIcon}>Oil</Text>
            <Text style={styles.breakdownLabel}>Seed Oils</Text>
          </View>
          <View style={styles.breakdownRight}>
            <Text style={[styles.breakdownStatus, { color: product.hasSeedOils ? '#EF4444' : '#22C55E' }]}>
              {product.hasSeedOils ? 'Present' : 'None'}
            </Text>
            <Text style={{ color: product.hasSeedOils ? '#EF4444' : '#22C55E' }}>●</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLeft}>
            <Text style={styles.breakdownIcon}>Proc</Text>
            <Text style={styles.breakdownLabel}>Processing</Text>
          </View>
          <View style={styles.breakdownRight}>
            <Text style={[styles.breakdownStatus, {
              color: product.processingLevel === 'High' ? '#EF4444' : product.processingLevel === 'Medium' ? '#F59E0B' : '#22C55E'
            }]}>
              {product.processingLevel}
            </Text>
            <Text style={{ color: product.processingLevel === 'High' ? '#EF4444' : product.processingLevel === 'Medium' ? '#F59E0B' : '#22C55E' }}>●</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLeft}>
            <Text style={styles.breakdownIcon}>Add</Text>
            <Text style={styles.breakdownLabel}>Additives</Text>
          </View>
          <View style={styles.breakdownRight}>
            <Text style={[styles.breakdownStatus, { color: product.hasAdditives ? '#F59E0B' : '#22C55E' }]}>
              {product.hasAdditives ? `${product.additives.length} found` : 'None'}
            </Text>
            <Text style={{ color: product.hasAdditives ? '#F59E0B' : '#22C55E' }}>●</Text>
          </View>
        </View>
      </View>

      {/* Additives Detail */}
      {product.additives.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.cardTitle}>Additives Found</Text>
          <View style={styles.chipContainer}>
            {product.additives.map((a, i) => (
              <View key={i} style={styles.additivechip}>
                <Text style={styles.additivechipText}>{a}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Ingredients */}
      <View style={styles.section}>
        <Text style={styles.cardTitle}>Ingredients</Text>
        <View style={styles.ingredientsBox}>
          <Text style={styles.ingredientsText}>{product.ingredients}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { fontSize: 16, color: '#6B7280', marginTop: 16 },
  errorEmoji: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  errorText: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  productHeader: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  productImage: { width: 100, height: 100, borderRadius: 16, backgroundColor: '#F3F4F6' },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  productBrand: { fontSize: 14, color: '#6B7280', marginBottom: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreBadge: { borderRadius: 10, paddingVertical: 4, paddingHorizontal: 12 },
  scoreNumber: { fontSize: 20, fontWeight: '800' },
  scoreLabel: { fontSize: 16, fontWeight: '700' },
  shareButton: {
    alignSelf: 'flex-start', backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 16, marginBottom: 20,
  },
  shareText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  analysisCard: { backgroundColor: '#F0FDF4', borderRadius: 16, padding: 16, marginBottom: 20 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 10 },
  analysisText: { fontSize: 15, color: '#374151', lineHeight: 24 },
  section: { marginBottom: 20 },
  flagRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, gap: 10, marginBottom: 8 },
  flagIcon: { fontSize: 14 },
  flagText: { fontSize: 14, fontWeight: '500', color: '#374151', flex: 1 },
  breakdownCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 20 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakdownIcon: { fontSize: 18 },
  breakdownLabel: { fontSize: 15, color: '#6B7280' },
  breakdownRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownStatus: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  additivechip: { backgroundColor: '#FEF3C7', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  additivechipText: { fontSize: 13, fontWeight: '500', color: '#92400E' },
  ingredientsBox: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14 },
  ingredientsText: { fontSize: 14, color: '#374151', lineHeight: 22 },
});
