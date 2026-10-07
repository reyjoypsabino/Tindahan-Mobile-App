import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '../theme/theme';

interface SariSariHeaderProps {
  storeName?: string;
  subtitle?: string;
  variant?: 'main' | 'inner';
  onBack?: () => void;
}

// Banner header (mirrors Figma): artwork + purple scrim, white title/subtitle,
// cat clerk avatar at right on every screen.
export default function SariSariHeader({ storeName = 'Tindahan', subtitle, variant = 'main', onBack }: SariSariHeaderProps) {
  return (
    <View style={styles.wrap}>
      <Image source={require('../assets/store-banner.jpg')} style={styles.bg} resizeMode="cover" />
      <View style={styles.scrim} />
      <View style={styles.row}>
        {variant === 'inner' ? (
          <TouchableOpacity onPress={onBack} style={styles.sideBtn} accessibilityLabel="Go back">
            <Text style={styles.chev}>‹</Text>
          </TouchableOpacity>
        ) : null}
        <View style={styles.identity}>
          <Text style={styles.title}>{storeName}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Image source={require('../assets/cat-avatar.png')} style={styles.avatar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 148, justifyContent: 'flex-end', paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, overflow: 'hidden' },
  bg: { ...StyleSheet.absoluteFill },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(46, 38, 120, 0.62)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sideBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chev: { color: colors.white, fontSize: 28, fontWeight: fontWeight.bold },
  identity: { flex: 1, gap: 2 },
  title: { color: colors.white, fontSize: 24, fontWeight: fontWeight.bold },
  subtitle: { color: colors.white, fontSize: fontSize.xs, opacity: 0.9 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
});
