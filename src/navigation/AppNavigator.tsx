import React, { useEffect } from 'react';
import { Image, View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import TenantLoginScreen from '../screens/TenantLoginScreen';
import { useAppContext } from '../context/AppContext';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import CalendarScreen from '../screens/CalendarScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import ServicesScreen from '../screens/ServicesScreen';
import ClientsScreen from '../screens/ClientsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ClientBookingScreen from '../screens/ClientBookingScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import PromotionsScreen from '../screens/PromotionsScreen';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

function LogoTitle() {
  const { theme } = useAppContext();
  return (
    <View style={styles.logoContainer}>
      <Image
        style={styles.logoImage}
        source={theme.logoUrl ? { uri: theme.logoUrl } : theme.logoPath || require("../../assets/logo.jpg")}
        resizeMode="contain"
      />
    </View>
  );
}

function CustomTopTabBar({ state, descriptors, navigation }: any) {
  const { theme } = useAppContext();
  return (
    <View style={styles.tabBarWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[
                styles.tabButton,
                isFocused ? { borderBottomColor: theme.primaryColor } : styles.tabButtonInactive
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  isFocused ? { color: theme.primaryColor, fontWeight: 'bold' } : styles.tabTextInactive
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function TopTabs() {
  const { role, teamName } = useAppContext();
  const isAdmin = role === 'admin';
  const isManagement = role === 'management';
  const showAdminOnly = isAdmin;

  return (
    <Tab.Navigator tabBar={(props) => <CustomTopTabBar {...props} />} screenOptions={{ swipeEnabled: false }}>
      {showAdminOnly && <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: '📊 Dashboard' }} />}
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ tabBarLabel: '📅 Calendario' }} initialParams={{ role, teamName }} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} options={{ tabBarLabel: '➕ Nueva Cita' }} initialParams={{ role, teamName }} />
      {isAdmin && <Tab.Screen name="Clients" component={ClientsScreen} options={{ tabBarLabel: '👥 Clientes' }} />}
      {(isAdmin || isManagement) && <Tab.Screen name="Services" component={ServicesScreen} options={{ tabBarLabel: '🧹 Servicios' }} />}
      {isAdmin && <Tab.Screen name="Expenses" component={ExpensesScreen} options={{ tabBarLabel: '💸 Gastos' }} />}
      {showAdminOnly && <Tab.Screen name="Calculator" component={CalculatorScreen} options={{ tabBarLabel: '🧮 Calculadora' }} />}
      {showAdminOnly && <Tab.Screen name="Promotions" component={PromotionsScreen} options={{ tabBarLabel: '📢 Promociones' }} />}
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ tabBarLabel: '📦 Inventario' }} initialParams={{ role, teamName }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { role, logout, loginAsClient, theme, tenantId } = useAppContext();

  useEffect(() => {
    if (Platform.OS === 'web') {
      const url = window.location.href;
      if (url.includes('?reserva') || url.includes('/reserva')) {
        loginAsClient();
      }
    }
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleAlign: 'center',
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <LogoTitle />
            </View>
          ),
          headerRight: () => role ? (
            <TouchableOpacity onPress={logout} style={{marginRight: 15, padding: 6, backgroundColor: theme.primaryColor + '1A', borderRadius: 8, borderWidth: 1, borderColor: theme.primaryColor + '4D'}}>
              <Text style={{color: theme.primaryColor, fontWeight: 'bold', fontSize: 13}}>Salir 🔒</Text>
            </TouchableOpacity>
          ) : null
        }}
      >
        {!tenantId ? (
          <Stack.Screen name="TenantLogin" component={TenantLoginScreen} options={{ headerShown: false }} />
        ) : !role ? (
          <Stack.Screen name="Login" component={RoleSelectionScreen} options={{ headerShown: false }} />
        ) : role === 'cliente' ? (
          <Stack.Screen name="ClientBooking" component={ClientBookingScreen} options={{ title: 'Reserva Online' }} />
        ) : (
          <Stack.Screen name="Main" component={TopTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  logoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 5 },
  logoImage: { width: 140, height: 40 },
  tabBarWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 }
  },
  tabScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '100%',
    justifyContent: 'space-around'
  },
  tabButton: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent'
  },
  tabButtonInactive: {
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center'
  },
  tabTextInactive: {
    color: '#888888',
    fontWeight: '600',
  }
});
