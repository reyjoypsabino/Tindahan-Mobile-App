import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CartItem, POSStackParamList } from '../navigation/types';
import EmptyState from '../components/EmptyState';
import OfflineBanner from '../components/OfflineBanner';
import SariSariHeader from '../components/SariSariHeader';
import { getProducts, imageSourceFor } from '../services/db';
import type { DbProduct } from '../services/db';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<POSStackParamList, 'POSHome'>;

// POSScreen ("New sale"): category chips, product grid, LiveCart, orange checkout.
// Products come from the same SQLite database as Inventory.
export default function POSScreen({ navigation, route }: Props) {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [cat, setCat] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  const lastSaleRef = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      try {
        setProducts(getProducts(''));
        setDbError(null);
      } catch (e) {
        setDbError(e instanceof Error ? e.message : 'Failed to load products.');
      }
      // A completed sale navigates back with a fresh saleId: start clean.
      const saleId = route.params?.saleId;
      if (saleId && saleId !== lastSaleRef.current) {
        lastSaleRef.current = saleId;
        setCart([]);
        setCat('All');
      }
    }, [route.params?.saleId]),
  );

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const bump = (p: DbProduct, d: number): void => {
    setCart((c) => {
      const f = c.find((i) => i.id === p.id);
      if (f) {
        const qty = f.qty + d;
        return qty <= 0 ? c.filter((i) => i.id !== p.id) : c.map((i) => (i.id === p.id ? { ...i, qty } : i));
      }
      return d > 0 ? [...c, { id: p.id, name: p.name, price: p.price, qty: 1 }] : c;
    });
  };

  const qtyOf = (id: number): number => cart.find((i) => i.id === id)?.qty ?? 0;
  const count: number = cart.reduce((s, i) => s + i.qty, 0);
  const total: number = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shown = products.filter((p) => cat === 'All' || p.category === cat);

  return (
    <View style={styles.flex}>
      <SariSariHeader storeName="New sale" subtitle="Order #018 · saved on this device" />
      <OfflineBanner queuedCount={3} />
      <ScrollView contentContainerStyle={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categories.map((c) => (
            <TouchableOpacity key={c} style={[styles.chip, cat === c && styles.chipActive]} onPress={() => setCat(c)}>
              <Text style={[styles.chipLabel, cat === c && styles.chipLabelActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {dbError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Database unavailable</Text>
            <Text style={styles.errorBody}>{dbError}</Text>
          </View>
        ) : null}

        <View style={styles.grid}>
          {shown.map((p) => {
            const q = qtyOf(p.id);
            return (
              <View key={p.id} style={styles.product}>
                {(() => {
                  const src = imageSourceFor(p.image_uri);
                  return src ? (
                    <Image source={src} style={styles.photo} resizeMode="cover" />
                  ) : (
                    <View style={styles.thumb}>
                      <Text style={styles.thumbText}>{p.name.charAt(0)}</Text>
                    </View>
                  );
                })()}
                <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.price}>₱{p.price.toFixed(2)}</Text>
                {q === 0 ? (
                  <TouchableOpacity onPress={() => bump(p, 1)}>
                    <Text style={styles.add}>+ Add</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.inCart}>{q} in cart</Text>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.cartHead}>
          <View>
            <Text style={styles.cardLabel}>Your cart</Text>
            <Text style={styles.sub}>{count} items · {cart.length} products</Text>
          </View>
          <TouchableOpacity style={styles.addStock} onPress={() => navigation.getParent()?.navigate('Inventory' as never)}>
            <Text style={styles.addStockLabel}>+  Add New Stock</Text>
          </TouchableOpacity>
        </View>

        {count === 0 ? (
          <EmptyState title="Your cart is empty" message="Tap a product from the grid above to start your sale." />
        ) : (
          <View style={styles.cart}>
            {cart.map((i) => (
              <View key={i.id} style={styles.line}>
                <View style={styles.lineInfo}>
                  <Text style={styles.lineName}>{i.name}</Text>
                  <Text style={styles.sub}>{i.qty} × ₱{i.price.toFixed(2)} = ₱{(i.qty * i.price).toFixed(2)}</Text>
                </View>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.step} onPress={() => bump(products.find((p) => p.id === i.id)!, -1)}>
                    <Text style={styles.stepLabel}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qty}>{i.qty}</Text>
                  <TouchableOpacity style={styles.step} onPress={() => bump(products.find((p) => p.id === i.id)!, 1)}>
                    <Text style={styles.stepLabel}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.summaryRow}>
          <Text style={styles.sub}>Subtotal</Text>
          <Text style={styles.total}>₱{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkout, count === 0 && styles.checkoutDisabled]}
          disabled={count === 0}
          onPress={() => navigation.navigate('Payment', { total, cart })}
        >
          <Text style={styles.checkoutLabel}>→  Checkout · ₱{total.toFixed(2)}</Text>
        </TouchableOpacity>
        <Text style={styles.note}>Cart saved locally · checkout works offline</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: spacing.xl, gap: spacing.md, paddingTop: spacing.md },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.primaryLight },
  chipLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  chipLabelActive: { color: colors.text, fontWeight: fontWeight.bold },
  errorBox: { marginHorizontal: spacing.lg, backgroundColor: '#FEE2E2', borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  errorTitle: { color: colors.danger, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  errorBody: { color: colors.text, fontSize: fontSize.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: spacing.lg, gap: spacing.md },
  product: { width: '47%', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: 4, alignItems: 'center', ...shadow.card },
  thumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  thumbText: { color: colors.primary, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  photo: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.background },
  name: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  price: { color: colors.textSecondary, fontSize: fontSize.xs },
  add: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  inCart: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  cartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg },
  cardLabel: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.text },
  sub: { fontSize: fontSize.xs, color: colors.textSecondary },
  addStock: { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  addStockLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  cart: { marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, ...shadow.card },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lineInfo: { flex: 1, gap: 2 },
  lineName: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  step: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 16, color: colors.primary, fontWeight: fontWeight.bold },
  qty: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text, minWidth: 14, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg },
  total: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  checkout: { marginHorizontal: spacing.lg, borderRadius: radius.full, backgroundColor: colors.accent, padding: spacing.lg, alignItems: 'center' },
  checkoutDisabled: { opacity: 0.5 },
  checkoutLabel: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  note: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
});
