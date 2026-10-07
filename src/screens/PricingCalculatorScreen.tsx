import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../navigation/types';
import OfflineBanner from '../components/OfflineBanner';
import SariSariHeader from '../components/SariSariHeader';
import { useStore } from '../store/AppStore';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<MoreStackParamList, 'PricingCalculator'>;
type Mode = 'bulk' | 'piece';

// PricingCalculator: mall buying comes in two shapes — bulk box or per piece.
// Unit cost always feeds the same gross-margin retail math.
export default function PricingCalculatorScreen({ navigation }: Props) {
  const { products } = useStore();
  const [mode, setMode] = useState<Mode>('bulk');
  const [productId, setProductId] = useState<string>(products[0]?.id ?? '');
  const [search, setSearch] = useState<string>('');
  const [boxCost, setBoxCost] = useState<string>('504');
  const [units, setUnits] = useState<string>('24');
  const [pieceCost, setPieceCost] = useState<string>('23');
  const [margin, setMargin] = useState<number>(20);

  const bulkUnit: number = (parseFloat(boxCost) || 0) / (parseInt(units, 10) || 1);
  const pieceUnit: number = parseFloat(pieceCost) || 0;
  const unit: number = mode === 'bulk' ? bulkUnit : pieceUnit;
  const product = products.find((p) => p.id === productId) ?? products[0];
  const query = search.trim().toLowerCase();
  const matches = query
    ? products.filter((p) => p.name.toLowerCase().includes(query)).slice(0, 5)
    : [];
  const retail: number = margin >= 100 ? 0 : unit / (1 - margin / 100);
  const profit: number = retail - unit;
  const at = (m: number): number => (m >= 100 ? 0 : unit / (1 - m / 100));
  const saving: number = pieceUnit > 0 ? pieceUnit - bulkUnit : 0;

  return (
    <View style={styles.flex}>
      <SariSariHeader storeName="Pricing Calculator" subtitle="Mall buying · bulk or per piece" variant="inner" onBack={() => navigation.goBack()} />
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Priced product</Text>
          <TextInput
            style={styles.search}
            placeholder="Search inventory…"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {matches.length === 0 ? (
            <Text style={styles.sub}>
              {query ? 'No matches — try another spelling.' : 'Type above to find a product from inventory.'}
            </Text>
          ) : null}
          {matches.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.pick, product?.id === p.id && styles.pickActive]}
              onPress={() => setProductId(p.id)}
            >
              {p.image ? (
                <Image source={p.image} style={styles.pickPhoto} resizeMode="cover" />
              ) : (
                <View style={styles.pickThumb}>
                  <Text style={styles.pickThumbText}>{p.name.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.pickInfo}>
                <Text style={styles.pickName}>{p.name}</Text>
                <Text style={styles.sub}>Current retail: ₱{p.unitPrice.toFixed(2)} / {p.unit}</Text>
              </View>
              <Text style={styles.radio}>{product?.id === p.id ? '◉' : '○'}</Text>
            </TouchableOpacity>
          ))}
          {product ? (
            <Text style={styles.sub}>Pricing: {product.name} · unchanged in POS until applied</Text>
          ) : null}
        </View>

        <View style={styles.modeRow}>
          {(['bulk', 'piece'] as Mode[]).map((m) => (
            <TouchableOpacity key={m} style={[styles.mode, mode === m && styles.modeActive]} onPress={() => setMode(m)}>
              <Text style={[styles.modeLabel, mode === m && styles.modeLabelActive]}>
                {m === 'bulk' ? 'Bulk box' : 'Per piece'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'bulk' ? (
          <>
            <View style={styles.duo}>
              <View style={styles.duoField}>
                <Text style={styles.fieldLabel}>Bulk box cost (₱)</Text>
                <TextInput style={styles.input} value={boxCost} onChangeText={setBoxCost} keyboardType="decimal-pad" />
              </View>
              <View style={styles.duoField}>
                <Text style={styles.fieldLabel}>Units per box</Text>
                <TextInput style={styles.input} value={units} onChangeText={setUnits} keyboardType="number-pad" />
              </View>
            </View>
            <View style={styles.unitRow}>
              <Text style={styles.sub}>Bulk unit cost</Text>
              <Text style={styles.unitValue}>₱{bulkUnit.toFixed(2)} / can</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.fieldLabel, styles.singleLabel]}>Mall per-piece price (₱)</Text>
            <TextInput
              style={[styles.input, styles.singleInput]}
              value={pieceCost}
              onChangeText={setPieceCost}
              keyboardType="decimal-pad"
              placeholder="e.g. 23"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.unitRow}>
              <Text style={styles.sub}>Per-piece unit cost</Text>
              <Text style={styles.unitValue}>₱{pieceUnit.toFixed(2)} / can</Text>
            </View>
          </>
        )}

        {pieceUnit > 0 && bulkUnit > 0 && Math.abs(saving) >= 0.005 ? (
          <View style={styles.compare}>
            <Text style={styles.compareText}>
              {saving > 0
                ? `Bulk saves ₱${saving.toFixed(2)} per can vs per-piece.`
                : `Per-piece is cheaper by ₱${Math.abs(saving).toFixed(2)} per can right now.`}
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.marginHead}>
            <Text style={styles.cardLabel}>Profit margin</Text>
            <Text style={styles.marginValue}>{margin}%</Text>
          </View>
          <View style={styles.margins}>
            {[10, 20, 30].map((m) => (
              <TouchableOpacity key={m} style={[styles.margin, margin === m && styles.marginActive]} onPress={() => setMargin(m)}>
                <Text style={[styles.marginLabel, margin === m && styles.marginLabelActive]}>{m}% · ₱{at(m).toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.result}>
          <View style={styles.resultHead}>
            <Text style={styles.resultLabel}>Suggested retail · {margin}% gross margin</Text>
            <Text style={styles.resultLabel}>Profit per unit</Text>
          </View>
          <View style={styles.resultHead}>
            <Text style={styles.amount}>₱{retail.toFixed(2)}</Text>
            <Text style={styles.profit}>₱{profit.toFixed(2)}</Text>
          </View>
          <Text style={styles.resultFormula}>Unit cost ÷ (1 − margin)</Text>
        </View>
        <Text style={styles.note}>Gross margin, not markup: the same formula prices bulk and per-piece buying. Estimates exclude other operating costs.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: spacing.xl, gap: spacing.md, paddingTop: spacing.md },
  card: { marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, gap: spacing.xs, ...shadow.card },
  cardLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  search: { height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: fontSize.sm, color: colors.text, backgroundColor: colors.background },
  pick: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, gap: spacing.sm },
  pickActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  pickPhoto: { width: 40, height: 40, borderRadius: 8 },
  pickThumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  pickThumbText: { color: colors.primary, fontWeight: fontWeight.bold },
  pickInfo: { flex: 1 },
  pickName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  radio: { fontSize: 16, color: colors.textSecondary },
  sub: { fontSize: fontSize.xs, color: colors.textSecondary },
  modeRow: { flexDirection: 'row', marginHorizontal: spacing.lg, gap: spacing.sm },
  mode: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center' },
  modeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeLabel: { fontWeight: fontWeight.semibold, fontSize: fontSize.sm, color: colors.text },
  modeLabelActive: { color: colors.white },
  duo: { flexDirection: 'row', marginHorizontal: spacing.lg, gap: spacing.md },
  duoField: { flex: 1, gap: spacing.xs },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text },
  singleLabel: { marginHorizontal: spacing.lg },
  input: { height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.lg, fontSize: fontSize.base, color: colors.text, backgroundColor: colors.card },
  singleInput: { marginHorizontal: spacing.lg },
  unitRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: spacing.lg },
  unitValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.primary },
  compare: { marginHorizontal: spacing.lg, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md },
  compareText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary },
  marginHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  marginValue: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.primary },
  margins: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  margin: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  marginActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  marginLabel: { fontWeight: fontWeight.semibold, color: colors.text, fontSize: fontSize.xs },
  marginLabelActive: { color: colors.white },
  result: { marginHorizontal: spacing.lg, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.lg, gap: 2, ...shadow.card },
  resultHead: { flexDirection: 'row', justifyContent: 'space-between' },
  resultLabel: { color: colors.white, fontSize: fontSize.xs, opacity: 0.9 },
  amount: { color: colors.white, fontSize: 32, fontWeight: fontWeight.bold },
  profit: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  resultFormula: { color: colors.white, fontSize: fontSize.xs, opacity: 0.9 },
  note: { fontSize: fontSize.xs, color: colors.textSecondary, marginHorizontal: spacing.lg },
});
