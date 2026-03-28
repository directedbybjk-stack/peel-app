import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function WelcomeScreen() {
  // Animation values
  const logoScale = useSharedValue(0);
  const logoGlow = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const card1 = useSharedValue(0);
  const card2 = useSharedValue(0);
  const card3 = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);
  const ctaTranslateY = useSharedValue(30);
  const buttonShimmer = useSharedValue(0);
  const logoFloat = useSharedValue(0);

  useEffect(() => {
    // Logo entrance — bouncy spring
    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
      mass: 0.8,
    });

    // Logo continuous float
    logoFloat.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(8, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Logo glow pulse
    logoGlow.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Title slide up + fade
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    titleTranslateY.value = withDelay(400, withSpring(0, { damping: 14, stiffness: 90 }));

    // Tagline
    taglineOpacity.value = withDelay(600, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    taglineTranslateY.value = withDelay(600, withSpring(0, { damping: 14, stiffness: 90 }));

    // Subtitle
    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));

    // Staggered proof cards
    card1.value = withDelay(950, withSpring(1, { damping: 12, stiffness: 80 }));
    card2.value = withDelay(1100, withSpring(1, { damping: 12, stiffness: 80 }));
    card3.value = withDelay(1250, withSpring(1, { damping: 12, stiffness: 80 }));

    // CTA
    ctaOpacity.value = withDelay(1400, withTiming(1, { duration: 500 }));
    ctaTranslateY.value = withDelay(1400, withSpring(0, { damping: 14, stiffness: 90 }));

    // Button shimmer loop
    buttonShimmer.value = withDelay(
      2000,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 400 }),
          withTiming(0, { duration: 1500 }) // pause between shimmers
        ),
        -1
      )
    );
  }, []);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { translateY: logoFloat.value },
    ],
  }));

  const logoGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(logoGlow.value, [0, 1], [0.3, 0.7]),
    transform: [
      { scale: interpolate(logoGlow.value, [0, 1], [1, 1.35]) },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const makeCardStyle = (val: Animated.SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: val.value,
      transform: [
        { scale: interpolate(val.value, [0, 1], [0.7, 1]) },
        { translateY: interpolate(val.value, [0, 1], [30, 0]) },
      ],
    }));

  const card1Style = makeCardStyle(card1);
  const card2Style = makeCardStyle(card2);
  const card3Style = makeCardStyle(card3);

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(buttonShimmer.value, [0, 0.5, 1], [0, 0.4, 0]),
  }));

  return (
    <LinearGradient colors={['#F0FDF9', '#ECFDF5', '#D1FAE5', '#A7F3D0']} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        {/* Animated Logo with Glow */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          {/* Glow ring */}
          <Animated.View style={[styles.logoGlow, logoGlowStyle]} />
          <View style={styles.logoOuter}>
            <LinearGradient
              colors={['#22C55E', '#16A34A', '#15803D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Text style={styles.logoLetter}>P</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* App Name */}
        <Animated.View style={titleStyle}>
          <Text style={styles.appName}>Peel</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={taglineStyle}>
          <Text style={styles.tagline}>Scan the label. Reveal the truth.</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={subtitleStyle}>
          <Text style={styles.subtitle}>
            Barcode-first food scanning that peels back{'\n'}the packaging and shows what is really{'\n'}hiding inside.
          </Text>
        </Animated.View>

        {/* Animated Proof Cards */}
        <View style={styles.proofRow}>
          <Animated.View style={[styles.proofCard, card1Style]}>
            <Text style={styles.proofValue}>3M+</Text>
            <Text style={styles.proofLabel}>PRODUCTS</Text>
          </Animated.View>
          <Animated.View style={[styles.proofCard, card2Style]}>
            <Text style={styles.proofValue}>100%</Text>
            <Text style={styles.proofLabel}>TRANSPARENT</Text>
          </Animated.View>
          <Animated.View style={[styles.proofCard, card3Style]}>
            <Text style={styles.proofValue}>7-Day</Text>
            <Text style={styles.proofLabel}>TRIAL</Text>
          </Animated.View>
        </View>
      </View>

      {/* Bottom CTA with shimmer */}
      <Animated.View style={[styles.bottom, ctaStyle]}>
        <AnimatedPressable
          testID="get-started-button"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.push('/onboarding/goals')}
        >
          <LinearGradient
            colors={['#22C55E', '#16A34A', '#15803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <Text style={styles.buttonArrow}>→</Text>

            {/* Shimmer overlay */}
            <Animated.View style={[styles.shimmerOverlay, shimmerStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.35)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </LinearGradient>
        </AnimatedPressable>

        <Pressable testID="sign-in-link" onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInLink}>Sign in</Text>
          </Text>
        </Pressable>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingBottom: 50,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#22C55E',
  },
  logoOuter: {
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appName: {
    fontSize: 56,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -2.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16A34A',
    letterSpacing: 0.3,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 8,
    marginBottom: 36,
  },
  proofRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  proofCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  proofValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  proofLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 4,
    letterSpacing: 1.2,
  },
  bottom: {
    alignItems: 'center',
    gap: 18,
  },
  button: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }],
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
    overflow: 'hidden',
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
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  signInText: {
    fontSize: 15,
    color: '#94A3B8',
  },
  signInLink: {
    color: '#16A34A',
    fontWeight: '700',
  },
});
