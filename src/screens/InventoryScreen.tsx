import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { InventoryStackParamList } from '../navigation/types';
import EmptyState from '../components/EmptyState';
import OfflineBanner from '../components/OfflineBanner';
import SariSariHeader from '../components/SariSariHeader';
import { adjustStock, deleteProduct, getProducts, imageSourceFor } from '../services/db';
import type { DbProduct } from '../services/db';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<InventoryStackParamList, 'InventoryHome'>;

const LOW_STOCK_AT = 10;

// InventoryScreen: SQLite-backed product list with SQL LIKE search,
// category chips, stock steppers, and delete. Survives restarts + airplane mode.
export default function InventoryScreen({ navigation }: Props) {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [q, setQ] = useState<string>('');
  const [filter, setFilter] = useState<string>('All');
  const [dbError, setDbError] = useState<string | null>(null);
  const queryRef = useRef<string>('');

  const loadData = useCallback((query: string): void => {
    queryRef.current = query;
    try {
      setProducts(getProducts(query));
      setDbError(null);
    } catch (e) {
      setDbError(e instanceof Error ? e.message : 'Failed to load products.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(queryRef.current);
    }, [loadData]),
  );

  const onSearch = (text: string): void => {
    setQ(text);
    loadData(text);
  };

  const handleDelete = (id: number, prodName: string): void => {
    Alert.alert('Delete Confirmation', `Remove ${prodName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteProduct(id);
          loadData(q);
        },
      },
    ]);
  };

  const handleStock = (id: number, delta: number): void => {
    adjustStock(id, delta);
    loadData(q);
  };

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  const lowCount = products.filter((p) => p.stock <= LOW_STOCK_AT).length;
  const items = products.filter((p) => filter === 'All' || p.category === filter);

  const renderItem = ({ item: p }: { item: DbProduct }) => {
    const low = p.stock <= LOW_STOCK_AT;
    const src = imageSourceFor(p.image_uri);
    return (
      <View style={styles.row}>
        <TouchableOpacity style={styles.main} onPress={() => navigation.navigate('EditProduct', { id: p.id })}>
          {src ? (
            <Image source={src} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.thumb}>
              <Text style={styles.thumbText}>{p.name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.meta}>Cat: {p.category}</Text>
            <Text style={styles.price}>₱{p.price.toFixed(2)}</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.stock}>{p.stock} pcs</Text>
            <Text style={[styles.status, low ? styles.statusLow : styles.statusOk]}>
              {low ? 'Low stock' : 'In stock'}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.stepBtn} onPress={() => handleStock(p.id, -1)}>
            <Text style={styles.stepText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.stepBtn} onPress={() => handleStock(p.id, 1)}>
            <Text style={styles.stepText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(p.id, p.name)}>
            <Text style={styles.delBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.flex}>
      <SariSariHeader storeName="Inventory" subtitle={`${products.length} active products · Nena's Sari-Sari`} />
      <OfflineBanner />
      <FlatList
        data={items}
        keyExtractor={(p) => String(p.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <>
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>○</Text>
              <TextInput
                style={styles.search}
                placeholder="Search products"
                placeholderTextColor={colors.textSecondary}
                value={q}
                onChangeText={onSearch}
              />
            </View>
            <View style={styles.chips}>
              {categories.map((c) => (
                <TouchableOpacity key={c} style={[styles.chip, filter === c && styles.chipActive]} onPress={() => setFilter(c)}>
                  <Text style={[styles.chipLabel, filter === c && styles.chipLabelActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {dbError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Database unavailable</Text>
                <Text style={styles.errorBody}>{dbError}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => loadData(queryRef.current)}>
                  <Text style={styles.retryLabel}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.listHead}>
              <View>
                <Text style={styles.listTitle}>Products</Text>
                <Text style={styles.sub}>{lowCount} low stock</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddStock')}>
                <Text style={styles.addLabel}>+ Add New Stock</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState title="No products yet" message="A stocked tindahan starts with one item. Add your first product to get going." actionLabel="Add New Stock" onAction={() => navigation.navigate('AddStock')} />
        }
        ListFooterComponent={
          <Text style={styles.note}>🗄  Saved in SQLite · survives restarts & airplane mode</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: spacing.xl, gap: spacing.md, paddingTop: spacing.md },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: radius.full, paddingHorizontal: spacing.lg, gap: spacing.sm, ...shadow.card },
  searchIcon: { fontSize: 16, color: colors.primary },
  search: { flex: 1, height: 48, fontSize: fontSize.sm, color: colors.text },
  chips: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.primaryLight },
  chipLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  chipLabelActive: { color: colors.text, fontWeight: fontWeight.bold },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg },
  listTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.text },
  sub: { fontSize: fontSize.xs, color: colors.textSecondary },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  addLabel: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  row: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.sm, ...shadow.card },
  main: { flexDirection: 'row', gap: spacing.md },
  thumb: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  thumbText: { color: colors.primary, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  photo: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.background },
  info: { flex: 1, gap: 2 },
  name: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  meta: { color: colors.textSecondary, fontSize: fontSize.xs },
  price: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  right: { alignItems: 'flex-end', gap: 2 },
  stock: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  status: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  statusLow: { color: colors.accentDark },
  statusOk: { color: colors.success },
  actions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  stepBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  stepText: { color: colors.text, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  delBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: spacing.xs, borderRadius: 4 },
  delBtnText: { color: colors.danger, fontWeight: fontWeight.bold, fontSize: 13 },
  errorBox: { marginHorizontal: spacing.lg, backgroundColor: '#FEE2E2', borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  errorTitle: { color: colors.danger, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  errorBody: { color: colors.text, fontSize: fontSize.xs },
  retryBtn: { backgroundColor: colors.danger, borderRadius: radius.full, paddingVertical: spacing.sm, alignItems: 'center' },
  retryLabel: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  note: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
});
