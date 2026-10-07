import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, StyleSheet, View } from 'react-native';
import { colors } from '../theme/theme';
import type {
  InventoryStackParamList,
  MoreStackParamList,
  POSStackParamList,
  RootStackParamList,
  UtangStackParamList,
} from './types';
import AddStockScreen from '../screens/AddStockScreen';
import EditProductScreen from '../screens/EditProductScreen';
import AddUtangScreen from '../screens/AddUtangScreen';
import CreditPaymentModalScreen from '../screens/CreditPaymentModalScreen';
import UtangCustomerScreen from '../screens/UtangCustomerScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ExpiryTrackerScreen from '../screens/ExpiryTrackerScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import InventoryScreen from '../screens/InventoryScreen';
import LoginScreen from '../screens/LoginScreen';
import MoreScreen from '../screens/MoreScreen';
import PaymentScreen from '../screens/PaymentScreen';
import POSScreen from '../screens/POSScreen';
import PricingCalculatorScreen from '../screens/PricingCalculatorScreen';
import ReportsScreen from '../screens/ReportsScreen';
import RestockListScreen from '../screens/RestockListScreen';
import SignupScreen from '../screens/SignupScreen';
import SplashScreen from '../screens/SplashScreen';
import StockExpiryEditorScreen from '../screens/StockExpiryEditorScreen';
import UtangLedgerScreen from '../screens/UtangLedgerScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const POSStackNav = createNativeStackNavigator<POSStackParamList>();
const InvStackNav = createNativeStackNavigator<InventoryStackParamList>();
const UtangStackNav = createNativeStackNavigator<UtangStackParamList>();
const MoreStackNav = createNativeStackNavigator<MoreStackParamList>();

function POSStack() {
  return (
    <POSStackNav.Navigator screenOptions={{ headerShown: false }}>
      <POSStackNav.Screen name="POSHome" component={POSScreen} options={{ title: 'POS' }} />
      <POSStackNav.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
    </POSStackNav.Navigator>
  );
}

function InventoryStack() {
  return (
    <InvStackNav.Navigator screenOptions={{ headerShown: false }}>
      <InvStackNav.Screen name="InventoryHome" component={InventoryScreen} options={{ title: 'Inventory' }} />
      <InvStackNav.Screen name="AddStock" component={AddStockScreen} options={{ title: 'Add Stock' }} />
      <InvStackNav.Screen
        name="EditProduct"
        component={EditProductScreen}
        options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', title: 'Edit Product' }}
      />
      <InvStackNav.Screen
        name="StockExpiryEditor"
        component={StockExpiryEditorScreen}
        options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', title: 'Edit Expiry' }}
      />
    </InvStackNav.Navigator>
  );
}

function UtangStack() {
  return (
    <UtangStackNav.Navigator screenOptions={{ headerShown: false }}>
      <UtangStackNav.Screen name="UtangHome" component={UtangLedgerScreen} options={{ title: 'Utang Ledger' }} />
      <UtangStackNav.Screen
        name="AddUtang"
        component={AddUtangScreen}
        options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', title: 'Add Utang' }}
      />
      <UtangStackNav.Screen
        name="UtangCustomer"
        component={UtangCustomerScreen}
        options={{ title: 'Customer' }}
      />
      <UtangStackNav.Screen
        name="CreditPaymentModal"
        component={CreditPaymentModalScreen}
        options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', title: 'Record Payment' }}
      />
    </UtangStackNav.Navigator>
  );
}

function MoreStack() {
  return (
    <MoreStackNav.Navigator screenOptions={{ headerShown: false }}>
      <MoreStackNav.Screen name="MoreHome" component={MoreScreen} options={{ title: 'More' }} />
      <MoreStackNav.Screen name="RestockList" component={RestockListScreen} options={{ title: 'Restock List' }} />
      <MoreStackNav.Screen name="ExpiryTracker" component={ExpiryTrackerScreen} options={{ title: 'Expiry Tracker' }} />
      <MoreStackNav.Screen name="PricingCalculator" component={PricingCalculatorScreen} options={{ title: 'Pricing Calculator' }} />
      <MoreStackNav.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Expenses' }} />
      <MoreStackNav.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
      <MoreStackNav.Screen
        name="StockExpiryEditor"
        component={StockExpiryEditorScreen}
        options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', title: 'Edit Expiry' }}
      />
    </MoreStackNav.Navigator>
  );
}

const TAB_ICONS = {
  Home: require('../assets/home-storefront.png'),
  POS: require('../assets/pos-bayong.png'),
  Inventory: require('../assets/inventory-garapon.png'),
  Utang: require('../assets/ledger-notebook.png'),
  More: require('../assets/more-crate.png'),
};

function tabIcon(name: keyof typeof TAB_ICONS) {
  return ({ focused }: { focused: boolean }) => (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Image source={TAB_ICONS[name]} style={{ width: 26, height: 26, opacity: focused ? 1 : 0.6 }} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 48, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: colors.primaryLight },
});

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ tabBarLabel: 'Home', tabBarIcon: tabIcon('Home') }} />
      <Tab.Screen name="POS" component={POSStack} options={{ tabBarIcon: tabIcon('POS') }} />
      <Tab.Screen name="Inventory" component={InventoryStack} options={{ tabBarIcon: tabIcon('Inventory') }} />
      <Tab.Screen name="Utang" component={UtangStack} options={{ tabBarIcon: tabIcon('Utang') }} />
      <Tab.Screen name="More" component={MoreStack} options={{ tabBarIcon: tabIcon('More') }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Splash" component={SplashScreen} />
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Signup" component={SignupScreen} />
      <RootStack.Screen name="Main" component={MainTabs} />
    </RootStack.Navigator>
  );
}
