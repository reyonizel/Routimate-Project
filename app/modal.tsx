import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

const BG = '#FFFFFF'; const CARD = '#F4F4F4'; const SURFACE = '#EEEEEE';
const TEXT = '#111111'; const TEXT2 = '#767676'; const TEXT3 = '#ABABAB';
const RED = '#E60023'; const GOLD = '#D4860A'; const BORDER = '#E8E8E8'; const PILL = 999;

function Row({
  icon, label, sub, onPress, danger = false, right,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; sub?: string; onPress?: () => void;
  danger?: boolean; right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={0.65}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={17} color={danger ? RED : TEXT2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: RED }]}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={15} color={TEXT3} />)}
    </TouchableOpacity>
  );
}

export default function ModalScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const updateUser = useStore((s) => s.updateUser);
  const togglePro = useStore((s) => s.togglePro);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user.username);

  const saveUsername = () => {
    if (!username.trim()) return;
    updateUser({ username: username.trim() });
    setEditing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Drag handle */}
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Ayarlar</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color={TEXT2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Pro Card */}
        <View style={[styles.proCard, user.isPro && styles.proCardActive]}>
          <View style={styles.proCardHeader}>
            <View style={[styles.proIcon, { backgroundColor: user.isPro ? GOLD + '20' : SURFACE }]}>
              <Ionicons name={user.isPro ? 'star' : 'lock-open-outline'} size={22} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.proCardTitle}>{user.isPro ? 'Pro Üye ✦' : 'Buzları Kaldır'}</Text>
              <Text style={styles.proCardSub}>
                {user.isPro ? 'Tüm ayrıcalıklardan faydalanıyorsunuz.' : "Mate'in fotoğraflarını gör, serbestçe mesajlaş."}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.proBtn, user.isPro && styles.proBtnSecondary]}
            onPress={togglePro}
            activeOpacity={0.85}
          >
            <Ionicons
              name={user.isPro ? 'lock-closed-outline' : 'lock-open-outline'}
              size={16}
              color={user.isPro ? TEXT2 : '#fff'}
            />
            <Text style={[styles.proBtnText, user.isPro && { color: TEXT2 }]}>
              {user.isPro ? "Pro'yu İptal Et" : "Pro'ya Geç"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile */}
        <Text style={styles.groupLabel}>PROFİL</Text>
        <View style={styles.group}>
          {editing ? (
            <View style={styles.editBox}>
              <View style={[styles.editInput, { borderColor: TEXT }]}>
                <Ionicons name="at" size={16} color={TEXT2} />
                <TextInput
                  style={styles.editField}
                  value={username}
                  onChangeText={setUsername}
                  autoFocus
                  maxLength={30}
                />
                {username.length > 0 && (
                  <TouchableOpacity onPress={() => setUsername('')}>
                    <Ionicons name="close-circle" size={16} color={TEXT3} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setUsername(user.username); setEditing(false); }}>
                  <Text style={styles.cancelText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveUsername}>
                  <Text style={styles.saveText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Row icon="person-outline" label={`@${user.username}`} onPress={() => setEditing(true)} />
          )}
          <View style={styles.divider} />
          <Row
            icon={user.gender === 'male' ? 'male-outline' : 'female-outline'}
            label={`Cinsiyet: ${user.gender === 'male' ? 'Erkek' : 'Kadın'}`}
            right={
              <View style={[styles.genderDot, { backgroundColor: user.gender === 'female' ? '#e91e63' : '#3498db' }]} />
            }
          />
        </View>

        {/* Notifications */}
        <Text style={styles.groupLabel}>BİLDİRİMLER</Text>
        <View style={styles.group}>
          <Row
            icon="alarm-outline"
            label="Bildirim Saatini Değiştir"
            sub="Rutin hatırlatıcılarını yönet"
            onPress={() => Alert.alert('Yakında', 'Bildirim ayarları eklenecek.')}
          />
        </View>

        {/* App */}
        <Text style={styles.groupLabel}>UYGULAMA</Text>
        <View style={styles.group}>
          <Row icon="share-social-outline" label="Arkadaşını Davet Et" onPress={() => Alert.alert('Paylaş', 'https://routinmate.app')} />
          <View style={styles.divider} />
          <Row icon="shield-checkmark-outline" label="KVKK & Gizlilik" onPress={() => Alert.alert('KVKK', 'Gizlilik politikası')} />
          <View style={styles.divider} />
          <Row icon="document-text-outline" label="Kullanıcı Sözleşmesi" onPress={() => Alert.alert('Sözleşme', 'Kullanıcı sözleşmesi')} />
        </View>

        {/* Danger */}
        <Text style={styles.groupLabel}>TEHLİKE BÖLGESİ</Text>
        <View style={styles.group}>
          <Row icon="log-out-outline" label="Çıkış Yap" onPress={() => Alert.alert('Çıkış', 'Çıkış yapıldı.')} danger />
          <View style={styles.divider} />
          <Row
            icon="trash-outline"
            label="Hesabı Sil"
            danger
            onPress={() =>
              Alert.alert('Hesabı Sil', 'Tüm verileriniz kalıcı olarak silinecek.', [
                { text: 'İptal', style: 'cancel' },
                { text: 'Sil', style: 'destructive', onPress: () => Alert.alert('Silindi', 'Simülasyon.') },
              ])
            }
          />
        </View>

        {/* Dev panel */}
        <TouchableOpacity
          style={styles.devBtn}
          onPress={() => { router.back(); setTimeout(() => router.push('/debug'), 250); }}
        >
          <Ionicons name="code-slash-outline" size={15} color={TEXT3} />
          <Text style={styles.devText}>Geliştirici Paneli</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  handle: { width: 36, height: 4, backgroundColor: SURFACE, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  title: { fontSize: 20, color: TEXT, fontWeight: '900' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },

  // Pro card
  proCard: { margin: 16, backgroundColor: CARD, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: GOLD + '30' },
  proCardActive: { backgroundColor: GOLD + '08', borderColor: GOLD + '55' },
  proCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  proIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  proCardTitle: { fontSize: 17, color: TEXT, fontWeight: '900', marginBottom: 4 },
  proCardSub: { fontSize: 13, color: TEXT2, lineHeight: 18 },
  proBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E60023', borderRadius: PILL, paddingVertical: 14 },
  proBtnSecondary: { backgroundColor: SURFACE },
  proBtnText: { fontSize: 15, color: '#fff', fontWeight: '900' },

  // Sections
  groupLabel: { fontSize: 11, color: TEXT3, fontWeight: '700', letterSpacing: 1.5, paddingHorizontal: 16, paddingBottom: 8 },
  group: { marginHorizontal: 16, backgroundColor: CARD, borderRadius: 18, marginBottom: 24, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  rowIconDanger: { backgroundColor: RED + '12' },
  rowLabel: { fontSize: 15, color: TEXT, fontWeight: '600' },
  rowSub: { fontSize: 12, color: TEXT2, marginTop: 2 },
  divider: { height: 0.5, backgroundColor: BORDER, marginLeft: 60 },
  genderDot: { width: 14, height: 14, borderRadius: 7 },

  // Edit username
  editBox: { padding: 14 },
  editInput: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: SURFACE, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1.5, marginBottom: 12 },
  editField: { flex: 1, fontSize: 15, color: TEXT, paddingVertical: 12 },
  editActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: SURFACE, borderRadius: PILL, paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: TEXT2, fontWeight: '700', fontSize: 14 },
  saveBtn: { flex: 1, backgroundColor: '#E60023', borderRadius: PILL, paddingVertical: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 14 },

  // Dev btn
  devBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, backgroundColor: CARD, borderRadius: PILL, paddingVertical: 14, marginBottom: 8, borderWidth: 1, borderColor: BORDER },
  devText: { color: TEXT3, fontSize: 13, fontWeight: '600' },
});
