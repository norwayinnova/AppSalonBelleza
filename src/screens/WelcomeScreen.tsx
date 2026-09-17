import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAppContext } from '../context/AppContext';

export default function WelcomeScreen() {
  const { setAppMode } = useAppContext();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido!</Text>
      <Text style={styles.subtitle}>¿Qué estás buscando hoy?</Text>

      <TouchableOpacity style={styles.clientBtn} onPress={() => setAppMode('client')}>
        <Text style={styles.btnEmoji}>🔎</Text>
        <View style={styles.btnTexts}>
          <Text style={styles.btnTitle}>Soy Cliente</Text>
          <Text style={styles.btnSubtitle}>Descubrir salones y reservar citas</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.profBtn} onPress={() => setAppMode('professional')}>
        <Text style={styles.btnEmoji}>💼</Text>
        <View style={styles.btnTexts}>
          <Text style={styles.btnTitle}>Soy Profesional</Text>
          <Text style={styles.btnSubtitle}>Acceder a la gestión de mi negocio</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 40 },
  clientBtn: { backgroundColor: '#3498db', padding: 20, borderRadius: 15, width: '100%', maxWidth: 400, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  profBtn: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#3498db', padding: 20, borderRadius: 15, width: '100%', maxWidth: 400, flexDirection: 'row', alignItems: 'center' },
  btnEmoji: { fontSize: 32, marginRight: 20 },
  btnTexts: { flex: 1 },
  btnTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  btnSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }
});
