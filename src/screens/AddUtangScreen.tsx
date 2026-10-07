import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { UtangStackParamList } from '../navigation/types';
import { formatCreditDate, useStore } from '../store/AppStore';
import { getProducts } from '../services/db';
import type { DbProduct } from '../services/db';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<UtangStackParamList, 'AddUtang'>;

interface StagedLine {
  productId: number;
  qty: number;
}

// AddUtang: customer name + multiple credited products → one ledger entry per
// product, all stamped with the same credited date and saved together.
export default function AddUtangScreen({ navigation, route }: Props) {
  const { ledger, addLedgerEntry } = useStore();
  const [items, setItems] = useState<DbProduct[]>([]);
  const [name, setName] = useState<string>(route.params?.name ?? '');
  const [productId, setProductId] = useState<number | null>(null);
  const [qty, setQty] = useState<string>('1');
  const [due, setDue] = useState<string>('');
  const [lines, setLines] = useState<StagedLine[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState<string>('');
  const [cache, setCache] = useState<Record<number, DbProduct>>({});
  const searchRef = useRef<string>('');

  const loadItems = useCallback((query = ''): void => {
    try {
      const rows = getProducts(query);
      setItems(rows);
      setCache((prev) => {
        const next = { ...prev };
        for (const r of rows) next[r.id] = r;
        return next;
      });
      setProductId((prev) => (prev === null ? (rows[0]?.id ?? null) : prev));
      setDbError(null);
    } catch (e) {
      setDbError(e instanceof Error ? e.message : 'Failed to load products.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems(searchRef.current);
    }, [loadItems]),
  );

  const onProductSearch = (text: string): void => {
    setProductSearch(text);
    searchRef.current = text;
    loadItems(text);
  };

  const balanceOf = (customer: string): number =>
    ledger.filter((e) => e.name === customer).reduce((s, e) => s + e.amount, 0);

  const product =
    (productId !== null ? cache[productId] : undefined) ??
    items.find((p) => p.id === productId) ??
    items[0];
  const n: number = parseInt(qty, 10) || 0;
  const trimmedName = name.trim();
  const existingBalance = trimmedName ? balanceOf(trimmedName) : 0;
  const today = formatCreditDate(new Date().toISOString());

  const lineDetail = (line: StagedLine): { product: DbProduct; total: number } | null => {
    const p = cache[line.productId] ?? items.find((i) => i.id === line.productId);
    return p ? { product: p, total: p.price * line.qty } : null;
  };
  const stagedTotal: number = lines.reduce((s, l) => s + (lineDetail(l)?.total ?? 0), 0);

  const addLine = (): void => {
    if (!product || n <= 0) {
      Alert.alert('Product required', 'Pumili ng produkto at tamang dami.');
      return;
    }
    setLines((prev) => {
      const found = prev.find((l) => l.productId === product.id);
      if (found) return prev.map((l) => (l.productId === product.id ? { ...l, qty: l.qty + n } : l));
      return [...prev, { productId: product.id, qty: n }];
    });
    setQty('1');
  };

  const bumpLine = (id: number, d: number): void => {
    setLines((prev) =>
      prev
        .map((l) => (l.productId === id ? { ...l, qty: l.qty + d } : l))
        .filter((l) => l.qty > 0),
    );
  };

  const save = (): void => {
    if (!trimmedName) {
      Alert.alert('Customer required', 'Ilagay ang pangalan ng customer.');
      return;
    }
    if (lines.length === 0) {
      Alert.alert('No items', 'Magdagdag muna ng kahit isang produkto sa listahan.');
      return;
    }
    const valid = lines.every((l) => lineDetail(l) !== null);
    if (!valid) {
      Alert.alert('Missing products', 'May produktong wala na sa inventory. Alisin ito at subukang muli.');
      return;
    }
    for (const line of lines) {
      const detail = lineDetail(line);
      if (!detail) continue;
      addLedgerEntry({
        name: trimmedName,
        productName: detail.product.name,
        unitPrice: detail.product.price,
        qty: line.qty,
        due,
      });
    }
    Alert.alert(
      'Utang recorded',
      `${trimmedName} · ${lines.length} ${lines.length === 1 ? 'item' : 'items'} = ₱${stagedTotal.toFixed(2)} (credited ${today})`,
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  };

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Add utang</Text>
          <Text style={styles.sub}>Ilista kung sino, anong mga produkto, at gaano karami ang kinuha.</Text>
          {dbError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Couldn’t load products</Text>
              <Text style={styles.errorBody}>{dbError}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => loadItems(searchRef.current)}>
                <Text style={styles.retryLabel}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>Customer name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Maria Santos"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
          {trimmedName ? (
            <Text style={styles.balancePreview}>
              {existingBalance > 0
                ? `Running balance: ₱${existingBalance.toFixed(2)} → ₱${(existingBalance + stagedTotal).toFixed(2)} after this credit`
                : 'New customer · starts at ₱0.00'}
            </Text>
          ) : null}

          <Text style={styles.fieldLabel}>Credited products *</Text>
          <TextInput
            style={styles.input}
            placeholder="Search product to credit…"
            placeholderTextColor={colors.textSecondary}
            value={productSearch}
            onChangeText={onProductSearch}
          />
          {productSearch.trim() === '' ? (
            <Text style={styles.searchHint}>Type a product name above — results appear here.</Text>
          ) : items.length === 0 ? (
            <Text style={styles.searchHint}>No products match “{productSearch.trim()}”.</Text>
          ) : (
            items.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.product, productId === p.id && styles.productActive]}
                onPress={() => setProductId(p.id)}
              >
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.sub}>₱{p.price.toFixed(2)} · {p.stock} in stock</Text>
                </View>
                <Text style={[styles.radio, productId === p.id && styles.radioActive]}>
                  {productId === p.id ? '◉' : '○'}
                </Text>
              </TouchableOpacity>
            ))
          )}

          <Text style={styles.fieldLabel}>Quantity *</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.step} onPress={() => setQty(String(Math.max(1, n - 1)))}>
              <Text style={styles.stepLabel}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.qtyInput}
              value={qty}
              onChangeText={(t) => setQty(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.step} onPress={() => setQty(String(n + 1))}>
              <Text style={styles.stepLabel}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addLine} onPress={addLine}>
              <Text style={styles.addLineLabel}>+ Add to list</Text>
            </TouchableOpacity>
          </View>

          {lines.length > 0 ? (
            <View style={styles.linesBox}>
              <Text style={styles.linesTitle}>This credit ({lines.length})</Text>
              {lines.map((l) => {
                const detail = lineDetail(l);
                if (!detail) return null;
                return (
                  <View key={l.productId} style={styles.lineRow}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{detail.product.name}</Text>
                      <Text style={styles.sub}>
                        {l.qty} × ₱{detail.product.price.toFixed(2)} = ₱{detail.total.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.lineSteps}>
                      <TouchableOpacity style={styles.miniStep} onPress={() => bumpLine(l.productId, -1)}>
                        <Text style={styles.miniStepLabel}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.lineQty}>{l.qty}</Text>
                      <TouchableOpacity style={styles.miniStep} onPress={() => bumpLine(l.productId, 1)}>
                        <Text style={styles.miniStepLabel}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => bumpLine(l.productId, -l.qty)}>
                        <Text style={styles.removeLine}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>Payment due date</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Oct 12"
            placeholderTextColor={colors.textSecondary}
            value={due}
            onChangeText={setDue}
          />

          <View style={styles.totalRow}>
            <Text style={styles.sub}>Total utang · credited {today}</Text>
            <Text style={styles.total}>₱{stagedTotal.toFixed(2)}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancel} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primary} onPress={save}>
              <Text style={styles.primaryLabel}>Save utang</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  sheet: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.sm, ...shadow.card },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  sub: { color: colors.textSecondary, fontSize: fontSize.xs },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  errorTitle: { color: colors.danger, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  errorBody: { color: colors.text, fontSize: fontSize.xs },
  retryBtn: { backgroundColor: colors.danger, borderRadius: radius.full, paddingVertical: spacing.sm, alignItems: 'center' },
  retryLabel: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  fieldLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginTop: spacing.sm },
  input: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, fontSize: fontSize.base, color: colors.text },
  balancePreview: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.semibold },
  searchHint: { fontSize: fontSize.xs, color: colors.textSecondary, fontStyle: 'italic' },
  product: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  productActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  productInfo: { flex: 1 },
  productName: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  radio: { fontSize: 18, color: colors.textSecondary },
  radioActive: { color: colors.primary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  step: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 20, color: colors.primary, fontWeight: fontWeight.bold },
  qtyInput: { width: 64, height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, textAlign: 'center', fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  addLine: { flex: 1, borderRadius: radius.full, backgroundColor: colors.primaryLight, paddingVertical: spacing.md, alignItems: 'center' },
  addLineLabel: { color: colors.primary, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  linesBox: { backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, marginTop: spacing.sm },
  linesTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lineSteps: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  miniStep: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  miniStepLabel: { fontSize: 16, color: colors.primary, fontWeight: fontWeight.bold },
  lineQty: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text, minWidth: 16, textAlign: 'center' },
  removeLine: { color: colors.danger, fontWeight: fontWeight.bold, fontSize: 14, paddingHorizontal: spacing.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  total: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancel: { flex: 1, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, alignItems: 'center' },
  cancelLabel: { color: colors.primary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  primary: { flex: 1, borderRadius: radius.full, backgroundColor: colors.primary, padding: spacing.lg, alignItems: 'center' },
  primaryLabel: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
