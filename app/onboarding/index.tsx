import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 100 });
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top decorative gradient band */}
      <LinearGradient
        colors={['#D1FAE5', '#ECFDF5', '#FFFFFF']}
        style={styles.topGradient}
      />

      <View style={styles.content}>
        {/* App Icon */}
        <Animated.View style={[styles.logoWrapper, logoStyle]}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Title block */}
        <Animated.View entering={FadeInDown.delay(200).duration(500).springify()}>
          <Text style={styles.appName}>Peel</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).duration(500).springify()}>
          <Text style={styles.tagline}>Scan the label. Reveal the truth.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450).duration(500).springify()}>
          <Text style={styles.subtitle}>
            See what's really inside your food — seed oils,{'\n'}additives, allergens, and more.
          </Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.delay(550).duration(500).springify()} style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3M+</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>100%</Text>
            <Text style={styles.statLabel}>Transparent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Free</Text>
            <Text style={styles.statLabel}>7-Day Trial</Text>
          </View>
        </Animated.View>

        {/* Trust line */}
        <Animated.View entering={FadeInDown.delay(650).duration(400)}>
          <Text style={styles.trustText}>Trusted by health-conscious families</Text>
        </Animated.View>
      </View>

      {/* Bottom CTA */}
      <Animated.View entering={FadeInDown.delay(700).duration(500).springify()} style={styles.bottom}>
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoWrapper: {
    marginBottom: 24,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 26,
  },
  appName: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -2,
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 17,
    fontWeight: '600',
    color: '#16A34A',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  trustText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 20,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    alignItems: 'center',
    gap: 18,
  },
  button: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
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
    paddingVertical: 18,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
