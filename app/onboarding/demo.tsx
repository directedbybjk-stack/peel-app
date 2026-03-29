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

type StoryStep = 0 | 1 | 2 | 3 | 4;

// Real product images from Open Food Facts (verified working URLs)
const IMAGES = {
  chipsAhoy: 'https://images.openfoodfacts.org/images/products/004/400/003/2197/front_en.50.400.jpg',
  heinz: 'https://images.openfoodfacts.org/images/products/001/300/000/6057/front_en.85.400.jpg',
  annies: 'https://images.openfoodfacts.org/images/products/001/356/249/4019/front_en.13.400.jpg',
  partake: 'https://images.openfoodfacts.org/images/products/085/276/100/7008/front_en.27.400.jpg',
};

const COMPARISON_ITEMS = [
  {
    title: 'Then',
    product: 'Heinz Ketchup',
    badgeColor: '#15803D',
    ingredients: 'Ripened Tomatoes, Pickling Vinegar, Cane Sugar, Salt, Fresh Ground Spices',
    imageUrl: IMAGES.heinz,
  },
  {
    title: 'Now',
    product: 'Heinz Ketchup',
    badgeColor: '#991B1B',
    ingredients: 'Tomato Concentrate From Red Ripe Tomatoes, Distilled Vinegar, High Fructose Corn Syrup, Corn Syrup, Salt, Spice, Onion Powder, Natural Flavoring',
    highlight: true,
    imageUrl: IMAGES.heinz,
  },
];

const FEELING_OPTIONS = [
  'Sluggish & tired',
  'Bloated',
  'I don\'t eat these',
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
    if (product) return product;
    return {
      barcode: '0044000032197',
      productName: 'Original Real Chocolate Chip Cookies',
      brand: 'Chips Ahoy!',
      imageUrl: IMAGES.chipsAhoy,
      ingredients: 'Unbleached enriched flour, sugar, soybean and palm oil, chocolate, high fructose corn syrup, leavening, salt, whey, natural and artificial flavor, caramel color',
      ingredientsList: [],
      categories: 'snacks, cookies',
      novaGroup: 4,
      score: 8,
      scoreLabel: 'Avoid',
      analysis: 'Original Real Chocolate Chip Cookies has several ingredients that may not align with clean eating goals. It contains canola oil and palm oil, which are processed seed oils linked to inflammation. This is an ultra-processed product with a high level of industrial processing. Notable additives include high fructose corn syrup, caramel color.',
      flags: [],
      hasSeedOils: true,
      seedOilsFound: ['Soybean oil', 'Palm oil'],
      hasAdditives: true,
      processingLevel: 'High' as const,
      allergens: ['Wheat', 'Milk', 'Soy'],
      additives: ['High fructose corn syrup', 'Caramel color', 'Natural flavor'],
    } as ProductData;
  }, [product]);

  // Step 0: Annie's is the healthier cracker alternative to Ritz
  const anniesProduct = {
    productName: 'Organic Cheddar Bunnies',
    brand: 'Annie\'s Homegrown',
    score: 78,
    scoreLabel: 'Good',
    imageUrl: IMAGES.annies,
    hasSeedOils: false,
    seedOilsFound: [],
    hasAdditives: false,
    processingLevel: 'Low' as const,
    allergens: ['Wheat', 'Milk'],
    analysis: 'Made with organic wheat flour and real cheddar cheese. No seed oils, no high fructose corn syrup, and no artificial additives. A much cleaner cracker for the whole family.',
  };

  // Step 2: Partake is the healthier cookie alternative to Chips Ahoy
  const cookieAlternative = {
    productName: 'Chocolate Chip Cookies',
    brand: 'Partake Foods',
    score: 82,
    scoreLabel: 'Excellent',
    imageUrl: IMAGES.partake,
    analysis: 'Vegan, gluten-free, and free of the top 9 allergens. Made with simpler ingredients and no artificial additives. A cleaner cookie swap.',
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
    if (storyStep < 4) {
      setStoryStep((prev) => (prev + 1) as StoryStep);
      return;
    }
    await savePreferences({ goal: goals || '', allergies: (allergies || '').split(',').filter(Boolean) });
    router.replace('/paywall');
  };

  const progressWidth = (((storyStep + 1) / 5) * 100) as number;

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
            {/* Step 0: Ritz Then vs Now + Annie's healthier alternative */}
            {storyStep === 0 && (
              <Animated.View entering={FadeInDown.duration(350).springify()}>
                <Text style={styles.title}>Avoiding bad{'\n'}ingredients can{'\n'}be tough...</Text>
                <Text style={styles.subtitle}>Packaged foods look familiar, but what is inside them has changed.</Text>

                <LinearGradient colors={['#E8F5E9', '#FFF9C4', '#E8F5E9']} style={styles.storyBackdrop}>
                  <View style={styles.comparisonRow}>
                    {COMPARISON_ITEMS.map((item) => (
                      <View key={item.title} style={styles.comparisonCard}>
                        <View style={[styles.comparisonBadge, { backgroundColor: item.badgeColor }]}>
                          <Text style={styles.comparisonBadgeText}>{item.title}</Text>
                        </View>
                        <Image source={{ uri: item.imageUrl }} style={styles.comparisonImage} />
                        <Text style={styles.comparisonProduct}>{item.product}</Text>
                        <Text style={[styles.comparisonIngredients, item.highlight && styles.comparisonIngredientsHighlight]}>
                          {item.highlight ? highlightBadIngredients(item.ingredients) : item.ingredients}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.comparisonCaption}>because our food{'\n'}has changed.</Text>
                </LinearGradient>

              </Animated.View>
            )}

            {/* Step 1: Impact / feelings (Chips Ahoy — different product from Step 0) */}
            {storyStep === 1 && (
              <Animated.View entering={FadeInDown.duration(350).springify()}>
                <Text style={styles.title}>See the impact{'\n'}of your choices</Text>
                <Text style={styles.subtitle}>Some of the foods people eat every day are tied to how they feel after eating.</Text>

                <LinearGradient colors={['#F0FDF4', '#E8F5E9', '#D1FAE5']} style={styles.feelingPanel}>
                  <Image
                    source={{ uri: IMAGES.chipsAhoy }}
                    style={styles.heroProductImage}
                  />
                  <Text style={styles.feelingQuestion}>
                    How do these cookies make you feel after eating them?
                  </Text>

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

            {/* Step 2: Why to skip the current product */}
            {storyStep === 2 && (
              <Animated.View entering={FadeInDown.duration(350).springify()}>
                <Text style={styles.title}>Peel reveals a{'\n'}better option</Text>
                <Text style={styles.subtitle}>Instead of guessing, Peel shows why one product is worth skipping and what to try instead.</Text>

                <View style={styles.revealStack}>
                  <View style={styles.resultPanel}>
                    <Text style={styles.resultPanelEyebrow}>AND HERE'S WHY YOU SHOULDN'T</Text>
                    <View style={styles.resultProductRow}>
                      <Image
                        source={{ uri: previewProduct.imageUrl || IMAGES.chipsAhoy }}
                        style={styles.resultProductImage}
                      />
                      <View style={styles.resultProductInfo}>
                        <Text style={styles.resultProductName} numberOfLines={2}>{previewProduct.productName}</Text>
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
                </View>
              </Animated.View>
            )}

            {/* Step 3: Better alternative reveal */}
            {storyStep === 3 && (
              <Animated.View entering={FadeInDown.duration(350).springify()}>
                <Text style={styles.title}>Here is the better{'\n'}option instead</Text>
                <Text style={styles.subtitle}>Peel does not just flag the problem. It points you to a cleaner alternative you can feel good about buying.</Text>

                <View style={styles.revealStack}>
                  <View style={[styles.resultPanel, styles.altResultPanel]}>
                    <Text style={styles.altPanelEyebrow}>TRY THIS INSTEAD</Text>
                    <View style={styles.resultProductRow}>
                      <Image
                        source={{ uri: cookieAlternative.imageUrl }}
                        style={styles.resultProductImage}
                      />
                      <View style={styles.resultProductInfo}>
                        <Text style={styles.resultProductName}>{cookieAlternative.productName}</Text>
                        <Text style={styles.resultProductBrand}>{cookieAlternative.brand}</Text>
                        <View style={styles.resultScoreRow}>
                          <View style={[styles.scoreDot, { backgroundColor: '#16A34A' }]} />
                          <Text style={[styles.resultScoreText, { color: '#15803D' }]}>
                            {cookieAlternative.score}/100 {cookieAlternative.scoreLabel}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.resultReason}>{cookieAlternative.analysis}</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Step 4: Healthy product preview (Annie's — shows what a good scan looks like) */}
            {storyStep === 4 && (
              <Animated.View entering={FadeInDown.duration(350).springify()}>
                <Text style={styles.title}>Scan a barcode.{'\n'}Know what is inside.</Text>
                <Text style={styles.subtitle}>This is exactly what Peel shows you in seconds before the product goes in your cart.</Text>

                <View style={styles.previewCard}>
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewEyebrow}>REAL RESULT PREVIEW</Text>
                    <View style={styles.previewBadge}>
                      <Text style={styles.previewBadgeText}>Analysis ready</Text>
                    </View>
                  </View>

                  <View style={styles.previewRow}>
                    <Image
                      source={{ uri: anniesProduct.imageUrl }}
                      style={styles.previewImage}
                    />
                    <View style={styles.previewInfo}>
                      <Text style={styles.previewName} numberOfLines={2}>{anniesProduct.productName}</Text>
                      <Text style={styles.previewBrand}>{anniesProduct.brand}</Text>
                      <LinearGradient colors={getScoreBg(anniesProduct.score)} style={styles.previewScoreBadge}>
                        <Text style={[styles.previewScoreNumber, { color: getScoreColor(anniesProduct.score) }]}>{anniesProduct.score}</Text>
                        <Text style={[styles.previewScoreOf, { color: getScoreColor(anniesProduct.score) }]}>/100</Text>
                        <View style={styles.previewScoreDivider} />
                        <Text style={[styles.previewScoreLabel, { color: getScoreColor(anniesProduct.score) }]}>{anniesProduct.scoreLabel}</Text>
                      </LinearGradient>
                    </View>
                  </View>
                </View>

                <View style={styles.valueCard}>
                  <Text style={styles.valueTitle}>What Peel shows you instantly</Text>
                  <ValueRow text={anniesProduct.hasSeedOils ? 'Seed oils detected immediately' : 'No seed oils detected ✓'} />
                  <ValueRow text={`${anniesProduct.processingLevel} processing profile, clearly labeled`} />
                  <ValueRow text={anniesProduct.allergens.length > 0 ? `${anniesProduct.allergens.length} allergen warnings flagged` : 'Allergen warnings when they appear'} />
                  <ValueRow text="Cleaner alternative suggestions before checkout" />
                </View>

                <View style={styles.analysisCard}>
                  <View style={styles.analysisHeader}>
                    <View style={styles.analysisDot} />
                    <Text style={styles.analysisTitle}>Peel's Analysis</Text>
                  </View>
                  <Text style={styles.analysisText}>{anniesProduct.analysis}</Text>
                </View>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.bottomFixed}>
        <Pressable testID="start-scanning-button" style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={handleContinue}>
          <LinearGradient colors={['#16A34A', '#15803D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>{storyStep === 4 ? 'Continue to Trial' : 'Continue'}</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

/** Render ingredients with bad ones in bold red */
function highlightBadIngredients(text: string) {
  const BAD = ['Soybean Oil', 'Canola Oil', 'Palm Oil', 'High Fructose Corn Syrup', 'Corn Syrup', 'Soy Lecithin', 'Natural Flavor', 'Natural Flavoring'];
  const parts: { text: string; bad: boolean }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliest = -1;
    let matchedBad = '';
    for (const b of BAD) {
      const idx = remaining.toLowerCase().indexOf(b.toLowerCase());
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        earliest = idx;
        matchedBad = remaining.substring(idx, idx + b.length);
      }
    }
    if (earliest === -1) {
      parts.push({ text: remaining, bad: false });
      break;
    }
    if (earliest > 0) {
      parts.push({ text: remaining.substring(0, earliest), bad: false });
    }
    parts.push({ text: matchedBad, bad: true });
    remaining = remaining.substring(earliest + matchedBad.length);
  }

  return (
    <Text style={styles.comparisonIngredients}>
      {parts.map((p, i) =>
        p.bad ? (
          <Text key={i} style={styles.badIngredient}>{p.text}</Text>
        ) : (
          <Text key={i}>{p.text}</Text>
        )
      )}
    </Text>
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
  header: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 4 },
  progressTrack: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 999, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: 4, borderRadius: 999 },
  step: { fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 6 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 110 },
  title: { fontSize: 30, fontWeight: '800', color: '#0F172A', lineHeight: 38, marginBottom: 10 },
  subtitle: { fontSize: 15, lineHeight: 23, color: '#64748B', marginBottom: 20 },

  loadingContainer: { paddingTop: 120, alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 15, color: '#64748B', textAlign: 'center' },

  // Step 0: Then vs Now
  storyBackdrop: { borderRadius: 24, padding: 20, paddingTop: 28 },
  comparisonRow: { flexDirection: 'row', gap: 12 },
  comparisonCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    paddingTop: 30,
  },
  comparisonBadge: {
    position: 'absolute',
    top: -12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1,
  },
  comparisonBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  comparisonImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  comparisonProduct: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
  },
  comparisonIngredients: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
    textAlign: 'center',
  },
  comparisonIngredientsHighlight: {
    color: '#991B1B',
  },
  badIngredient: {
    color: '#DC2626',
    fontWeight: '700',
  },
  comparisonCaption: {
    textAlign: 'center',
    marginTop: 20,
    color: '#991B1B',
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 26,
  },

  // Step 0: Alt swap section
  altSwapSection: { marginTop: 18 },
  altSwapLabel: { fontSize: 11, fontWeight: '800', color: '#15803D', letterSpacing: 1, textAlign: 'center', marginBottom: 10 },

  // Step 1: Feelings
  feelingPanel: { borderRadius: 24, padding: 24, alignItems: 'center' },
  heroProductImage: {
    width: 160,
    height: 160,
    borderRadius: 16,
    marginBottom: 24,
    backgroundColor: '#F1F5F9',
  },
  feelingQuestion: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
  },
  feelingOptions: { width: '100%', gap: 12 },
  feelingOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  feelingOptionText: { fontSize: 16, fontWeight: '600', color: '#334155' },

  // Step 2: Reveal
  revealStack: { gap: 14 },
  resultPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  altResultPanel: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  resultPanelEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 14,
    textAlign: 'center',
  },
  altPanelEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 1,
    marginBottom: 14,
    textAlign: 'center',
  },
  resultProductRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  resultProductImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  resultProductInfo: { flex: 1 },
  resultProductName: { fontSize: 17, fontWeight: '800', color: '#0F172A', lineHeight: 22 },
  resultProductBrand: { fontSize: 13, color: '#64748B', marginTop: 2, marginBottom: 8 },
  resultScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreDot: { width: 10, height: 10, borderRadius: 5 },
  resultScoreText: { fontSize: 14, fontWeight: '700' },
  resultReason: { fontSize: 14, lineHeight: 22, color: '#475569', marginTop: 14 },
  arrowWrap: { alignItems: 'center', gap: 4 },
  arrowText: { fontSize: 26, color: '#16A34A', fontWeight: '800' },
  arrowLabel: { fontSize: 14, fontWeight: '700', color: '#15803D' },

  // Step 3: Preview
  previewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  previewEyebrow: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.1 },
  previewBadge: { backgroundColor: '#ECFDF5', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  previewBadgeText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  previewRow: { flexDirection: 'row', gap: 14 },
  previewImage: { width: 80, height: 80, borderRadius: 14, backgroundColor: '#F1F5F9' },
  previewInfo: { flex: 1, justifyContent: 'center' },
  previewName: { fontSize: 17, fontWeight: '800', color: '#0F172A', lineHeight: 22 },
  previewBrand: { fontSize: 13, color: '#64748B', marginBottom: 8, marginTop: 2 },
  previewScoreBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 3, borderRadius: 10, paddingVertical: 5, paddingHorizontal: 11 },
  previewScoreNumber: { fontSize: 20, fontWeight: '900' },
  previewScoreOf: { fontSize: 13, fontWeight: '700' },
  previewScoreDivider: { width: 1, height: 14, backgroundColor: 'rgba(0,0,0,0.12)', marginHorizontal: 4 },
  previewScoreLabel: { fontSize: 13, fontWeight: '700' },

  valueCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 14 },
  valueTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 14 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  valueCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  valueCheckText: { fontSize: 12, fontWeight: '800', color: '#15803D' },
  valueText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#334155', lineHeight: 20 },

  analysisCard: { backgroundColor: '#F0FDF4', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#DCFCE7', marginTop: 14 },
  analysisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  analysisDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  analysisTitle: { fontSize: 16, fontWeight: '700', color: '#15803D' },
  analysisText: { fontSize: 14, lineHeight: 22, color: '#374151' },

  bottomFixed: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  button: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  buttonPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  buttonGradient: { borderRadius: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  buttonText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  buttonArrow: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
});
