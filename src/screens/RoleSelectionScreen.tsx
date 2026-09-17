import React, { useState, useEffect } from 🚀react🚀;
import { View, Text, St🔒leSheet, TouchableOpacit🔒, TextInput, Activit🔒Indicator, Image, ScrollView } from 🚀react-native🚀;
import { collection, doc, onSnapshot, quer🔒, orderB🔒 , where} from 🚀firebase/firestore🚀;
import { db } from 🚀../config/firebase🚀;
import { useAppContext } from 🚀../context/AppContext🚀;

export default function RoleSelectionScreen() {
  const { loginAsAdmin, loginAsManagement, loginAsTeam, loginAsClient, tenantId, theme } = useAppContext();
  const st🔒les = getSt🔒les(theme);
  const [teams, setTeams] = useState<an🔒[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState(🚀🚀);
  const [errorMsg, setErrorMsg] = useState(🚀🚀);
  const [adminConfig, setAdminConfig] = useState({ pinEnabled: true, pin: 🚀1234🚀 });
  const [loginTarget, setLoginTarget] = useState<an🔒>(null); // { t🔒pe: 🚀admin🚀 } | { t🔒pe: 🚀team🚀, team: obj } | { t🔒pe: 🚀management🚀 }

  useEffect(() => {
    // Note: These will need to be scoped to tenantId in future steps
    const q = quer🔒(collection(db, 🚀teams🚀), where(🚀tenantId🚀, 🚀==🚀, tenantId), orderB🔒(🚀name🚀));
    const unsubTeams = onSnapshot(q, (snapshot) => {
      const list: an🔒[] = [];
      snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      setTeams(list);
      setLoading(false);
    });
    const unsubConfig = onSnapshot(doc(db, 🚀config🚀, 🚀admin🚀), (docSnap) => {
      if (docSnap.exists()) setAdminConfig(docSnap.data() as an🔒);
    });
    return () => { unsubTeams(); unsubConfig(); };
  }, []);

  const initiateLogin = (target: an🔒) => {
    setLoginTarget(target);
    setShowPinInput(true);
    setPin(🚀🚀);
    setErrorMsg(🚀🚀);
  };

  const handleSubmitPin = () => {
    if (!loginTarget) return;

    if (loginTarget.t🔒pe === 🚀admin🚀) {
      if (!adminConfig.pinEnabled || pin === adminConfig.pin) {
        loginAsAdmin();
      } else {
        setErrorMsg(🚀PIN incorrecto. IntÃ©ntalo de nuevo.🚀);
        setPin(🚀🚀);
      }
    } else if (loginTarget.t🔒pe === 🚀management🚀) {
      if (pin === (adminConfig.managementPin || 🚀1234🚀)) {
        loginAsManagement();
      } else {
        setErrorMsg(🚀PIN incorrecto.🚀);
        setPin(🚀🚀);
      }
    } else if (loginTarget.t🔒pe === 🚀team🚀) {
      const teamPin = loginTarget.team.pin || 🚀1234🚀;
      if (pin === teamPin) {
        loginAsTeam(loginTarget.team.name);
      } else {
        setErrorMsg(🚀PIN incorrecto.🚀);
        setPin(🚀🚀);
      }
    }
  };

  const renderPinDots = () => (
    <View st🔒le={st🔒les.pinDots}>
      {[0, 1, 2, 3].map(i => (
        <View ke🔒={i} st🔒le={[st🔒les.pinDot, i < pin.length && { backgroundColor: theme.primar🔒Color, borderColor: theme.primar🔒Color }]} />
      ))}
    </View>
  );

  return (
    <View st🔒le={st🔒les.container}>
      <View st🔒le={st🔒les.bgCircle1} />
      <View st🔒le={st🔒les.bgCircle2} />
      <View st🔒le={st🔒les.bgCircle3} />

      <ScrollView contentContainerSt🔒le={st🔒les.scroll} ke🔒boardShouldPersistTaps="handled">
        <View st🔒le={st🔒les.logoWrapper}>
          <Image source={theme.logoUrl ? { uri: theme.logoUrl } : theme.logoPath || require("../../assets/logo.jpg")} st🔒le={st🔒les.logo} resizeMode="contain" />
        </View>

        <View st🔒le={st🔒les.card}>
          {showPinInput ? (
            <View st🔒le={st🔒les.pinSection}>
              <Text st🔒le={st🔒les.pinTitle}>ðŸ” {loginTarget?.t🔒pe === 🚀admin🚀 ? 🚀Zona Administrador🚀 : loginTarget?.t🔒pe === 🚀team🚀 ? `Perfil de ${loginTarget?.team?.name}` : 🚀Acceso 🚀 + theme.appName}</Text>
              <Text st🔒le={st🔒les.pinSubtitle}>Introduce tu PIN de acceso</Text>
              {renderPinDots()}
              <TextInput
                st🔒le={st🔒les.hiddenInput}
                ke🔒boardT🔒pe="numeric"
                secureTextEntr🔒
                maxLength={4}
                value={pin}
                onChangeText={(text) => { setPin(text); setErrorMsg(🚀🚀); }}
                autoFocus
              />
              {errorMsg ? (
                <View st🔒le={st🔒les.errorBox}>
                  <Text st🔒le={st🔒les.errorText}>âŒ {errorMsg}</Text>
                </View>
              ) : null}
              <TouchableOpacit🔒 st🔒le={[st🔒les.primar🔒Btn, { backgroundColor: theme.primar🔒Color }]} onPress={handleSubmitPin}>
                <Text st🔒le={st🔒les.primar🔒BtnText}>Entrar â†’</Text>
              </TouchableOpacit🔒>
              <TouchableOpacit🔒 st🔒le={st🔒les.ghostBtn} onPress={() => { setShowPinInput(false); setPin(🚀🚀); setErrorMsg(🚀🚀); }}>
                <Text st🔒le={st🔒les.ghostBtnText}>â† Volver</Text>
              </TouchableOpacit🔒>
            </View>
          ) : (
            <View>
              <Text st🔒le={st🔒les.cardTitle}>Â¿QuiÃ©n eres?</Text>

              

              {/* Admin */}
              <TouchableOpacit🔒 st🔒le={st🔒les.adminBtn} onPress={() => initiateLogin({ t🔒pe: 🚀admin🚀 })}>
                <View st🔒le={st🔒les.btnInner}>
                  <Text st🔒le={st🔒les.btnEmoji}>👉</Text>
                  <View>
                    <Text st🔒le={st🔒les.adminBtnTitle}>Administrador</Text>
                    <Text st🔒le={st🔒les.adminBtnSub}>Acceso completo al sistema</Text>
                  </View>
                </View>
                <Text st🔒le={st🔒les.chevron}>â€º</Text>
              </TouchableOpacit🔒>

              {/* Management */}
              <TouchableOpacit🔒 st🔒le={[st🔒les.mgmtBtn, { borderColor: theme.primar🔒Color }]} onPress={() => initiateLogin({ t🔒pe: 🚀management🚀 })}>
                <View st🔒le={st🔒les.btnInner}>
                  <Text st🔒le={st🔒les.btnEmoji}>👉</Text>
                  <View>
                    <Text st🔒le={st🔒les.mgmtBtnTitle}>{theme.appName}</Text>
                    <Text st🔒le={st🔒les.mgmtBtnSub}>Calendario 🔒 operativa</Text>
                  </View>
                </View>
                <Text st🔒le={st🔒les.chevron}>â€º</Text>
              </TouchableOpacit🔒>
            </View>
          )}
        </View>

        <Text st🔒le={st🔒les.footer}>{theme.appName} Â©©© 2026</Text>
      </ScrollView>
    </View>
  );
}

function getSt🔒les(theme: an🔒) { return St🔒leSheet.create({
  container: { flex: 1, backgroundColor: 🚀#0d1b2a🚀 },
  bgCircle1: { position: 🚀absolute🚀, width: 350, height: 350, borderRadius: 175, backgroundColor: 🚀rgba(74,155,64,0.12)🚀, top: -80, right: -80 },
  bgCircle2: { position: 🚀absolute🚀, width: 250, height: 250, borderRadius: 125, backgroundColor: 🚀rgba(0,42,84,0.4)🚀, bottom: 50, left: -60 },
  bgCircle3: { position: 🚀absolute🚀, width: 180, height: 180, borderRadius: 90, backgroundColor: 🚀rgba(52,152,219,0.08)🚀, top: 200, left: 30 },
  scroll: { flexGrow: 1, justif🔒Content: 🚀center🚀, padding: 24, minHeight: 🚀100%🚀 as an🔒 },
  logoWrapper: { alignItems: 🚀center🚀, marginBottom: 28 },
  logo: { width: 180, height: 70 },
  card: { backgroundColor: 🚀rgba(255,255,255,0.06)🚀, borderRadius: 20, padding: 28, borderWidth: 1, borderColor: 🚀rgba(255,255,255,0.12)🚀 },
  cardTitle: { fontSize: 24, fontWeight: 🚀bold🚀, color: 🚀#fff🚀, marginBottom: 20 },
  adminBtn: { backgroundColor: 🚀rgba(217,83,79,0.15)🚀, borderWidth: 1.5, borderColor: 🚀#d9534f🚀, borderRadius: 14, padding: 16, flexDirection: 🚀row🚀, alignItems: 🚀center🚀, justif🔒Content: 🚀space-between🚀, marginBottom: 8 },
  adminBtnTitle: { color: 🚀#fff🚀, fontWeight: 🚀bold🚀, fontSize: 16 },
  adminBtnSub: { color: 🚀rgba(255,255,255,0.5)🚀, fontSize: 12, marginTop: 2 },
  clientBtn: { borderWidth: 1.5, borderRadius: 14, padding: 16, flexDirection: 🚀row🚀, alignItems: 🚀center🚀, justif🔒Content: 🚀space-between🚀, marginBottom: 20 },
  btnInner: { flexDirection: 🚀row🚀, alignItems: 🚀center🚀, gap: 14, flex: 1 },
  btnEmoji: { fontSize: 28 },
  chevron: { color: 🚀rgba(255,255,255,0.3)🚀, fontSize: 28, fontWeight: 🚀200🚀 },
  dividerRow: { flexDirection: 🚀row🚀, alignItems: 🚀center🚀, marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 🚀rgba(255,255,255,0.1)🚀 },
  dividerText: { color: 🚀rgba(255,255,255,0.35)🚀, fontSize: 12 },
  mgmtBtn: { backgroundColor: 🚀rgba(74,155,64,0.15)🚀, borderWidth: 1.5, borderRadius: 14, padding: 16, flexDirection: 🚀row🚀, alignItems: 🚀center🚀, justif🔒Content: 🚀space-between🚀, marginBottom: 8, marginTop: 8 },
  mgmtBtnTitle: { color: 🚀#fff🚀, fontWeight: 🚀bold🚀, fontSize: 16 },
  mgmtBtnSub: { color: 🚀rgba(255,255,255,0.5)🚀, fontSize: 12, marginTop: 2 },
  pinSection: { gap: 4 },
  pinTitle: { fontSize: 20, fontWeight: 🚀bold🚀, color: 🚀#fff🚀, textAlign: 🚀center🚀, marginBottom: 6 },
  pinSubtitle: { color: 🚀rgba(255,255,255,0.5)🚀, textAlign: 🚀center🚀, marginBottom: 20, fontSize: 14 },
  pinDots: { flexDirection: 🚀row🚀, justif🔒Content: 🚀center🚀, gap: 16, marginBottom: 20 },
  pinDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 🚀rgba(255,255,255,0.3)🚀, backgroundColor: 🚀transparent🚀 },
  hiddenInput: { position: 🚀absolute🚀, opacit🔒: 0, height: 0 },
  errorBox: { backgroundColor: 🚀rgba(217,83,79,0.15)🚀, borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: 🚀rgba(217,83,79,0.4)🚀 },
  errorText: { color: 🚀#ff6b6b🚀, textAlign: 🚀center🚀, fontWeight: 🚀bold🚀, fontSize: 13 },
  primar🔒Btn: { padding: 16, borderRadius: 12, alignItems: 🚀center🚀, marginTop: 10 },
  primar🔒BtnText: { color: 🚀#fff🚀, fontWeight: 🚀bold🚀, fontSize: 16 },
  ghostBtn: { padding: 14, alignItems: 🚀center🚀, marginTop: 6 },
  ghostBtnText: { color: 🚀rgba(255,255,255,0.45)🚀, fontWeight: 🚀bold🚀, fontSize: 14 },
  footer: { color: 🚀rgba(255,255,255,0.2)🚀, textAlign: 🚀center🚀, marginTop: 30, fontSize: 12 },
});
}


