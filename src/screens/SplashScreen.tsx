import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, Text, TouchableWithoutFeedback, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { colors, fontSize, fontWeight } from '../theme/theme';

// Artwork natural size: 1024 x 1792. Rendered contain-fit with EXPLICIT dp
// dimensions (never cropped, never zoomed) on a warm dark gradient bed that
// complements the store wood tones on any viewport ratio.
const ART_W = 1024;
const ART_H = 1792;

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

// Branded full-bleed intro: store scene settles, clerk cat enters with a 1.2s
// bounce, greeting + brand rise, then an idle breathing loop.
// Tap mascot = bounce; long-press anywhere = skip; reduced-motion = final state.
export default function SplashScreen({ navigation }: Props) {
  const { session, ready } = useAuth();
  const go = () => navigation.replace(session ? 'Main' : 'Login');
  const gone = useRef<boolean>(false);
  const finish = () => {
    if (!gone.current) {
      gone.current = true;
      go();
    }
  };

  const { width: winW, height: winH } = useWindowDimensions();
  const fitScale = Math.min(winW / ART_W, winH / ART_H);
  const artW = Math.round(ART_W * fitScale);
  const artH = Math.round(ART_H * fitScale);

  const mascotY = useRef(new Animated.Value(-160)).current;
  const mascotScaleY = useRef(new Animated.Value(1)).current;
  const mascotScale = useRef(new Animated.Value(1)).current;
  const greetOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandY = useRef(new Animated.Value(12)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ready) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) {
        mascotY.setValue(0);
        greetOpacity.setValue(1);
        brandOpacity.setValue(1);
        brandY.setValue(0);
      } else {
        // 1.2-second entrance bounce: spring drop, then squash-and-rebound.
        Animated.sequence([
          Animated.spring(mascotY, { toValue: 0, stiffness: 90, damping: 10, useNativeDriver: true }),
          Animated.timing(mascotScaleY, { toValue: 0.82, duration: 120, useNativeDriver: true }),
          Animated.spring(mascotScaleY, { toValue: 1, stiffness: 180, damping: 9, useNativeDriver: true }),
        ]).start();
        Animated.timing(greetOpacity, { toValue: 1, duration: 450, delay: 900, useNativeDriver: true }).start();
        Animated.parallel([
          Animated.timing(brandOpacity, { toValue: 1, duration: 500, delay: 1100, useNativeDriver: true }),
          Animated.timing(brandY, { toValue: 0, duration: 500, delay: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(breathe, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(breathe, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
        );
        timers.push(setTimeout(() => loop.start(), 1400));
      }
      timers.push(setTimeout(finish, 2400));
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, ready]);

  const boing = () => {
    Animated.sequence([
      Animated.timing(mascotScale, { toValue: 0.88, duration: 120, useNativeDriver: true }),
      Animated.spring(mascotScale, { toValue: 1, stiffness: 200, damping: 8, useNativeDriver: true }),
    ]).start();
  };

  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  return (
    <TouchableWithoutFeedback onLongPress={finish} accessibilityLabel="Skip intro">
      <View style={styles.container}>
        <LinearGradient colors={['#4A3428', '#241A2E']} style={StyleSheet.absoluteFill} />
        <View style={styles.artWrap}>
          <Image
            source={require('../assets/store-artwork.png')}
            style={{ width: artW, height: artH }}
            resizeMode="contain"
          />
        </View>
        <View style={styles.mascotSpot}>
          <TouchableWithoutFeedback onPress={boing} accessibilityRole="button" accessibilityLabel="Cat mascot">
            <Animated.View
              style={{
                transform: [
                  { translateY: mascotY },
                  { scaleY: mascotScaleY },
                  { scale: Animated.multiply(mascotScale, breatheScale) },
                ],
              }}
            >
              <Image source={require('../assets/cat-mascot.png')} style={styles.mascot} resizeMode="contain" />
            </Animated.View>
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.greetPill, { opacity: greetOpacity }]}>
            <Text style={styles.greeting}>Mabuhay! Ang iyong tindahan, ang iyong negosyo.</Text>
          </Animated.View>
        </View>
        <Animated.View style={[styles.brand, { opacity: brandOpacity, transform: [{ translateY: brandY }] }]}>
          <Text style={styles.title}>Tindahan</Text>
          <Text style={styles.tagline}>Sari-sari store companion</Text>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#241A2E' },
  artWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  mascotSpot: { position: 'absolute', top: '24%', left: 0, right: 0, alignItems: 'center', gap: 12 },
  mascot: { width: 280, height: 280 },
  greetPill: {
    backgroundColor: 'rgba(23, 23, 45, 0.55)',
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 40,
    alignItems: 'center',
  },
  greeting: { color: colors.white, fontSize: 15, fontWeight: fontWeight.medium, textAlign: 'center' },
  brand: { position: 'absolute', bottom: '7%', left: 0, right: 0, alignItems: 'center', gap: 2 },
  title: { color: colors.white, fontSize: 40, fontWeight: fontWeight.bold, textShadowColor: 'rgba(23,23,45,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  tagline: { color: colors.white, fontSize: 14, opacity: 0.92, textShadowColor: 'rgba(23,23,45,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});
