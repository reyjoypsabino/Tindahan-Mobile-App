import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { UtangStackParamList } from '../navigation/types';
import { useStore } from '../store/AppStore';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<UtangStackParamList, 'CreditPaymentModal'>;

// Record payment: applies to the customer's oldest credits first (FIFO),
// so the leftover balance always reflects their most recent debt.
export default function CreditPaymentModalScreen({ navigation, route }: Props) {
  const { id, name: nameParam, amount: amountParam = 0 } = route.params ?? {};
  const { ledger, recordPayment, recordCustomerPayment } = useStore();
  const [paid, setPaid] = useState<string>('100');
  const [method, setMethod] = useState<string>('Cash');
  const [picked, setPicked] = useState<string | null>(null);

  const resolvedName =
    nameParam ?? (id ? ledger.find((e) => e.id === id)?.name : undefined) ?? picked;
  const customers = [...new Set(ledger.map((e) => e.name))].sort();
  const balanceOf = (customer: string): number =>
    ledger.filter((e) => e.name === customer).reduce((s, e) => s + e.amount, 0);
  const balance = resolvedName ? balanceOf(resolvedName) : amountParam;

  const num: number = parseFloat(paid) || 0;
  const applied: number = Math.min(num, balance);
  const after: number = Math.max(0, balance - num);

  const save = (): void => {
    if (!resolvedName) {
      Alert.alert('Customer required', 'Pumili ng customer na magbabayad.');
      return;
    }
    if (num <= 0) {
      Alert.alert('Invalid amount', 'Enter a payment amount greater than ₱0.');
      return;
    }
    if (id && !nameParam) recordPayment(id, num);
    else recordCustomerPayment(resolvedName, num);
    Alert.alert(
      'Payment recorded',
      `${resolvedName} paid ₱${applied.toFixed(2)}${after > 0 ? ` · ₱${after.toFixed(2)} remaining` : ' · fully paid'}. Saved on this device.`,
    );
    navigation.goBack();
  };

  return (
    <View style={styles.scrim}>
      <View style={styles.sheet}>
        <Text style={styles.title}>Record payment</Text>
        {!nameParam && !id ? (
          <>
            <Text style={styles.fieldLabel}>Customer</Text>
            <View style={styles.names}>
              {customers.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.nameChip, picked === c && styles.nameChipActive]}
                  onPress={() => setPicked(c)}
                >
                  <Text style={[styles.nameChipLabel, picked === c && styles.nameChipLabelActive]}>
                    {c} · ₱{balanceOf(c).toFixed(0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.name}>{resolvedName ?? nameParam ?? 'Maria Santos'}</Text>
        )}
        <View style={styles.row}>
          <Text style={styles.sub}>Current balance</Text>
          <Text style={styles.balance}>₱{balance.toFixed(2)}</Text>
        </View>
        <Text style={styles.fieldLabel}>Payment amount</Text>
        <TextInput
          style={styles.input}
          value={paid}
          onChangeText={setPaid}
          keyboardType="decimal-pad"
          placeholder="e.g. 200"
          placeholderTextColor={colors.textSecondary}
        />
        <View style={styles.methods}>
          {['Cash', 'GCash'].map((m) => (
            <TouchableOpacity key={m} style={[styles.chip, method === m && styles.chipActive]} onPress={() => setMethod(m)}>
              <Text style={[styles.chipLabel, method === m && styles.chipLabelActive]}>
                {method === m ? '◉ ' : '○ '}{m}{method === m ? ' · selected' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          <Text style={styles.sub}>Balance after payment</Text>
          <Text style={styles.after}>₱{after.toFixed(2)}</Text>
        </View>
        <Text style={styles.sub}>Oldest credits are paid first · saved on this device.</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancel} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primary} onPress={save}>
            <Text style={styles.primaryLabel}>Record payment</Text>
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
  name: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.bold, marginTop: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sub: { color: colors.textSecondary, fontSize: fontSize.xs },
  balance: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.bold },
  fieldLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  input: { backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.lg, fontSize: fontSize.base, color: colors.text },
  names: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  nameChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  nameChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  nameChipLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  nameChipLabelActive: { color: colors.primary, fontWeight: fontWeight.bold },
  methods: { flexDirection: 'row', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.background },
  chipActive: { backgroundColor: colors.primaryLight },
  chipLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  chipLabelActive: { color: colors.primary, fontWeight: fontWeight.bold },
  after: { color: colors.primary, fontSize: fontSize.base, fontWeight: fontWeight.bold },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancel: { flex: 1, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, alignItems: 'center' },
  cancelLabel: { color: colors.primary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  primary: { flex: 1, borderRadius: radius.full, backgroundColor: colors.primary, padding: spacing.lg, alignItems: 'center' },
  primaryLabel: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
