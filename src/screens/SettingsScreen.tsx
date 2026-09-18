import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Switch, Alert } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const PRESET_COLORS = [
  '#D48A9A', '#3498db', '#2ecc71', '#e74c3c', '#9b59b6', 
  '#f1c40f', '#e67e22', '#1abc9c', '#34495e', '#795548', 
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
  const [allowRedsys, setAllowRedsys] = useState(theme.paymentOptions?.allowRedsys ?? false);
  const [redsysFuc, setRedsysFuc] = useState(theme.paymentOptions?.redsysFuc || '');
  const [redsysKey, setRedsysKey] = useState(theme.paymentOptions?.redsysKey || '');
  const [allowPaypal, setAllowPaypal] = useState(theme.paymentOptions?.allowPaypal ?? false);
  const [paypalClientId, setPaypalClientId] = useState(theme.paymentOptions?.paypalClientId || '');

  // Horarios Reales
  const [openTime, setOpenTime] = useState(theme.businessHours?.openTime || '09:00');
  const [closeTime, setCloseTime] = useState(theme.businessHours?.closeTime || '20:00');
  const [breakStart, setBreakStart] = useState(theme.businessHours?.breakStart || '');
  const [breakEnd, setBreakEnd] = useState(theme.businessHours?.breakEnd || '');
  const [closedDays, setClosedDays] = useState<number[]>(theme.businessHours?.closedDays || [0]);

  // Perfil Público
  const [address, setAddress] = useState(theme.publicProfile?.address || '');
  const [contactPhone, setContactPhone] = useState(theme.publicProfile?.contactPhone || '');
  const [googleProfileUrl, setGoogleProfileUrl] = useState(theme.publicProfile?.googleProfileUrl || '');
  const [galleryUrls, setGalleryUrls] = useState<string[]>(theme.publicProfile?.galleryUrls || []);
  const [uploadingGallery, setUploadingGallery] = useState(false);

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
      const fileRef = ref(storage, 'tenants/' + tenantId + '/logo.jpg');
      const uploadTask = uploadBytesResumable(fileRef, blob);
      
      uploadTask.on('state_changed', null, 
        (error) => { showToast('Error al subir', 'error'); setUploading(false); }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setLogoUrl(downloadURL);
          setUploading(false);
          showToast('Logo subido', 'success');
        }
      );
    } catch (e) {
      setUploading(false);
      showToast('Error', 'error');
    }
  };

  const addGalleryImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3, // ULTRA COMPRESION PARA GALERIA
    });
    if (!result.canceled && result.assets[0].uri) {
      setUploadingGallery(true);
      try {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileName = 'gal_' + Date.now() + '.jpg';
        const fileRef = ref(storage, 'tenants/' + tenantId + '/gallery/' + fileName);
        
        const uploadTask = uploadBytesResumable(fileRef, blob);
        
        uploadTask.on('state_changed', null, 
          (error) => { showToast('Error al subir foto', 'error'); setUploadingGallery(false); }, 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setGalleryUrls([...galleryUrls, downloadURL]);
            setUploadingGallery(false);
            showToast('Foto añadida a la galera', 'success');
          }
        );
      } catch (e) {
        setUploadingGallery(false);
        showToast('Error', 'error');
      }
    }
  };

  const removeGalleryImage = (index: number) => {
    Alert.alert('Eliminar foto', '¿Seguro que deseas quitar esta foto de tu escaparate?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
          const newG = [...galleryUrls];
          newG.splice(index, 1);
          setGalleryUrls(newG);
        }
      }
    ]);
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
        appName, primaryColor, secondaryColor, darkTextColor,
        paymentOptions: { allowInStore, allowBizum, bizumPhone, allowStripe, stripePublicKey, allowRedsys, redsysFuc, redsysKey, allowPaypal, paypalClientId },
        publicProfile: {
          address,
          contactPhone,
          googleProfileUrl,
          galleryUrls
        },
        businessHours: {
          openTime,
          closeTime,
          breakStart,
          breakEnd,
          closedDays
        }
      };
      if (logoUrl) updates.logoUrl = logoUrl;

      await updateDoc(tenantRef, updates);
      showToast('Ajustes guardados con xito', 'success');
    } catch (e) {
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.backgroundColor || '#f5f7fa' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.darkTextColor }]}>Ajustes de mi Salón</Text>
        <Text style={styles.subtitle}>Personaliza tu escaparate en el Marketplace</Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.primaryColor }]}>Identidad Visual</Text>
        <View style={styles.logoSection}>
          <View style={styles.logoPreview}>
            {logoUrl ? <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" />
            : theme.logoPath ? <Image source={theme.logoPath} style={styles.logoImage} resizeMode="contain" />
            : <Text style={styles.noLogoText}>Sin logo</Text>}
          </View>
          <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: theme.primaryColor }]} onPress={pickImage} disabled={uploading}>
            {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadBtnText}>Cambiar Logotipo</Text>}
          </TouchableOpacity>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del Salón</Text>
          <TextInput style={[styles.input, { borderColor: theme.secondaryColor }]} value={appName} onChangeText={setAppName} placeholder="Ej: BeautyTime" />
        </View>
      </View>

      {/* INFORMACION PUBLICA */}
      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.primaryColor }]}>Información Pública</Text>
        <Text style={styles.helpTextDesc}>Estos datos serán visibles para los clientes en el Marketplace.</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dirección del Local</Text>
          <TextInput style={[styles.input, { borderColor: theme.secondaryColor }]} value={address} onChangeText={setAddress} placeholder="Ej: Calle Mayor 12, Madrid" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Teléfono Público de Contacto</Text>
          <TextInput style={[styles.input, { borderColor: theme.secondaryColor }]} value={contactPhone} onChangeText={setContactPhone} placeholder="Ej: 910000000" keyboardType="phone-pad" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Enlace a Reseñas de Google (Opcional)</Text>
          <TextInput style={[styles.input, { borderColor: theme.secondaryColor }]} value={googleProfileUrl} onChangeText={setGoogleProfileUrl} placeholder="https://g.page/..." />
        </View>
      </View>

      {/* GALERIA */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: theme.primaryColor, marginBottom: 0 }]}>Galería de Trabajos</Text>
          <TouchableOpacity style={[styles.addPhotoBtn, { backgroundColor: theme.primaryColor }]} onPress={addGalleryImage} disabled={uploadingGallery}>
            {uploadingGallery ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addPhotoText}>+ Subir Foto</Text>}
          </TouchableOpacity>
        </View>
        <Text style={styles.helpTextDesc}>Sube fotos de tu local o de tus mejores trabajos. Se comprimirán automáticamente.</Text>
        
        <View style={styles.galleryGrid}>
          {galleryUrls.map((uri, idx) => (
            <TouchableOpacity key={idx} style={styles.galleryItem} onLongPress={() => removeGalleryImage(idx)}>
              <Image source={{uri}} style={styles.galleryImg} />
              <View style={styles.deleteOverlay}><Text style={{color:'#fff', fontSize:10}}>Manten pulsado para borrar</Text></View>
            </TouchableOpacity>
          ))}
          {galleryUrls.length === 0 && !uploadingGallery && (
            <Text style={styles.noPhotosText}>Aún no has subido ninguna foto.</Text>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.primaryColor }]}>Colores Corporativos</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Color Primario</Text>
          <View style={styles.paletteContainer}>
            {PRESET_COLORS.map(color => (
              <TouchableOpacity key={color} style={[styles.paletteCircle, { backgroundColor: color }, primaryColor === color && styles.paletteCircleSelected]} onPress={() => setPrimaryColor(color)} />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.primaryColor }]}>Métodos de Cobro</Text>
        <View style={styles.switchRow}>
          <View style={{flex: 1}}><Text style={styles.label}>Pago en Local (Efectivo/TPV)</Text></View>
          <Switch value={allowInStore} onValueChange={setAllowInStore} trackColor={{ true: theme.primaryColor }} />
        </View>
        <View style={styles.switchRow}>
          <View style={{flex: 1}}><Text style={styles.label}>Pago por Bizum</Text></View>
          <Switch value={allowBizum} onValueChange={setAllowBizum} trackColor={{ true: theme.primaryColor }} />
        </View>
        {allowBizum && (
          <View style={[styles.inputGroup, { marginTop: 5, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: theme.secondaryColor }]}>
            <Text style={styles.label}>Teléfono Bizum</Text>
            <TextInput style={[styles.input, { borderColor: theme.secondaryColor }]} value={bizumPhone} onChangeText={setBizumPhone} keyboardType="phone-pad" />
          </View>
        )}
        <View style={styles.switchRow}>
          <View style={{flex: 1}}><Text style={styles.label}>Pago con Tarjeta (Stripe)</Text></View>
          <Switch value={allowStripe} onValueChange={setAllowStripe} trackColor={{ true: theme.primaryColor }} />
        </View>
        {allowStripe && (
          <View style={[styles.inputGroup, { marginTop: 5, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: theme.secondaryColor }]}>
            <Text style={styles.label}>Clave Stripe</Text>
            <TextInput style={[styles.input, { borderColor: theme.secondaryColor }]} value={stripePublicKey} onChangeText={setStripePublicKey} secureTextEntry />
          </View>
        )}
        <View style={styles.switchRow}>
          <View style={{flex: 1}}><Text style={styles.label}>Pago con Tarjeta (Redsys)</Text></View>
          <Switch value={allowRedsys} onValueChange={setAllowRedsys} trackColor={{ true: theme.primaryColor }} />
        </View>
        {allowRedsys && (
          <View style={[styles.inputGroup, { marginTop: 5, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: theme.secondaryColor }]}>
            <Text style={styles.label}>Código FUC</Text>
            <TextInput style={[styles.input, { borderColor: theme.secondaryColor, marginBottom: 10 }]} value={redsysFuc} onChangeText={setRedsysFuc} />
            <Text style={styles.label}>Clave Secreta</Text>
            <TextInput style={[styles.input, { borderColor: theme.secondaryColor }]} value={redsysKey} onChangeText={setRedsysKey} secureTextEntry />
          </View>
        )}
        <View style={styles.switchRow}>
          <View style={{flex: 1}}><Text style={styles.label}>Pago con PayPal</Text></View>
          <Switch value={allowPaypal} onValueChange={setAllowPaypal} trackColor={{ true: theme.primaryColor }} />
        </View>
        {allowPaypal && (
          <View style={[styles.inputGroup, { marginTop: 5, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: theme.secondaryColor }]}>
            <Text style={styles.label}>Client ID</Text>
            <TextInput style={[styles.input, { borderColor: theme.secondaryColor }]} value={paypalClientId} onChangeText={setPaypalClientId} secureTextEntry />
          </View>
        )}
      </View>

      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primaryColor }]} onPress={saveSettings} disabled={saving}>
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
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  helpTextDesc: { color: '#888', fontSize: 12, marginBottom: 15 },
  logoSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 15 },
  logoPreview: { width: 120, height: 60, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  logoImage: { width: '100%', height: '100%' },
  noLogoText: { color: '#aaa', fontSize: 12 },
  uploadBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 },
  uploadBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  addPhotoBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addPhotoText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  galleryItem: { width: '31%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  galleryImg: { width: '100%', height: '100%' },
  deleteOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, alignItems: 'center' },
  noPhotosText: { color: '#ccc', fontStyle: 'italic', padding: 10 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#fafafa' },
  paletteContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }, 
  paletteCircle: { width: 40, height: 40, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: {width: 0, height: 1} }, 
  paletteCircleSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.1 }] },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  helpText: { color: '#888', fontSize: 11, marginTop: 2, paddingRight: 20 },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 30, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width: 0, height: 2} },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});