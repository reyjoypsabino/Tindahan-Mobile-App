import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { POSStackParamList } from '../navigation/types';
import OfflineBanner from '../components/OfflineBanner';
import SariSariHeader from '../components/SariSariHeader';
import { adjustStock } from '../services/db';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<POSStackParamList, 'Payment'>;

const METHODS: string[] = ['Cash', 'GCash', 'Credit'];

// PaymentScreen: receipt + tendered/change + queued note + next sale.
export default function PaymentScreen({ route, navigation }: Props) {
  const { total = 0, cart = [] } = route.params ?? {};
  const [method, setMethod] = useState<string>('Cash');
  const [received, setReceived] = useState<string>('200');
  const [done, setDone] = useState<boolean>(false);
  const tendered: number = parseFloat(received) || 0;
  const change: number = Math.max(0, tendered - Number(total));
  const cashShortfall: number = Number(total) - tendered;
  const cashInsufficient: boolean = method === 'Cash' && tendered < Number(total);

  const confirm = (): void => {
    if (cashInsufficient) {
      Alert.alert(
        'Insufficient cash',
        `Total is ₱${Number(total).toFixed(2)} but only ₱${tendered.toFixed(2)} was received. Cash payment needs at least the full amount.`,
      );
      return;
    }
    try {
      for (const item of cart) {
        adjustStock(item.id, -item.qty);
      }
    } catch (e) {
      Alert.alert(
        'Sale failed',
        e instanceof Error ? e.message : 'Could not update inventory stock.',
      );
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <View style={styles.flex}>
        <SariSariHeader storeName="Payment" subtitle="Order #018 · paid at 9:41 AM" variant="inner" onBack={() => navigation.goBack()} />
        <OfflineBanner />
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.confirm}>
            <View style={styles.checkCircle}>
              <Text style={styles.check}>✓</Text>
            </View>
            <View>
              <Text style={styles.confirmTitle}>Payment received</Text>
              <Text style={styles.sub}>Paid in {method.toLowerCase()} · saved locally</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate('POSHome', { saleId: Date.now() })}>
            <Text style={styles.primaryLabel}>+  Start next sale</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <SariSariHeader storeName="Payment" subtitle="Order #018 · paid at 9:41 AM" variant="inner" onBack={() => navigation.goBack()} />
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.receiptHead}>
            <Text style={styles.cardLabel}>Order #018</Text>
            <Text style={styles.sub}>{cart.reduce((s, i) => s + i.qty, 0)} items</Text>
          </View>
          {(cart.length > 0 ? cart : [{ id: 0, name: 'Ligo Sardines', price: 25, qty: 2 }, { id: -1, name: 'Regular rice', price: 55, qty: 1 }]).map((i) => (
            <View key={i.id} style={styles.receiptLine}>
              <Text style={styles.sub}>{i.qty} × {i.name}</Text>
              <Text style={styles.receiptValue}>₱{(i.qty * i.price).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.receiptTotal}>
            <Text style={styles.cardLabel}>Total paid</Text>
            <Text style={styles.total}>₱{Number(total || 145).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.methodHead}>
          <Text style={styles.cardLabel}>Payment method</Text>
          <Text style={styles.sub}>Paid with {method}</Text>
        </View>
        <View style={styles.methods}>
          {METHODS.map((m) => (
            <TouchableOpacity key={m} style={[styles.method, method === m && styles.methodActive]} onPress={() => setMethod(m)}>
              <Text style={[styles.methodLabel, method === m && styles.methodLabelActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Cash received (₱)</Text>
          <TextInput style={styles.input} value={received} onChangeText={setReceived} keyboardType="decimal-pad" />
          {method === 'Cash' ? (
            cashInsufficient ? (
              <Text style={styles.shortfall}>
                Insufficient — still need ₱{cashShortfall.toFixed(2)} to cover ₱{Number(total).toFixed(2)}.
              </Text>
            ) : (
              <Text style={styles.sufficient}>Covered — change: ₱{change.toFixed(2)}.</Text>
            )
          ) : null}
          <View style={styles.receiptLine}>
            <Text style={styles.sub}>Change given</Text>
            <Text style={styles.receiptValue}>₱{change.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.queued}>
          <Text style={styles.sub}>Receipt saved and stock updated on this device.</Text>
        </View>

        <TouchableOpacity
          style={[styles.primary, cashInsufficient && styles.primaryDisabled]}
          onPress={confirm}
        >
          <Text style={styles.primaryLabel}>+  Confirm payment</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: spacing.xl, gap: spacing.md, paddingTop: spacing.md },
  card: { marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm, ...shadow.card },
  cardLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  sub: { fontSize: fontSize.xs, color: colors.textSecondary },
  receiptHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  receiptLine: { flexDirection: 'row', justifyContent: 'space-between' },
  receiptValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  receiptTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  total: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  methodHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginHorizontal: spacing.lg },
  methods: { flexDirection: 'row', marginHorizontal: spacing.lg, gap: spacing.sm },
  method: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center' },
  methodActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  methodLabel: { fontWeight: fontWeight.semibold, color: colors.text, fontSize: fontSize.sm },
  methodLabelActive: { color: colors.primary, fontWeight: fontWeight.bold },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text },
  input: { height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.lg, fontSize: fontSize.base, color: colors.text },
  confirm: { marginHorizontal: spacing.lg, backgroundColor: '#E9F7EF', borderRadius: radius.md, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  checkCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  check: { color: colors.white, fontSize: 26, fontWeight: fontWeight.bold },
  confirmTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.success },
  queued: { marginHorizontal: spacing.lg, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md },
  primary: { marginHorizontal: spacing.lg, borderRadius: radius.full, backgroundColor: colors.primary, padding: spacing.lg, alignItems: 'center' },
  primaryDisabled: { opacity: 0.5 },
  primaryLabel: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  shortfall: { color: colors.danger, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  sufficient: { color: colors.success, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
});
