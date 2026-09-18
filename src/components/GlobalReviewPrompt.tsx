import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking } from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAppContext } from '../context/AppContext';

export default function GlobalReviewPrompt() {
  const { firebaseUser, showToast } = useAppContext();
  const [reviewPromptVisible, setReviewPromptVisible] = useState(false);
  const [promptApp, setPromptApp] = useState<any>(null);
  const [salonsInfo, setSalonsInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const q = query(
      collection(db, 'appointments'),
      where('clientId', '==', firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const apps = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const unprompted = apps.find(a => a.status === 'completed' && !a.isReviewed && !a.reviewPromptShown);
      
      if (unprompted) {
        // Fetch salon name if we don't have it
        if (!salonsInfo[unprompted.tenantId]) {
          try {
            const tDoc = await getDoc(doc(db, 'tenants', unprompted.tenantId));
            if (tDoc.exists()) {
              setSalonsInfo(prev => ({ ...prev, [unprompted.tenantId]: tDoc.data().appName || 'el salón' }));
            }
          } catch (e) {
            console.error(e);
          }
        }
        setPromptApp(unprompted);
        setReviewPromptVisible(true);
      } else {
        setReviewPromptVisible(false);
      }
    });

    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  const dismissReviewPrompt = async () => {
    setReviewPromptVisible(false);
    if (promptApp) {
      await updateDoc(doc(db, 'appointments', promptApp.id), { reviewPromptShown: true });
    }
  };

  const acceptReviewPrompt = async () => {
    if (!promptApp) return;
    setReviewPromptVisible(false);
    await updateDoc(doc(db, 'appointments', promptApp.id), { reviewPromptShown: true, isReviewed: true });
    
    try {
      const tDoc = await getDoc(doc(db, 'tenants', promptApp.tenantId));
      if (tDoc.exists() && tDoc.data().publicProfile?.googleProfileUrl) {
        Linking.openURL(tDoc.data().publicProfile.googleProfileUrl);
      } else {
        showToast('Este salón no tiene configurado su perfil de Google.', 'error');
      }
    } catch (e) {
      showToast('Error al abrir el perfil del salón.', 'error');
    }
  };

  return (
    <Modal visible={reviewPromptVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{'\u2728'} ¡Esperamos que te haya gustado!</Text>
          <Text style={styles.modalText}>
            Tu cita en {salonsInfo[promptApp?.tenantId] || 'el salón'} ha finalizado. Apoya a tu profesional dejando una valoración en Google.
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalBtnCancel} onPress={dismissReviewPrompt}>
              <Text style={styles.modalBtnCancelText}>Ahora no</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtnConfirm, { backgroundColor: '#3498db' }]} onPress={acceptReviewPrompt}>
              <Text style={styles.modalBtnConfirmText}>{'\u2B50'} Valorar en Google</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
  modalText: { fontSize: 15, color: '#34495e', marginBottom: 24, lineHeight: 22 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtnCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#ecf0f1' },
  modalBtnCancelText: { color: '#7f8c8d', fontWeight: 'bold' },
  modalBtnConfirm: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalBtnConfirmText: { color: '#fff', fontWeight: 'bold' }
});