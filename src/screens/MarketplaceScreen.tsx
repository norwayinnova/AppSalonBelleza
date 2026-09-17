import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAppContext, AppTheme } from '../context/AppContext';

interface SalonItem extends AppTheme {
  id: string;
}

export default function MarketplaceScreen() {
  const { setTenantId } = useAppContext();
  const [salons, setSalons] = useState<SalonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'tenants'));
        const loadedSalons: SalonItem[] = [];
        querySnapshot.forEach((doc) => {
          loadedSalons.push({ id: doc.id, ...(doc.data() as AppTheme) });
        });
        setSalons(loadedSalons);
      } catch (error) {
        console.error('Error fetching salons:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSalons();
  }, []);

  const handleSelectSalon = (id: string) => {
    // Cuando el cliente elige un salón, lo seteamos para entrar a SU entorno
    setTenantId(id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Beauty Marketplace</Text>
        <Text style={styles.headerSub}>Encuentra tu salón ideal</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={salons}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.card, { borderLeftColor: item.primaryColor }]}
              onPress={() => handleSelectSalon(item.id)}
            >
              <View style={styles.logoContainer}>
                {item.logoUrl ? (
                  <Image source={{ uri: item.logoUrl }} style={styles.logo} resizeMode="contain" />
                ) : item.logoPath ? (
                  <Image source={item.logoPath} style={styles.logo} resizeMode="contain" />
                ) : (
                  <View style={[styles.fallbackLogo, { backgroundColor: item.primaryColor }]}>
                    <Text style={styles.fallbackText}>{item.appName?.charAt(0) || 'S'}</Text>
                  </View>
                )}
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.appName}</Text>
                <Text style={styles.actionText}>Ver servicios y reservar ➔</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 60, paddingBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
  headerSub: { fontSize: 14, color: '#7f8c8d', marginTop: 5 },
  list: { padding: 15 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: {width: 0, height: 2}, borderLeftWidth: 5 },
  logoContainer: { width: 60, height: 60, marginRight: 15, borderRadius: 10, overflow: 'hidden', backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  logo: { width: '100%', height: '100%' },
  fallbackLogo: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  fallbackText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  actionText: { fontSize: 13, color: '#3498db', marginTop: 5, fontWeight: 'bold' }
});
