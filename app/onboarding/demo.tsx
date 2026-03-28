import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { brand } from '@/constants/Colors';
import { lookupProduct, type ProductData } from '@/lib/openfoodfacts';
import { savePreferences } from '@/lib/storage';

const DEMO_BARCODES = ['0044000032197', '0028400064057', '0049000006346'];

type StoryStep = 0 | 1 | 2 | 3;

const COMPARISON_ITEMS = [
  {
    title: 'Then',
    product: 'Original cookies',
    badgeColor: '#3F6F49',
    ingredients: 'Flour, butter, sugar, salt, baking soda',
    emoji: '🍪',
  },
  {
    title: 'Now',
    product: 'Modern cookies',
    badgeColor: '#A92B2B',
    ingredients: 'Soybean oil, canola oil, high fructose corn syrup, soy lecithin, natural flavor',
    highlight: true,
    emoji: '🍪',
  },
];

const FEELING_OPTIONS = [
  'Sluggish & tired',
  'Bloated',
  'I do not eat these',
];

export default function DemoScreen() {
  const { goals, allergies } = useLocalSearchParams<{ goals: string; allergies: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [storyStep, setStoryStep] = useState<StoryStep>(0);

  useEffect(() => {
    async function tryBarcodes() {
      for (const barcode of DEMO_BARCODES) {
        const found = await lookupProduct(barcode);
        if (found) {
          setProduct(found);
          setLoading(false);
          return;
        }
      }
      setLoading(false);
    }
    tryBarcodes();
  }, []);

  const previewProduct = useMemo(() => {
    if (product) {
      return product;
    }

    return {
      barcode: '0044000032197',
      productName: 'Classic Potato Chips',
      brand: "Lay's",
      imageUrl: undefined,
      ingredients: 'Potatoes, vegetable oil (canola, corn, soybean, and/or sunflower oil), salt',
      ingredientsList: ['potatoes', 'vegetable oil', 'canola oil', 'corn oil', 'soybean oil', 'sunflower oil', 'salt'],
      categories: 'snacks, chips',
      novaGroup: 4,
      score: 16,
      scoreLabel: 'Avoid',
      analysis: 'Contains seed oils and high processing, making it a weaker everyday choice.',
      flags: [],
      hasSeedOils: true,
      seedOilsFound: ['Sunflower oil', 'Canola oil'],
      hasAdditives: true,
      processingLevel: 'High',
      allergens: ['Possible dairy', 'Possible soy'],
      additives: ['Natural flavor'],
    } as ProductData;
  }, [product]);

  const alternativeProduct = {
    productName: 'Simple Butter Cookies',
    brand: 'Better pantry swap',
    score: 84,
    scoreLabel: 'Excellent',
    analysis: 'Made with fewer processed ingredients and no seed oils, making it a cleaner cookie-style swap for everyday snacking.',
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

  const handleContinue = async () => {
    if (storyStep < 3) {
      setStoryStep((prev) => (prev + 1) as StoryStep);
      return;
    }

    await savePreferences({ goal: goals || '', allergies: (allergies || '').split(',').filter(Boolean) });
    router.replace('/paywall');
  };

  const progressWidth = (((storyStep + 1) / 4) * 100) as number;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.progressTrack}>
          <LinearGradient colors={['#16A34A', '#22C55E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${progressWidth}%` as const }]} />
        </View>
        <Text style={styles.step}>STEP 3 OF 3</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.loadingText}>Loading your Peel demo...</Text>
          </View>
        ) : (
          <>
            {storyStep === 0 && (
              <Animated.View entering={FadeInDown.duration(350).springify()}>
                <Text style={styles.title}>Avoiding bad ingredients can be tough...</Text>
                <Text style={styles.subtitle}>Packaged foods look familiar, but what is inside them has changed.</Text>

                <LinearGradient colors={['#DFF6E5', '#F7E6A6']} style={styles.storyBackdrop}>
                  <View style={styles.comparisonRow}>
                    {COMPARISON_ITEMS.map((item) => (
                      <View key={item.title} style={styles.comparisonCard}>
                        <View style={[styles.comparisonBadge, { backgroundColor: item.badgeColor }]}>
                          <Text style={styles.comparisonBadgeText}>{item.title}</Text>
                        </View>
                        <View style={styles.comparisonImageWrap}>
                          <Text style={styles.comparisonEmoji}>{item.emoji}</Text>
                        </View>
                        <Text style={styles.comparisonProduct}>{item.product}</Text>
                        <Text style={[styles.comparisonIngredients, item.highlight && styles.comparisonIngredientsHighlight]}>
                          {item.ingredients}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.comparisonCaption}>because our food has changed.</Text>
                </LinearGradient>
              </Animated.View>
            )}

            {storyStep === 1 && (
              <Animated.View entering={FadeInDown.duration(350).springify()}>
                <Text style={styles.title}>See the impact of your choices</Text>
                <Text style={styles.subtitle}>Some of the foods people eat every day are tied to how they feel after eating.</Text>

                <LinearGradient colors={['#F4F8F0', '#DDF1DE']} style={styles.feelingPanel}>
                  {previewProduct.imageUrl ? (
                    <Image source={{ uri: previewProduct.imageUrl }} style={styles.heroProductImage} />
                  ) : (
                    <View style={[styles.heroProductImage, styles.heroProductPlaceholder]}>
                      <Text style={styles.heroProductPlaceholderEmoji}>🍪</Text>
                    </View>
                  )}
                  <Text style={styles.feelingQuestion}>How do these cookies make you feel after eating them?</Text>

                  <View style={styles.feelingOptions}>
                    {FEELING_OPTIONS.map((option) => (
                      <View key={option} style={styles.feelingOption}>
                        <Text style={styles.feelingOptionText}>{option}</Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {storyStep === 2 && (
              <Animated.View entering={FadeInDown.duration(350).springify()}>
                <Text style={styles.title}>Peel reveals a better option</Text>
                <Text style={styles.subtitle}>Instead of guessing, Peel shows why one product is worth skipping and what to try instead.</Text>

                <View style={styles.revealStack}>
                  <View style={styles.resultPanel}>
                    <Text style={styles.resultPanelEyebrow}>AND HERE'S WHY YOU SHOULDN'T</Text>
                    <View style={styles.resultProductRow}>
                      {previewProduct.imageUrl ? (
                        <Image source={{ uri: previewProduct.imageUrl }} style={styles.resultProductImage} />
                      ) : (
                        <View style={[styles.resultProductImage, styles.heroProductPlaceholder]}>
                          <Text style={styles.heroProductPlaceholderEmoji}>🍪</Text>
                        </View>
                      )}
                      <View style={styles.resultProductInfo}>
                        <Text style={styles.resultProductName}>{previewProduct.productName}</Text>
                        <Text style={styles.resultProductBrand}>{previewProduct.brand}</Text>
                        <View style={styles.resultScoreRow}>
                          <View style={[styles.scoreDot, { backgroundColor: getScoreColor(previewProduct.score) }]} />
                          <Text style={[styles.resultScoreText, { color: getScoreColor(previewProduct.score) }]}>
                            {previewProduct.score}/100 {previewProduct.scoreLabel}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.resultReason}>{previewProduct.analysis}</Text>
                  </View>

                  <View style={styles.arrowWrap}>
                    <Text style={styles.arrowText}>↓</Text>
                    <Text style={styles.arrowLabel}>Reveal better alternative</Text>
                  </View>

                  <View style={[styles.resultPanel, styles.altResultPanel]}>
                    <Text style={styles.resultPanelEyebrow}>TRY THIS INSTEAD</Text>
                    <View style={styles.resultProductRow}>
                      <View style={[styles.resultProductImage, styles.altProductIconWrap]}>
                        <Text style={styles.altProductIcon}>🍪</Text>
                      </View>
                      <View style={styles.resultProductInfo}>
                        <Text style={styles.resultProductName}>{alternativeProduct.productName}</Text>
                        <Text style={styles.resultProductBrand}>{alternativeProduct.brand}</Text>
                        <View style={styles.resultScoreRow}>
                          <View style={[styles.scoreDot, { backgroundColor: '#16A34A' }]} />
                          <Text style={[styles.resultScoreText, { color: '#15803D' }]}>
                            {alternativeProduct.score}/100 {alternativeProduct.scoreLabel}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.resultReason}>{alternativeProduct.analysis}</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {storyStep === 3 && (
              <Animated.View entering={FadeInDown.duration(350).springify()}>
                <Text style={styles.title}>Scan a barcode. Know what is inside.</Text>
                <Text style={styles.subtitle}>This is the exact kind of result Peel gives you in seconds before the product goes in your cart.</Text>

                <View style={styles.previewCard}>
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewEyebrow}>REAL RESULT PREVIEW</Text>
                    <View style={styles.previewBadge}>
                      <Text style={styles.previewBadgeText}>Analysis ready</Text>
                    </View>
                  </View>

                  <View style={styles.previewRow}>
                    {previewProduct.imageUrl ? (
                      <Image source={{ uri: previewProduct.imageUrl }} style={styles.previewImage} />
                    ) : (
                      <View style={[styles.previewImage, styles.heroProductPlaceholder]}>
                        <Text style={styles.heroProductPlaceholderEmoji}>🍪</Text>
                      </View>
                    )}
                    <View style={styles.previewInfo}>
                      <Text style={styles.previewName} numberOfLines={2}>{previewProduct.productName}</Text>
                      <Text style={styles.previewBrand}>{previewProduct.brand}</Text>
                      <LinearGradient colors={getScoreBg(previewProduct.score)} style={styles.previewScoreBadge}>
                        <Text style={[styles.previewScoreNumber, { color: getScoreColor(previewProduct.score) }]}>{previewProduct.score}</Text>
                        <Text style={[styles.previewScoreOf, { color: getScoreColor(previewProduct.score) }]}>/100</Text>
                        <View style={styles.previewScoreDivider} />
                        <Text style={[styles.previewScoreLabel, { color: getScoreColor(previewProduct.score) }]}>{previewProduct.scoreLabel}</Text>
                      </LinearGradient>
                    </View>
                  </View>
                </View>

                <View style={styles.valueCard}>
                  <Text style={styles.valueTitle}>What Peel shows you instantly</Text>
                  <ValueRow text={previewProduct.hasSeedOils ? 'Seed oils detected immediately' : 'Seed oil check in one tap'} />
                  <ValueRow text={`${previewProduct.processingLevel} processing profile, clearly labeled`} />
                  <ValueRow text={previewProduct.allergens.length > 0 ? `${previewProduct.allergens.length} allergen warnings flagged` : 'Allergen warnings when they appear'} />
                  <ValueRow text="Cleaner alternative decisions before checkout" />
                </View>

                <View style={styles.analysisCard}>
                  <View style={styles.analysisHeader}>
                    <View style={styles.analysisDot} />
                    <Text style={styles.analysisTitle}>Peel's Analysis</Text>
                  </View>
                  <Text style={styles.analysisText}>{previewProduct.analysis}</Text>
                </View>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.bottomFixed}>
        <Pressable testID="start-scanning-button" style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={handleContinue}>
          <LinearGradient colors={['#16A34A', '#15803D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>{storyStep === 3 ? 'Continue to Trial' : 'Continue'}</Text>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 8 },
  progressTrack: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 999, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: 4, borderRadius: 999 },
  step: { fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 10 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 110 },
  title: { fontSize: 32, fontWeight: '800', color: '#16351F', lineHeight: 39, marginBottom: 10 },
  subtitle: { fontSize: 16, lineHeight: 23, color: '#64748B', marginBottom: 20 },

  loadingContainer: { paddingTop: 120, alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 15, color: '#64748B', textAlign: 'center' },

  storyBackdrop: { borderRadius: 28, padding: 22, marginTop: 8 },
  comparisonRow: { flexDirection: 'row', gap: 14 },
  comparisonCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 22, padding: 16, alignItems: 'center', minHeight: 308 },
  comparisonBadge: { position: 'absolute', top: -12, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  comparisonBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  comparisonImageWrap: { marginTop: 28, marginBottom: 16, width: 74, height: 74, borderRadius: 20, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  comparisonEmoji: { fontSize: 44 },
  comparisonProduct: { fontSize: 14, fontWeight: '700', color: '#334155', textAlign: 'center', marginBottom: 10 },
  comparisonIngredients: { fontSize: 12, lineHeight: 18, color: '#475569', textAlign: 'center' },
  comparisonIngredientsHighlight: { color: '#9F1D1D', fontWeight: '700' },
  comparisonCaption: { textAlign: 'center', marginTop: 18, color: '#41684A', fontSize: 18, fontWeight: '700', fontStyle: 'italic' },

  feelingPanel: { borderRadius: 28, padding: 24, alignItems: 'center' },
  heroProductImage: { width: 150, height: 150, resizeMode: 'contain', marginBottom: 22 },
  heroProductPlaceholder: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  heroProductPlaceholderText: { fontSize: 20, fontWeight: '700', color: '#94A3B8' },
  heroProductPlaceholderEmoji: { fontSize: 42 },
  feelingQuestion: { fontSize: 18, fontWeight: '700', color: '#1F2937', textAlign: 'center', lineHeight: 28, marginBottom: 18 },
  feelingOptions: { width: '100%', gap: 14 },
  feelingOption: { backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 20, paddingHorizontal: 18, alignItems: 'center', shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  feelingOptionText: { fontSize: 17, fontWeight: '600', color: '#334155' },

  revealStack: { gap: 16 },
  resultPanel: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  altResultPanel: { backgroundColor: '#F8FFF9', borderColor: '#CDEED2' },
  resultPanelEyebrow: { fontSize: 12, fontWeight: '800', color: '#64748B', letterSpacing: 0.8, marginBottom: 14, textAlign: 'center' },
  resultProductRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  resultProductImage: { width: 82, height: 82, borderRadius: 18, backgroundColor: '#F1F5F9', resizeMode: 'cover' },
  altProductIconWrap: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5' },
  altProductIcon: { fontSize: 36 },
  resultProductInfo: { flex: 1 },
  resultProductName: { fontSize: 19, fontWeight: '800', color: '#111827', lineHeight: 24 },
  resultProductBrand: { fontSize: 14, color: '#64748B', marginTop: 2, marginBottom: 8 },
  resultScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreDot: { width: 12, height: 12, borderRadius: 6 },
  resultScoreText: { fontSize: 15, fontWeight: '700' },
  resultReason: { fontSize: 14, lineHeight: 22, color: '#475569', marginTop: 16 },
  arrowWrap: { alignItems: 'center', gap: 4 },
  arrowText: { fontSize: 28, color: '#16A34A', fontWeight: '800' },
  arrowLabel: { fontSize: 14, fontWeight: '700', color: '#15803D' },

  previewCard: { backgroundColor: '#F8FAFC', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  previewEyebrow: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.1 },
  previewBadge: { backgroundColor: '#ECFDF5', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  previewBadgeText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  previewRow: { flexDirection: 'row', gap: 14 },
  previewImage: { width: 84, height: 84, borderRadius: 16, backgroundColor: '#F1F5F9', resizeMode: 'cover' },
  previewInfo: { flex: 1, justifyContent: 'center' },
  previewName: { fontSize: 19, fontWeight: '800', color: '#111827', lineHeight: 24 },
  previewBrand: { fontSize: 14, color: '#64748B', marginBottom: 9, marginTop: 2 },
  previewScoreBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, borderRadius: 10, paddingVertical: 5, paddingHorizontal: 11 },
  previewScoreNumber: { fontSize: 21, fontWeight: '900' },
  previewScoreOf: { fontSize: 13, fontWeight: '700' },
  previewScoreDivider: { width: 1, height: 14, backgroundColor: 'rgba(0,0,0,0.12)', marginHorizontal: 4 },
  previewScoreLabel: { fontSize: 13, fontWeight: '700' },

  valueCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 14 },
  valueTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 14 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  valueCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  valueCheckText: { fontSize: 12, fontWeight: '800', color: '#15803D' },
  valueText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155', lineHeight: 21 },

  analysisCard: { backgroundColor: '#F0FDF4', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#DCFCE7', marginTop: 14 },
  analysisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  analysisDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  analysisTitle: { fontSize: 16, fontWeight: '700', color: '#15803D' },
  analysisText: { fontSize: 15, lineHeight: 23, color: '#374151' },

  bottomFixed: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 34, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  button: { width: '100%', borderRadius: 18, overflow: 'hidden' },
  buttonPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  buttonGradient: { borderRadius: 18, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  buttonText: { fontSize: 19, fontWeight: '800', color: '#FFFFFF' },
  buttonArrow: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
});
