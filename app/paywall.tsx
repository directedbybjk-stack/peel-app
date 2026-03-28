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
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.logo}>
            <Text style={styles.logoText}>P</Text>
          </LinearGradient>
          <Text style={styles.headline}>Start Eating{'\n'}Cleaner Today</Text>

          <View style={styles.socialProof}>
            <View style={styles.proofItem}>
              <Text style={styles.proofValue}>3M+</Text>
              <Text style={styles.proofLabel}>Products Scanned</Text>
            </View>
          </View>
          <Text style={styles.trustedText}>Trusted by health-conscious families</Text>
        </View>

        {/* Benefits — above pricing */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>What you get with Peel Pro</Text>
          <FeatureRow text="Unlimited product scans" />
          <FeatureRow text="Detailed ingredient breakdown" />
          <FeatureRow text="Seed oil & additive detection" />
          <FeatureRow text="Personalized health alerts" />
          <FeatureRow text="Healthier alternative suggestions" />
          <FeatureRow text="Full scan history" />
        </View>

        {/* Pricing plans */}
        <View style={styles.pricingSection}>
          {/* Monthly */}
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
                <Text style={[styles.planName, selectedPlan === 'monthly' && styles.planNameSelected]}>Monthly</Text>
                <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceSelected]}>{monthlyPrice}/month</Text>
              </View>
            </View>
          </Pressable>

          {/* Yearly */}
          <Pressable
            testID="plan-yearly"
            accessible
            accessibilityRole="button"
            accessibilityState={{ selected: selectedPlan === 'yearly' }}
            style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('yearly')}
          >
            {selectedPlan === 'yearly' && (
              <View style={styles.bestValueLabel}>
                <Text style={styles.bestValueText}>BEST VALUE</Text>
              </View>
            )}
            <View style={styles.planLeft}>
              <View style={[styles.radio, selectedPlan === 'yearly' && styles.radioSelected]}>
                {selectedPlan === 'yearly' && <View style={styles.radioInner} />}
              </View>
              <View>
                <Text style={styles.planBenefit}>Best value after trial</Text>
                <Text style={[styles.planName, selectedPlan === 'yearly' && styles.planNameSelected]}>Yearly</Text>
                <Text style={[styles.planPrice, selectedPlan === 'yearly' && styles.planPriceSelected]}>{yearlyPrice}/year</Text>
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
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <Text style={styles.noPaymentText}>No Payment Due Now</Text>
          </View>
        )}

      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={styles.bottomFixed}>
        <Pressable
          testID="subscribe-button"
          disabled={loadingOfferings || isProcessing}
          style={[
            { width: '100%' },
            (loadingOfferings || isProcessing) && styles.buttonDisabled,
          ]}
          onPress={handleSubscribe}
        >
          <LinearGradient
            colors={['#16A34A', '#15803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>
              {isProcessing ? 'Working...' : selectedPlan === 'yearly' ? 'Try for $0.00' : `Subscribe for ${monthlyPrice}/mo`}
            </Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.finePrint}>
          {selectedPlan === 'yearly'
            ? `7 days FREE, then ${yearlyPrice} per year. Cancel anytime.`
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },

  scrollContent: {
    paddingTop: 72,
    paddingHorizontal: 24,
    paddingBottom: 210,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
  },
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 20,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  proofItem: {
    alignItems: 'center',
  },
  proofValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  proofLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  proofDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  trustedText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 12,
  },

  // Benefits
  benefitsCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  benefitsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCheckText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  featureText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },

  // Pricing
  pricingSection: {
    gap: 10,
    marginBottom: 14,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
  },
  bestValueLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomRightRadius: 8,
  },
  bestValueText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#16A34A',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
  },
  planName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  planNameSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
  planBenefit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 1,
  },
  planPriceSelected: {
    color: '#0F172A',
  },
  trialBadge: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  trialBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },

  noPaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  noPaymentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },

  // Bottom CTA
  bottomFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  ctaButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  finePrint: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 17,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  legalLink: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontSize: 12,
    color: '#CBD5E1',
  },
});
