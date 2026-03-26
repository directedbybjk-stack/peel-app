import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { brand } from '@/constants/Colors';
import { lookupProduct, type ProductData } from '@/lib/openfoodfacts';
import { savePreferences, setOnboardingComplete } from '@/lib/storage';

// Try multiple barcodes in case one isn't in the database
const DEMO_BARCODES = [
  '0044000032197', // Chips Ahoy — ultra-processed, has image
  '0028400064057', // Tostitos — has seed oils
  '0049000006346', // Coca-Cola
];

export default function DemoScreen() {
  const { goals, allergies } = useLocalSearchParams<{ goals: string; allergies: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function tryBarcodes() {
      for (const barcode of DEMO_BARCODES) {
        const p = await lookupProduct(barcode);
        if (p) {
          setProduct(p);
          setLoading(false);
          return;
        }
      }
      setLoading(false);
    }
    tryBarcodes();
  }, []);

  const handleStart = async () => {
    await savePreferences({
      goal: goals || '',
      allergies: (allergies || '').split(',').filter(Boolean),
    });
    await setOnboardingComplete();
    router.replace('/(tabs)');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return brand.score.excellent;
    if (score >= 60) return brand.score.good;
    if (score >= 30) return brand.score.limit;
    return brand.score.avoid;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: '100%' }]} />
        </View>
        <Text style={styles.step}>3 of 3</Text>
        <Text style={styles.title}>Here's what Peel{'\n'}can do for you</Text>
        <Text style={styles.subtitle}>Real product analysis — no sign-up needed</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={brand.primary} />
            <Text style={styles.loadingText}>Analyzing product...</Text>
          </View>
        ) : product ? (
          <View style={styles.demoCard}>
            <View style={styles.productHeader}>
              {product.imageUrl && (
                <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{product.productName}</Text>
                <Text style={styles.productBrand}>{product.brand}</Text>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(product.score) + '20' }]}>
                  <Text style={[styles.scoreText, { color: getScoreColor(product.score) }]}>
                    {product.score}/100
                  </Text>
                  <Text style={[styles.scoreLabel, { color: getScoreColor(product.score) }]}>
                    {product.scoreLabel}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.analysisBox}>
              <Text style={styles.analysisTitle}>Peel's Analysis</Text>
              <Text style={styles.analysisText}>{product.analysis}</Text>
            </View>

            {product.flags.length > 0 && (
              <View style={styles.flagsSection}>
                <Text style={styles.flagsTitle}>Flags</Text>
                {product.flags.map((flag, i) => (
                  <View
                    key={i}
                    style={[
                      styles.flagRow,
                      { backgroundColor: flag.severity === 'danger' ? '#FEE2E2' : '#FEF3C7' },
                    ]}
                  >
                    <Text style={styles.flagIcon}>
                      {flag.severity === 'danger' ? '●' : '●'}
                    </Text>
                    <Text style={styles.flagText}>{flag.label}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownTitle}>Breakdown</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Seed Oils</Text>
                <Text style={[styles.breakdownValue, { color: product.hasSeedOils ? '#EF4444' : '#22C55E' }]}>
                  {product.hasSeedOils ? 'Present' : 'None'}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Processing</Text>
                <Text style={[styles.breakdownValue, {
                  color: product.processingLevel === 'High' ? '#EF4444' : product.processingLevel === 'Medium' ? '#F59E0B' : '#22C55E'
                }]}>
                  {product.processingLevel}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Additives</Text>
                <Text style={[styles.breakdownValue, { color: product.hasAdditives ? '#F59E0B' : '#22C55E' }]}>
                  {product.hasAdditives ? `${product.additives.length} found` : 'None'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Could not load demo product. You can still continue!</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          testID="start-scanning-button"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleStart}
        >
          <Text style={styles.buttonText}>Start Scanning</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  progress: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: brand.primary,
    borderRadius: 2,
  },
  step: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  demoCard: {
    gap: 16,
  },
  productHeader: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 6,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  analysisBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  flagsSection: {
    gap: 8,
  },
  flagsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  flagIcon: {
    fontSize: 14,
  },
  flagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  breakdownSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    paddingTop: 12,
  },
  button: {
    backgroundColor: brand.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: brand.primaryDark,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
