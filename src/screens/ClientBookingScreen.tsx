import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Linking } from 'react-native';
import { collection, query, onSnapshot, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Calendar } from 'react-native-calendars';

export default function ClientBookingScreen({ navigation }: any) {
  const { role, teamName, tenantId, theme, firebaseUser, showToast } = useAppContext();
  const styles = getStyles(theme);
  const [step, setStep] = useState(1);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [services, setServices] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  
  // Selection
  const [clientName, setClientName] = useState(firebaseUser?.displayName || '');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  // Fidelity
  const [isTenthAppointment, setIsTenthAppointment] = useState(false);

  // Available slots logic
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isCalculatingSlots, setIsCalculatingSlots] = useState(false);

  useEffect(() => {
    // Load services
    const qSrv = query(collection(db, 'services'), where('tenantId', '==', tenantId));
    const unSrv = onSnapshot(qSrv, snap => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setServices(list);
    });

    // Load teams
    const qTeams = query(collection(db, 'teams'), where('tenantId', '==', tenantId));
    const unTeams = onSnapshot(qTeams, snap => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setTeams(list);
      setLoading(false);
    });

    return () => { unSrv(); unTeams(); };
  }, []);

  useEffect(() => {
    if (selectedDate && selectedService && selectedTeam) {
      calculateSlots();
    }
  }, [selectedDate, selectedService, selectedTeam]);

  const calculateSlots = async () => {
    setIsCalculatingSlots(true);
    try {
      const dayOfWeek = new Date(selectedDate).getDay();
      const bh = theme.businessHours || { openTime: '09:00', closeTime: '20:00', closedDays: [] };
      if (bh.closedDays && bh.closedDays.includes(dayOfWeek)) {
        setAvailableSlots([]);
        setIsCalculatingSlots(false);
        return;
      }

      const getMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
      const openMins = getMins(bh.openTime || '09:00');
      const closeMins = getMins(bh.closeTime || '20:00');
      const breakStartMins = bh.breakStart ? getMins(bh.breakStart) : -1;
      const breakEndMins = bh.breakEnd ? getMins(bh.breakEnd) : -1;

      // Get all appointments for that day
      const qApps = query(collection(db, 'appointments'), where('tenantId', '==', tenantId), where('date', '==', selectedDate));
      const snap = await getDocs(qApps);
      
      const allApps: any[] = [];
      snap.forEach(d => allApps.push(d.data()));

      const duration = parseInt(selectedService.duration || '60');
      const allSlots: string[] = [];

      for (let m = openMins; m <= closeMins - duration; m += 30) {
        if (breakStartMins !== -1 && breakEndMins !== -1) {
          const slotEnd = m + duration;
          if (m < breakEndMins && slotEnd > breakStartMins) continue;
        }
        const hStr = Math.floor(m / 60).toString().padStart(2, '0');
        const mStr = (m % 60).toString().padStart(2, '0');
        allSlots.push(`${hStr}:${mStr}`);
      }
      const duration = parseInt(selectedService.duration || '60');

      let teamsToCheck = selectedTeam.id === 'any' 
        ? teams.filter(t => !selectedService?.allowedTeams || selectedService.allowedTeams.includes(t.name)) 
        : [selectedTeam];
      const validSlots = new Set<string>();

      teamsToCheck.forEach(teamObj => {
        const teamApps = allApps.filter(app => (app.team || teams[0]?.name) === teamObj.name && app.status !== 'cancelled');
        
        allSlots.forEach(slot => {
          const slotStart = getMins(slot);
          const slotEnd = slotStart + duration;

          const hasConflict = teamApps.some(app => {
            const appStart = getMins(app.time);
            const appEnd = appStart + parseInt(app.duration || '60');
            const isBloqueo = (app.serviceName && app.serviceName.toLowerCase().includes('bloquead')) || 
                              (app.client && app.client.toLowerCase().includes('bloquead'));

            if (slotStart < appEnd && slotEnd > appStart) {
              if (isBloqueo && slotStart < appStart) return false;
              return true;
            }
            return false;
          });

          if (!hasConflict) {
            validSlots.add(slot);
          }
        });
      });

      const sortedSlots = Array.from(validSlots).sort();
      setAvailableSlots(sortedSlots);
    } catch (e) {
      console.log('Error calculating slots', e);
    } finally {
      setIsCalculatingSlots(false);
    }
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (!clientName.trim() || !clientPhone.trim() || clientPhone.length < 6) {
        showToast('Introduce tu nombre y un teléfono válido.', 'error');
        return;
      }
      try {
        const qFidel = query(collection(db, 'appointments'), where('tenantId', '==', tenantId), where('phone', '==', clientPhone.trim()), where('status', '==', 'completed'));
        const snap = await getDocs(qFidel);
        if (snap.size === 9) setIsTenthAppointment(true);
        else setIsTenthAppointment(false);
      } catch (e) { }
      setStep(2);
    } else if (step === 2) {
      if (!selectedService) { showToast('Por favor, selecciona un servicio.', 'error'); return; }
      setStep(3);
    } else if (step === 3) {
      if (!selectedTeam) { showToast('Por favor, selecciona a un profesional.', 'error'); return; }
      setStep(4);
    }
  };

  const handleBook = () => {
    if (!selectedDate || !selectedTime) {
      showToast('Selecciona fecha y hora.', 'error');
      return;
    }
    const payment = theme.paymentOptions;
    if (payment?.allowBizum) {
      setConfirmMessage('Para confirmar, realiza un Bizum al ' + (payment.bizumPhone || 'teléfono del local') + '. ¿Deseas registrar la cita?');
    } else if (payment?.allowStripe || payment?.allowRedsys || payment?.allowPaypal) {
      setConfirmMessage('Serás redirigido a la pasarela de pago seguro. ¿Deseas continuar?');
    } else {
      setConfirmMessage('Tu cita será confirmada y pagarás en el local. ¿Confirmar?');
    }
    setConfirmModalVisible(true);
  };

  const confirmBookingAndClose = () => {
    setConfirmModalVisible(false);
    saveBooking();
  };

  const saveBooking = async () => {
    try {
      let assignedTeamName = selectedTeam.name;

      if (selectedTeam.id === 'any') {
        const qApps = query(collection(db, 'appointments'), where('tenantId', '==', tenantId), where('date', '==', selectedDate));
        const snap = await getDocs(qApps);
        const allApps: any[] = [];
        snap.forEach(d => allApps.push(d.data()));

        const getMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const slotStart = getMins(selectedTime);
        const duration = parseInt(selectedService.duration || '60');
        const slotEnd = slotStart + duration;

        const availableTeam = teams
          .filter(t => !selectedService?.allowedTeams || selectedService.allowedTeams.includes(t.name))
          .find(teamObj => {
          const teamApps = allApps.filter(app => (app.team || teams[0]?.name) === teamObj.name && app.status !== 'cancelled');
          const hasConflict = teamApps.some(app => {
            const appStart = getMins(app.time);
            const appEnd = appStart + parseInt(app.duration || '60');
            const isBloqueo = (app.serviceName && app.serviceName.toLowerCase().includes('bloquead')) || 
                              (app.client && app.client.toLowerCase().includes('bloquead'));
            if (slotStart < appEnd && slotEnd > appStart) {
              if (isBloqueo && slotStart < appStart) return false;
              return true;
            }
            return false;
          });
          return !hasConflict;
        });

        if (availableTeam) {
          assignedTeamName = availableTeam.name;
        } else {
           throw new Error('No hay equipos disponibles en este horario.');
        }
      }

      let finalNotes = 'Reserva Online - Fianza pagada';
      if (isTenthAppointment) {
        finalNotes += '\n\uD83C\uDF1F 10ª Cita - APLICAR 20% DESCUENTO';
      }

      await addDoc(collection(db, 'appointments'), { 
        tenantId,
        clientId: firebaseUser?.uid || null,
        clientEmail: firebaseUser?.email || null,
        client: clientName.trim(),
        phone: clientPhone.trim(),
        date: selectedDate,
        time: selectedTime,
        serviceName: selectedService.name,
        duration: selectedService.duration || '60',
        price: selectedService.price || '0',
        team: assignedTeamName,
        status: 'pending',
        paymentStatus: 'pending',
        notes: finalNotes
      });

      // ENVIAR EMAIL DE CONFIRMACIÓN VÍA EMAILJS
      try {
        const emailParams = {
          service_id: 'service_ht0jlfj',
          template_id: 'template_uw1kc9n',
          user_id: 'DKeOwyQXqU50Y2lq-',
          template_params: {
            to_email: firebaseUser?.email || '',
            to_name: clientName.trim(),
            salon_name: theme.appName || 'Nuestro Salón',
            service_name: selectedService.name,
            appointment_date: selectedDate,
            appointment_time: selectedTime,
            team_name: assignedTeamName
          }
        };
        // Si el usuario configuró EmailJS, se envía
        if (emailParams.service_id) {
          fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailParams)
          }).catch(err => console.log('EmailJS Error:', err));
        }
      } catch (e) {
        console.log('Error preparando email', e);
      }

      showToast('¡Reserva confirmada con éxito!', 'success');
      
      setStep(1);
      setClientName(firebaseUser?.displayName || '');
      setClientPhone('');
      setSelectedDate('');
      setSelectedTime('');
      setSelectedService(null);
      setSelectedTeam(null);
      setIsTenthAppointment(false);
    } catch (e: any) {
      showToast('Hubo un error al guardar la reserva.', 'error');
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={theme.primaryColor} style={{flex:1, justifyContent:'center'}} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{theme.appName}</Text>
        <Text style={styles.subtitle}>Reserva tu cita online</Text>
      </View>

      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>1. Tus Datos</Text>
          <TextInput style={styles.input} placeholder="Tu Nombre" value={clientName} onChangeText={setClientName} />
          <TextInput style={styles.input} placeholder="Tu Teléfono" value={clientPhone} onChangeText={setClientPhone} keyboardType="phone-pad" />
          <View style={styles.navRow}>
            <View style={{flex:1}}></View>
            <TouchableOpacity style={styles.btnAction} onPress={handleNextStep}><Text style={styles.btnText}>Siguiente \u279C</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>2. ¿Qué necesitas?</Text>
          <View style={styles.grid}>
            {services.map(s => (
              <TouchableOpacity key={s.id} style={[styles.optionCard, selectedService?.id === s.id && styles.optionSelected]} onPress={() => setSelectedService(s)}>
                <Text style={[styles.optionTitle, selectedService?.id === s.id && styles.textSelected]}>{s.name}</Text>
                <Text style={styles.optionSub}>{s.duration} min | {s.price}€</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.btnBack} onPress={() => setStep(1)}><Text style={styles.btnBackText}>\u2190 Volver</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnAction} onPress={handleNextStep}><Text style={styles.btnText}>Siguiente \u279C</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>3. ¿Con quién quieres tu cita?</Text>
          <View style={styles.grid}>
            <TouchableOpacity style={[styles.optionCard, selectedTeam?.id === 'any' && styles.optionSelected]} onPress={() => setSelectedTeam({id: 'any', name: 'Cualquiera'})}>
              <Text style={[styles.optionTitle, selectedTeam?.id === 'any' && styles.textSelected]}>\uD83D\uDC87\u200D\u2640\uFE0F Sin preferencia (Cualquiera)</Text>
            </TouchableOpacity>
            {teams.filter(t => !selectedService?.allowedTeams || selectedService.allowedTeams.includes(t.name)).map(t => (
              <TouchableOpacity key={t.id} style={[styles.optionCard, selectedTeam?.id === t.id && styles.optionSelected]} onPress={() => setSelectedTeam(t)}>
                <Text style={[styles.optionTitle, selectedTeam?.id === t.id && styles.textSelected]}>\uD83D\uDC87\u200D\u2640\uFE0F {t.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.btnBack} onPress={() => setStep(2)}><Text style={styles.btnBackText}>\u2190 Volver</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnAction} onPress={handleNextStep}><Text style={styles.btnText}>Siguiente \u279C</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {step === 4 && (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>4. Elige Fecha y Hora</Text>
          <Calendar
            onDayPress={(day: any) => { setSelectedDate(day.dateString); setSelectedTime(''); }}
            markedDates={{ [selectedDate]: { selected: true, selectedColor: theme.primaryColor } }}
            minDate={new Date().toISOString().split('T')[0]}
            theme={{ todayTextColor: theme.darkTextColor, arrowColor: theme.darkTextColor }}
          />
          
          {selectedDate ? (
            isCalculatingSlots ? (
              <ActivityIndicator size="small" color={theme.primaryColor} style={{marginTop: 20}} />
            ) : availableSlots.length > 0 ? (
              <View style={styles.timeGrid}>
                {availableSlots.map(time => (
                  <TouchableOpacity key={time} style={[styles.timeSlot, selectedTime === time && styles.timeSlotSelected]} onPress={() => setSelectedTime(time)}>
                    <Text style={[styles.timeText, selectedTime === time && styles.timeTextSelected]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.noSlotsText}>
                {theme.businessHours?.closedDays?.includes(new Date(selectedDate).getDay()) 
                  ? 'El establecimiento está cerrado en este día de la semana.' 
                  : 'No hay huecos disponibles este día para la empleada seleccionada.'}
              </Text>
            )
          ) : (
            <Text style={styles.noSlotsText}>Selecciona un día en el calendario.</Text>
          )}

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.btnBack} onPress={() => setStep(3)}><Text style={styles.btnBackText}>\u2190 Volver</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnAction} onPress={handleBook}><Text style={styles.btnText}>Confirmar y Pagar Fianza</Text></TouchableOpacity>
          </View>
        </View>
      )}
      
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirmar Reserva</Text>
            <Text style={styles.modalText}>{confirmMessage}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setConfirmModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnConfirm, { backgroundColor: theme.primaryColor }]} onPress={confirmBookingAndClose}>
                <Text style={styles.modalBtnConfirmText}>Sí, Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function getStyles(theme: any) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f4f7' },
  header: { padding: 30, backgroundColor: theme.primaryColor, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#fff', opacity: 0.9, marginTop: 5 },
  card: { backgroundColor: '#fff', margin: 15, borderRadius: 12, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: {width:0, height:2} },
  stepTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, fontSize: 16, marginBottom: 15, backgroundColor: '#fafafa' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  optionCard: { width: '48%', borderWidth: 1, borderColor: '#eee', padding: 15, borderRadius: 10, marginBottom: 15, alignItems: 'center', backgroundColor: '#fafafa' },
  optionSelected: { borderColor: theme.primaryColor, backgroundColor: '#fdf5f7' },
  optionTitle: { fontWeight: 'bold', color: '#555', textAlign: 'center' },
  optionSub: { fontSize: 12, color: '#888', marginTop: 5 },
  textSelected: { color: theme.primaryColor },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  btnAction: { backgroundColor: theme.primaryColor, paddingVertical: 15, paddingHorizontal: 20, borderRadius: 10, flex: 1, alignItems: 'center', marginLeft: 5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnBack: { backgroundColor: '#eee', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 10, flex: 1, alignItems: 'center', marginRight: 5 },
  btnBackText: { color: '#555', fontSize: 16, fontWeight: 'bold' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginTop: 20 },
  timeSlot: { width: '22%', borderWidth: 1, borderColor: '#2ecc71', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10, marginRight: '3%', backgroundColor: '#fdfdfd' },
  timeSlotSelected: { backgroundColor: '#2ecc71' },
  timeText: { color: '#2ecc71', fontWeight: 'bold', fontSize: 16 },
  timeTextSelected: { color: '#fff' },
  noSlotsText: { textAlign: 'center', marginTop: 20, color: '#888', fontStyle: 'italic' },
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
}