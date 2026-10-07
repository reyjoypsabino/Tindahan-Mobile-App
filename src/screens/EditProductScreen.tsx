import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { InventoryStackParamList } from '../navigation/types';
import CategorySheet from '../components/CategorySheet';
import { getProductById, imageSourceFor, updateProduct } from '../services/db';
import type { DbProduct } from '../services/db';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<InventoryStackParamList, 'EditProduct'>;

// EditProduct: full details editor for an already-saved product.
// Writes back to SQLite; Inventory/POS/Home pick it up on next focus.
export default function EditProductScreen({ navigation, route }: Props) {
  const { id } = route.params;
  let initial: DbProduct | null = null;
  try {
    initial = getProductById(id);
  } catch {
    initial = null;
  }

  const [name, setName] = useState<string>(initial?.name ?? '');
  const [category, setCategory] = useState<string>(initial?.category ?? 'Others');
  const [price, setPrice] = useState<string>(initial ? String(initial.price) : '');
  const [stock, setStock] = useState<string>(initial ? String(initial.stock) : '');
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.image_uri || null);
  const [sheet, setSheet] = useState<boolean>(false);

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

  if (!initial) {
    return (
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Product not found</Text>
          <Text style={styles.sub}>It may have been deleted from inventory.</Text>
          <TouchableOpacity style={styles.cancel} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelLabel}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const save = (): void => {
    const priceNum = parseFloat(price) || 0;
    const stockNum = parseInt(stock, 10);
    if (!name.trim()) {
      Alert.alert('Missing details', 'Product name is required.');
      return;
    }
    if (priceNum <= 0) {
      Alert.alert('Invalid price', 'Enter a price greater than ₱0.');
      return;
    }
    if (Number.isNaN(stockNum) || stockNum < 0) {
      Alert.alert('Invalid stock', 'Enter a stock count of 0 or more.');
      return;
    }
    try {
      updateProduct(id, {
        name: name.trim(),
        category,
        price: priceNum,
        stock: stockNum,
        imageUri: photoUri ?? '',
      });
    } catch (e) {
      Alert.alert('Database error', e instanceof Error ? e.message : 'Failed to save changes.');
      return;
    }
    navigation.goBack();
  };

  return (
    <View style={styles.scrim}>
      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.title}>Edit product</Text>
          <Text style={styles.sub}>Changes apply everywhere: Inventory, POS, and Home.</Text>

          <View style={styles.photoRow}>
            {(() => {
              const src = photoUri ? imageSourceFor(photoUri) : null;
              return src ? (
                <Image source={src} style={styles.photoPreview} resizeMode="cover" />
              ) : (
                <View style={styles.photoBox}>
                  <Text style={styles.photoIcon}>🖼</Text>
                  <Text style={styles.sub}>No photo yet</Text>
                </View>
              );
            })()}
            <View style={styles.photoInfo}>
              <Text style={styles.photoTitle}>Product photo</Text>
              <TouchableOpacity style={styles.photoBtn} onPress={choosePhoto}>
                <Text style={styles.photoBtnLabel}>📷  {photoUri ? 'Change Photo' : 'Take Photo'}</Text>
              </TouchableOpacity>
              {photoUri ? (
                <TouchableOpacity onPress={() => setPhotoUri(null)}>
                  <Text style={styles.removePhoto}>Remove photo</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <Text style={styles.fieldLabel}>Product name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ligo Sardines"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.fieldLabel}>Category</Text>
          <TouchableOpacity style={styles.inputRow} onPress={() => setSheet(true)}>
            <Text style={styles.inputText}>{category}</Text>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>

          <View style={styles.duo}>
            <View style={styles.duoField}>
              <Text style={styles.fieldLabel}>Price (₱) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 25.00"
                placeholderTextColor={colors.textSecondary}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.duoField}>
              <Text style={styles.fieldLabel}>Stock *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 12"
                placeholderTextColor={colors.textSecondary}
                value={stock}
                onChangeText={setStock}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancel} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primary} onPress={save}>
              <Text style={styles.primaryLabel}>Save changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <CategorySheet visible={sheet} selected={category} onSelect={setCategory} onClose={() => setSheet(false)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(23, 23, 45, 0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingTop: spacing.xl, maxHeight: '90%', ...shadow.card },
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  sub: { color: colors.textSecondary, fontSize: fontSize.xs },
  photoRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  photoBox: { width: 96, height: 120, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', gap: 4 },
  photoPreview: { width: 96, height: 120, borderRadius: radius.md, backgroundColor: colors.background },
  photoIcon: { fontSize: 28 },
  photoInfo: { flex: 1, gap: 4 },
  photoTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  photoBtn: { marginTop: 4, backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, alignSelf: 'flex-start' },
  photoBtnLabel: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  removePhoto: { color: colors.danger, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  fieldLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginTop: spacing.sm },
  input: { height: 56, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.lg, fontSize: fontSize.base, color: colors.text },
  inputRow: { height: 56, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputText: { fontSize: fontSize.base, color: colors.text },
  chev: { color: colors.textSecondary, fontSize: 18, fontWeight: fontWeight.bold },
  duo: { flexDirection: 'row', gap: spacing.md },
  duoField: { flex: 1, gap: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  cancel: { flex: 1, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, alignItems: 'center' },
  cancelLabel: { color: colors.primary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  primary: { flex: 1, borderRadius: radius.full, backgroundColor: colors.primary, padding: spacing.lg, alignItems: 'center' },
  primaryLabel: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
