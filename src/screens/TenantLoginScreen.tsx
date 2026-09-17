import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { themes } from '../config/theme';

export default function TenantLoginScreen() {
  const { setTenantId } = useAppContext();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    const cleanCode = code.trim().toLowerCase();
    if (themes[cleanCode]) {
      setTenantId(cleanCode);
    } else {
      setError('Código de salón no válido.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Beauty Manager SaaS</Text>
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
        
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Acceder a mi Salón</Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          (Códigos de prueba: "avalon_mystic" o "appbeauty")
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
  },
  helpText: {
    color: 'rgba(255,255,255,0.3)',
    marginTop: 20,
    fontSize: 12,
  }
});
