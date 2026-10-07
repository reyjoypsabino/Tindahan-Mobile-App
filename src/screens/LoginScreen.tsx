import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import AuthHero from '../components/AuthHero';
import GoogleButton from '../components/GoogleButton';
import { useAuth } from '../auth/AuthContext';
import { useGoogleAuth } from '../auth/google';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// Login: clean mascot hero, single-column card, inline validation (reserved
// error slot so messages never overlap content), 48dp touch targets.
export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const { signIn } = useAuth();
  const { signIn: googleSignIn, loading } = useGoogleAuth();

  const continueWithGoogle = async (): Promise<void> => {
    try {
      await googleSignIn();
      navigation.replace('Main');
    } catch {
      setFormError('Kailangan ng internet para sa Google sign-in.');
    }
  };

  const submit = async (): Promise<void> => {
    if (!email.trim() || !password) {
      setFormError('Enter your email and password to continue.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setFormError('That email address does not look right.');
      return;
    }
    setFormError('');
    const ok = await signIn(email, password);
    if (ok) navigation.replace('Main');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <AuthHero greeting="Mabuhay! Ang iyong tindahan, ang iyong negosyo." />

      <View style={styles.card}>
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.context}>Log in to manage your sari-sari store.</Text>

        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={(t) => { setEmail(t); setFormError(''); }}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="off"
          importantForAutofill="no"
        />

        <Text style={styles.fieldLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={(t) => { setPassword(t); setFormError(''); }}
          secureTextEntry
          autoComplete="off"
          importantForAutofill="no"
        />

        <View style={styles.errorSlot}>
          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        </View>

        <TouchableOpacity style={styles.primary} onPress={submit} activeOpacity={0.8}>
          <Text style={styles.primaryLabel}>Log in</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerLabel}>or</Text>
          <View style={styles.divider} />
        </View>

        <GoogleButton title="Continue with Google" onPress={continueWithGoogle} loading={loading} />

        <Text style={styles.accountPrompt}>New to Tindahan?</Text>
        <TouchableOpacity style={styles.secondary} onPress={() => navigation.navigate('Signup')} activeOpacity={0.8}>
          <Text style={styles.secondaryLabel}>Create an account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.offlineCard}>
        <Image source={require('../assets/cat-avatar.png')} style={styles.offlineCat} />
        <View style={styles.offlineText}>
          <Text style={styles.offlineTitle}>Go online for account setup</Text>
          <Text style={styles.offlineBody}>New account verification requires an online connection. Cached sales remain on this device.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: spacing.xl, gap: spacing.md },
  card: { marginHorizontal: spacing.lg, marginTop: -24, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, ...shadow.card },
  heading: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.bold },
  context: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.sm },
  fieldLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  input: { height: 56, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.lg, fontSize: fontSize.base, color: colors.text, backgroundColor: colors.card },
  errorSlot: { minHeight: 22, justifyContent: 'center' },
  errorText: { color: colors.accentDark, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  primary: { height: 48, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryLabel: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xs },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  accountPrompt: { color: colors.textSecondary, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.sm },
  secondary: { height: 48, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  secondaryLabel: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  offlineCard: { marginHorizontal: spacing.lg, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  offlineCat: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card },
  offlineText: { flex: 1, gap: 4 },
  offlineTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  offlineBody: { color: colors.textSecondary, fontSize: fontSize.xs },
});
