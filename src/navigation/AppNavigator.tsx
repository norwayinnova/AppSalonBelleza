import React, { useState } from 'react';
import { Image, View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import TenantLoginScreen from '../screens/TenantLoginScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import { useAppContext } from '../context/AppContext';
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
      <Text style={[styles.headerTitle, { color: theme.lightTextColor || '#fff' }]}>{theme.appName}</Text>
    </View>
  );
}

function MainTabsComponent() {
  const { role, theme } = useAppContext();
  const [activeTab, setActiveTab] = useState('Calendar');

  const isAdmin = role === 'admin';
  const isMgmt = role === 'management';
  const { width: screenWidth } = useWindowDimensions();
  const MIN_TAB_WIDTH = 90;

  const tabs = [
    ...(isAdmin ? [{ name: 'Dashboard', label: 'Dashboard', component: DashboardScreen }] : []),
    { name: 'Calendar', label: 'Calendario', component: CalendarScreen },
    { name: 'Appointments', label: 'Nueva Cita', component: AppointmentsScreen },
    ...(isAdmin ? [{ name: 'Clients', label: 'Clientes', component: ClientsScreen }] : []),
    ...((isAdmin || isMgmt) ? [{ name: 'Services', label: 'Servicios', component: ServicesScreen }] : []),
    ...(isAdmin ? [{ name: 'Expenses', label: 'Gastos', component: ExpensesScreen }] : []),
    ...(isAdmin ? [{ name: 'Calculator', label: 'Calculadora', component: CalculatorScreen }] : []),
    ...(isAdmin ? [{ name: 'Promotions', label: 'Promociones', component: PromotionsScreen }] : []),
    { name: 'Inventory', label: 'Inventario', component: InventoryScreen },
    ...(isAdmin ? [{ name: 'Settings', label: 'Ajustes', component: SettingsScreen }] : []),
  ];

  // Make sure activeTab is always valid
  const validActive = tabs.find(t => t.name === activeTab) ? activeTab : tabs[0]?.name || 'Calendar';
  const ActiveComponent = tabs.find(t => t.name === validActive)?.component || CalendarScreen;

  return (
    <View style={{ flex: 1 }}>
      {/* CUSTOM TAB BAR */}
      <View style={[styles.tabBar, { borderBottomColor: theme.primaryColor + '30' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {tabs.map(tab => {
            const isActive = validActive === tab.name;
            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => setActiveTab(tab.name)}
                style={[
                  styles.tabItem, 
                  { width: Math.max(MIN_TAB_WIDTH, screenWidth / tabs.length) },
                  isActive && { borderBottomColor: theme.primaryColor, borderBottomWidth: 3 }
                ]}
              >
                <Text style={[styles.tabLabel, { color: isActive ? theme.primaryColor : '#666' }, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* SCREEN CONTENT */}
      <View style={{ flex: 1 }}>
        <ActiveComponent />
      </View>
    </View>
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
        {!appMode ? (
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        ) : appMode === 'professional' ? (
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
                headerTintColor: theme.lightTextColor || '#fff',
                headerRight: () => (
                  <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                  </TouchableOpacity>
                ),
              }}
            />
          )
        ) : (
          !tenantId ? (
            <Stack.Screen
              name="Marketplace"
              component={MarketplaceScreen}
              options={{
                headerTitle: 'Directorio de Salones',
                headerLeft: () => (
                  <TouchableOpacity onPress={() => setAppMode(null)} style={styles.backBtn}>
                    <Text style={{ color: '#3498db' }}>Volver</Text>
                  </TouchableOpacity>
                ),
              }}
            />
          ) : (
            <Stack.Screen
              name="ClientBooking"
              component={ClientBookingScreen}
              options={{
                headerTitle: () => <LogoTitle />,
                headerStyle: { backgroundColor: theme.primaryColor },
                headerTintColor: theme.lightTextColor || '#fff',
                headerLeft: () => (
                  <TouchableOpacity onPress={() => setTenantId('')} style={styles.backBtn}>
                    <Text style={{ color: theme.lightTextColor || '#fff' }}>Volver</Text>
                  </TouchableOpacity>
                ),
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
  logo: { width: 35, height: 35, marginRight: 10, borderRadius: 18 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 20, marginRight: 10 },
  logoutText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  backBtn: { padding: 10 },
  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1 },
  tabScroll: { flexDirection: 'row', alignItems: 'center' },
  tabItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 13, color: '#666' },
  tabLabelActive: { fontWeight: 'bold' },
});