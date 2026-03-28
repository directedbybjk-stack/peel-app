import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { brand } from '@/constants/Colors';
import { lookupProduct, type ProductData } from '@/lib/openfoodfacts';
import { savePreferences } from '@/lib/storage';

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
    router.replace('/paywall');
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
      <View style={styles.header}>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={['#16A34A', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: '100%' }]}
          />
        </View>
        <Text style={styles.step}>STEP 3 OF 3</Text>
        <Text style={styles.title}>Scan a barcode.{'\n'}Know what is inside.</Text>
        <Text style={styles.subtitle}>Peel turns a packaged food into a clear ingredient decision in seconds before you buy it.</Text>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
            <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.productCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultEyebrow}>REAL RESULT PREVIEW</Text>
                <View style={styles.resultStatusBadge}>
                  <Text style={styles.resultStatusText}>Analysis ready</Text>
                </View>
              </View>
              <View style={styles.productRow}>
                {product.imageUrl ? (
                  <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                ) : (
                  <View style={[styles.productImage, styles.productImagePlaceholder]}>
                    <Text style={{ fontSize: 11, color: '#94A3B8' }}>No Image</Text>
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
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(70).duration(400).springify()} style={styles.valueCard}>
              <Text style={styles.valueTitle}>What Peel shows you instantly</Text>
              <View style={styles.valueList}>
                <ValueRow text={product.hasSeedOils ? 'Seed oils detected immediately' : 'Seed oil check in one tap'} />
                <ValueRow text={`${product.processingLevel} processing profile, clearly labeled`} />
                <ValueRow text={product.allergens.length > 0 ? `${product.allergens.length} allergen warnings flagged` : 'Allergen warnings when they appear'} />
                <ValueRow text="Cleaner alternative decisions before checkout" />
              </View>
            </Animated.View>

            {/* Analysis */}
            <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <View style={styles.analysisDot} />
                <Text style={styles.analysisTitle}>Peel's Analysis</Text>
              </View>
              <Text style={styles.analysisText}>{product.analysis}</Text>
            </Animated.View>

            {/* Personalized Alerts */}
            {product.flags.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200).duration(400).springify()} style={styles.alertsSection}>
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
              </Animated.View>
            )}

            {/* Breakdown */}
            <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} style={styles.breakdownCard}>
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
                    backgroundColor: product.allergens.length > 0 ? '#FEF3C7' : '#F1F5F9'
                  }]}>
                    <Text style={[styles.statusText, {
                      color: product.allergens.length > 0 ? '#D97706' : '#64748B'
                    }]}>
                      {product.allergens.length > 0 ? `${product.allergens.length} found` : 'No Data'}
                    </Text>
                  </View>
                </View>
                <View style={styles.breakdownRight}>
                  <View style={[styles.statusDot, {
                    backgroundColor: product.allergens.length > 0 ? '#F59E0B' : '#CBD5E1'
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
            </Animated.View>

            {/* Ingredients */}
            <Animated.View entering={FadeInDown.delay(400).duration(400).springify()} style={styles.ingredientsCard}>
              <Text style={styles.sectionTitle}>INGREDIENTS</Text>
              <Text style={styles.ingredientsText}>{product.ingredients}</Text>
            </Animated.View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Could not load demo product.{'\n'}No worries — you can still continue!</Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={styles.bottomFixed}>
        <Pressable
          testID="start-scanning-button"
          style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          onPress={handleStart}
        >
          <LinearGradient
            colors={['#16A34A', '#15803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continue to Trial</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function ValueRow({ text }: { text: string }) {
  return (
    <View style={styles.valueRow}>
      <View style={styles.valueCheck}>
        <Text style={styles.valueCheckText}>✓</Text>
      </View>
      <Text style={styles.valueText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  step: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 40,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },

  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 14,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },

  productCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  productRow: { flexDirection: 'row', gap: 16 },
  productImage: {
    width: 85,
    height: 85,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  productImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  resultEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  resultStatusBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resultStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  productBrand: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 10,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 3,
  },
  scoreNumber: { fontSize: 20, fontWeight: '900' },
  scoreOf: { fontSize: 13, fontWeight: '600' },
  scoreDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 6,
  },
  scoreLabel: { fontSize: 13, fontWeight: '700' },

  valueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  valueList: { gap: 12 },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  valueCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueCheckText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  valueText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
    fontWeight: '600',
  },

  analysisCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  analysisDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803D',
  },
  analysisText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },

  alertsSection: { gap: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderLeftWidth: 4,
  },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertText: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
  alertBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '900' },

  breakdownCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  breakdownLabel: { fontSize: 15, fontWeight: '600', color: '#334155' },
  statusBadge: { borderRadius: 8, paddingVertical: 3, paddingHorizontal: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
  breakdownRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  chevron: { fontSize: 16, color: '#94A3B8', fontWeight: '600' },
  breakdownDivider: { height: 1, backgroundColor: '#E2E8F0' },

  expandedContent: { paddingBottom: 14, paddingLeft: 4 },
  expandedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  expandedInfo: { fontSize: 13, color: '#64748B', lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dangerChip: { backgroundColor: '#FEE2E2', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  dangerChipText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  warningChip: { backgroundColor: '#FEF3C7', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  warningChipText: { fontSize: 12, fontWeight: '600', color: '#92400E' },

  processingBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  processingBarGradient: { height: 8, borderRadius: 4, width: '100%' },
  processingIndicator: {
    position: 'absolute',
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#334155',
  },
  processingLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  processingLabelText: { fontSize: 11, color: '#94A3B8' },

  ingredientsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  ingredientsText: { fontSize: 13, color: '#64748B', lineHeight: 20 },

  bottomFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 44,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  buttonGradient: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
