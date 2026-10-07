import { NavigationContainer } from '@react-navigation/native';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/auth/AuthContext';
import { StoreProvider } from './src/store/AppStore';
import { colors } from './src/theme/theme';

export default function App() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} translucent={false} />
      <AuthProvider>
        <StoreProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </StoreProvider>
      </AuthProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Platform.OS === 'android' ? colors.primary : colors.background },
});
