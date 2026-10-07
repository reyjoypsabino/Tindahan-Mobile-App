import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

interface ProductCardProps {
  name?: string;
  price?: number;
  stock?: number;
  imageSource?: number | null;
  onAdd?: () => void;
  onEdit?: () => void;
}

export default function ProductCard({ name = 'Product', price = 0, stock = 0, imageSource = null, onAdd, onEdit }: ProductCardProps) {
  return (
    <View style={styles.card}>
      {imageSource ? (
        <Image source={imageSource} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={styles.thumbnail}>
          <Text style={styles.thumbnailText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.price}>₱{Number(price).toFixed(2)}</Text>
        <Text style={styles.stock}>Stock: {stock}</Text>
      </View>
      <View style={styles.actions}>
        {onAdd && (
          <TouchableOpacity style={[styles.btn, styles.addBtn]} onPress={onAdd}>
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        )}
        {onEdit && (
          <TouchableOpacity style={[styles.btn, styles.editBtn]} onPress={onEdit}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, ...shadow.card },
  thumbnail: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  thumbnailText: { color: colors.primary, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  photo: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.background },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  price: { color: colors.primary, fontSize: fontSize.base, fontWeight: fontWeight.bold, marginTop: 2 },
  stock: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  actions: { gap: spacing.sm },
  btn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  addBtn: { backgroundColor: colors.primary },
  addText: { color: colors.white, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  editBtn: { backgroundColor: colors.primaryLight },
  editText: { color: colors.primary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
});
