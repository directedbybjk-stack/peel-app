import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import Purchases, { type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';

import { CONTACT_URL, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/lib/appConfig';
import { useOnboarding } from '@/app/_layout';
import { trackMetaPurchase, trackMetaStartTrial } from '@/lib/metaTracking';
import { getPackageForPlan, hasAvailableSubscriptionPackages, hasPremiumAccess, loadCurrentOfferingWithTimeout } from '@/lib/revenuecat';
import { setOnboardingComplete } from '@/lib/storage';

type Plan = 'monthly' | 'yearly';

function getIntroOfferCopy(aPackage: PurchasesPackage | null) {
  const introPrice = aPackage?.product.introPrice ?? null;
  const hasFreeTrial = Boolean(introPrice && introPrice.price === 0);
  const periodUnit = introPrice?.periodUnit?.toLowerCase() ?? '';
  const periodCount = introPrice?.periodNumberOfUnits ?? 0;
  const periodLabel = periodUnit && periodCount
    ? `${periodCount}-${periodUnit.toUpperCase()} FREE TRIAL`
    : null;

  return {
    introPrice,
    hasFreeTrial,
    periodUnit,
    periodCount,
    periodLabel,
  };
}

export default function PaywallScreen() {
  const { setDone: setOnboardingDone } = useOnboarding();
  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly');
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offeringsError, setOfferingsError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadOffering() {
      if (mounted) {
        setLoadingOfferings(true);
        setOfferingsError(null);
      }

      try {
        const currentOffering = await loadCurrentOfferingWithTimeout();
        if (mounted) {
          setOffering(currentOffering);
          setOfferingsError(
            hasAvailableSubscriptionPackages(currentOffering)
              ? null
              : 'Subscriptions are currently unavailable on this device.'
          );
        }
      } catch (error) {
        console.error('Failed to load RevenueCat offerings', error);
        if (mounted) {
          setOffering(null);
          setOfferingsError('We could not load subscription plans right now. Please try again.');
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
  }, [loadAttempt]);

  const monthlyPackage = useMemo(() => getPackageForPlan(offering, 'monthly'), [offering]);
  const yearlyPackage = useMemo(() => getPackageForPlan(offering, 'yearly'), [offering]);
  const selectedPackage = selectedPlan === 'yearly' ? yearlyPackage : monthlyPackage;
  const subscriptionsUnavailable = !loadingOfferings && !selectedPackage && !monthlyPackage && !yearlyPackage;
  const monthlyIntro = getIntroOfferCopy(monthlyPackage);
  const yearlyIntro = getIntroOfferCopy(yearlyPackage);
  const selectedIntro = selectedPlan === 'yearly' ? yearlyIntro : monthlyIntro;

  useEffect(() => {
    if (selectedPlan === 'yearly' && !yearlyPackage && monthlyPackage) {
      setSelectedPlan('monthly');
      return;
    }

    if (selectedPlan === 'monthly' && !monthlyPackage && yearlyPackage) {
      setSelectedPlan('yearly');
    }
  }, [monthlyPackage, selectedPlan, yearlyPackage]);

  const handleSubscribe = async () => {
    if (!selectedPackage) {
      Alert.alert(
        'Subscription unavailable',
        'Peel could not load a purchasable subscription for this device right now. Please try again in a moment or contact support.'
      );
      return;
    }

    setIsProcessing(true);

    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      if (!hasPremiumAccess(customerInfo)) {
        Alert.alert('Purchase incomplete', 'We could not confirm your subscription yet. Please try restore purchases.');
        return;
      }

      if (selectedIntro.hasFreeTrial) {
        await trackMetaStartTrial({
          value: selectedPackage.product.price,
          currency: selectedPackage.product.currencyCode,
          plan: selectedPlan,
        });
      }

      await trackMetaPurchase({
        value: selectedPackage.product.price,
        currency: selectedPackage.product.currencyCode,
        plan: selectedPlan,
      });

      await setOnboardingComplete();
      setOnboardingDone(true);
      router.replace('/(tabs)');
    } catch (error) {
      const purchaseError = error as { userCancelled?: boolean; message?: string };
      if (!purchaseError.userCancelled) {
        console.error('RevenueCat purchase failed', error);
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
      setOnboardingDone(true);
      router.replace('/(tabs)');
    } catch (error) {
      const restoreError = error as { message?: string };
      console.error('RevenueCat restore failed', error);
      Alert.alert('Restore failed', restoreError.message || 'We could not restore your purchases. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const monthlyPrice = monthlyPackage?.product.priceString;
  const yearlyPrice = yearlyPackage?.product.priceString;

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
          {loadingOfferings && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#16A34A" />
              <Text style={styles.loadingTitle}>Loading subscription plans...</Text>
              <Text style={styles.loadingSubtitle}>
                If this takes too long, Peel will show a retry option instead of staying stuck.
              </Text>
            </View>
          )}

          {/* Monthly */}
          <Pressable
            testID="plan-monthly"
            accessible
            accessibilityRole="button"
            accessibilityState={{ selected: selectedPlan === 'monthly', disabled: !monthlyPackage }}
            disabled={!monthlyPackage}
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.planCardSelected,
              !monthlyPackage && styles.planCardDisabled,
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            {selectedPlan === 'monthly' && monthlyIntro.periodLabel && (
              <View style={styles.bestValueLabel}>
                <Text style={styles.bestValueText}>{monthlyIntro.periodLabel}</Text>
              </View>
            )}
            <View style={styles.planLeft}>
              <View style={[styles.radio, selectedPlan === 'monthly' && styles.radioSelected]}>
                {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
              </View>
              <View>
                <Text style={styles.planBenefit}>
                  {monthlyIntro.hasFreeTrial ? 'Start with a free trial' : 'Flexible monthly plan'}
                </Text>
                <Text style={[styles.planName, selectedPlan === 'monthly' && styles.planNameSelected]}>Monthly</Text>
                <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceSelected]}>
                  {monthlyPrice ? `${monthlyPrice}/month` : 'Currently unavailable'}
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Yearly */}
          <Pressable
            testID="plan-yearly"
            accessible
            accessibilityRole="button"
            accessibilityState={{ selected: selectedPlan === 'yearly', disabled: !yearlyPackage }}
            disabled={!yearlyPackage}
            style={[
              styles.planCard,
              selectedPlan === 'yearly' && styles.planCardSelected,
              !yearlyPackage && styles.planCardDisabled,
            ]}
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
                <Text style={styles.planBenefit}>
                  {yearlyIntro.hasFreeTrial ? 'Best value after trial' : 'Best yearly value'}
                </Text>
                <Text style={[styles.planName, selectedPlan === 'yearly' && styles.planNameSelected]}>Yearly</Text>
                <Text style={[styles.planPrice, selectedPlan === 'yearly' && styles.planPriceSelected]}>
                  {yearlyPrice ? `${yearlyPrice}/year` : 'Currently unavailable'}
                </Text>
              </View>
            </View>
            {yearlyPackage && yearlyIntro.periodLabel && (
              <LinearGradient colors={['#16A34A', '#15803D']} style={styles.trialBadge}>
                <Text style={styles.trialBadgeText}>{yearlyIntro.periodLabel}</Text>
              </LinearGradient>
            )}
          </Pressable>
        </View>

        {selectedPackage && selectedIntro.hasFreeTrial && (
          <View style={styles.noPaymentRow}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <Text style={styles.noPaymentText}>No Payment Due Now</Text>
          </View>
        )}

        {subscriptionsUnavailable && (
          <View style={styles.unavailableCard}>
            <Text style={styles.unavailableTitle}>Subscriptions unavailable</Text>
            <Text style={styles.unavailableText}>
              {offeringsError ?? 'Peel could not load a purchasable subscription right now.'}
            </Text>
            <Pressable style={styles.retryButton} onPress={() => setLoadAttempt((attempt) => attempt + 1)}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL(CONTACT_URL)}>
              <Text style={styles.unavailableLink}>Contact support</Text>
            </Pressable>
          </View>
        )}

      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={styles.bottomFixed}>
        <Pressable
          testID="subscribe-button"
          disabled={loadingOfferings || isProcessing || !selectedPackage}
          style={[
            { width: '100%' },
            (loadingOfferings || isProcessing || !selectedPackage) && styles.buttonDisabled,
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
              {isProcessing
                ? 'Working...'
                  : !selectedPackage
                    ? 'Subscriptions unavailable'
                    : selectedPlan === 'yearly'
                      ? selectedIntro.hasFreeTrial
                        ? `Start ${selectedIntro.periodCount}-Day Free Trial`
                        : `Subscribe for ${yearlyPrice}/yr`
                      : selectedIntro.hasFreeTrial
                        ? `Start ${selectedIntro.periodCount}-Day Free Trial`
                        : `Subscribe for ${monthlyPrice}/mo`}
            </Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.finePrint}>
          {!selectedPackage
            ? 'Restore purchases remains available below if you already subscribed.'
            : selectedPlan === 'yearly'
              ? selectedIntro.hasFreeTrial
                ? `${selectedIntro.periodCount} ${selectedIntro.periodUnit || 'period'}${selectedIntro.periodCount === 1 ? '' : 's'} FREE, then ${yearlyPrice} per year. Cancel anytime.`
                : `Billed at ${yearlyPrice}/year. Cancel anytime.`
              : selectedIntro.hasFreeTrial
                ? `${selectedIntro.periodCount} ${selectedIntro.periodUnit || 'period'}${selectedIntro.periodCount === 1 ? '' : 's'} FREE, then ${monthlyPrice}/month. Cancel anytime.`
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
  loadingCard: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
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
  planCardDisabled: {
    opacity: 0.5,
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
  unavailableCard: {
    marginBottom: 24,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  unavailableTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
  },
  unavailableText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#78350F',
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#16A34A',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unavailableLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
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
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  legalLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
