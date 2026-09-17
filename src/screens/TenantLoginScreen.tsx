import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAppContext } from '../context/AppContext';
import { defaultThemes } from '../context/AppContext';

export default function TenantLoginScreen() {
  const { setTenantData } = useAppContext();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanCode = code.trim().toLowerCase();
    if (!cleanCode) return;
    
    setLoading(true);
    setError('');

    try {
      const tenantRef = doc(db, 'tenants', cleanCode);
      const tenantSnap = await getDoc(tenantRef);

      if (tenantSnap.exists()) {
        // Tenant exists in Firebase
        setTenantData(cleanCode, tenantSnap.data() as any);
      } else {
        // Tenant does NOT exist. 
        // Self-seed logic for development: if it's one of our defaults, create it in Firebase!
        if (defaultThemes[cleanCode]) {
          const themeToSave = { ...defaultThemes[cleanCode] };
          delete themeToSave.logoPath; // We can't save 'require' in Firebase
          await setDoc(tenantRef, themeToSave);
          
          setTenantData(cleanCode, defaultThemes[cleanCode]);
        } else {
          setError('El código de salón ingresado no existe en nuestra base de datos.');
        }
      }
    } catch (e) {
      console.error(e);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>BeautyTime SaaS</Text>
        <Text style={styles.subtitle}>Introduce el código de tu Salón para acceder</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Ej: avalon_mystic"
          placeholderTextColor="#999"
          value={code}
          onChangeText={(t) => { setCode(t); setError(''); }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Acceder a mi Salón</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helpText}>
          (Si el salón es nuevo, avisa a tu administrador)
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b2a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 15,
  },
  button: {
    width: '100%',
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  helpText: {
    color: 'rgba(255,255,255,0.3)',
    marginTop: 20,
    fontSize: 12,
  }
});
