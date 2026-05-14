import { Alert } from 'react-native';

export function showError(title: string, message?: string) {
  Alert.alert(title, message, [{ text: 'Tamam' }]);
}

export function handleError(err: unknown, fallback = 'Beklenmeyen bir hata oluştu.') {
  const msg = err instanceof Error ? err.message : String(err ?? fallback);
  const friendly = mapToFriendly(msg);
  showError('Hata', friendly);
}

function mapToFriendly(msg: string): string {
  const m = msg.toLowerCase();

  // Network
  if (m.includes('network request failed') || m.includes('failed to fetch'))
    return 'İnternet bağlantısı yok. Lütfen bağlantını kontrol et.';
  if (m.includes('timeout') || m.includes('timed out'))
    return 'İstek zaman aşımına uğradı. Lütfen tekrar dene.';

  // Auth
  if (m.includes('invalid login credentials') || m.includes('invalid email or password'))
    return 'E-posta veya şifre hatalı.';
  if (m.includes('email not confirmed'))
    return 'E-posta adresin doğrulanmamış. Gelen kutunu kontrol et.';
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı dene.';
  if (m.includes('password should be at least'))
    return 'Şifre en az 6 karakter olmalı.';
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Çok fazla deneme yaptın. Lütfen biraz bekle.';
  if (m.includes('session_not_found') || m.includes('refresh_token_not_found'))
    return 'Oturum süresi doldu. Lütfen tekrar giriş yap.';

  // Supabase / DB
  if (m.includes('duplicate key') || m.includes('unique constraint'))
    return 'Bu bilgi zaten kayıtlı. Farklı bir değer dene.';
  if (m.includes('foreign key') || m.includes('violates foreign key'))
    return 'İlişkili bir kayıt bulunamadı.';
  if (m.includes('row-level security') || m.includes('permission denied'))
    return 'Bu işlem için yetkin yok.';
  if (m.includes('relation') && m.includes('does not exist'))
    return 'Veritabanı yapılandırma hatası. Lütfen destek ekibine bildir.';
  if (m.includes('jwt expired'))
    return 'Oturum süresi doldu. Lütfen tekrar giriş yap.';

  // Storage / Upload
  if (m.includes('file size') || m.includes('payload too large'))
    return 'Dosya boyutu çok büyük. Daha küçük bir dosya seç.';
  if (m.includes('invalid mime') || m.includes('file type'))
    return 'Geçersiz dosya türü. Lütfen bir resim dosyası seç.';

  // Permissions
  if (m.includes('camera') && m.includes('permission'))
    return 'Kamera izni reddedildi. Ayarlardan izin ver.';
  if (m.includes('media library') || (m.includes('photo') && m.includes('permission')))
    return 'Galeri izni reddedildi. Ayarlardan izin ver.';
  if (m.includes('location') && m.includes('permission'))
    return 'Konum izni reddedildi. Ayarlardan izin ver.';

  // Offline / Server
  if (m.includes('503') || m.includes('service unavailable'))
    return 'Sunucu şu anda kullanılamıyor. Lütfen daha sonra tekrar dene.';
  if (m.includes('500') || m.includes('internal server'))
    return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar dene.';

  return msg.length < 120 ? msg : 'Beklenmeyen bir hata oluştu.';
}

// Özel doğrulama hataları
export const ValidationErrors = {
  usernameShort:     'Kullanıcı adı en az 3 karakter olmalı.',
  usernameTaken:     'Bu kullanıcı adı zaten alınmış.',
  usernameChecking:  'Kullanıcı adı kontrol ediliyor, lütfen bekle.',
  usernameInvalid:   'Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir.',
  emailInvalid:      'Geçerli bir e-posta adresi gir.',
  passwordShort:     'Şifre en az 6 karakter olmalı.',
  passwordMismatch:  'Şifreler eşleşmiyor.',
  requiredField:     (field: string) => `${field} alanı zorunludur.`,
  ageTooLow:         'En az 13 yaşında olmalısın.',
  bioTooLong:        'Biyografi en fazla 200 karakter olabilir.',
  noInterest:        'En az bir ilgi alanı seçmelisin.',
  noLocation:        'Lütfen bir konum seç.',
  noRoutineTitle:    'Rutin başlığı boş olamaz.',
  noSetName:         'Set adı zorunludur.',
  noDaySelected:     'En az bir gün seçmelisin.',
  photoUploadFail:   'Fotoğraf yüklenemedi. Lütfen tekrar dene.',
  networkOffline:    'İnternet bağlantısı yok.',
};
