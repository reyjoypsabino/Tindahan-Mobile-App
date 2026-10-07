import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme/theme';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// Empty states use the Figma cat clerk mascot illustration.
export default function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <Image source={require('../assets/cat-mascot.png')} style={styles.art} resizeMode="contain" />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel ? (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.buttonLabel}>+ {actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  art: { width: 120, height: 120 },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold, textAlign: 'center' },
  message: { color: colors.textSecondary, fontSize: fontSize.sm, textAlign: 'center' },
  button: { marginTop: spacing.sm, height: 48, paddingHorizontal: spacing.xl, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  buttonLabel: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
});
