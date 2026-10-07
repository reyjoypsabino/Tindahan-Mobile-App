import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../navigation/types';
import OfflineBanner from '../components/OfflineBanner';
import SariSariHeader from '../components/SariSariHeader';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<MoreStackParamList, 'ExpiryTracker'>;

const BATCHES = [
  { name: 'Ligo Sardines', tag: '≤7 days · urgent', code: 'LG-018 · 6 cans · 6 days left', exp: 'Expires Oct 9, 2026', urgent: true, preview: '10% preview: ₱25 → ₱22.50 · not applied' },
  { name: 'Regular milled rice', tag: '8–14 days', code: 'RC-012 · 8 kg · 12 days left', exp: 'Expires Oct 15, 2026', urgent: false },
  { name: 'Kopiko Brown', tag: '15–30 days', code: 'KB-007 · 4 sachets · 25 days left', exp: 'Expires Oct 28, 2026', urgent: false },
  { name: 'Coca-Cola', tag: 'Later', code: 'CC-021 · 24 bottles · 48 days left', exp: 'Expires Nov 20, 2026', urgent: false },
];

// ExpiryTrackerScreen: batches grouped by urgency (mirrors Figma frames).
export default function ExpiryTrackerScreen({ navigation }: Props) {
  return (
    <View style={styles.flex}>
      <SariSariHeader storeName="Expiry Tracker" subtitle="Batch dates · as of Oct 3, 2026" variant="inner" onBack={() => navigation.goBack()} />
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>3 batches within 30 days</Text>
          <Text style={styles.sub}>7 days urgent · 14 days soon · 30 days upcoming</Text>
        </View>
        {BATCHES.map((b) => (
          <View key={b.name} style={[styles.card, b.urgent && styles.cardUrgent]}>
            <View style={styles.head}>
              <Text style={styles.name}>{b.name}</Text>
              <Text style={[styles.tag, b.urgent ? styles.tagUrgent : b.tag === 'Later' ? styles.tagLater : styles.tagSoon]}>{b.tag}</Text>
            </View>
            <Text style={styles.sub}>{b.code}</Text>
            <Text style={styles.sub}>{b.exp}</Text>
            {b.urgent ? (
              <>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.outline} onPress={() => navigation.navigate('StockExpiryEditor', { name: b.name })}>
                    <Text style={styles.outlineLabel}>Edit expiry</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.solid}>
                    <Text style={styles.solidLabel}>Mark discounted</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.preview}>{b.preview}</Text>
              </>
            ) : null}
          </View>
        ))}
        <Text style={styles.note}>Manually logged packaging dates, not barcode guesses. Illustrative batches · no inventory changes.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: spacing.xl, gap: spacing.md, paddingTop: spacing.md },
  card: { marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, gap: spacing.xs, ...shadow.card },
  cardUrgent: { borderWidth: 1.5, borderColor: colors.accent },
  cardLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  sub: { fontSize: fontSize.xs, color: colors.textSecondary },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text, flex: 1 },
  tag: { fontSize: 11, fontWeight: fontWeight.bold, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, overflow: 'hidden' },
  tagUrgent: { color: colors.white, backgroundColor: colors.accent },
  tagSoon: { color: colors.primary, backgroundColor: colors.primaryLight },
  tagLater: { color: colors.textSecondary, backgroundColor: colors.background },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  outline: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.full, backgroundColor: colors.primaryLight, alignItems: 'center' },
  outlineLabel: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  solid: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center' },
  solidLabel: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  preview: { fontSize: fontSize.xs, color: colors.textSecondary },
  note: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center', marginHorizontal: spacing.lg },
});
