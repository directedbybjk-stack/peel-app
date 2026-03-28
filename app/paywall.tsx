import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import Purchases, { type PurchasesOffering } from 'react-native-purchases';

import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/lib/appConfig';
import { configureRevenueCat, getPackageForPlan, hasPremiumAccess } from '@/lib/revenuecat';
import { setOnboardingComplete } from '@/lib/storage';

type Plan = 'monthly' | 'yearly';

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly');
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadOffering() {
      try {
        await configureRevenueCat();
        const offerings = await Purchases.getOfferings();
        if (mounted) {
          setOffering(offerings.current);
        }
      } catch {
        if (mounted) {
          setOffering(null);
        }
      } finally {
        if (mounted) {
          setLoadingOfferings(false);
        }
      }
    }

    loadOffering();

    return () => {
      mounted = false;
    };
  }, []);

  const monthlyPackage = useMemo(() => getPackageForPlan(offering, 'monthly'), [offering]);
  const yearlyPackage = useMemo(() => getPackageForPlan(offering, 'yearly'), [offering]);
  const selectedPackage = selectedPlan === 'yearly' ? yearlyPackage : monthlyPackage;

  const handleSubscribe = async () => {
    if (!selectedPackage) {
      Alert.alert('Subscription unavailable', 'The subscription options are still loading. Try again in a moment.');
      return;
    }

    setIsProcessing(true);

    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      if (!hasPremiumAccess(customerInfo)) {
        Alert.alert('Purchase incomplete', 'We could not confirm your subscription yet. Please try restore purchases.');
        return;
      }

      await setOnboardingComplete();
      router.replace('/(tabs)');
    } catch (error) {
      const purchaseError = error as { userCancelled?: boolean; message?: string };
      if (!purchaseError.userCancelled) {
        Alert.alert('Purchase failed', purchaseError.message || 'We could not complete your purchase. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);

    try {
      const customerInfo = await Purchases.restorePurchases();
      if (!hasPremiumAccess(customerInfo)) {
        Alert.alert('No active subscription found', 'We could not find an active Peel subscription to restore.');
        return;
      }

      await setOnboardingComplete();
      router.replace('/(tabs)');
    } catch (error) {
      const restoreError = error as { message?: string };
      Alert.alert('Restore failed', restoreError.message || 'We could not restore your purchases. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const monthlyPrice = monthlyPackage?.product.priceString || '$14.99';
  const yearlyPricePerMonth = yearlyPackage?.product.pricePerMonthString || '$5.83';
  const yearlyPrice = yearlyPackage?.product.priceString || '$69.99';
  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/onboarding');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Pressable style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <LinearGradient colors={['#16A34A', '#15803D']} style={styles.logo}>
            <Text style={styles.logoText}>P</Text>
          </LinearGradient>
          <Text style={styles.headline}>Start Eating{'\n'}Cleaner Today</Text>
        </View>

        <View style={styles.socialProof}>
          <View style={styles.proofItem}>
            <Text style={styles.proofValue}>4.9</Text>
            <Text style={styles.proofLabel}>Stars</Text>
          </View>
          <View style={styles.proofDivider} />
          <View style={styles.proofItem}>
            <Text style={styles.proofValue}>3M+</Text>
            <Text style={styles.proofLabel}>Products</Text>
          </View>
        </View>

        <Text style={styles.trustedText}>Trusted by health-conscious families</Text>

        <View style={styles.pricingSection}>
          <Pressable
            testID="plan-monthly"
            accessible
            accessibilityRole="button"
            accessibilityState={{ selected: selectedPlan === 'monthly' }}
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.planLeft}>
              <View style={[styles.radio, selectedPlan === 'monthly' && styles.radioSelected]}>
                {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
              </View>
              <View>
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planPrice}>{monthlyPrice}/mo</Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            testID="plan-yearly"
            accessible
            accessibilityRole="button"
            accessibilityState={{ selected: selectedPlan === 'yearly' }}
            style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('yearly')}
          >
            <View style={styles.planLeft}>
              <View style={[styles.radio, selectedPlan === 'yearly' && styles.radioSelected]}>
                {selectedPlan === 'yearly' && <View style={styles.radioInner} />}
              </View>
              <View>
                <Text style={styles.planName}>Yearly</Text>
                <Text style={styles.planPrice}>{yearlyPricePerMonth}/mo</Text>
              </View>
            </View>
            <LinearGradient colors={['#16A34A', '#15803D']} style={styles.trialBadge}>
              <Text style={styles.trialBadgeText}>7-DAY FREE TRIAL</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {selectedPlan === 'yearly' && (
          <View style={styles.noPaymentRow}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkText}>✓</Text>
            </View>
            <Text style={styles.noPaymentText}>No Payment Due Now</Text>
          </View>
        )}

        <View style={styles.testimonialCard}>
          <View style={styles.testimonialHeader}>
            <View style={styles.testimonialAvatar}>
              <Text style={styles.testimonialAvatarText}>S</Text>
            </View>
            <View>
              <Text style={styles.testimonialName}>Sarah M.</Text>
              <Text style={styles.testimonialLocation}>Austin, TX</Text>
            </View>
          </View>
          <Text style={styles.testimonialText}>
            "I had no idea how many seed oils were in my everyday groceries. Peel made it so easy to find cleaner alternatives for my family."
          </Text>
        </View>

        <View style={styles.testimonialCard}>
          <View style={styles.testimonialHeader}>
            <View style={[styles.testimonialAvatar, { backgroundColor: '#DBEAFE' }]}>
              <Text style={[styles.testimonialAvatarText, { color: '#2563EB' }]}>J</Text>
            </View>
            <View>
              <Text style={styles.testimonialName}>James R.</Text>
              <Text style={styles.testimonialLocation}>Denver, CO</Text>
            </View>
          </View>
          <Text style={styles.testimonialText}>
            "Worth every penny. I scan everything now before it goes in my cart. The ingredient breakdown is incredibly detailed."
          </Text>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Peel Pro includes:</Text>
          <FeatureRow text="Unlimited product scans" />
          <FeatureRow text="Detailed ingredient breakdown" />
          <FeatureRow text="Seed oil & additive detection" />
          <FeatureRow text="Personalized health alerts" />
          <FeatureRow text="Healthier alternative suggestions" />
          <FeatureRow text="Full scan history" />
        </View>
      </ScrollView>

      <View style={styles.bottomFixed}>
        <Pressable
          testID="subscribe-button"
          disabled={loadingOfferings || isProcessing}
          style={loadingOfferings || isProcessing ? styles.buttonDisabled : undefined}
          onPress={handleSubscribe}
        >
          <LinearGradient
            colors={['#16A34A', '#15803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>
              {isProcessing ? 'Working...' : selectedPlan === 'yearly' ? 'Try for $0.00' : 'Continue'}
            </Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.finePrint}>
          {selectedPlan === 'yearly'
            ? `7 days FREE, then ${yearlyPrice} per year (${yearlyPricePerMonth}/mo)`
            : `Billed at ${monthlyPrice}/month. Cancel anytime.`}
        </Text>

        <View style={styles.legalRow}>
          <Pressable onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}>
            <Text style={styles.legalLink}>Terms</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={handleRestore}>
            <Text style={styles.legalLink}>Restore</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureCheck}>
        <Text style={styles.featureCheckText}>✓</Text>
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  closeButton: {
    position: 'absolute', top: 56, right: 20, zIndex: 10,
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },

  scrollContent: { paddingTop: 70, paddingHorizontal: 24, paddingBottom: 200 },

  header: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { fontSize: 36, fontWeight: '900', color: '#FFF' },
  headline: { fontSize: 32, fontWeight: '900', color: '#111827', textAlign: 'center', lineHeight: 40 },

  socialProof: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 8,
    alignSelf: 'center', gap: 24,
  },
  proofItem: { alignItems: 'center' },
  proofValue: { fontSize: 24, fontWeight: '900', color: '#111827' },
  proofLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 2 },
  proofDivider: { width: 1, height: 32, backgroundColor: '#E5E7EB' },
  trustedText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 20 },

  testimonialCard: {
    backgroundColor: '#F9FAFB', borderRadius: 18, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  testimonialHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  testimonialAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#DCFCE7',
    alignItems: 'center', justifyContent: 'center',
  },
  testimonialAvatarText: { fontSize: 18, fontWeight: '800', color: '#16A34A' },
  testimonialName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  testimonialLocation: { fontSize: 12, color: '#9CA3AF' },
  testimonialText: { fontSize: 14, color: '#4B5563', lineHeight: 22, fontStyle: 'italic' },

  pricingSection: { gap: 12, marginTop: 8, marginBottom: 12 },
  planCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18,
    borderWidth: 2.5, borderColor: '#E5E7EB',
  },
  planCardSelected: {
    borderColor: '#16A34A', backgroundColor: '#F0FDF4',
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4,
  },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  radio: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2.5, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: '#16A34A' },
  radioInner: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#16A34A' },
  planName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  planPrice: { fontSize: 20, fontWeight: '900', color: '#111827', marginTop: 2 },
  trialBadge: { borderRadius: 10, paddingVertical: 6, paddingHorizontal: 14 },
  trialBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },

  noPaymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#16A34A',
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  noPaymentText: { fontSize: 15, fontWeight: '600', color: '#374151' },

  featuresCard: {
    backgroundColor: '#F0FDF4', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#DCFCE7',
  },
  featuresTitle: { fontSize: 16, fontWeight: '800', color: '#15803D', marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  featureCheck: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#16A34A',
    alignItems: 'center', justifyContent: 'center',
  },
  featureCheckText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  featureText: { fontSize: 15, color: '#374151', fontWeight: '500' },

  bottomFixed: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  buttonDisabled: { opacity: 0.7 },
  ctaButton: {
    borderRadius: 18, paddingVertical: 20, alignItems: 'center',
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  ctaText: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', letterSpacing: 0.3 },
  finePrint: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 10 },
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8 },
  legalLink: { fontSize: 12, color: '#9CA3AF', textDecorationLine: 'underline' },
  legalDot: { fontSize: 12, color: '#D1D5DB' },
});
