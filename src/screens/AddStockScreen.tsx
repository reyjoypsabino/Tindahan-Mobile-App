import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { InventoryStackParamList } from '../navigation/types';
import CategorySheet from '../components/CategorySheet';
import OfflineBanner from '../components/OfflineBanner';
import SariSariHeader from '../components/SariSariHeader';
import { addProduct } from '../services/db';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<InventoryStackParamList, 'AddStock'>;

// AddStockScreen: photo row, name, category sheet, price+qty, expiry, save.
export default function AddStockScreen({ navigation }: Props) {
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('Canned Goods');
  const [price, setPrice] = useState<string>('');
  const [qty, setQty] = useState<string>('');
  const [expiry, setExpiry] = useState<string>('');
  const [sheet, setSheet] = useState<boolean>(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const takePhoto = async (): Promise<void> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Camera access is needed to take a product photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const pickFromLibrary = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Photo library access is needed to choose a product photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const choosePhoto = (): void => {
    Alert.alert('Product photo', 'Take a new photo or choose from the library.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: () => void takePhoto() },
      { text: 'Choose from Library', onPress: () => void pickFromLibrary() },
    ]);
  };

  const save = (): void => {
    const priceNum = parseFloat(price) || 0;
    const qtyNum = parseInt(qty, 10) || 0;
    if (!name.trim() || priceNum <= 0 || qtyNum <= 0) {
      Alert.alert('Missing details', 'Product name, a price greater than ₱0, and quantity are required.');
      return;
    }
    try {
      addProduct(name.trim(), category, priceNum, qtyNum, photoUri ?? '');
    } catch (e) {
      Alert.alert('Database error', e instanceof Error ? e.message : 'Failed to save product.');
      return;
    }
    Alert.alert('Saved', `${name.trim()} saved to SQLite.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.flex}>
      <SariSariHeader storeName="Add New Stock" subtitle="Nena's Sari-Sari" variant="inner" onBack={() => navigation.goBack()} />
      <OfflineBanner cachedAt="local save intended" queuedCount={0} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.photoRow}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
            ) : (
              <View style={styles.photoBox}>
                <Text style={styles.photoIcon}>🖼</Text>
                <Text style={styles.sub}>No photo yet</Text>
              </View>
            )}
            <View style={styles.photoInfo}>
              <Text style={styles.cardLabel}>Product photo</Text>
              <Text style={styles.sub}>Optional · show the product and label clearly.</Text>
              <TouchableOpacity style={styles.photoBtn} onPress={choosePhoto}>
                <Text style={styles.photoBtnLabel}>📷  Take Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.fieldLabel}>Product name *</Text>
        <TextInput style={styles.input} placeholder="e.g. Ligo Sardines" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} />

        <Text style={styles.fieldLabel}>Category</Text>
        <TouchableOpacity style={styles.inputRow} onPress={() => setSheet(true)}>
          <Text style={styles.inputText}>{category === 'All' ? 'Select a category' : category}</Text>
          <Text style={styles.chev}>›</Text>
        </TouchableOpacity>
        <Text style={styles.helper}>Used in Inventory and POS filters.</Text>

        <View style={styles.duo}>
          <View style={styles.duoField}>
            <Text style={styles.fieldLabel}>Price *</Text>
            <TextInput style={styles.input} placeholder="₱ e.g. 25.00" placeholderTextColor={colors.textSecondary} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
            <Text style={styles.helper}>Required · greater than ₱0</Text>
          </View>
          <View style={styles.duoField}>
            <Text style={styles.fieldLabel}>Initial quantity *</Text>
            <TextInput style={styles.input} placeholder="e.g. 12" placeholderTextColor={colors.textSecondary} value={qty} onChangeText={setQty} keyboardType="number-pad" />
            <Text style={styles.helper}>Required · whole number, 0 or more</Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>Expiry date (optional)</Text>
        <TextInput style={styles.input} placeholder="DD / MM / YYYY" placeholderTextColor={colors.textSecondary} value={expiry} onChangeText={setExpiry} />
        <Text style={styles.helper}>New products are intended to appear in Inventory and POS after saving.</Text>

        <TouchableOpacity style={styles.primary} onPress={save}>
          <Text style={styles.primaryLabel}>Save Product</Text>
        </TouchableOpacity>
      </ScrollView>
      <CategorySheet visible={sheet} selected={category} onSelect={setCategory} onClose={() => setSheet(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, ...shadow.card },
  photoRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  photoBox: { width: 96, height: 120, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', gap: 4 },
  photoPreview: { width: 96, height: 120, borderRadius: radius.md, backgroundColor: colors.background },
  photoIcon: { fontSize: 28 },
  photoInfo: { flex: 1, gap: 4 },
  cardLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  sub: { fontSize: fontSize.xs, color: colors.textSecondary },
  photoBtn: { marginTop: 4, backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, alignSelf: 'flex-start' },
  photoBtnLabel: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, marginTop: spacing.sm },
  input: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, fontSize: fontSize.sm, color: colors.text },
  inputRow: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputText: { fontSize: fontSize.sm, color: colors.text },
  chev: { color: colors.textSecondary, fontSize: 18, fontWeight: fontWeight.bold },
  helper: { fontSize: fontSize.xs, color: colors.textSecondary },
  duo: { flexDirection: 'row', gap: spacing.md },
  duoField: { flex: 1, gap: spacing.xs },
  primary: { borderRadius: radius.full, backgroundColor: colors.primary, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md },
  primaryLabel: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.base },
});
