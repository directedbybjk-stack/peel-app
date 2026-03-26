import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { brand } from '@/constants/Colors';
import { lookupProduct, type ProductData } from '@/lib/openfoodfacts';
import { savePreferences, setOnboardingComplete } from '@/lib/storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DEMO_BARCODES = ['0044000032197', '0028400064057', '0049000006346'];

export default function DemoScreen() {
  const { goals, allergies } = useLocalSearchParams<{ goals: string; allergies: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

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

  const toggleSection = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

      {/* Fixed header */}
      <View style={styles.headerFixed}>
        <View style={styles.progressTrack}>
          <LinearGradient colors={['#16A34A', '#22C55E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: '100%' }]} />
        </View>
        <Text style={styles.step}>Step 3 of 3</Text>
        <Text style={styles.title}>Here's what Peel{'\n'}can do for you</Text>
        <Text style={styles.subtitle}>Real product analysis — no sign-up needed</Text>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
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
                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>No Image</Text>
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

            {/* Personalized Alerts */}
            {product.flags.length > 0 && (
              <View style={styles.alertsSection}>
                <Text style={styles.sectionTitle}>PERSONALIZED ALERTS</Text>
                {product.flags.map((flag, i) => (
                  <View
                    key={i}
                    style={[styles.alertRow, {
                      backgroundColor: flag.severity === 'danger' ? '#FEF2F2' : '#FFFBEB',
                      borderLeftColor: flag.severity === 'danger' ? '#EF4444' : '#F59E0B',
                    }]}
                  >
                    <View style={[styles.alertDot, { backgroundColor: flag.severity === 'danger' ? '#EF4444' : '#F59E0B' }]} />
                    <Text style={styles.alertText}>{flag.label}</Text>
                    <View style={[styles.alertBadge, { backgroundColor: flag.severity === 'danger' ? '#EF4444' : '#F59E0B' }]}>
                      <Text style={styles.alertBadgeText}>!</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Breakdown — Expandable like Olive */}
            <View style={styles.breakdownCard}>
              <Text style={styles.sectionTitle}>BREAKDOWN</Text>

              {/* Seed Oils */}
              <Pressable style={styles.breakdownRow} onPress={() => toggleSection('seedOils')}>
                <View style={styles.breakdownLeft}>
                  <Text style={styles.breakdownLabel}>Seed Oils</Text>
                  <View style={[styles.statusBadge, { backgroundColor: product.hasSeedOils ? '#FEE2E2' : '#DCFCE7' }]}>
                    <Text style={[styles.statusText, { color: product.hasSeedOils ? '#DC2626' : '#16A34A' }]}>
                      {product.hasSeedOils ? 'Present' : 'None'}
                    </Text>
                  </View>
                </View>
                <View style={styles.breakdownRight}>
                  <View style={[styles.statusDot, { backgroundColor: product.hasSeedOils ? '#EF4444' : '#22C55E' }]} />
                  <Text style={styles.chevron}>{expandedSections.seedOils ? '∧' : '∨'}</Text>
                </View>
              </Pressable>
              {expandedSections.seedOils && (
                <View style={styles.expandedContent}>
                  {product.hasSeedOils ? (
                    <>
                      <Text style={styles.expandedLabel}>Seed oils found:</Text>
                      <View style={styles.chipRow}>
                        {product.seedOilsFound.map((oil, i) => (
                          <View key={i} style={styles.dangerChip}>
                            <Text style={styles.dangerChipText}>{oil}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.expandedInfo}>
                        Seed oils are high in omega-6 fatty acids and can promote inflammation when consumed in excess.
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.expandedInfo}>No seed oils detected in this product.</Text>
                  )}
                </View>
              )}

              <View style={styles.breakdownDivider} />

              {/* Processing Profile */}
              <Pressable style={styles.breakdownRow} onPress={() => toggleSection('processing')}>
                <View style={styles.breakdownLeft}>
                  <Text style={styles.breakdownLabel}>Processing Profile</Text>
                  <View style={[styles.statusBadge, {
                    backgroundColor: product.processingLevel === 'High' ? '#FEE2E2' : product.processingLevel === 'Medium' ? '#FEF3C7' : '#DCFCE7'
                  }]}>
                    <Text style={[styles.statusText, {
                      color: product.processingLevel === 'High' ? '#DC2626' : product.processingLevel === 'Medium' ? '#D97706' : '#16A34A'
                    }]}>
                      {product.processingLevel}
                    </Text>
                  </View>
                </View>
                <View style={styles.breakdownRight}>
                  <View style={[styles.statusDot, {
                    backgroundColor: product.processingLevel === 'High' ? '#EF4444' : product.processingLevel === 'Medium' ? '#F59E0B' : '#22C55E'
                  }]} />
                  <Text style={styles.chevron}>{expandedSections.processing ? '∧' : '∨'}</Text>
                </View>
              </Pressable>
              {expandedSections.processing && (
                <View style={styles.expandedContent}>
                  <Text style={styles.expandedLabel}>Processing Level</Text>
                  <View style={styles.processingBar}>
                    <LinearGradient
                      colors={['#22C55E', '#F59E0B', '#EF4444']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.processingBarGradient}
                    />
                    <View style={[styles.processingIndicator, {
                      left: product.processingLevel === 'High' ? '85%' : product.processingLevel === 'Medium' ? '50%' : '15%'
                    }]} />
                  </View>
                  <View style={styles.processingLabels}>
                    <Text style={styles.processingLabelText}>Unprocessed</Text>
                    <Text style={styles.processingLabelText}>Ultra-processed</Text>
                  </View>
                  {product.additives.length > 0 && (
                    <>
                      <Text style={[styles.expandedLabel, { marginTop: 16 }]}>Additives</Text>
                      <View style={styles.chipRow}>
                        {product.additives.slice(0, 8).map((add, i) => (
                          <View key={i} style={styles.warningChip}>
                            <Text style={styles.warningChipText}>{add}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              )}

              <View style={styles.breakdownDivider} />

              {/* Allergens */}
              <Pressable style={styles.breakdownRow} onPress={() => toggleSection('allergens')}>
                <View style={styles.breakdownLeft}>
                  <Text style={styles.breakdownLabel}>Detected Allergens</Text>
                  <View style={[styles.statusBadge, {
                    backgroundColor: product.allergens.length > 0 ? '#FEF3C7' : '#F3F4F6'
                  }]}>
                    <Text style={[styles.statusText, {
                      color: product.allergens.length > 0 ? '#D97706' : '#6B7280'
                    }]}>
                      {product.allergens.length > 0 ? `${product.allergens.length} found` : 'No Data'}
                    </Text>
                  </View>
                </View>
                <View style={styles.breakdownRight}>
                  <View style={[styles.statusDot, {
                    backgroundColor: product.allergens.length > 0 ? '#F59E0B' : '#9CA3AF'
                  }]} />
                  <Text style={styles.chevron}>{expandedSections.allergens ? '∧' : '∨'}</Text>
                </View>
              </Pressable>
              {expandedSections.allergens && (
                <View style={styles.expandedContent}>
                  {product.allergens.length > 0 ? (
                    <View style={styles.chipRow}>
                      {product.allergens.map((a, i) => (
                        <View key={i} style={styles.warningChip}>
                          <Text style={styles.warningChipText}>{a}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.expandedInfo}>No allergen data available for this product.</Text>
                  )}
                </View>
              )}
            </View>

            {/* Ingredients */}
            <View style={styles.ingredientsCard}>
              <Text style={styles.sectionTitle}>INGREDIENTS</Text>
              <Text style={styles.ingredientsText}>{product.ingredients}</Text>
            </View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Could not load demo product.{'\n'}No worries — you can still continue!</Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={styles.bottomFixed}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  headerFixed: { paddingTop: 60, paddingHorizontal: 28, paddingBottom: 8 },
  progressTrack: { height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  step: { fontSize: 13, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '900', color: '#111827', lineHeight: 36, marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6B7280', lineHeight: 22 },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 14 },

  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 },
  loadingText: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },

  productCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  productRow: { flexDirection: 'row', gap: 16 },
  productImage: { width: 85, height: 85, borderRadius: 16, backgroundColor: '#F3F4F6' },
  productImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 3 },
  productBrand: { fontSize: 13, color: '#9CA3AF', marginBottom: 10 },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14, gap: 3 },
  scoreNumber: { fontSize: 22, fontWeight: '900' },
  scoreOf: { fontSize: 14, fontWeight: '600' },
  scoreDivider: { width: 1, height: 16, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 6 },
  scoreLabel: { fontSize: 14, fontWeight: '700' },

  analysisCard: { backgroundColor: '#F0FDF4', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#DCFCE7' },
  analysisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  analysisDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  analysisTitle: { fontSize: 16, fontWeight: '700', color: '#15803D' },
  analysisText: { fontSize: 14, color: '#374151', lineHeight: 22 },

  alertsSection: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#6B7280', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  alertRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, gap: 10, borderLeftWidth: 4,
  },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertText: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
  alertBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  alertBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '900' },

  breakdownCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18,
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
  breakdownDivider: { height: 1, backgroundColor: '#F3F4F6' },

  expandedContent: { paddingBottom: 14, paddingLeft: 4 },
  expandedLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  expandedInfo: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dangerChip: { backgroundColor: '#FEE2E2', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  dangerChipText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  warningChip: { backgroundColor: '#FEF3C7', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  warningChipText: { fontSize: 12, fontWeight: '600', color: '#92400E' },

  processingBar: { height: 8, borderRadius: 4, marginBottom: 6, overflow: 'hidden', position: 'relative' },
  processingBarGradient: { height: 8, borderRadius: 4, width: '100%' },
  processingIndicator: {
    position: 'absolute', top: -3, width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#FFF', borderWidth: 3, borderColor: '#374151',
  },
  processingLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  processingLabelText: { fontSize: 11, color: '#9CA3AF' },

  ingredientsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  ingredientsText: { fontSize: 13, color: '#6B7280', lineHeight: 20 },

  bottomFixed: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12,
    backgroundColor: '#FAFAFA',
  },
  buttonGradient: {
    flexDirection: 'row', borderRadius: 18, paddingVertical: 20,
    alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  buttonArrow: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
});
