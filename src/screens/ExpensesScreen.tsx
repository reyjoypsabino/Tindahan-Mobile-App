import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../navigation/types';
import OfflineBanner from '../components/OfflineBanner';
import SariSariHeader from '../components/SariSariHeader';
import { useStore } from '../store/AppStore';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<MoreStackParamList, 'Expenses'>;

// ExpensesScreen: live expense list + working add form (persisted in store).
export default function ExpensesScreen({ navigation }: Props) {
  const { expenses, addExpense } = useStore();
  const [label, setLabel] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const save = (): void => {
    const value = parseFloat(amount) || 0;
    if (!label.trim() || value <= 0) {
      Alert.alert('Missing details', 'Enter what the expense was for and an amount greater than ₱0.');
      return;
    }
    addExpense(label.trim(), value);
    setLabel('');
    setAmount('');
  };

  return (
    <View style={styles.flex}>
      <SariSariHeader storeName="Expenses" subtitle="Today · Saturday, October 3" variant="inner" onBack={() => navigation.goBack()} />
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View>
            <Text style={styles.heroLabel}>Operating expenses</Text>
            <Text style={styles.heroAmount}>₱{total.toFixed(2)}</Text>
            <Text style={styles.heroSub}>{expenses.length} entries · saved on this device</Text>
          </View>
          <Text style={styles.heroIcon}>🧾</Text>
        </View>

        <View style={styles.card}>
          {expenses.map((e) => (
            <View key={e.id} style={styles.row}>
              <Text style={styles.rowLabel}>{e.label}</Text>
              <Text style={styles.rowValue}>₱{e.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Add expense</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Electricity"
            placeholderTextColor={colors.textSecondary}
            value={label}
            onChangeText={setLabel}
          />
          <TextInput
            style={styles.input}
            placeholder="₱ e.g. 60"
            placeholderTextColor={colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.primary} onPress={save}>
            <Text style={styles.primaryLabel}>+  Save expense</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: spacing.xl, gap: spacing.md, paddingTop: spacing.md },
  hero: { marginHorizontal: spacing.lg, backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...shadow.card },
  heroLabel: { color: colors.white, fontSize: fontSize.sm, opacity: 0.9 },
  heroAmount: { color: colors.white, fontSize: 32, fontWeight: fontWeight.bold },
  heroSub: { color: colors.white, fontSize: fontSize.xs, opacity: 0.9 },
  heroIcon: { fontSize: 30 },
  card: { marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm, ...shadow.card },
  cardLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: fontSize.sm, color: colors.text },
  rowValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
  input: { height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.lg, fontSize: fontSize.sm, color: colors.text },
  primary: { borderRadius: radius.full, backgroundColor: colors.primary, padding: spacing.lg, alignItems: 'center' },
  primaryLabel: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
