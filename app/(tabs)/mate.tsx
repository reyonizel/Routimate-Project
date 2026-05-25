import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore, User, Mate, MatchRequest } from '../../store/useStore';
import { MatchAPI } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { localDateStr } from '../../lib/date';

const today = localDateStr();
const BG='#EEE3D0'; const SURFACE='#F5EDE0'; const CARD='#FFFFFF';
const TEXT='#0A3B25'; const TEXT2='#3D6B58'; const TEXT3='#B2B7AA';
const RED='#2A6151'; const GREEN='#1A4F3A'; const GOLD='#D8C2A4';
const BORDER='#B2B7AA'; const PILL=999;

const CAT_COLORS = ['#E91E63','#9C27B0','#3F51B5','#2196F3','#00ACC1','#00897B','#F4511E','#6D4C41','#546E7A','#558B2F'];
function catColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return CAT_COLORS[Math.abs(h) % CAT_COLORS.length];
}

const FREQ_LABEL: Record<string,string> = { daily:'Günlük', weekly:'Haftalık', monthly:'Aylık' };


function interestScore(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  return a.filter(i => b.includes(i)).length / Math.min(a.length, b.length);
}
function ageScore(dA?: string, dB?: string): number {
  if (!dA || !dB) return 0.5;
  const age = (d: string) => (Date.now() - new Date(d).getTime()) / (365.25 * 24 * 3600 * 1000);
  const diff = Math.abs(age(dA) - age(dB));
  if (diff <= 2) return 1.0; if (diff <= 5) return 0.8; if (diff <= 10) return 0.5; if (diff <= 15) return 0.2; return 0.0;
}
function commitmentScore(a: number, b: number): number {
  const diff = Math.abs(a - b);
  if (diff <= 10) return 1.0; if (diff <= 25) return 0.6; if (diff <= 50) return 0.3; return 0.0;
}
function locationScore(lat1?: number, lon1?: number, lat2?: number, lon2?: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0.5;
  const R = 6371; const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  if (km < 10) return 1.0; if (km < 50) return 0.8; if (km < 100) return 0.5; if (km < 300) return 0.2; return 0.0;
}
function calcCompat(user: User, mate: Mate): number {
  const raw =
    interestScore(user.interests, mate.interests)    * 0.40 +
    ageScore(user.birthDate, mate.birthDate)          * 0.30 +
    commitmentScore(user.achievementScore, mate.achievementScore) * 0.20 +
    locationScore(user.locationLat, user.locationLon, mate.locationLat, mate.locationLon) * 0.10;
  return Math.round(raw * 59) + 40;
}
function compatLabel(pct: number): string {
  if (pct >= 85) return 'Yüksek Uyum'; if (pct >= 65) return 'İyi Uyum'; return 'Temel Uyum';
}

const INTEREST_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'Yoga':'body-outline', 'Meditasyon':'leaf-outline', 'Koşu':'footsteps-outline',
  'Fitness':'barbell-outline', 'Soğuk Duş':'water-outline', 'Kitap':'book-outline',
  'Pilates':'fitness-outline', 'Beslenme':'nutrition-outline', 'Uyku':'moon-outline',
  'Bisiklet':'bicycle-outline', 'Müzik':'musical-notes-outline', 'Yazarlık':'pencil-outline',
  'Spor':'basketball-outline',
};

export default function MateScreen() {
  const user        = useStore(s => s.user);
  const mate        = useStore(s => s.mate);
  const discoveryUsers  = useStore(s => s.discoveryUsers);
  const matchRequests   = useStore(s => s.matchRequests);
  const sentRequests    = useStore(s => s.sentMatchRequests);
  const addMatchRequest    = useStore(s => s.addMatchRequest);
  const sendMessage        = useStore(s => s.sendMessage);
  const sendMatchRequest   = useStore(s => s.sendMatchRequest);
  const cancelMatchRequest = useStore(s => s.cancelMatchRequest);
  const acceptMatchRequest = useStore(s => s.acceptMatchRequest);
  const rejectMatchRequest = useStore(s => s.rejectMatchRequest);
  const loadUserData       = useStore(s => s.loadUserData);
  const router = useRouter();

  useEffect(() => {
    if (!user.id) return;
    const channel = MatchAPI.subscribeToRequests(user.id, addMatchRequest);
    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  useEffect(() => {
    if (!user.id || mate) return;
    const ts = Date.now();
    const handleMatchFound = () => { loadUserData().catch(() => {}); };
    const ch1 = supabase.channel(`match_new_a:${user.id}:${ts}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches', filter: `user_a=eq.${user.id}` }, handleMatchFound).subscribe();
    const ch2 = supabase.channel(`match_new_b:${user.id}:${ts}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches', filter: `user_b=eq.${user.id}` }, handleMatchFound).subscribe();
    const poll = setInterval(() => {
      MatchAPI.getActiveMatch(user.id).then(md => { if (md.matchId) handleMatchFound(); }).catch(() => {});
    }, 8000);
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); clearInterval(poll); };
  }, [user.id, !!mate]);

  useFocusEffect(useCallback(() => {
    if (!user.id) return;
    MatchAPI.getRequests(user.id).then(requests => { requests.forEach(addMatchRequest); }).catch(() => {});
    if (!mate) { loadUserData().catch(() => {}); }
  }, [user.id, !!mate]));

  const sortedDiscovery = [...discoveryUsers]
    .filter(u => u.id !== user.id)
    .sort((a, b) => calcCompat(user, b) - calcCompat(user, a));

  // ── Aktif Eşleşme ─────────────────────────────────────────────────────────
  const renderActiveMatch = () => {
    if (!mate) return null;
    const accent = mate.gender === 'female' ? '#e91e63' : '#3498db';
    const daysPassed = user.matchedSince
      ? Math.floor((Date.now() - new Date(user.matchedSince).getTime()) / 86400000)
      : 0;
    const doneToday = mate.routines.filter(r => r.completedDates.includes(today)).length;

    const sortedRoutines = [...mate.routines].sort((a, b) => {
      const aDone = a.completedDates.includes(today);
      const bDone = b.completedDates.includes(today);
      return aDone === bDone ? 0 : aDone ? -1 : 1;
    });

    return (
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Top row ─────────────────────────────── */}
        <View style={s.topRow}>
          <Text style={s.topUsername}>@{mate.username}</Text>
          <TouchableOpacity style={s.settingsBtn} onPress={() => router.push('/mate-profile')}>
            <Ionicons name="person-outline" size={20} color={TEXT} />
          </TouchableOpacity>
        </View>

        {/* ── Instagram head: avatar + stats ─────── */}
        <View style={s.instaHead}>
          <View style={[s.avatar, { borderColor: accent }]}>
            {mate.avatarUri ? (
              <Image source={{ uri: mate.avatarUri }} style={{ width: '100%', height: '100%', borderRadius: PILL }} contentFit="cover" cachePolicy="memory-disk" blurRadius={12} />
            ) : (
              <Ionicons name="person" size={26} color={TEXT3} />
            )}
          </View>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statNum}>{doneToday}/{mate.routines.length}</Text>
              <Text style={s.statLabel}>Görev</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statNum}>{daysPassed}</Text>
              <Text style={s.statLabel}>Gün</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statNum}>{mate.achievementScore}%</Text>
              <Text style={s.statLabel}>Başarı</Text>
            </View>
          </View>
        </View>

        {/* ── Bio ──────────────────────────────────── */}
        {mate.fullName && (
          <View style={s.bioArea}>
            <Text style={s.profileName}>{mate.fullName}</Text>
          </View>
        )}

        {/* ── Tab ayırıcı ─────────────────────────── */}
        <View style={s.tabDivider} />

        {/* ── Rutinler ─────────────────────────────── */}
        {sortedRoutines.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="clipboard-outline" size={36} color={TEXT3} />
            <Text style={s.emptyTxt}>Mate'in rutini yok</Text>
          </View>
        ) : (
          sortedRoutines.map((r, i) => {
            const done = r.completedDates.includes(today);
            const cc = catColor(r.setName ?? r.name);
            return (
              <View key={r.id}>
                <View style={s.taskRow}>
                  <View style={[s.catIcon, { backgroundColor: cc }]}>
                    <Ionicons name={(r.setIcon as any) || 'star-outline'} size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.taskName, done && s.taskNameDone]}>{r.name}</Text>
                    <Text style={s.taskMeta}>{FREQ_LABEL[r.frequency]} · {r.notificationTime}</Text>
                    {done ? (
                      <TouchableOpacity
                        style={s.congratsBlock}
                        onPress={() => {
                          const msgs = [
                            `"${r.name}" görevini tamamladın, aferin! 🎉 [congrats]`,
                            `"${r.name}" tamam, çok iyisin! 💪 [congrats]`,
                            `"${r.name}" bitti, muhteşemsin! 🔥 [congrats]`,
                            `"${r.name}" tamamlandı, birlikte başaracağız! ✅ [congrats]`,
                            `"${r.name}" harika iş, devam et! ⭐ [congrats]`,
                          ];
                          sendMessage(msgs[Math.floor(Math.random() * msgs.length)]);
                          router.push('/(tabs)/dm');
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={s.congratsBar} />
                        <View style={s.remindQuoteContent}>
                          <Text style={s.congratsTxt}>Görevi tamamladı! 🎉</Text>
                          <View style={s.remindQuoteAction}>
                            <Ionicons name="return-down-forward-outline" size={11} color="#2A6151" />
                            <Text style={[s.remindQuoteTxt, { color: '#2A6151' }]}>Tebrik mesajı gönder</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ) : (() => {
                      const [h, mn] = r.notificationTime.split(':').map(Number);
                      const now = new Date();
                      const isPast = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= mn);
                      return (
                        <TouchableOpacity
                          style={s.remindQuote}
                          onPress={() => {
                            sendMessage(`"${r.name}" görevini henüz yapmadın, hatırlatmak istedim 💬`);
                            router.push('/(tabs)/dm');
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={s.remindQuoteBar} />
                          <View style={s.remindQuoteContent}>
                            <Text style={[s.remindQuoteRoutine, { color: isPast ? '#EF4444' : '#2A6151' }]}>{isPast ? 'Süresi geçti' : 'Henüz vakit var'}</Text>
                            <View style={s.remindQuoteAction}>
                              <Ionicons name="return-down-forward-outline" size={11} color={RED} />
                              <Text style={s.remindQuoteTxt}>Arkadaşına görevi hatırlat</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                  {done
                    ? <View style={s.taskDotDone}><Ionicons name="checkmark" size={12} color="#fff" /></View>
                    : <View style={s.taskDotPending} />
                  }
                </View>
                {i < sortedRoutines.length - 1 && <View style={s.taskDivider} />}
              </View>
            );
          })
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    );
  };

  // ── Keşif ─────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const filteredDiscovery = sortedDiscovery.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.username.toLowerCase().includes(q) ||
      (item.fullName?.toLowerCase().includes(q) ?? false) ||
      item.interests.some(i => i.toLowerCase().includes(q));
  });

  const renderDiscovery = () => (
    <ScrollView showsVerticalScrollIndicator={false}>

      {/* ── Başlık ──────────────────────────────── */}
      <View style={s.topRow}>
        <Text style={s.pageTitle}>Rutinmate</Text>
      </View>

      {/* ── Arama ───────────────────────────────── */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={16} color={TEXT3} />
        <TextInput
          style={s.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="İsim veya ilgi alanı ara..."
          placeholderTextColor={TEXT3}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={17} color={TEXT3} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Gelen istekler ──────────────────────── */}
      {matchRequests.length > 0 && (
        <View style={s.reqSection}>
          <Text style={s.sectionLabel}>EŞLEŞME İSTEKLERİ</Text>
          {matchRequests.map(req => {
            const reqAccent = req.fromUser.gender === 'female' ? '#e91e63' : '#3498db';
            return (
              <View key={req.id} style={s.reqCard}>
                <View style={[s.reqAvatar, { borderColor: reqAccent }]}>
                  <Image source={{ uri: req.fromUser.avatarUri || '' }} style={{ width: '100%', height: '100%', borderRadius: PILL }} contentFit="cover" cachePolicy="memory-disk" blurRadius={8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.reqName}>{req.fromUser.username}</Text>
                  <Text style={s.reqSub}>eşleşmek istiyor</Text>
                </View>
                <View style={s.reqActions}>
                  <TouchableOpacity style={s.reqAcceptBtn} onPress={() => acceptMatchRequest(req)} activeOpacity={0.8}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.reqRejectBtn} onPress={() => rejectMatchRequest(req.id)} activeOpacity={0.8}>
                    <Ionicons name="close" size={16} color={TEXT2} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Önerilen kişiler ────────────────────── */}
      <View style={s.discSection}>
        <Text style={s.sectionLabel}>ÖNERİLEN KİŞİLER</Text>

        {filteredDiscovery.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="people-outline" size={40} color={TEXT3} />
            <Text style={s.emptyTxt}>{searchQuery ? 'Sonuç bulunamadı' : 'Şu an önerilecek kimse yok'}</Text>
          </View>
        )}

        {filteredDiscovery.map(item => {
          const isSent = sentRequests.includes(item.id);
          const accentColor = item.gender === 'female' ? '#e91e63' : '#3498db';
          const compat = calcCompat(user, item);
          const displayName = item.fullName ?? item.username;

          return (
            <View key={item.id} style={s.discCard}>
              {/* Avatar */}
              <View style={[s.discAvatar, { borderColor: accentColor }]}>
                {item.avatarUri ? (
                  <Image source={{ uri: item.avatarUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" blurRadius={user.isPro ? 0 : 6} />
                ) : (
                  <View style={[s.discAvatarFallback, { backgroundColor: accentColor + '20' }]}>
                    <Ionicons name="person" size={20} color={accentColor} />
                  </View>
                )}
              </View>

              {/* Bilgi */}
              <View style={s.discInfo}>
                <Text style={s.discName} numberOfLines={1}>{displayName}</Text>
                <Text style={s.discCompat}>{compatLabel(compat)} · %{compat}</Text>
                {item.interests.length > 0 ? (
                  <View style={s.interestRow}>
                    {item.interests.slice(0, 3).map(int => (
                      <View key={int} style={s.interestChip}>
                        <Ionicons name={INTEREST_ICON[int] ?? 'star-outline'} size={10} color={RED} />
                        <Text style={s.interestTxt}>{int}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={s.noInterests}>İlgi alanı eklenmemiş</Text>
                )}
              </View>

              {/* Buton */}
              {isSent ? (
                <TouchableOpacity style={s.cancelBtn} onPress={() => cancelMatchRequest(item.id)} activeOpacity={0.8}>
                  <Text style={s.cancelTxt}>Geri Çek</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.matchBtn} onPress={() => sendMatchRequest(item)} activeOpacity={0.8}>
                  <Text style={s.matchTxt}>Eşleş</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {mate ? renderActiveMatch() : renderDiscovery()}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Shared header
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  topUsername: { fontSize: 16, color: TEXT, fontWeight: '400', letterSpacing: -0.1 },
  pageTitle: { fontSize: 28, color: TEXT, fontWeight: '900', letterSpacing: -0.8 },
  settingsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },

  // Active match — insta head
  instaHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 16 },
  avatar: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 2 },
  statNum: { fontSize: 18, fontWeight: '900', color: TEXT, letterSpacing: -0.4 },
  statLabel: { fontSize: 11, color: TEXT3, fontWeight: '600' },

  bioArea: { paddingHorizontal: 16, paddingBottom: 8 },
  profileName: { fontSize: 14, fontWeight: '600', color: TEXT },

  tabDivider: { height: 0.5, backgroundColor: BORDER, marginTop: 8 },

  // Routine rows (home style)
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 16, backgroundColor: SURFACE },
  taskDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 20 },
  catIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  taskName: { fontSize: 14, color: TEXT, fontWeight: '500' },
  taskNameDone: { color: TEXT3, textDecorationLine: 'line-through' },
  taskMeta: { fontSize: 11, color: TEXT3, marginTop: 2 },
  congratsBlock: { flexDirection: 'row', alignItems: 'center', marginTop: 7, borderRadius: 6, overflow: 'hidden', backgroundColor: '#2A615115' },
  congratsBar: { width: 3, alignSelf: 'stretch', backgroundColor: '#2A6151' },
  congratsTxt: { fontSize: 11, color: '#2A6151', fontWeight: '600', paddingHorizontal: 8, paddingVertical: 6 },

  remindQuote: { flexDirection: 'row', alignItems: 'stretch', marginTop: 7, borderRadius: 6, overflow: 'hidden', backgroundColor: RED + '0D' },
  remindQuoteBar: { width: 3, backgroundColor: RED },
  remindQuoteContent: { flex: 1, paddingHorizontal: 8, paddingVertical: 5 },
  remindQuoteRoutine: { fontSize: 11, color: TEXT2, fontWeight: '600', marginBottom: 2 },
  remindQuoteAction: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  remindQuoteTxt: { fontSize: 11, color: RED, fontWeight: '600' },
  taskDotDone: { width: 26, height: 26, borderRadius: 13, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  taskDotPending: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: BORDER },

  empty: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyTxt: { fontSize: 14, color: TEXT2 },

  // Discovery — search
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 12, marginHorizontal: 16, marginBottom: 16, paddingHorizontal: 12, height: 42, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: TEXT },

  // Match requests
  reqSection: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  reqCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: SURFACE, borderRadius: 16, padding: 12 },
  reqAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, overflow: 'hidden', flexShrink: 0 },
  reqName: { fontSize: 15, color: TEXT, fontWeight: '700' },
  reqSub: { fontSize: 12, color: TEXT2, marginTop: 2 },
  reqActions: { flexDirection: 'row', gap: 8 },
  reqAcceptBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  reqRejectBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },

  // Discovery cards
  discSection: { paddingBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: TEXT3, letterSpacing: 0.8, paddingHorizontal: 16, marginBottom: 8 },
  discCard: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  discAvatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, overflow: 'hidden', flexShrink: 0 },
  discAvatarFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  discInfo: { flex: 1, gap: 3 },
  discName: { fontSize: 14, color: TEXT, fontWeight: '600' },
  discCompat: { fontSize: 12, color: TEXT2, fontWeight: '500' },
  interestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  interestChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: RED + '12', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  interestTxt: { fontSize: 11, color: RED, fontWeight: '600' },
  noInterests: { fontSize: 11, color: TEXT3, marginTop: 2 },
  matchBtn: { backgroundColor: RED, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  matchTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cancelBtn: { backgroundColor: SURFACE, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' },
  cancelTxt: { color: TEXT2, fontSize: 12, fontWeight: '600' },
});
