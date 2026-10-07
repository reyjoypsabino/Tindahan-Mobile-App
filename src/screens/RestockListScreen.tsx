import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../navigation/types';
import CategorySheet from '../components/CategorySheet';
import OfflineBanner from '../components/OfflineBanner';
import SariSariHeader from '../components/SariSariHeader';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

// RestockListScreen: budget overview + supplier groups + market-trip checks + category filter.
const GROUPS = [
  {
    supplier: 'Mila Wholesale',
    subtotal: 576,
    items: [
      { name: 'Ligo Sardines', cat: 'Canned Goods', stock: 'On hand 6 cans · target 30', cost: 'Add 24 cans x ₱21', total: 504 },
      { name: 'Kopiko Brown', cat: 'Coffee/Sachets', stock: 'On hand 4 sachets · target 28', cost: 'Add 24 sachets x ₱3', total: 72 },
    ],
  },
  {
    supplier: 'Reyes Rice Supply',
    subtotal: 1200,
    items: [
      { name: 'Regular milled rice', cat: 'Rice/Grains', stock: 'On hand 8 kg · target 33', cost: 'Add 25 kg x ₱48', total: 1200 },
    ],
  },
];

const peso = (n: number): string => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

type Props = NativeStackScreenProps<MoreStackParamList, 'RestockList'>;

export default function RestockListScreen({ navigation }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({ 'Kopiko Brown': true });
  const [sheet, setSheet] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('All');

  const groups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((it) => category === 'All' || it.cat === category),
  })).filter((g) => g.items.length > 0);

  return (
    <View style={styles.flex}>
      <SariSariHeader storeName="Restock List" subtitle="Market trip · low-stock items" variant="inner" onBack={() => navigation.goBack()} />
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.budget}>
          <View style={styles.budgetHead}>
            <Text style={styles.budgetLabel}>Estimated cash needed</Text>
            <Text style={styles.budgetMeta}>3 items · 2 suppliers</Text>
          </View>
          <Text style={styles.budgetAmount}>{peso(1776)}</Text>
          <Text style={styles.budgetMeta}>1 of 3 collected · {peso(1704)} remaining</Text>
        </View>

        <TouchableOpacity style={styles.filter} onPress={() => setSheet(true)}>
          <Text style={styles.filterLabel}>Category: {category}</Text>
          <Text style={styles.chev}>›</Text>
        </TouchableOpacity>

        {groups.map((g) => (
          <View key={g.supplier} style={styles.card}>
            <View style={styles.groupHead}>
              <Text style={styles.cardLabel}>{g.supplier}</Text>
              <Text style={styles.groupTotal}>{peso(g.subtotal)}</Text>
            </View>
            {g.items.map((it) => (
              <TouchableOpacity
                key={it.name}
                style={styles.item}
                onPress={() => setChecked((c) => ({ ...c, [it.name]: !c[it.name] }))}
              >
                <View style={[styles.box, checked[it.name] && styles.boxChecked]}>
                  {checked[it.name] ? <Text style={styles.check}>✓</Text> : null}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.cat}>{it.cat}</Text>
                  <Text style={styles.name}>{it.name}</Text>
                  <Text style={styles.sub}>{it.stock}</Text>
                  <Text style={styles.sub}>{it.cost}</Text>
                </View>
                <Text style={styles.lineTotal}>{peso(it.total)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <Text style={styles.guideTitle}>Auto-compiled from cached low stock</Text>
        <Text style={styles.note}>Wholesale estimates · Sat, Oct 3, 2026. Trip checks do not change inventory counts.</Text>
        <TouchableOpacity
          style={styles.manualAdd}
          onPress={() => {
            const tabs = navigation.getParent()?.navigate as unknown as
              | ((name: string, params?: object) => void)
              | undefined;
            tabs?.('Inventory', { screen: 'AddStock' });
          }}
        >
          <Text style={styles.manualAddLabel}>+  Add product not yet in inventory</Text>
        </TouchableOpacity>
      </ScrollView>

      <CategorySheet
        visible={sheet}
        includeAll
        selected={category}
        onSelect={setCategory}
        onClose={() => setSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl, gap: spacing.md, paddingTop: spacing.md },
  budget: { marginHorizontal: spacing.lg, backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, gap: 2, ...shadow.card },
  budgetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  budgetLabel: { color: colors.white, fontSize: fontSize.sm, opacity: 0.9 },
  budgetMeta: { color: colors.white, fontSize: fontSize.xs, opacity: 0.9 },
  budgetAmount: { color: colors.white, fontSize: 32, fontWeight: fontWeight.bold },
  guideTitle: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginHorizontal: spacing.lg },
  card: { marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm, ...shadow.card },
  manualAdd: { marginHorizontal: spacing.lg, borderRadius: radius.full, backgroundColor: colors.primary, padding: spacing.lg, alignItems: 'center' },
  manualAddLabel: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  cardLabel: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  sub: { color: colors.textSecondary, fontSize: fontSize.xs },
  amount: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  filter: { marginHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  filterLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  chev: { color: colors.textSecondary, fontSize: 18, fontWeight: fontWeight.bold },
  groupHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupTotal: { color: colors.primary, fontWeight: fontWeight.bold },
  item: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  check: { color: colors.white, fontWeight: fontWeight.bold, fontSize: 14 },
  itemInfo: { flex: 1, gap: 2 },
  cat: { color: colors.textSecondary, fontSize: fontSize.xs },
  name: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  lineTotal: { color: colors.text, fontWeight: fontWeight.bold },
  note: { color: colors.textSecondary, fontSize: fontSize.xs, textAlign: 'center', marginHorizontal: spacing.lg },
});
