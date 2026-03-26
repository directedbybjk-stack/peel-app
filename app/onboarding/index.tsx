import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <LinearGradient colors={['#ECFDF5', '#D1FAE5', '#A7F3D0']} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoOuter}>
          <LinearGradient colors={['#16A34A', '#15803D']} style={styles.logoGradient}>
            <Text style={styles.logoLetter}>P</Text>
          </LinearGradient>
        </View>

        <Text style={styles.appName}>Peel</Text>
        <Text style={styles.tagline}>Peel back the label.</Text>

        <Text style={styles.subtitle}>
          Instantly see what's really inside your food — seed oils, additives, toxins, and more.
        </Text>

        {/* Social Proof Cards */}
        <View style={styles.proofRow}>
          <View style={styles.proofCard}>
            <Text style={styles.proofValue}>3M+</Text>
            <Text style={styles.proofLabel}>Products</Text>
          </View>
          <View style={styles.proofCard}>
            <Text style={styles.proofValue}>100%</Text>
            <Text style={styles.proofLabel}>Transparent</Text>
          </View>
          <View style={styles.proofCard}>
            <Text style={styles.proofValue}>Free</Text>
            <Text style={styles.proofLabel}>To Start</Text>
          </View>
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottom}>
        <Pressable
          testID="get-started-button"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.push('/onboarding/goals')}
        >
          <LinearGradient
            colors={['#16A34A', '#15803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </LinearGradient>
        </Pressable>

        <Pressable testID="sign-in-link" onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInLink}>Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    paddingBottom: 50,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoOuter: {
    marginBottom: 20,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoGradient: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 52,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '600',
    color: '#16A34A',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 12,
    marginBottom: 40,
  },
  proofRow: {
    flexDirection: 'row',
    gap: 12,
  },
  proofCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  proofValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  proofLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottom: {
    alignItems: 'center',
    gap: 20,
  },
  button: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  signInText: {
    fontSize: 15,
    color: '#6B7280',
  },
  signInLink: {
    color: '#16A34A',
    fontWeight: '700',
  },
});
