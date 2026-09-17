import React, { useState } from 'react';
import { Image, View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import WelcomeScreen from '../screens/WelcomeScreen';
import AuthScreen from '../screens/AuthScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import ClientAppointmentsScreen from '../screens/ClientAppointmentsScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import TenantLoginScreen from '../screens/TenantLoginScreen';
import ClientBookingScreen from '../screens/ClientBookingScreen';
import CalendarScreen from '../screens/CalendarScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import ServicesScreen from '../screens/ServicesScreen';
import ClientsScreen from '../screens/ClientsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import InventoryScreen from '../screens/InventoryScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import PromotionsScreen from '../screens/PromotionsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

function LogoTitle() {
  const { theme } = useAppContext();
  return (
    <View style={styles.logoRow}>
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
  const { width: screenWidth } = useWindowDimensions();

  const isAdmin = role === 'admin';
  const isMgmt = role === 'management';

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

  const MIN_TAB_WIDTH = 90;
  const tabWidth = Math.max(MIN_TAB_WIDTH, screenWidth / tabs.length);
  const validActive = tabs.find(t => t.name === activeTab) ? activeTab : tabs[0]?.name || 'Calendar';
  const ActiveComponent = tabs.find(t => t.name === validActive)?.component || CalendarScreen;

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.tabBar, { borderBottomColor: theme.primaryColor + '30' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {tabs.map(tab => {
            const isActive = validActive === tab.name;
            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => setActiveTab(tab.name)}
                style={[styles.tabItem, { width: tabWidth }, isActive && { borderBottomColor: theme.primaryColor, borderBottomWidth: 3 }]}
              >
                <Text style={[styles.tabLabel, { color: isActive ? theme.primaryColor : '#666' }, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <View style={{ flex: 1 }}>
        <ActiveComponent />
      </View>
    </View>
  );
}


function ClientTabsComponent() {
  const { setAppMode, logout } = useAppContext();
  const [activeTab, setActiveTab] = useState('Marketplace');
  const { width: screenWidth } = useWindowDimensions();

  const tabs = [
    { name: 'Marketplace', label: 'Explorar Salones', component: MarketplaceScreen },
    { name: 'MyAppointments', label: 'Mis Citas', component: ClientAppointmentsScreen },
  ];

  const MIN_TAB_WIDTH = 120;
  const tabWidth = Math.max(MIN_TAB_WIDTH, screenWidth / tabs.length);
  const ActiveComponent = tabs.find(t => t.name === activeTab)?.component || MarketplaceScreen;

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.tabBar, { borderBottomColor: '#3498db30', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll} style={{ flex: 1 }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.name;
            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => setActiveTab(tab.name)}
                style={[styles.tabItem, { width: tabWidth }, isActive && { borderBottomColor: '#3498db', borderBottomWidth: 3 }]}
              >
                <Text style={[styles.tabLabel, { color: isActive ? '#3498db' : '#666' }, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity onPress={() => { logout(); setAppMode(null); }} style={styles.logoutBtnClient}>
          <Text style={styles.logoutTextClient}>Salir</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        <ActiveComponent />
      </View>
    </View>
  );
}
export default function AppNavigator() {
  const { role, logout, appMode, setAppMode, tenantId, setTenantId, theme, firebaseUser, authLoading } = useAppContext();

  if (authLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#D48A9A" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const handleLogout = () => {
    logout();
  };

  const renderProfessionalFlow = () => {
    // Not logged in with Firebase Auth yet
    if (!firebaseUser) {
      return <Stack.Screen name="AuthPro" options={{ headerShown: false }}>
        {() => <AuthScreen mode="professional" />}
      </Stack.Screen>;
    }
    // Logged in but no tenantId in Firestore profile yet (team member first login via old PIN)
    if (!tenantId) {
      return <Stack.Screen name="TenantLogin" component={TenantLoginScreen} options={{ headerShown: false }} />;
    }
    // Has tenant but no role chosen (admin assigns role)
    if (!role || role === 'team') {
      return <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ headerShown: false }} />;
    }
    // Fully authenticated - show main app
    return (
      <Stack.Screen
        name="MainTabs"
        component={MainTabsComponent}
        options={{
          headerTitle: () => <LogoTitle />,
          headerStyle: { backgroundColor: theme.primaryColor },
          headerTintColor: theme.lightTextColor || '#fff',
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Cerrar Sesion</Text>
            </TouchableOpacity>
          ),
        }}
      />
    );
  };

  const renderClientFlow = () => {
    if (!firebaseUser) {
      return <Stack.Screen name="AuthClient" options={{ headerShown: false }}>
        {() => <AuthScreen mode="client" />}
      </Stack.Screen>;
    }
    if (!tenantId) {
      return (
        <Stack.Screen
          name="ClientTabs"
          component={ClientTabsComponent}
          options={{
            headerShown: true,
            headerTitle: 'BeautyTime Marketplace',
            headerStyle: { backgroundColor: '#3498db' },
            headerTintColor: '#fff',
            headerLeft: () => (
              <TouchableOpacity onPress={() => setAppMode(null)} style={styles.backBtn}>
                <Text style={{ color: '#fff' }}>Volver</Text>
              </TouchableOpacity>
            )
          }}
        />
      );
    }
    return (
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
    );
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!appMode ? (
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        ) : appMode === 'professional' ? (
          renderProfessionalFlow()
        ) : (
          renderClientFlow()
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1b2a' },
  loadingText: { color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: 14 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 35, height: 35, marginRight: 10, borderRadius: 18 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 20, marginRight: 10 },
  logoutText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  backBtn: { padding: 10 },
  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1 },
  tabScroll: { flexDirection: 'row', alignItems: 'center' },
  tabItem: { paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent', alignItems: 'center' },
  tabLabel: { fontSize: 13, color: '#666' },
  tabLabelActive: { fontWeight: 'bold' },
  logoutBtnClient: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#e74c3c', borderRadius: 12 },
  logoutTextClient: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});