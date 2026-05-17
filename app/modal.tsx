import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Share, Linking, Modal, Platform,
  Animated, Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { sendTestNotification } from '../lib/notifications';

const BG = '#FFFFFF';
const TEXT = '#111111'; const TEXT2 = '#767676'; const TEXT3 = '#ABABAB';
const RED = '#00bf63'; const GOLD = '#C9920A'; const BORDER = '#F0F0F0';
const CARD = '#F8F8F8'; const PILL = 999;

// ─── Animated Pro Card ───────────────────────────────────────────────────────
function ProCard({ isPro, onToggle }: { isPro: boolean; onToggle: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const blob1X = anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 30] });
  const blob1Y = anim.interpolate({ inputRange: [0, 1], outputRange: [-10, 20] });
  const blob2X = anim.interpolate({ inputRange: [0, 1], outputRange: [30, -10] });
  const blob2Y = anim.interpolate({ inputRange: [0, 1], outputRange: [20, -15] });
  const blob3X = anim.interpolate({ inputRange: [0, 1], outputRange: [10, -30] });
  const blob3Scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });

  return (
    <View style={pro.card}>
      {/* Animated background blobs */}
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[pro.blob, pro.blob1, { transform: [{ translateX: blob1X }, { translateY: blob1Y }] }]} />
        <Animated.View style={[pro.blob, pro.blob2, { transform: [{ translateX: blob2X }, { translateY: blob2Y }] }]} />
        <Animated.View style={[pro.blob, pro.blob3, { transform: [{ translateX: blob3X }, { scale: blob3Scale }] }]} />
      </View>

      {/* Content */}
      <View style={pro.content}>
        {/* Badge */}
        <View style={pro.badge}>
          <FontAwesome5 name="crown" size={11} color={GOLD} />
          <Text style={pro.badgeTxt}>{isPro ? 'Pro Üye' : 'RoutinMate Pro'}</Text>
        </View>

        {/* Title */}
        <Text style={pro.title}>
          {isPro ? 'Ayrıcalıklı dünyaya\nhoş geldin ✦' : "RoutinMate'nin ayrıcalıklı\ndünyasını keşfet"}
        </Text>

        {/* Button label above */}
        {!isPro && (
          <Text style={pro.hint}>Serbest mesajlaş · Fotoğrafları gör</Text>
        )}

        {/* CTA Button */}
        <TouchableOpacity style={[pro.btn, isPro && pro.btnSecondary]} onPress={onToggle} activeOpacity={0.85}>
          <FontAwesome5 name="crown" size={13} color={isPro ? TEXT2 : '#fff'} />
          <Text style={[pro.btnTxt, isPro && { color: TEXT2 }]}>
            {isPro ? "Pro'yu İptal Et" : "Pro'ya Yükselt"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── TikTok-style Section ────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>{title}</Text>
      <View style={s.card}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

// ─── Row ─────────────────────────────────────────────────────────────────────
function Row({
  icon, label, sub, onPress, danger = false, right, iconBg,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; sub?: string; onPress?: () => void;
  danger?: boolean; right?: React.ReactNode; iconBg?: string;
}) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress} activeOpacity={0.6}>
      <View style={[s.rowIcon, { backgroundColor: iconBg ?? (danger ? RED + '14' : BORDER) }]}>
        <Ionicons name={icon} size={18} color={danger ? RED : TEXT2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, danger && { color: RED }]}>{label}</Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={14} color={TEXT3} />)}
    </TouchableOpacity>
  );
}

// ─── Notification Sound Sheet ─────────────────────────────────────────────────
const SOUNDS = [
  { id: 'default', label: 'Varsayılan', icon: 'notifications-outline' as const, file: null },
  { id: 'correct', label: 'Doğru', icon: 'checkmark-circle-outline' as const, file: require('../assets/images/dragon-studio-correct-472358.mp3') },
  { id: 'apple_pay', label: 'Başarılı (Apple)', icon: 'card-outline' as const, file: require('../assets/images/ksjsbwuil-apple-pay-success-sound-effect-481188.mp3') },
  { id: 'success', label: 'Başarılı', icon: 'star-outline' as const, file: require('../assets/images/meldix-success-340660.mp3') },
  { id: 'notify', label: 'Bildirim', icon: 'notifications-outline' as const, file: require('../assets/images/notification_message-notify-7-310750.mp3') },
  { id: 'iphone_msg', label: 'Mesaj (iPhone)', icon: 'chatbubble-outline' as const, file: require('../assets/images/son_duquotidient-message-envoye-iphone-apple-391098.mp3') },
  { id: 'level_up', label: 'Seviye Atlama', icon: 'arrow-up-circle-outline' as const, file: require('../assets/images/tithuh-level-up-02-528919.mp3') },
  { id: 'notify_022', label: 'Kısa Çınlama', icon: 'musical-note-outline' as const, file: require('../assets/images/universfield-new-notification-022-370046.mp3') },
  { id: 'notify_037', label: 'Hafif Tıklama', icon: 'musical-note-outline' as const, file: require('../assets/images/universfield-new-notification-037-485898.mp3') },
  { id: 'notify_054', label: 'Tatlı Bildirim', icon: 'musical-note-outline' as const, file: require('../assets/images/universfield-new-notification-054-494259.mp3') },
  { id: 'notify_057', label: 'Dikkat Çekici', icon: 'musical-note-outline' as const, file: require('../assets/images/universfield-new-notification-057-494255.mp3') },
  { id: 'none', label: 'Sessiz', icon: 'volume-mute-outline' as const, file: null },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ModalScreen() {
  const router     = useRouter();
  const user       = useStore((s) => s.user);
  const updateUser = useStore((s) => s.updateUser);
  const togglePro  = useStore((s) => s.togglePro);
  const resetStore = useStore((s) => s.resetStore);

  const [editing, setEditing]             = useState(false);
  const [username, setUsername]           = useState(user.username);
  const [soundSheet, setSoundSheet]       = useState<'notification' | 'completion' | null>(null);

  const playSound = async (file: any) => {
    if (!file) return;
    try {
      const { sound } = await Audio.Sound.createAsync(file);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      console.log('Error playing sound', e);
    }
  };

  const handleSelectSound = (snd: typeof SOUNDS[0]) => {
    if (soundSheet === 'notification') {
      updateUser({ notificationSound: snd.id });
    } else if (soundSheet === 'completion') {
      updateUser({ completionSound: snd.id });
    }
    if (snd.file) {
      playSound(snd.file);
    }
    setSoundSheet(null);
  };

  const saveUsername = () => {
    if (!username.trim()) return;
    updateUser({ username: username.trim() });
    setEditing(false);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'RoutinMate ile rutin partner bul, her gün birlikte ilerliyoruz! 🚀 https://routinmate.app',
      });
    } catch {}
  };

  const handleWhatsapp = () => {
    const phone = '+905551579682';
    const msg = encodeURIComponent('Merhaba, RoutinMate hakkında destek almak istiyorum.');
    Linking.openURL(`https://wa.me/${phone}?text=${msg}`).catch(() =>
      Alert.alert('Hata', 'WhatsApp açılamadı.')
    );
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap', style: 'destructive', onPress: async () => {
          resetStore();
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Tüm verileriniz kalıcı olarak silinecek. Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Sil', style: 'destructive', onPress: () => {
            Alert.alert(
              'Son Onay',
              'Hesabınız ve tüm verileriniz silinecek. Devam edilsin mi?',
              [
                { text: 'Vazgeç', style: 'cancel' },
                {
                  text: 'Kalıcı Olarak Sil', style: 'destructive', onPress: async () => {
                    try {
                      const { error } = await supabase.rpc('delete_user_account');
                      if (error) throw error;
                      resetStore();
                      await supabase.auth.signOut();
                    } catch (err: any) {
                      Alert.alert('Hata', err?.message ?? 'Hesap silinirken bir hata oluştu.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleRate = () => {
    const url = Platform.select({
      ios: 'https://apps.apple.com/app/idXXXXXXXXX',
      android: 'https://play.google.com/store/apps/details?id=com.routinmate',
    });
    Linking.openURL(url!).catch(() => Alert.alert('Hata', 'Mağaza açılamadı.'));
  };

  const handleReportBug = () => {
    const subject = encodeURIComponent('[Hata Bildirimi] RoutinMate');
    const body = encodeURIComponent('Merhaba,\n\nAşağıdaki hatayı yaşadım:\n\n');
    Linking.openURL(`mailto:destek@routinmate.app?subject=${subject}&body=${body}`).catch(() =>
      Alert.alert('Hata', 'E-posta uygulaması açılamadı.')
    );
  };

  const currentNotifSound = SOUNDS.find(s => s.id === (user.notificationSound || 'default')) ?? SOUNDS[0];
  const currentCompSound = SOUNDS.find(s => s.id === (user.completionSound || 'correct')) ?? SOUNDS[1];

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      {/* Drag Handle */}
      <View style={s.handle} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Ayarlar</Text>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={18} color={TEXT} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* Pro Card */}
        <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 8 }}>
          <ProCard isPro={user.isPro} onToggle={() => {
            if (!user.isPro) {
              router.back();
              setTimeout(() => router.push('/pro-upgrade'), 250);
            } else {
              togglePro();
            }
          }} />
        </View>

        {/* Profil */}
        <Section title="Profil">
          {editing ? (
            <View style={s.editBox}>
              <View style={s.editInput}>
                <Ionicons name="at" size={16} color={TEXT2} />
                <TextInput
                  style={s.editField}
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
              <View style={s.editActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setUsername(user.username); setEditing(false); }}>
                  <Text style={s.cancelTxt}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={saveUsername}>
                  <Text style={s.saveTxt}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Row icon="person-outline" label={`@${user.username}`} onPress={() => setEditing(true)} />
          )}
          <Divider />
          <Row
            icon={user.gender === 'male' ? 'male-outline' : 'female-outline'}
            label={`Cinsiyet: ${user.gender === 'male' ? 'Erkek' : 'Kadın'}`}
            iconBg={user.gender === 'female' ? '#FCE4EC' : '#E3F2FD'}
            right={
              <View style={[s.genderDot, { backgroundColor: user.gender === 'female' ? '#e91e63' : '#3498db' }]} />
            }
          />
        </Section>

        {/* Bildirimler */}
        <Section title="Bildirimler & Sesler">
          <Row
            icon="alarm-outline"
            label="Bildirim Saatini Değiştir"
            sub="Rutin hatırlatıcılarını yönet"
            onPress={() => Alert.alert('Yakında', 'Bildirim saati ayarları eklenecek.')}
          />
          <Divider />
          <Row
            icon={currentNotifSound.icon}
            label="Bildirim Sesi"
            sub={currentNotifSound.label}
            onPress={() => setSoundSheet('notification')}
          />
          <Divider />
          <Row
            icon={currentCompSound.icon}
            label="Görev Tamamlama Sesi"
            sub={currentCompSound.label}
            onPress={() => setSoundSheet('completion')}
          />
        </Section>

        {/* Destek */}
        <Section title="Destek">
          <Row
            icon="bug-outline"
            label="Hata Bildir"
            sub="Bir sorunla mı karşılaştın?"
            onPress={handleReportBug}
          />
          <Divider />
          <Row
            icon="logo-whatsapp"
            label="WhatsApp Destek"
            sub="Ekibimizle iletişime geç"
            iconBg="#E8F5E9"
            onPress={handleWhatsapp}
          />
        </Section>

        {/* Uygulama */}
        <Section title="Uygulama">
          <Row
            icon="star-outline"
            label="Bizi Puanlayın"
            sub="Görüşünü paylaş"
            iconBg="#FFF8E1"
            onPress={handleRate}
          />
          <Divider />
          <Row
            icon="share-social-outline"
            label="Arkadaşlarınıza Önerin"
            sub="Birlikte büyüyelim 🚀"
            onPress={handleShare}
          />
          <Divider />
          <Row
            icon="shield-checkmark-outline"
            label="KVKK & Gizlilik"
            onPress={() => Linking.openURL('https://routinmate.app/kvkk').catch(() => Alert.alert('Hata', 'Sayfa açılamadı.'))}
          />
          <Divider />
          <Row
            icon="document-text-outline"
            label="Kullanıcı Sözleşmesi"
            onPress={() => Linking.openURL('https://routinmate.app/sozlesme').catch(() => Alert.alert('Hata', 'Sayfa açılamadı.'))}
          />
        </Section>

        {/* Geliştirici */}
        <Section title="Geliştirici">
          <Row
            icon="notifications-outline"
            label="Test Bildirimi Gönder (5sn)"
            onPress={() =>
              sendTestNotification()
                .then(() => Alert.alert('Gönderildi', '5 saniye sonra bildirim gelecek.'))
                .catch(() => Alert.alert('Hata', 'Bildirim gönderilemedi.'))
            }
          />
        </Section>

        {/* Tehlike */}
        <Section title="Tehlike Bölgesi">
          <Row icon="log-out-outline" label="Çıkış Yap" danger onPress={handleLogout} />
          <Divider />
          <Row icon="trash-outline" label="Hesabı Sil" danger onPress={handleDeleteAccount} />
        </Section>

      </ScrollView>

      {/* Sound Bottom Sheet */}
      {soundSheet && (
        <Modal transparent visible animationType="slide" onRequestClose={() => setSoundSheet(false)}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSoundSheet(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} />
          </TouchableOpacity>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Bildirim Sesi</Text>
              <TouchableOpacity onPress={() => setSoundSheet(false)}>
                <Ionicons name="close" size={22} color={TEXT} />
              </TouchableOpacity>
            </View>
            {SOUNDS.map((snd, i) => (
              <TouchableOpacity
                key={snd.id}
                style={[s.soundRow, i === SOUNDS.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => handleSelectSound(snd)}
                activeOpacity={0.7}
              >
                <View style={[s.soundIcon, (user.notificationSound || 'default') === snd.id && { backgroundColor: RED + '18' }]}>
                  <Ionicons name={snd.icon} size={18} color={(user.notificationSound || 'default') === snd.id ? RED : TEXT2} />
                </View>
                <Text style={[s.soundLabel, (user.notificationSound || 'default') === snd.id && { color: RED, fontWeight: '700' }]}>{snd.label}</Text>
                {(user.notificationSound || 'default') === snd.id && <Ionicons name="checkmark" size={18} color={RED} />}
              </TouchableOpacity>
            ))}
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ─── Pro Card Styles ──────────────────────────────────────────────────────────
const pro = StyleSheet.create({
  card:    { borderRadius: 22, overflow: 'hidden', backgroundColor: '#0D0D1F', padding: 24, minHeight: 200 },
  blob:    { position: 'absolute', borderRadius: 999, opacity: 0.55 },
  blob1:   { width: 180, height: 180, backgroundColor: '#7C3AED', top: -40, left: -40 },
  blob2:   { width: 160, height: 160, backgroundColor: '#DB2777', top: 20, right: -30 },
  blob3:   { width: 140, height: 140, backgroundColor: '#2563EB', bottom: -30, left: 60 },
  content: { zIndex: 1 },
  badge:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginBottom: 14 },
  badgeTxt:{ fontSize: 12, color: '#fff', fontWeight: '700' },
  title:   { fontSize: 22, color: '#fff', fontWeight: '900', lineHeight: 30, marginBottom: 8 },
  hint:    { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 20 },
  btn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 14, marginTop: 8 },
  btnSecondary: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  btnTxt:  { fontSize: 15, color: '#0D0D1F', fontWeight: '800' },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  handle:    { width: 36, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  title:     { fontSize: 20, color: TEXT, fontWeight: '900', letterSpacing: -0.3 },
  closeBtn:  { width: 34, height: 34, borderRadius: 17, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' },

  // TikTok-style section
  section:      { marginTop: 12 },
  sectionLabel: { fontSize: 13, color: TEXT3, fontWeight: '500', paddingHorizontal: 20, paddingBottom: 8, paddingTop: 4 },
  card:         { marginHorizontal: 16, backgroundColor: CARD, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },

  // Row
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: BORDER },
  rowLabel:{ fontSize: 15, color: TEXT, fontWeight: '500' },
  rowSub:  { fontSize: 12, color: TEXT3, marginTop: 1 },
  divider: { height: 0.5, backgroundColor: BORDER, marginLeft: 62 },
  genderDot: { width: 12, height: 12, borderRadius: 6 },

  // Edit
  editBox:     { padding: 14 },
  editInput:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F0F0F0', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: BORDER, marginBottom: 12 },
  editField:   { flex: 1, fontSize: 15, color: TEXT, paddingVertical: 12 },
  editActions: { flexDirection: 'row', gap: 10 },
  cancelBtn:   { flex: 1, backgroundColor: BORDER, borderRadius: PILL, paddingVertical: 12, alignItems: 'center' },
  cancelTxt:   { color: TEXT2, fontWeight: '700', fontSize: 14 },
  saveBtn:     { flex: 1, backgroundColor: RED, borderRadius: PILL, paddingVertical: 12, alignItems: 'center' },
  saveTxt:     { color: '#fff', fontWeight: '900', fontSize: 14 },

  // Sound Sheet
  sheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: BG, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, paddingHorizontal: 20 },
  sheetHandle: { width: 36, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: BORDER, marginBottom: 8 },
  sheetTitle:  { fontSize: 17, fontWeight: '800', color: TEXT },
  soundRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  soundIcon:   { width: 38, height: 38, borderRadius: 10, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' },
  soundLabel:  { flex: 1, fontSize: 15, color: TEXT, fontWeight: '500' },
});
