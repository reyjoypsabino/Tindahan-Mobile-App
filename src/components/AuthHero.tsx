import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '../theme/theme';

interface AuthHeroProps {
  greeting?: string;
  caption?: string;
}

// Clean auth header: solid brand background, apron mascot hero, no photo noise.
// Scales with screen width; fixed proportions keep every size consistent.
export default function AuthHero({ greeting, caption }: AuthHeroProps) {
  const { width } = useWindowDimensions();
  const mascotSize = Math.round(Math.min(160, Math.max(112, width * 0.34)));

  return (
    <View style={styles.hero}>
      <Image
        source={require('../assets/cat-mascot.png')}
        style={{ width: mascotSize, height: mascotSize }}
        resizeMode="contain"
        accessibilityLabel="Tindahan cat clerk mascot"
      />
      <Text style={styles.wordmark}>Tindahan</Text>
      <Text style={styles.tagline}>Sari-sari store companion</Text>
      {greeting ? <Text style={styles.greeting}>{greeting}</Text> : null}
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  wordmark: { color: colors.white, fontSize: 30, fontWeight: fontWeight.bold, marginTop: spacing.sm },
  tagline: { color: colors.white, fontSize: fontSize.sm, opacity: 0.9 },
  greeting: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginTop: spacing.md },
  caption: { color: colors.white, fontSize: fontSize.xs, opacity: 0.85, marginTop: 2, textAlign: 'center' },
});
