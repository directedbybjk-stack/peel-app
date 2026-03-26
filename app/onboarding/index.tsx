import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { brand } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>P</Text>
          </View>
          <Text style={styles.logoText}>Peel</Text>
        </View>
        <Text style={styles.tagline}>Peel back the label.</Text>
        <Text style={styles.subtitle}>
          Scan any product to instantly see what's really inside — seed oils, additives, toxins, and more.
        </Text>

        <View style={styles.socialProof}>
          <View style={styles.proofItem}>
            <Text style={styles.proofNumber}>3M+</Text>
            <Text style={styles.proofLabel}>Products</Text>
          </View>
          <View style={styles.proofDivider} />
          <View style={styles.proofItem}>
            <Text style={styles.proofNumber}>100%</Text>
            <Text style={styles.proofLabel}>Transparent</Text>
          </View>
          <View style={styles.proofDivider} />
          <View style={styles.proofItem}>
            <Text style={styles.proofNumber}>Free</Text>
            <Text style={styles.proofLabel}>To Start</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottom}>
        <Pressable
          testID="get-started-button"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.push('/onboarding/goals')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
        <Pressable
          testID="sign-in-link"
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.signInText}>Already have an account? Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 50,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: brand.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '600',
    color: brand.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    width: '100%',
  },
  proofItem: {
    flex: 1,
    alignItems: 'center',
  },
  proofNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  proofLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  proofDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
  },
  bottom: {
    alignItems: 'center',
    gap: 16,
  },
  button: {
    backgroundColor: brand.primary,
    borderRadius: 16,
    paddingVertical: 18,
    width: '100%',
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
  signInText: {
    color: '#6B7280',
    fontSize: 15,
  },
});
