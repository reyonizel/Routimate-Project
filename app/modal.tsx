import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';

function SettingRow({ icon, label, onPress, rightElement, destructive = false }: {
  icon: string;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.settingIcon}>{icon}</Text>
      <Text style={[styles.settingLabel, destructive && { color: Colors.danger }]}>{label}</Text>
      <View style={styles.settingRight}>
        {rightElement ?? <Text style={styles.chevron}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function ModalScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const updateUser = useStore((s) => s.updateUser);
  const togglePro = useStore((s) => s.togglePro);
  const accentColor = user.gender === 'female' ? Colors.female : Colors.male;

  const [editingUsername, setEditingUsername] = useState(false);
  const [username, setUsername] = useState(user.username);

  const saveUsername = () => {
    if (!username.trim()) return;
    updateUser({ username: username.trim() });
    setEditingUsername(false);
    Alert.alert('✓', 'Kullanıcı adı güncellendi!');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Tüm verileriniz kalıcı olarak silinecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => Alert.alert('✓', 'Hesap silindi (simülasyon)'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Ayarlar</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* PRO PLAN BANNER */}
        <View style={[styles.proBanner, user.isPro && styles.proBannerActive]}>
          <Text style={styles.proBannerTitle}>
            {user.isPro ? '✦ Pro Üye' : '🔓 Buzları Kaldır'}
          </Text>
          <Text style={styles.proBannerSub}>
            {user.isPro
              ? 'Tüm Pro ayrıcalıklarından yararlanıyorsunuz.'
              : "Mate'inin fotoğraflarını net gör ve serbestçe mesajlaş."}
          </Text>
          {!user.isPro && (
            <TouchableOpacity
              style={[styles.proBtn, { backgroundColor: accentColor }]}
              onPress={togglePro}
            >
              <Text style={styles.proBtnText}>Pro'ya Geç</Text>
            </TouchableOpacity>
          )}
          {user.isPro && (
            <TouchableOpacity
              style={[styles.proBtn, { backgroundColor: Colors.surfaceAlt }]}
              onPress={togglePro}
            >
              <Text style={[styles.proBtnText, { color: Colors.textSecondary }]}>Pro'yu İptal Et</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* PROFILE SECTION */}
        <Text style={styles.sectionHeader}>PROFİL</Text>
        <View style={styles.section}>
          {editingUsername ? (
            <View style={styles.usernameEdit}>
              <TextInput
                style={[styles.usernameInput, { borderColor: accentColor + '66' }]}
                value={username}
                onChangeText={setUsername}
                autoFocus
                maxLength={30}
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingUsername(false)}>
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: accentColor }]}
                  onPress={saveUsername}
                >
                  <Text style={styles.saveBtnText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <SettingRow
              icon="👤"
              label={`@${user.username}`}
              onPress={() => setEditingUsername(true)}
            />
          )}

          <View style={styles.divider} />

          <SettingRow
            icon={user.gender === 'male' ? '♂' : '♀'}
            label={`Cinsiyet: ${user.gender === 'male' ? 'Erkek' : 'Kadın'}`}
            rightElement={
              <View style={[styles.genderBadge, { backgroundColor: accentColor + '22' }]}>
                <Text style={[{ color: accentColor, fontSize: 11, fontWeight: '700' }]}>
                  {user.gender === 'male' ? 'Erkek' : 'Kadın'}
                </Text>
              </View>
            }
          />
        </View>

        {/* NOTIFICATIONS SECTION */}
        <Text style={styles.sectionHeader}>BİLDİRİMLER</Text>
        <View style={styles.section}>
          <SettingRow
            icon="⏰"
            label="Bildirim Saatini Değiştir"
            onPress={() => Alert.alert('Yakında', 'Bildirim saati ayarı eklenecek.')}
          />
        </View>

        {/* ABOUT SECTION */}
        <Text style={styles.sectionHeader}>HAKKINDA</Text>
        <View style={styles.section}>
          <SettingRow
            icon="🔗"
            label="Arkadaşını Davet Et"
            onPress={() => Alert.alert('Paylaş', 'https://routinmate.app/invite')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="📜"
            label="KVKK & Gizlilik"
            onPress={() => Alert.alert('KVKK', 'Gizlilik politikası içeriği...')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="📋"
            label="Kullanıcı Sözleşmesi"
            onPress={() => Alert.alert('Sözleşme', 'Kullanıcı sözleşmesi içeriği...')}
          />
        </View>

        {/* DANGER ZONE */}
        <Text style={styles.sectionHeader}>TEHLİKE BÖLGESİ</Text>
        <View style={styles.section}>
          <SettingRow
            icon="🚪"
            label="Çıkış Yap"
            onPress={() => Alert.alert('Çıkış', 'Çıkış yapıldı (simülasyon).')}
            destructive
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🗑"
            label="Hesabı Sil"
            onPress={handleDeleteAccount}
            destructive
          />
        </View>

        {/* Debug button */}
        <TouchableOpacity
          style={styles.debugBtn}
          onPress={() => { router.back(); setTimeout(() => router.push('/debug'), 200); }}
        >
          <Text style={styles.debugBtnText}>⚙ Geliştirici Paneli (Debug)</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.cardBorder,
  },
  title: {
    fontSize: FontSize.xl,
    color: Colors.text,
    fontWeight: '800',
  },
  closeBtn: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    padding: 4,
  },
  proBanner: {
    margin: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.proGold + '33',
  },
  proBannerActive: {
    backgroundColor: Colors.proGold + '11',
  },
  proBannerTitle: {
    fontSize: FontSize.xl,
    color: Colors.proGold,
    fontWeight: '800',
    marginBottom: 6,
  },
  proBannerSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  proBtn: {
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  proBtnText: {
    fontSize: FontSize.md,
    color: '#fff',
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  section: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
  },
  settingIcon: {
    fontSize: 18,
    marginRight: Spacing.md,
    width: 24,
    textAlign: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  settingRight: {
    alignItems: 'flex-end',
  },
  chevron: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.cardBorder,
    marginLeft: 52,
  },
  genderBadge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  usernameEdit: {
    padding: Spacing.md,
  },
  usernameInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: 10,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  debugBtn: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.md,
  },
  debugBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
