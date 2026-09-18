import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAppContext } from '../context/AppContext';

interface Props {
  mode: 'client' | 'professional';
}

export default function AuthScreen({ mode }: Props) {
  const { showToast, setTenantId, setAppMode, loginAsAdmin, loginAsClient } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [salonCode, setSalonCode] = useState('');
  const [isNewSalon, setIsNewSalon] = useState(false);
  const [newSalonName, setNewSalonName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/email-already-in-use': return 'Este email ya tiene una cuenta. Inicia sesion.';
      case 'auth/invalid-email': return 'El email no es valido.';
      case 'auth/weak-password': return 'La contrasena debe tener al menos 6 caracteres.';
      case 'auth/user-not-found': return 'No existe cuenta con este email.';
      case 'auth/wrong-password': return 'Contrasena incorrecta.';
      case 'auth/invalid-credential': return 'Email o contrasena incorrectos.';
      default: return code || 'Error desconocido. Inténtalo de nuevo.';
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos.');
      return;
    }
    if (!isLogin && !name.trim()) {
      setError('Introduce tu nombre.');
      return;
    }
    if (!isLogin && mode === 'professional') {
      if (!isNewSalon && !salonCode.trim()) {
        setError('Introduce el código de tu salón.');
        return;
      }
      if (isNewSalon && !newSalonName.trim()) {
        setError('Introduce el nombre de tu salón.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // LOGIN
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        // Profile loaded automatically in AppContext via onAuthStateChanged
      } else {
        // REGISTER
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });

        if (mode === 'professional') {
          if (isNewSalon) {
            const generatedCode = newSalonName.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
            
            const newTheme = {
              appName: newSalonName.trim(),
              primaryColor: '#3498db',
              secondaryColor: '#ecf0f1',
              darkTextColor: '#2c3e50',
              businessHours: { openTime: '09:00', closeTime: '20:00', closedDays: [0] }
            };
            await setDoc(doc(db, 'tenants', generatedCode), newTheme);

            await setDoc(doc(db, 'users', cred.user.uid), {
              email: email.trim(),
              displayName: name.trim(),
              tenantId: generatedCode,
              role: 'admin',
              createdAt: new Date().toISOString()
            });

            await setDoc(doc(db, 'admin', generatedCode), { pinEnabled: false, pin: '1234' });

            // Inyectar datos iniciales para que la agenda no esté vacía
            const { collection, addDoc } = require('firebase/firestore');
            await addDoc(collection(db, 'teams'), { tenantId: generatedCode, name: 'Equipo 1', role: 'stylist' });
            await addDoc(collection(db, 'services'), { tenantId: generatedCode, name: 'Corte Básico', duration: '30', price: '15' });

            setTenantId(generatedCode);
            loginAsAdmin();
          } else {
            const code = salonCode.trim().toLowerCase();
            const tenantSnap = await getDoc(doc(db, 'tenants', code));
            if (!tenantSnap.exists()) {
              setError('El codigo de salon no existe. Contacta con tu administrador.');
              setLoading(false);
              return;
            }
            await setDoc(doc(db, 'users', cred.user.uid), {
              email: email.trim(),
              displayName: name.trim(),
              tenantId: code,
              role: 'team',
              createdAt: new Date().toISOString()
            });
          }
        } else {
          // Client account
          await setDoc(doc(db, 'users', cred.user.uid), {
            email: email.trim(),
            displayName: name.trim(),
            role: 'client',
            createdAt: new Date().toISOString()
          });
        }
      }
      showToast(isLogin ? 'Bienvenido!' : 'Cuenta creada con exito!', 'success');
    } catch (e: any) {
      setError(getErrorMessage(e.code));
    } finally {
      setLoading(false);
    }
  };

  const isPro = mode === 'professional';
  const accentColor = isPro ? '#3498db' : '#D48A9A';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={[styles.title, { color: accentColor }]}>
            {isPro ? 'Acceso Profesional' : 'Acceso Cliente'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? (isPro ? 'Inicia sesion con tu cuenta del salon' : 'Inicia sesion para gestionar tus citas')
              : (isPro ? 'Crea tu cuenta de empleado' : 'Crea tu cuenta gratuita')}
          </Text>

          {!isLogin && (
            <View style={styles.field}>
              <Text style={styles.label}>Nombre completo</Text>
              <TextInput
                style={[styles.input, { borderColor: accentColor }]}
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, { borderColor: accentColor }]}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contrasena</Text>
            <TextInput
              style={[styles.input, { borderColor: accentColor }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Minimo 6 caracteres"
              secureTextEntry
            />
          </View>

          {!isLogin && isPro && (
            <>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 5}}>
                <TouchableOpacity onPress={() => setIsNewSalon(false)} style={{flex: 1, alignItems: 'center', paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: !isNewSalon ? accentColor : '#eee'}}>
                  <Text style={{fontWeight: 'bold', color: !isNewSalon ? accentColor : '#999'}}>Soy Empleado</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsNewSalon(true)} style={{flex: 1, alignItems: 'center', paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: isNewSalon ? accentColor : '#eee'}}>
                  <Text style={{fontWeight: 'bold', color: isNewSalon ? accentColor : '#999'}}>Crear mi Salón</Text>
                </TouchableOpacity>
              </View>

              {!isNewSalon ? (
                <View style={styles.field}>
                  <Text style={styles.label}>Código del Salón</Text>
                  <TextInput
                    style={[styles.input, { borderColor: accentColor }]}
                    value={salonCode}
                    onChangeText={setSalonCode}
                    placeholder="Ej: avalon_mystic"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.hint}>Tu administrador te lo facilita</Text>
                </View>
              ) : (
                <View style={styles.field}>
                  <Text style={styles.label}>Nombre de tu Salón</Text>
                  <TextInput
                    style={[styles.input, { borderColor: accentColor }]}
                    value={newSalonName}
                    onChangeText={setNewSalonName}
                    placeholder="Ej: InnovaNor Peluquería"
                    autoCapitalize="words"
                  />
                  <Text style={styles.hint}>Crearemos un espacio dedicado para ti.</Text>
                </View>
              )}
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: accentColor }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{isLogin ? 'Iniciar Sesion' : 'Crear Cuenta'}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setError(''); }} style={styles.toggle}>
            <Text style={styles.toggleText}>
              {isLogin ? 'No tienes cuenta? Registrate' : 'Ya tienes cuenta? Inicia sesion'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setAppMode(null)} style={styles.back}>
            <Text style={styles.backText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)'
  },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: 24, fontSize: 13 },
  field: { marginBottom: 16 },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderRadius: 10,
    padding: 13, color: '#fff', fontSize: 15
  },
  hint: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 4 },
  error: { color: '#e74c3c', textAlign: 'center', marginBottom: 12, fontWeight: 'bold', fontSize: 13 },
  btn: { padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  toggle: { padding: 14, alignItems: 'center' },
  toggleText: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  back: { padding: 10, alignItems: 'center' },
  backText: { color: 'rgba(255,255,255,0.3)', fontSize: 12 }
});