import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator, Linking } from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAppContext } from '../context/AppContext';

export default function ClientAppointmentsScreen() {
  const { firebaseUser, theme, showToast } = useAppContext();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salonsInfo, setSalonsInfo] = useState<Record<string, string>>({});
  
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const q = query(
      collection(db, 'appointments'),
      where('clientId', '==', firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const apps = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      apps.sort((a, b) => {
        const dA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dA.getTime() - dB.getTime();
      });

      setAppointments(apps);

      const missingTenants = [...new Set(apps.map(a => a.tenantId).filter(id => !salonsInfo[id]))];
      if (missingTenants.length > 0) {
        const newSalons = { ...salonsInfo };
        for (const tid of missingTenants) {
          try {
            const tDoc = await getDoc(doc(db, 'tenants', tid));
            if (tDoc.exists()) {
              newSalons[tid] = tDoc.data().appName || tid;
            } else {
              newSalons[tid] = 'Salón Desconocido';
            }
          } catch (e) {
            newSalons[tid] = tid;
          }
        }
        setSalonsInfo(newSalons);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  const confirmCancel = () => {
    if (!appointmentToCancel) return;
    updateDoc(doc(db, 'appointments', appointmentToCancel), {
      status: 'cancelled',
      notes: 'Cancelada por el cliente'
    })
    .then(() => {
      showToast('Cita cancelada correctamente', 'success');
      setCancelModalVisible(false);
      setAppointmentToCancel(null);
    })
    .catch(err => {
      showToast('Error al cancelar la cita', 'error');
      setCancelModalVisible(false);
    });
  };

  const handleCancel = (appId: string) => {
    setAppointmentToCancel(appId);
    setCancelModalVisible(true);
  };

  const leaveGoogleReview = async (app: any) => {
    try {
      const tenantSnap = await getDoc(doc(db, 'tenants', app.tenantId));
      if (tenantSnap.exists()) {
        const data = tenantSnap.data();
        const url = data.publicProfile?.googleProfileUrl;
        
        if (url) {
          // Open the Google Review URL
          Linking.openURL(url).catch(() => showToast('No se pudo abrir el enlace', 'error'));
          
          // Mark as reviewed in our DB so the button disappears
          await updateDoc(doc(db, 'appointments', app.id), {
            isReviewed: true
          });
        } else {
          showToast('Este salón no tiene configurado su perfil de Google.', 'error');
        }
      }
    } catch (error) {
      showToast('Error al procesar la solicitud', 'error');
    }
  };

  const now = new Date();
  
  const upcoming = appointments.filter(a => {
    if (a.status === 'cancelled' || a.status === 'completed') return false;
    const appDate = new Date(`${a.date}T${a.time || '23:59'}`);
    return appDate >= now;
  });

  const past = appointments.filter(a => {
    if (a.status === 'cancelled' || a.status === 'completed') return true;
    const appDate = new Date(`${a.date}T${a.time || '23:59'}`);
    return appDate < now;
  });

  const renderItem = ({ item, isPast }: { item: any, isPast: boolean }) => {
    const isCancelled = item.status === 'cancelled';
    const isCompleted = item.status === 'completed';
    const isEffectivelyPast = isPast || isCompleted;
    
    return (
      <View style={[styles.card, isEffectivelyPast && styles.cardPast, isCancelled && styles.cardCancelled]}>
        <View style={styles.cardHeader}>
          <Text style={styles.salonName}>{salonsInfo[item.tenantId] || 'Cargando salón...'}</Text>
          <Text style={[styles.statusBadge, isCancelled && styles.statusCancelled]}>
            {isCancelled ? 'Cancelada' : isPast ? 'Completada' : 'Confirmada'}
          </Text>
        </View>
        
        <Text style={styles.serviceText}>{item.serviceName}</Text>
        <Text style={styles.detailsText}>{'\uD83D\uDCC5'} {item.date} a las {item.time}</Text>
        <Text style={styles.detailsText}>{'\uD83D\uDC87\u200D\u2640\uFE0F'} Con {item.team}</Text>
        <Text style={styles.detailsText}>{'\uD83D\uDCB6'} {item.price}€ ({item.duration} min)</Text>

        {!isPast && !isCancelled && (
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={() => handleCancel(item.id)}
          >
            <Text style={styles.cancelBtnText}>Cancelar Cita</Text>
          </TouchableOpacity>
        )}

        {isPast && !isCancelled && !item.isReviewed && (
          <TouchableOpacity 
            style={styles.reviewBtn} 
            onPress={() => leaveGoogleReview(item)}
          >
            <Text style={styles.reviewBtnText}>{'\u2B50'} Dejar Reseña en Google</Text>
          </TouchableOpacity>
        )}

        {isPast && item.isReviewed && (
          <View style={styles.reviewedBadge}>
            <Text style={styles.reviewedBadgeText}>{'\u2713'} Reseña enviada a Google</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Citas</Text>
      
      {appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Aún no tienes citas</Text>
          <Text style={styles.emptySub}>Explora el directorio y reserva tu primera cita.</Text>
        </View>
      ) : (
        <FlatList
          data={[{ type: 'header', title: 'Próximas Citas' }, ...upcoming, { type: 'header', title: 'Historial' }, ...past]}
          keyExtractor={(item, index) => item.id || `header-${index}`}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return <Text style={styles.sectionTitle}>{item.title}</Text>;
            }
            const isPast = past.some(p => p.id === item.id);
            return renderItem({ item, isPast });
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
      
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Cancelar Cita</Text>
            <Text style={styles.modalText}>¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setCancelModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={confirmCancel}>
                <Text style={styles.modalBtnConfirmText}>Sí, Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#34495e', marginTop: 20, marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardPast: { borderLeftColor: '#95a5a6', opacity: 0.8 },
  cardCancelled: { borderLeftColor: '#e74c3c', opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  salonName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  statusBadge: { fontSize: 12, fontWeight: 'bold', color: '#2ecc71', backgroundColor: '#e8f8f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusCancelled: { color: '#e74c3c', backgroundColor: '#fdedec' },
  serviceText: { fontSize: 15, color: '#34495e', fontWeight: '600', marginBottom: 8 },
  detailsText: { fontSize: 14, color: '#7f8c8d', marginBottom: 4 },
  cancelBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#fdedec',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fadbd8'
  },
  cancelBtnText: { color: '#e74c3c', fontWeight: 'bold', fontSize: 13 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#34495e', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#7f8c8d', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
  modalText: { fontSize: 15, color: '#34495e', marginBottom: 24, lineHeight: 22 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtnCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#ecf0f1' },
  modalBtnCancelText: { color: '#7f8c8d', fontWeight: 'bold' },
  modalBtnConfirm: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#e74c3c' },
  modalBtnConfirmText: { color: '#fff', fontWeight: 'bold' },

  reviewBtn: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#e8f4fd', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#d1e8fa' },
  reviewBtnText: { color: '#3498db', fontWeight: 'bold', fontSize: 13 },
  reviewedBadge: { marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8 },
  reviewedBadgeText: { color: '#2ecc71', fontWeight: 'bold', fontSize: 13 }
});