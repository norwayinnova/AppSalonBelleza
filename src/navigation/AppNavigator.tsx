import React from 'react';
import { Image, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import TenantLoginScreen from '../screens/TenantLoginScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
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
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

function LogoTitle() {
  const { theme } = useAppContext();
  return (
    <View style={styles.logoTitleContainer}>
      <Image 
        style={styles.logo} 
        source={theme.logoUrl ? { uri: theme.logoUrl } : theme.logoPath || require('../../assets/logo.jpg')} 
        resizeMode="contain" 
      />
      <Text style={[styles.headerTitle, {color: theme.lightTextColor}]}>{theme.appName}</Text>
    </View>
  );
}

function MainTabsComponent() {
  const { role, theme } = useAppContext();
  const isAdmin = role === 'admin';
  const isManagement = role === 'management';
  const showAdminOnly = isAdmin;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarItemStyle: { width: 130 },
        tabBarStyle: { backgroundColor: '#fff', elevation: 2, height: 48 },
        tabBarIndicatorStyle: { backgroundColor: theme.primaryColor, height: 3 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold', textTransform: 'none' },
        tabBarActiveTintColor: theme.primaryColor,
        tabBarInactiveTintColor: '#888',
      }}
    >
      {showAdminOnly && <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />}
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ tabBarLabel: 'Calendario' }} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} options={{ tabBarLabel: 'Nueva Cita' }} />
      {isAdmin && <Tab.Screen name="Clients" component={ClientsScreen} options={{ tabBarLabel: 'Clientes' }} />}
      {(isAdmin || isManagement) && <Tab.Screen name="Services" component={ServicesScreen} options={{ tabBarLabel: 'Servicios' }} />}
      {isAdmin && <Tab.Screen name="Expenses" component={ExpensesScreen} options={{ tabBarLabel: 'Gastos' }} />}
      {showAdminOnly && <Tab.Screen name="Calculator" component={CalculatorScreen} options={{ tabBarLabel: 'Calculadora' }} />}
      {showAdminOnly && <Tab.Screen name="Promotions" component={PromotionsScreen} options={{ tabBarLabel: 'Promociones' }} />}
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ tabBarLabel: 'Inventario' }} />
      {showAdminOnly && <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Ajustes' }} />}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { role, logout, appMode, setAppMode, tenantId, setTenantId, theme } = useAppContext();

  const handleLogout = () => {
    logout();
    setTenantId('');
    setAppMode(null);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        
        {/* PANTALLA INICIAL DE SELECCIÓN DE MODO */}
        {!appMode ? (
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        ) : appMode === 'professional' ? (
          
          /* FLUJO B2B: PROFESIONALES */
          !tenantId ? (
            <Stack.Screen name="TenantLogin" component={TenantLoginScreen} options={{ headerShown: false }} />
          ) : !role ? (
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ headerShown: false }} />
          ) : (
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabsComponent}
              options={{
                headerTitle: () => <LogoTitle />,
                headerStyle: { backgroundColor: theme.primaryColor },
                headerTintColor: theme.lightTextColor,
                headerRight: () => (
                  <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={[styles.logoutText, {color: theme.lightTextColor}]}>Cerrar Sesión</Text>
                  </TouchableOpacity>
                ),
              }}
            />
          )

        ) : (
          
          /* FLUJO B2C: CLIENTES FINALES (MARKETPLACE) */
          !tenantId ? (
            <Stack.Screen 
              name="Marketplace" 
              component={MarketplaceScreen} 
              options={{
                headerTitle: 'Directorio de Salones',
                headerLeft: () => (
                  <TouchableOpacity onPress={() => setAppMode(null)} style={styles.backBtn}>
                    <Text style={{color: '#3498db'}}>Volver</Text>
                  </TouchableOpacity>
                )
              }} 
            />
          ) : (
            <Stack.Screen 
              name="ClientBooking" 
              component={ClientBookingScreen} 
              options={{
                headerTitle: () => <LogoTitle />,
                headerStyle: { backgroundColor: theme.primaryColor },
                headerTintColor: theme.lightTextColor,
                headerLeft: () => (
                  <TouchableOpacity onPress={() => setTenantId('')} style={styles.backBtn}>
                    <Text style={{color: theme.lightTextColor}}>Volver</Text>
                  </TouchableOpacity>
                )
              }} 
            />
          )
        )}
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  logoTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 35, height: 35, marginRight: 10, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 20, marginRight: 10 },
  logoutText: { fontSize: 12, fontWeight: 'bold' },
  backBtn: { padding: 10, marginRight: 10 }
});