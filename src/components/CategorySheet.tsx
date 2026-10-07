import { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme/theme';

export interface Category {
  label: string;
  examples?: string;
  icon: string;
}

// Mirrors Figma CategoryDropdownMenu options; row pattern mirrors More menu sheet:
// icon + label (+ examples sub) + chevron, check when selected.
export const CATEGORIES: Category[] = [
  { label: 'Canned Goods', examples: 'e.g., Corned Beef, Sardines, Meat Loaf', icon: '🥫' },
  { label: 'Beverages', examples: 'e.g., Soda, Juice, Bottled Water', icon: '🥤' },
  { label: 'Instant Noodles', icon: '🍜' },
  { label: 'Coffee/Sachets', examples: 'e.g., 3-in-1 Coffee, Powdered Milk', icon: '☕' },
  { label: 'Snacks', icon: '🍪' },
  { label: 'Condiments', examples: 'e.g., Soy Sauce, Vinegar, Cooking Oil', icon: '🧂' },
  { label: 'Rice/Grains', icon: '🌾' },
  { label: 'Frozen Food', examples: 'e.g., Hotdogs, Tocino, Ice Candy', icon: '🧊' },
  { label: 'Bath/Hair Care', examples: 'e.g., Shampoo sachets, Bar Soap', icon: '🧴' },
  { label: 'Oral Care', examples: 'e.g., Toothpaste, Toothbrushes', icon: '🪥' },
  { label: 'Laundry/Household', examples: 'e.g., Detergent powder, Fabric softener', icon: '🧺' },
  { label: 'Others', icon: '📦' },
];

interface CategorySheetProps {
  visible: boolean;
  selected?: string;
  includeAll?: boolean;
  allLabel?: string;
  onSelect: (label: string) => void;
  onClose: () => void;
}

export default function CategorySheet({ visible, selected, includeAll, allLabel = 'All', onSelect, onClose }: CategorySheetProps) {
  const [q, setQ] = useState<string>('');
  const base = includeAll ? [{ label: allLabel, icon: '🧺' } as Category, ...CATEGORIES] : CATEGORIES;
  const rows = base.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <TouchableOpacity style={styles.scrimTouch} onPress={onClose} accessibilityLabel="Close categories" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.heading}>
            <Text style={styles.title}>Select a category</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" style={styles.close}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.search}
            placeholder="Hanapin…"
            placeholderTextColor={colors.textSecondary}
            value={q}
            onChangeText={setQ}
          />
          <FlatList
            data={rows}
            keyExtractor={(c) => c.label}
            renderItem={({ item }) => {
              const active = item.label === selected;
              return (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    onSelect(item.label);
                    onClose();
                  }}
                >
                  <Text style={styles.icon}>{item.icon}</Text>
                  <View style={styles.rowText}>
                    <Text style={styles.label}>{item.label}</Text>
                    {item.examples ? <Text style={styles.examples}>{item.examples}</Text> : null}
                  </View>
                  <Text style={[styles.check, active && styles.checkActive]}>{active ? '✓' : '›'}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(23, 23, 45, 0.45)', justifyContent: 'flex-end' },
  scrimTouch: { flex: 1 },
  sheet: { maxHeight: '80%', backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingBottom: spacing.lg },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textSecondary, fontSize: 14 },
  search: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: fontSize.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  icon: { fontSize: 22, width: 30, textAlign: 'center' },
  rowText: { flex: 1 },
  label: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.medium },
  examples: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  check: { fontSize: 18, color: colors.textSecondary, fontWeight: fontWeight.bold },
  checkActive: { color: colors.primary },
});
