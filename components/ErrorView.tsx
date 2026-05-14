import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const GREEN = '#00bf63';
const TEXT = '#111111'; const TEXT2 = '#767676'; const TEXT3 = '#ABABAB';
const CARD = '#F4F4F4';

export type ErrorVariant = 'not_found' | 'network' | 'upload' | 'server' | 'permission' | 'empty';

interface ErrorViewProps {
  variant?: ErrorVariant;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
}

const PRESETS: Record<ErrorVariant, { icon: React.ComponentProps<typeof Ionicons>['name']; iconColor: string; title: string; message: string }> = {
  not_found: {
    icon: 'search-outline',
    iconColor: '#767676',
    title: 'Sayfa Bulunamadı',
    message: 'Aradığın içerik kaldırılmış ya da hiç var olmamış olabilir.',
  },
  network: {
    icon: 'wifi-outline',
    iconColor: '#e74c3c',
    title: 'Bağlantı Hatası',
    message: 'İnternet bağlantısı yok. Bağlantını kontrol edip tekrar dene.',
  },
  upload: {
    icon: 'cloud-upload-outline',
    iconColor: '#e67e22',
    title: 'Yükleme Başarısız',
    message: 'Fotoğraf yüklenirken bir hata oluştu. Dosya boyutunu kontrol et ve tekrar dene.',
  },
  server: {
    icon: 'alert-circle-outline',
    iconColor: '#e74c3c',
    title: 'Sunucu Hatası',
    message: 'Bir şeyler ters gitti. Ekibimiz haberdar edildi, lütfen daha sonra tekrar dene.',
  },
  permission: {
    icon: 'lock-closed-outline',
    iconColor: '#3498db',
    title: 'İzin Gerekli',
    message: 'Bu içeriğe erişmek için gereken izinler verilmemiş. Ayarlardan izin ver.',
  },
  empty: {
    icon: 'file-tray-outline',
    iconColor: '#ABABAB',
    title: 'Henüz İçerik Yok',
    message: 'Burası şu an boş. İlk içeriği eklemek için başla!',
  },
};

export default function ErrorView({
  variant = 'server',
  title,
  message,
  onRetry,
  retryLabel = 'Tekrar Dene',
  compact = false,
}: ErrorViewProps) {
  const preset = PRESETS[variant];
  const displayTitle = title ?? preset.title;
  const displayMessage = message ?? preset.message;

  if (compact) {
    return (
      <View style={[styles.compactWrap]}>
        <Ionicons name={preset.icon} size={28} color={preset.iconColor} />
        <View style={{ flex: 1 }}>
          <Text style={styles.compactTitle}>{displayTitle}</Text>
          <Text style={styles.compactMsg}>{displayMessage}</Text>
        </View>
        {onRetry && (
          <TouchableOpacity style={styles.compactBtn} onPress={onRetry} activeOpacity={0.8}>
            <Text style={styles.compactBtnTxt}>{retryLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconCircle, { backgroundColor: preset.iconColor + '15' }]}>
        <Ionicons name={preset.icon} size={48} color={preset.iconColor} />
      </View>
      <Text style={styles.title}>{displayTitle}</Text>
      <Text style={styles.msg}>{displayMessage}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.85}>
          <Ionicons name="refresh-outline" size={16} color="#fff" />
          <Text style={styles.retryBtnTxt}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 14,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: TEXT,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  msg: {
    fontSize: 14,
    color: TEXT2,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  retryBtnTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },

  compactWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 2,
  },
  compactMsg: {
    fontSize: 12,
    color: TEXT2,
    lineHeight: 16,
  },
  compactBtn: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  compactBtnTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
});
