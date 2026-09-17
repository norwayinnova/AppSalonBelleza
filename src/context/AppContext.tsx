import React, { createContext, useState, useContext, ReactNode, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface AppTheme {
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  darkTextColor: string;
  lightTextColor: string;
  backgroundColor: string;
  logoUrl?: string; // Loaded from Firebase
  logoPath?: any;   // Local fallback
  paymentOptions?: {
    allowInStore: boolean;
    allowBizum: boolean;
    bizumPhone?: string;
    allowStripe: boolean;
    stripePublicKey?: string;
    allowRedsys?: boolean;
    redsysFuc?: string;
    redsysKey?: string;
    allowPaypal?: boolean;
    paypalClientId?: string;
  };
}

export const defaultThemes: Record<string, AppTheme> = {
  avalon_mystic: {
    appName: 'Avalon Mystic',
    primaryColor: '#D48A9A',
    secondaryColor: '#f0f0f0',
    darkTextColor: '#7A4B56',
    lightTextColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    logoPath: require('../../assets/logo.jpg')
  },
  beautytime: {
    appName: 'BeautyTime',
    primaryColor: '#3498db',
    secondaryColor: '#ecf0f1',
    darkTextColor: '#2c3e50',
    lightTextColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    logoPath: require('../../assets/logo.jpg'),
    paymentOptions: {
      allowInStore: true,
      allowBizum: false,
      allowStripe: false,
      allowRedsys: false,
      allowPaypal: false
    }
  }
};

type Role = 'admin' | 'management' | 'team' | 'cliente' | null;
type ToastType = 'success' | 'error' | 'info';

interface AppContextType {
  role: Role;
  teamName: string | null;
  tenantId: string;
  theme: AppTheme;
  appMode: 'client' | 'professional' | null;
  setAppMode: (mode: 'client' | 'professional' | null) => void;
  setTenantId: (id: string) => void;
  loginAsAdmin: () => void;
  loginAsManagement: () => void;
  loginAsTeam: (teamName: string) => void;
  loginAsClient: () => void;
  logout: () => void;
  showToast: (msg: string, type?: ToastType) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  
  const [appMode, setAppModeState] = useState<'client' | 'professional' | null>(null);
  const [tenantId, setTenantIdState] = useState<string>('');
  const [theme, setThemeState] = useState<AppTheme>(defaultThemes['beautytime']);
  
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const slideAnim = useRef(new Animated.Value(-100)).current;

  // REACITIVIDAD EN TIEMPO REAL: Escuchar cambios del Tenant
  useEffect(() => {
    if (!tenantId) return;

    const tenantRef = doc(db, 'tenants', tenantId);
    const unsubscribe = onSnapshot(tenantRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppTheme;
        setThemeState(data);
      }
    });

    return () => unsubscribe();
  }, [tenantId]);

  const setAppMode = (mode: 'client' | 'professional' | null) => {
    setAppModeState(mode);
    if (!mode) {
      setTenantIdState('');
      setRole(null);
    }
  };

  const setTenantId = (id: string) => {
    setTenantIdState(id);
  };

  const loginAsAdmin = () => { setRole('admin'); setTeamName(null); };
  const loginAsManagement = () => { setRole('management'); setTeamName(null); };
  const loginAsTeam = (name: string) => { setRole('team'); setTeamName(name); };
  const loginAsClient = () => { setRole('cliente'); setTeamName(null); };
  const logout = () => { setRole(null); setTeamName(null); };

  const showToast = (msg: string, type: ToastType = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    Animated.spring(slideAnim, {
      toValue: 50,
      useNativeDriver: true,
      speed: 12
    }).start();

    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true
      }).start();
    }, 3000);
  };

  return (
    <AppContext.Provider value={{ role, teamName, tenantId, theme, appMode, setAppMode, setTenantId, loginAsAdmin, loginAsManagement, loginAsTeam, loginAsClient, logout, showToast }}>
      {children}
      {toastMsg ? (
        <Animated.View style={[
          styles.toastContainer, 
          { transform: [{ translateY: slideAnim }] },
          toastType === 'success' ? styles.toastSuccess : toastType === 'error' ? styles.toastError : styles.toastInfo
        ]}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      ) : null}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
  },
  toastSuccess: { backgroundColor: '#2ecc71' },
  toastError: { backgroundColor: '#e74c3c' },
  toastInfo: { backgroundColor: '#3498db' },
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});
