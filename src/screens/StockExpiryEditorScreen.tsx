import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { InventoryStackParamList, MoreStackParamList } from '../navigation/types';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props =
  | NativeStackScreenProps<InventoryStackParamList, 'StockExpiryEditor'>
  | NativeStackScreenProps<MoreStackParamList, 'StockExpiryEditor'>;

// StockExpiryEditorModalState: draft date edit with format guidance.
export default function StockExpiryEditorScreen({ navigation, route }: Props) {
  const params = (route.params as { name?: string; batch?: string } | undefined) ?? {};
  const { name = 'Ligo Sardines', batch = 'Batch LG-018 · 6 cans' } = params;
  const [date, setDate] = useState<string>('09 / 10 / 2026');

  return (
    <View style={styles.scrim}>
      <View style={styles.sheet}>
        <Text style={styles.title}>Edit expiry date</Text>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.sub}>{batch}</Text>
        <Text style={styles.fieldLabel}>Expiry date</Text>
        <View style={styles.dateRow}>
          <TextInput
            style={styles.dateInput}
            value={date}
            onChangeText={setDate}
            placeholder="DD / MM / YYYY"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.cal}>📅</Text>
        </View>
        <Text style={styles.sub}>DD / MM / YYYY · enter the expiry date printed on this batch's packaging.</Text>
        <Text style={styles.draft}>Draft only · inventory unchanged</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancel} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primary}
            onPress={() => {
              Alert.alert('Expiry updated', 'Batch date saved locally.');
              navigation.goBack();
            }}
          >
            <Text style={styles.primaryLabel}>Save expiry date</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(23, 23, 45, 0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.xl, gap: spacing.sm, ...shadow.card },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  name: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.bold },
  sub: { color: colors.textSecondary, fontSize: fontSize.xs },
  fieldLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  dateRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg },
  dateInput: { flex: 1, height: 52, fontSize: fontSize.base, color: colors.text },
  cal: { fontSize: 20 },
  draft: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancel: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { color: colors.primary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  primary: { flex: 1, borderRadius: radius.full, backgroundColor: colors.primary, padding: spacing.lg, alignItems: 'center' },
  primaryLabel: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
