import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { UtangStackParamList } from '../navigation/types';
import SariSariHeader from '../components/SariSariHeader';
import { formatCreditDate, useStore } from '../store/AppStore';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<UtangStackParamList, 'UtangCustomer'>;

// UtangCustomer: full dated credit history for one customer (transparency).
// Every credit shows what was taken, how much, and when it was credited.
export default function UtangCustomerScreen({ navigation, route }: Props) {
  const { name } = route.params;
  const { ledger, updateLedgerEntry, removeLedgerEntry } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dueDraft, setDueDraft] = useState<string>('');

  const entries = ledger
    .filter((e) => e.name === name)
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = entries.reduce((s, e) => s + e.amount, 0);

  const saveDue = (id: string): void => {
    updateLedgerEntry(id, { due: dueDraft });
    setEditingId(null);
    setDueDraft('');
  };

  const removeEntry = (id: string, label: string): void => {
    Alert.alert('Void this credit?', `${label} will be removed from ${name}'s balance.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Void',
        style: 'destructive',
        onPress: () => {
          removeLedgerEntry(id);
        },
      },
    ]);
  };

  return (
    <View style={styles.flex}>
      <SariSariHeader storeName={name} subtitle={`${entries.length} credits · Nena's Sari-Sari`} variant="inner" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Outstanding balance</Text>
          <Text style={styles.totalValue}>₱{total.toFixed(2)}</Text>
          <Text style={styles.totalSub}>Across {entries.length} credited {entries.length === 1 ? 'item' : 'items'}</Text>
        </View>

        {entries.map((e) => (
          <View key={e.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.product}>{e.productName ?? e.note}</Text>
                <Text style={styles.sub}>
                  Credited {formatCreditDate(e.date)}
                  {e.qty ? ` · ×${e.qty}` : ''}
                </Text>
                {editingId === e.id ? (
                  <View style={styles.editRow}>
                    <TextInput
                      style={styles.dueInput}
                      placeholder="Due date, e.g. Oct 12"
                      placeholderTextColor={colors.textSecondary}
                      value={dueDraft}
                      onChangeText={setDueDraft}
                    />
                    <TouchableOpacity style={styles.saveDue} onPress={() => saveDue(e.id)}>
                      <Text style={styles.saveDueLabel}>Save</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.due}>{e.due ? `Due ${e.due}` : 'No due date set'}</Text>
                )}
              </View>
              <View style={styles.right}>
                <Text style={styles.amount}>₱{e.amount.toFixed(2)}</Text>
                <Text style={[styles.pill, e.status === 'Overdue' ? styles.pillOverdue : styles.pillDue]}>
                  {e.pill}
                </Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              {editingId === e.id ? (
                <TouchableOpacity onPress={() => setEditingId(null)}>
                  <Text style={styles.actionLink}>Cancel</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setEditingId(e.id);
                    setDueDraft(e.due ?? '');
                  }}
                >
                  <Text style={styles.actionLink}>Edit due date</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => navigation.navigate('CreditPaymentModal', { name, amount: total })}
              >
                <Text style={styles.actionLink}>Record payment</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeEntry(e.id, e.productName ?? e.note)}>
                <Text style={[styles.actionLink, styles.voidLink]}>Void</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.ctaRow}>
          <TouchableOpacity style={[styles.cta, styles.ctaOutline]} onPress={() => navigation.navigate('AddUtang', { name })}>
            <Text style={styles.ctaOutlineText}>+  Add utang</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cta, styles.recordBtn]}
            onPress={() => navigation.navigate('CreditPaymentModal', { name, amount: total })}
          >
            <Text style={styles.recordText}>Record payment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  totalCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, gap: 2, ...shadow.card },
  totalLabel: { color: colors.white, fontSize: fontSize.sm, opacity: 0.9 },
  totalValue: { color: colors.white, fontSize: 32, fontWeight: fontWeight.bold },
  totalSub: { color: colors.white, fontSize: fontSize.xs, opacity: 0.9 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm, ...shadow.card },
  row: { flexDirection: 'row', gap: spacing.sm },
  info: { flex: 1, gap: 2 },
  product: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  sub: { color: colors.textSecondary, fontSize: fontSize.xs },
  due: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  editRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.xs },
  dueInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.sm, color: colors.text },
  saveDue: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  saveDueLabel: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { color: colors.text, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  pill: { fontSize: 11, fontWeight: fontWeight.bold, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, overflow: 'hidden' },
  pillOverdue: { color: colors.accentDark, backgroundColor: colors.accentLight },
  pillDue: { color: colors.primary, backgroundColor: colors.primaryLight },
  cardActions: { flexDirection: 'row', gap: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  actionLink: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  voidLink: { color: colors.danger },
  ctaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cta: { flex: 1, borderRadius: radius.full, padding: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  ctaOutline: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  ctaOutlineText: { color: colors.primary, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  recordBtn: { backgroundColor: colors.primary },
  recordText: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.base },
});
