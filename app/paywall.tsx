import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

type Plan = 'monthly' | 'yearly';

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly');

  const handleSubscribe = () => {
    // TODO: RevenueCat integration
    // For now, just dismiss
    router.back();
  };

  const handleRestore = () => {
    // TODO: RevenueCat restore purchases
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Close button */}
      <Pressable style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient colors={['#16A34A', '#15803D']} style={styles.logo}>
            <Text style={styles.logoText}>P</Text>
          </LinearGradient>
          <Text style={styles.headline}>Start Eating{'\n'}Cleaner Today</Text>
        </View>

        {/* Social Proof */}
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

        {/* Testimonials */}
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

        {/* Pricing Options */}
        <View style={styles.pricingSection}>
          {/* Monthly */}
          <Pressable
            testID="plan-monthly"
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.planLeft}>
              <View style={[styles.radio, selectedPlan === 'monthly' && styles.radioSelected]}>
                {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
              </View>
              <View>
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planPrice}>$14.99/mo</Text>
              </View>
            </View>
          </Pressable>

          {/* Yearly */}
          <Pressable
            testID="plan-yearly"
            style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('yearly')}
          >
            <View style={styles.planLeft}>
              <View style={[styles.radio, selectedPlan === 'yearly' && styles.radioSelected]}>
                {selectedPlan === 'yearly' && <View style={styles.radioInner} />}
              </View>
              <View>
                <Text style={styles.planName}>Yearly</Text>
                <Text style={styles.planPrice}>$5.83/mo</Text>
              </View>
            </View>
            <LinearGradient colors={['#16A34A', '#15803D']} style={styles.trialBadge}>
              <Text style={styles.trialBadgeText}>7-DAY FREE TRIAL</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* No Payment Due */}
        {selectedPlan === 'yearly' && (
          <View style={styles.noPaymentRow}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkText}>✓</Text>
            </View>
            <Text style={styles.noPaymentText}>No Payment Due Now</Text>
          </View>
        )}

        {/* What you get */}
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

      {/* Fixed Bottom CTA */}
      <View style={styles.bottomFixed}>
        <Pressable testID="subscribe-button" onPress={handleSubscribe}>
          <LinearGradient
            colors={['#16A34A', '#15803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>
              {selectedPlan === 'yearly' ? 'Try for $0.00' : 'Continue'}
            </Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.finePrint}>
          {selectedPlan === 'yearly'
            ? '7 days FREE, then $69.99 per year ($5.83/mo)'
            : 'Billed at $14.99 per month. Cancel anytime.'}
        </Text>

        <View style={styles.legalRow}>
          <Pressable><Text style={styles.legalLink}>Terms</Text></Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable><Text style={styles.legalLink}>Privacy Policy</Text></Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={handleRestore}><Text style={styles.legalLink}>Restore</Text></Pressable>
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
