import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Pressable, Share, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { brand } from '@/constants/Colors';
import { lookupProduct, searchProducts, type ProductData } from '@/lib/openfoodfacts';
import { addToScanHistory } from '@/lib/storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProductDetailScreen() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [inPantry, setInPantry] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [alternatives, setAlternatives] = useState<Array<{ barcode: string; productName: string; brand: string; imageUrl?: string }>>([]);

  useEffect(() => {
    if (!barcode) return;
    lookupProduct(barcode).then(async (p) => {
      if (p) {
        setProduct(p);
        await addToScanHistory({
          barcode: p.barcode, productName: p.productName, brand: p.brand,
          score: p.score, imageUrl: p.imageUrl, scannedAt: new Date().toISOString(),
        });
        // Fetch alternatives based on category
        if (p.categories) {
          const cat = p.categories.split(',')[0]?.trim();
          if (cat) {
            const alts = await searchProducts(`organic ${cat}`);
            setAlternatives(alts.filter((a) => a.barcode !== barcode).slice(0, 6));
          }
        }
      } else {
        setError(true);
      }
      setLoading(false);
    });
  }, [barcode]);

  const toggleSection = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getScoreColor = (s: number) => s >= 80 ? brand.score.excellent : s >= 60 ? brand.score.good : s >= 30 ? brand.score.limit : brand.score.avoid;
  const getScoreBg = (s: number): [string, string] => s >= 80 ? ['#DCFCE7', '#BBF7D0'] : s >= 60 ? ['#DCFCE7', '#D1FAE5'] : s >= 30 ? ['#FEF3C7', '#FDE68A'] : ['#FEE2E2', '#FECACA'];

  const handleShare = async () => {
    if (!product) return;
    await Share.share({ message: `${product.productName} scored ${product.score}/100 (${product.scoreLabel}) on Peel` });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Analyzing product...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIcon}><Text style={styles.errorIconText}>?</Text></View>
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <Text style={styles.errorText}>We couldn't find this product in our database.{'\n'}Try scanning again or searching by name.</Text>
      </View>
    );
  }

  const sc = getScoreColor(product.score);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={true} bounces={true}>
      {/* Product Header */}
      <View style={styles.productCard}>
        <View style={styles.productRow}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.productPlaceholder]}><Text style={{ color: '#9CA3AF', fontSize: 11 }}>No Image</Text></View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.productName}</Text>
            <Text style={styles.productBrand}>{product.brand}</Text>
            <LinearGradient colors={getScoreBg(product.score)} style={styles.scoreBadge}>
              <Text style={[styles.scoreNum, { color: sc }]}>{product.score}</Text>
              <Text style={[styles.scoreOf, { color: sc }]}>/100</Text>
              <View style={styles.scoreDivider} />
              <Text style={[styles.scoreLabel, { color: sc }]}>{product.scoreLabel}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable
            testID="pantry-button"
            style={[styles.actionBtn, inPantry && styles.actionBtnActive]}
            onPress={() => setInPantry(!inPantry)}
          >
            <Text style={[styles.actionBtnText, inPantry && styles.actionBtnTextActive]}>
              {inPantry ? 'Remove from Pantry' : 'Add to Pantry'}
            </Text>
          </Pressable>
          <Pressable testID="share-button" style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share</Text>
          </Pressable>
        </View>
      </View>

      {/* Analysis */}
      <View style={styles.analysisCard}>
        <View style={styles.analysisHeader}>
          <LinearGradient colors={['#16A34A', '#15803D']} style={styles.analysisIcon}>
            <Text style={styles.analysisIconText}>P</Text>
          </LinearGradient>
          <Text style={styles.analysisTitle}>Peel's Analysis</Text>
        </View>
        <Text style={styles.analysisText}>{product.analysis}</Text>
      </View>

      {/* Personalized Alerts */}
      {product.flags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PERSONALIZED ALERTS</Text>
          {product.flags.map((flag, i) => (
            <View key={i} style={[styles.alertRow, {
              backgroundColor: flag.severity === 'danger' ? '#FEF2F2' : '#FFFBEB',
              borderLeftColor: flag.severity === 'danger' ? '#EF4444' : '#F59E0B',
            }]}>
              <View style={[styles.alertDot, { backgroundColor: flag.severity === 'danger' ? '#EF4444' : '#F59E0B' }]} />
              <Text style={styles.alertText}>{flag.label}</Text>
              <View style={[styles.alertBadge, { backgroundColor: flag.severity === 'danger' ? '#EF4444' : '#F59E0B' }]}>
                <Text style={styles.alertBadgeText}>!</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.sectionLabel}>BREAKDOWN</Text>

        {/* Seed Oils */}
        <Pressable style={styles.breakdownRow} onPress={() => toggleSection('seedOils')}>
          <View style={styles.breakdownLeft}>
            <Text style={styles.breakdownLabel}>Seed Oils</Text>
            <View style={[styles.statusBadge, { backgroundColor: product.hasSeedOils ? '#FEE2E2' : '#DCFCE7' }]}>
              <Text style={[styles.statusText, { color: product.hasSeedOils ? '#DC2626' : '#16A34A' }]}>{product.hasSeedOils ? 'Present' : 'None'}</Text>
            </View>
          </View>
          <View style={styles.breakdownRight}>
            <View style={[styles.statusDot, { backgroundColor: product.hasSeedOils ? '#EF4444' : '#22C55E' }]} />
            <Text style={styles.chevron}>{expanded.seedOils ? '∧' : '∨'}</Text>
          </View>
        </Pressable>
        {expanded.seedOils && (
          <View style={styles.expandedContent}>
            {product.hasSeedOils ? (
              <>
                <Text style={styles.expandedLabel}>Seed oils found:</Text>
                <View style={styles.chipRow}>
                  {product.seedOilsFound.map((oil, i) => <View key={i} style={styles.dangerChip}><Text style={styles.dangerChipText}>{oil}</Text></View>)}
                </View>
                <Text style={styles.expandedInfo}>Seed oils are high in omega-6 fatty acids and can promote inflammation when consumed in excess.</Text>
              </>
            ) : (
              <Text style={styles.expandedInfo}>No seed oils detected in this product.</Text>
            )}
          </View>
        )}

        <View style={styles.divider} />

        {/* Processing */}
        <Pressable style={styles.breakdownRow} onPress={() => toggleSection('processing')}>
          <View style={styles.breakdownLeft}>
            <Text style={styles.breakdownLabel}>Processing Profile</Text>
            <View style={[styles.statusBadge, {
              backgroundColor: product.processingLevel === 'High' ? '#FEE2E2' : product.processingLevel === 'Medium' ? '#FEF3C7' : '#DCFCE7'
            }]}>
              <Text style={[styles.statusText, {
                color: product.processingLevel === 'High' ? '#DC2626' : product.processingLevel === 'Medium' ? '#D97706' : '#16A34A'
              }]}>{product.processingLevel}</Text>
            </View>
          </View>
          <View style={styles.breakdownRight}>
            <View style={[styles.statusDot, { backgroundColor: product.processingLevel === 'High' ? '#EF4444' : product.processingLevel === 'Medium' ? '#F59E0B' : '#22C55E' }]} />
            <Text style={styles.chevron}>{expanded.processing ? '∧' : '∨'}</Text>
          </View>
        </Pressable>
        {expanded.processing && (
          <View style={styles.expandedContent}>
            <Text style={styles.expandedLabel}>Processing Level</Text>
            <View style={styles.processingBar}>
              <LinearGradient colors={['#22C55E', '#F59E0B', '#EF4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.processingGradient} />
              <View style={[styles.processingDot, { left: product.processingLevel === 'High' ? '85%' : product.processingLevel === 'Medium' ? '50%' : '15%' }]} />
            </View>
            <View style={styles.processingLabels}>
              <Text style={styles.procLabel}>Unprocessed</Text>
              <Text style={styles.procLabel}>Ultra-processed</Text>
            </View>
            {product.additives.length > 0 && (
              <>
                <Text style={[styles.expandedLabel, { marginTop: 16 }]}>Additives</Text>
                <View style={styles.chipRow}>
                  {product.additives.slice(0, 10).map((a, i) => <View key={i} style={styles.warningChip}><Text style={styles.warningChipText}>{a}</Text></View>)}
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.divider} />

        {/* Detected Toxins */}
        <Pressable style={styles.breakdownRow} onPress={() => toggleSection('toxins')}>
          <View style={styles.breakdownLeft}>
            <Text style={styles.breakdownLabel}>Detected Toxins</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#F3F4F6' }]}>
              <Text style={[styles.statusText, { color: '#6B7280' }]}>No Data</Text>
            </View>
          </View>
          <View style={styles.breakdownRight}>
            <View style={[styles.statusDot, { backgroundColor: '#9CA3AF' }]} />
            <Text style={styles.chevron}>{expanded.toxins ? '∧' : '∨'}</Text>
          </View>
        </Pressable>
        {expanded.toxins && (
          <View style={styles.expandedContent}>
            <Text style={styles.expandedInfo}>Toxin data is not yet available for this product. We're working on expanding our database.</Text>
          </View>
        )}
      </View>

      {/* Better Alternatives */}
      {alternatives.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BETTER ALTERNATIVES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.altRow}>
            {alternatives.map((alt, i) => (
              <Pressable key={i} style={styles.altCard} onPress={() => router.push(`/product/${alt.barcode}`)}>
                {alt.imageUrl ? (
                  <Image source={{ uri: alt.imageUrl }} style={styles.altImage} />
                ) : (
                  <View style={[styles.altImage, styles.altPlaceholder]}><Text style={{ fontSize: 10, color: '#9CA3AF' }}>N/A</Text></View>
                )}
                <Text style={styles.altName} numberOfLines={2}>{alt.productName}</Text>
                <Text style={styles.altBrand} numberOfLines={1}>{alt.brand}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Ingredients */}
      <View style={styles.ingredientsCard}>
        <Text style={styles.sectionLabel}>INGREDIENTS</Text>
        <Text style={styles.ingredientsText}>{product.ingredients}</Text>
      </View>
    </ScrollView>
  );
}

// Need router for alternatives navigation
import { router } from 'expo-router';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#FAFAFA' },
  loadingText: { fontSize: 15, color: '#6B7280', marginTop: 16 },
  errorIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  errorIconText: { fontSize: 24, color: '#D1D5DB', fontWeight: '700' },
  errorTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  errorText: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },

  productCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  productRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  productImage: { width: 90, height: 90, borderRadius: 16, backgroundColor: '#F3F4F6' },
  productPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  productBrand: { fontSize: 13, color: '#9CA3AF', marginBottom: 10 },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14, gap: 3 },
  scoreNum: { fontSize: 22, fontWeight: '900' },
  scoreOf: { fontSize: 14, fontWeight: '600' },
  scoreDivider: { width: 1, height: 16, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 6 },
  scoreLabel: { fontSize: 14, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    borderWidth: 2, borderColor: '#16A34A', backgroundColor: '#FFFFFF',
  },
  actionBtnActive: { backgroundColor: '#F0FDF4' },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#16A34A' },
  actionBtnTextActive: { color: '#15803D' },
  shareBtn: {
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  shareBtnText: { fontSize: 14, fontWeight: '700', color: '#374151' },

  analysisCard: { backgroundColor: '#F0FDF4', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#DCFCE7' },
  analysisHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  analysisIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  analysisIconText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  analysisTitle: { fontSize: 16, fontWeight: '700', color: '#15803D' },
  analysisText: { fontSize: 14, color: '#374151', lineHeight: 22 },

  section: { marginBottom: 14 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#6B7280', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },

  alertRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, gap: 10, borderLeftWidth: 4, marginBottom: 8 },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertText: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
  alertBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  alertBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '900' },

  breakdownCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  breakdownLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  statusBadge: { borderRadius: 8, paddingVertical: 3, paddingHorizontal: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
  breakdownRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  chevron: { fontSize: 16, color: '#9CA3AF', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F3F4F6' },

  expandedContent: { paddingBottom: 14, paddingLeft: 4 },
  expandedLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  expandedInfo: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginTop: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dangerChip: { backgroundColor: '#FEE2E2', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  dangerChipText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  warningChip: { backgroundColor: '#FEF3C7', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  warningChipText: { fontSize: 12, fontWeight: '600', color: '#92400E' },

  processingBar: { height: 8, borderRadius: 4, marginBottom: 6, overflow: 'hidden', position: 'relative' },
  processingGradient: { height: 8, borderRadius: 4, width: '100%' },
  processingDot: { position: 'absolute', top: -3, width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFF', borderWidth: 3, borderColor: '#374151' },
  processingLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  procLabel: { fontSize: 11, color: '#9CA3AF' },

  altRow: { gap: 12, paddingRight: 20 },
  altCard: {
    width: 120, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  altImage: { width: '100%', height: 80, borderRadius: 12, backgroundColor: '#F3F4F6', marginBottom: 8 },
  altPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  altName: { fontSize: 12, fontWeight: '600', color: '#111827', marginBottom: 2 },
  altBrand: { fontSize: 11, color: '#9CA3AF' },

  ingredientsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  ingredientsText: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
});
