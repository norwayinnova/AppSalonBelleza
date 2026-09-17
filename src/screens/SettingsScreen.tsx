import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Switch } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const PRESET_COLORS = [
  '#D48A9A', 
  '#3498db', 
  '#2ecc71', 
  '#e74c3c', 
  '#9b59b6', 
  '#f1c40f', 
  '#e67e22', 
  '#1abc9c', 
  '#34495e', 
  '#795548', 
];

export default function SettingsScreen() {
  const { tenantId, theme, showToast } = useAppContext();
  
  const [appName, setAppName] = useState(theme.appName);
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(theme.secondaryColor || '#ecf0f1');
  const [darkTextColor, setDarkTextColor] = useState(theme.darkTextColor || '#2c3e50');
  
  const [logoUrl, setLogoUrl] = useState(theme.logoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagos
  const [allowInStore, setAllowInStore] = useState(theme.paymentOptions?.allowInStore ?? true);
  const [allowBizum, setAllowBizum] = useState(theme.paymentOptions?.allowBizum ?? false);
  const [bizumPhone, setBizumPhone] = useState(theme.paymentOptions?.bizumPhone || '');
  const [allowStripe, setAllowStripe] = useState(theme.paymentOptions?.allowStripe ?? false);
  const [stripePublicKey, setStripePublicKey] = useState(theme.paymentOptions?.stripePublicKey || '');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      await uploadLogo(result.assets[0].uri);
    }
  };

  const uploadLogo = async (uri: string) => {
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileRef = ref(storage, \	enants/\/logo.jpg\);
      
      const uploadTask = uploadBytesResumable(fileRef, blob);
      
      uploadTask.on('state_changed', 
        (snapshot) => {}, 
        (error) => {
          console.error(error);
          showToast('Error al subir el logo', 'error');
          setUploading(false);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setLogoUrl(downloadURL);
          setUploading(false);
          showToast('Logo subido. Recuerda guardar.', 'info');
        }
      );
    } catch (e) {
      console.error(e);
      setUploading(false);
      showToast('Error al procesar la imagen', 'error');
    }
  };

  const saveSettings = async () => {
    if (!appName.trim() || !primaryColor.trim()) {
      showToast('Nombre y color primario son obligatorios', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const tenantRef = doc(db, 'tenants', tenantId);
      const updates: any = {
        appName,
        primaryColor,
        secondaryColor,
        darkTextColor,
        paymentOptions: {
          allowInStore,
          allowBizum,
          bizumPhone,
          allowStripe,
          stripePublicKey
        }
      };
      if (logoUrl) {
        updates.logoUrl = logoUrl;
      }

      await updateDoc(tenantRef, updates);
      showToast('Ajustes guardados con éxito', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error al guardar los ajustes', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.backgroundColor || '#f5f7fa' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.darkTextColor }]}>Ajustes de mi Salón</Text>
        <Text style={styles.subtitle}>Personaliza tu aplicación en tiempo real</Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.primaryColor }]}>Identidad Visual</Text>
        
        <View style={styles.logoSection}>
          <View style={styles.logoPreview}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" />
            ) : theme.logoPath ? (
              <Image source={theme.logoPath} style={styles.logoImage} resizeMode="contain" />
            ) : (
              <Text style={styles.noLogoText}>Sin logo</Text>
            )}
          </View>
          <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: theme.primaryColor }]} onPress={pickImage} disabled={uploading}>
            {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadBtnText}>Cambiar Logotipo</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del Salón</Text>
          <TextInput 
            style={[styles.input, { borderColor: theme.secondaryColor }]} 
            value={appName}
            onChangeText={setAppName}
            placeholder="Ej: BeautyTime"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.primaryColor }]}>Colores Corporativos</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Color Primario</Text>
          <View style={styles.paletteContainer}>
            {PRESET_COLORS.map(color => (
              <TouchableOpacity 
                key={color}
                style={[
                  styles.paletteCircle, 
                  { backgroundColor: color },
                  primaryColor === color && styles.paletteCircleSelected
                ]}
                onPress={() => setPrimaryColor(color)}
              />
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Color Texto Oscuro (Acentos)</Text>
          <View style={styles.paletteContainer}>
            {['#2c3e50', '#7A4B56', '#222222', '#555555', '#4A2311', '#1A365D'].map(color => (
              <TouchableOpacity 
                key={color}
                style={[
                  styles.paletteCircle, 
                  { backgroundColor: color },
                  darkTextColor === color && styles.paletteCircleSelected
                ]}
                onPress={() => setDarkTextColor(color)}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.primaryColor }]}>Métodos de Cobro</Text>
        
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>Pago en Local (Efectivo/TPV)</Text>
            <Text style={styles.helpText}>El cliente paga al terminar el servicio</Text>
          </View>
          <Switch 
            value={allowInStore} 
            onValueChange={setAllowInStore}
            trackColor={{ true: theme.primaryColor }}
          />
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>Pago por Bizum</Text>
            <Text style={styles.helpText}>Cobro manual mediante Bizum</Text>
          </View>
          <Switch 
            value={allowBizum} 
            onValueChange={setAllowBizum}
            trackColor={{ true: theme.primaryColor }}
          />
        </View>
        
        {allowBizum && (
          <View style={[styles.inputGroup, { marginTop: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: theme.secondaryColor }]}>
            <Text style={styles.label}>Teléfono para recibir Bizum</Text>
            <TextInput 
              style={[styles.input, { borderColor: theme.secondaryColor }]} 
              value={bizumPhone}
              onChangeText={setBizumPhone}
              placeholder="Ej: 600123456"
              keyboardType="phone-pad"
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>Pago con Tarjeta (Stripe)</Text>
            <Text style={styles.helpText}>Pasarela automática</Text>
          </View>
          <Switch 
            value={allowStripe} 
            onValueChange={setAllowStripe}
            trackColor={{ true: theme.primaryColor }}
          />
        </View>

        {allowStripe && (
          <View style={[styles.inputGroup, { marginTop: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: theme.secondaryColor }]}>
            <Text style={styles.label}>Clave Pública de Stripe (API Key)</Text>
            <TextInput 
              style={[styles.input, { borderColor: theme.secondaryColor }]} 
              value={stripePublicKey}
              onChangeText={setStripePublicKey}
              placeholder="pk_test_..."
              secureTextEntry
            />
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.saveBtn, { backgroundColor: theme.primaryColor }]} 
        onPress={saveSettings}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Guardar y Aplicar</Text>}
      </TouchableOpacity>
      
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 5 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: {width: 0, height: 2} },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  logoSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 15 },
  logoPreview: { width: 120, height: 60, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  logoImage: { width: '100%', height: '100%' },
  noLogoText: { color: '#aaa', fontSize: 12 },
  uploadBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 },
  uploadBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#fafafa' },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorInput: { flex: 1 },
  paletteContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }, 
  paletteCircle: { width: 40, height: 40, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: {width: 0, height: 1} }, 
  paletteCircleSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.1 }] },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  helpText: { color: '#888', fontSize: 11, marginTop: 2 },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 30, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width: 0, height: 2} },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
