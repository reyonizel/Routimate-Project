import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, FlatList, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useStore, User, Mate, MatchRequest } from '../../store/useStore';
import { localDateStr } from '../../lib/date';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

const CircularProgress = ({ size = 72, strokeWidth = 5, progress = 0, color = '#000', children }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circum = radius * 2 * Math.PI;
  const dashoffset = circum - (Math.min(Math.max(progress, 0), 1) * circum);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Svg width={size} height={size}>
          <Circle stroke="#E8E8E8" fill="none" cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} />
          <Circle
            stroke={color}
            fill="none"
            cx={size/2}
            cy={size/2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circum} ${circum}`}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
          />
        </Svg>
      </View>
      {children}
    </View>
  );
};

const today = localDateStr();
const BG='#FFFFFF'; const CARD='#F4F4F4'; const SURFACE='#EEEEEE';
const TEXT='#111111'; const TEXT2='#767676'; const TEXT3='#ABABAB';
const RED='#00cc6d'; const GREEN='#008800'; const GOLD='#D4860A';
const BORDER='#E8E8E8'; const PILL=999;

// ── Uyumluluk algoritması ─────────────────────────────────────────────────────
function interestScore(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const common = a.filter(i => b.includes(i)).length;
  return common / Math.min(a.length, b.length);
}

function ageScore(dA?: string, dB?: string): number {
  if (!dA || !dB) return 0.5;
  const age = (d: string) => (Date.now() - new Date(d).getTime()) / (365.25 * 24 * 3600 * 1000);
  const diff = Math.abs(age(dA) - age(dB));
  if (diff <= 2) return 1.0;
  if (diff <= 5) return 0.8;
  if (diff <= 10) return 0.5;
  if (diff <= 15) return 0.2;
  return 0.0;
}

function commitmentScore(a: number, b: number): number {
  const diff = Math.abs(a - b);
  if (diff <= 10) return 1.0;
  if (diff <= 25) return 0.6;
  if (diff <= 50) return 0.3;
  return 0.0;
}

function locationScore(lat1?: number, lon1?: number, lat2?: number, lon2?: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0.5;
  const R = 6371;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  if (km < 10) return 1.0;
  if (km < 50) return 0.8;
  if (km < 100) return 0.5;
  if (km < 300) return 0.2;
  return 0.0;
}

function calcCompat(user: User, mate: Mate): number {
  const raw =
    interestScore(user.interests, mate.interests)    * 0.40 +
    ageScore(user.birthDate, mate.birthDate)          * 0.30 +
    commitmentScore(user.achievementScore, mate.achievementScore) * 0.20 +
    locationScore(user.locationLat, user.locationLon, mate.locationLat, mate.locationLon) * 0.10;
  return Math.round(raw * 59) + 40; // 40–99
}

function compatLabel(pct: number): string {
  if (pct >= 85) return 'Yüksek Uyum';
  if (pct >= 65) return 'İyi Uyum';
  return 'Temel Uyum';
}

const INTEREST_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'Yoga':        'body-outline',
  'Meditasyon':  'leaf-outline',
  'Koşu':        'footsteps-outline',
  'Fitness':     'barbell-outline',
  'Soğuk Duş':   'water-outline',
  'Kitap':       'book-outline',
  'Pilates':     'fitness-outline',
  'Beslenme':    'nutrition-outline',
  'Uyku':        'moon-outline',
  'Bisiklet':    'bicycle-outline',
  'Müzik':       'musical-notes-outline',
  'Yazarlık':    'pencil-outline',
  'Spor':        'basketball-outline',
};


export default function MateScreen() {
  const user = useStore(s => s.user);
  const mate = useStore(s => s.mate);
  const discoveryUsers = useStore(s => s.discoveryUsers);
  const matchRequests = useStore(s => s.matchRequests);
  const sentRequests = useStore(s => s.sentMatchRequests);
  
  const sendMatchRequest   = useStore(s => s.sendMatchRequest);
  const cancelMatchRequest = useStore(s => s.cancelMatchRequest);
  const acceptMatchRequest = useStore(s => s.acceptMatchRequest);
  const rejectMatchRequest = useStore(s => s.rejectMatchRequest);

  const router = useRouter();

  const sortedDiscovery = [...discoveryUsers]
    .filter(u => u.id !== user.id)
    .sort((a, b) => calcCompat(user, b) - calcCompat(user, a));

  const renderActiveMatch = () => {
    if (!mate) return null;
    const accent = mate.gender === 'female' ? '#e91e63' : '#3498db';
    const daysPassed = user.matchedSince ? Math.floor((Date.now() - new Date(user.matchedSince).getTime()) / 86400000) : 0;
    const doneToday = mate.routines.filter(r => r.completedDates.includes(today)).length;
    const FREQ_LABEL: Record<string,string> = { daily:'Günlük', weekly:'Haftalık', monthly:'Aylık' };

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>Rutinmate</Text>
        </View>

        <View style={s.mateCard}>
          <View style={s.mateTop}>
            <View style={[s.avatar, {borderColor: accent}]}>
              {user.isPro
                ? <Image source={{ uri: mate.avatarUri || '' }} style={{ width: '100%', height: '100%', borderRadius: PILL }} contentFit="cover" cachePolicy="memory-disk" />
                : <Ionicons name="lock-closed" size={20} color={TEXT3} />}
            </View>
            <View style={{flex:1}}>
              <Text style={s.mateName}>@{mate.username}</Text>
              <Text style={[s.mateScore, {color: accent}]}>{mate.achievementScore}% genel başarı</Text>
            </View>
            <TouchableOpacity style={s.profileBtn} onPress={() => router.push('/mate-profile')}>
              <Text style={s.profileBtnTxt}>Profil</Text>
              <Ionicons name="chevron-forward" size={14} color={TEXT2} />
            </TouchableOpacity>
          </View>

          <View style={s.stats}>
            <View style={s.statItem}>
              <CircularProgress size={40} strokeWidth={4} progress={mate.routines.length > 0 ? doneToday / mate.routines.length : 0} color={GREEN}>
                <Ionicons name="checkmark-outline" size={18} color={GREEN} />
              </CircularProgress>
              <View style={s.statTextGroup}>
                <Text style={s.statNum}>{doneToday}<Text style={s.statDenom}>/{mate.routines.length}</Text></Text>
                <Text style={s.statLabel}>Görev</Text>
              </View>
            </View>
            
            <View style={s.statItem}>
              <CircularProgress size={40} strokeWidth={4} progress={daysPassed / 30} color={accent}>
                <Ionicons name="calendar-outline" size={16} color={accent} />
              </CircularProgress>
              <View style={s.statTextGroup}>
                <Text style={s.statNum}>{daysPassed}<Text style={s.statDenom}>/30</Text></Text>
                <Text style={s.statLabel}>Geçen Gün</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Rutin Arkadaşım</Text>
        </View>

        {mate.routines.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="clipboard-outline" size={36} color={TEXT3} />
            <Text style={s.emptyTxt}>Mate'in rutini yok</Text>
          </View>
        ) : (
          <View style={s.list}>
            {[...mate.routines].sort((a,b) => (a.completedDates.includes(today) === b.completedDates.includes(today) ? 0 : a.completedDates.includes(today) ? -1 : 1)).map(r => (
              <View key={r.id} style={s.row}>
                <View style={[s.checkBox, {borderColor: r.completedDates.includes(today) ? GREEN : GOLD}]}>
                  {r.completedDates.includes(today) ? <Ionicons name="checkmark" size={14} color={GREEN} /> : <Ionicons name="hourglass-outline" size={10} color={GOLD} />}
                </View>
                <View style={{flex:1}}>
                  <Text style={[s.rowName, r.completedDates.includes(today) && {color: TEXT2}]}>{r.name}</Text>
                  <Text style={[s.rowMeta, r.completedDates.includes(today) && {color: TEXT3}]}>{FREQ_LABEL[r.frequency]} · {r.notificationTime}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{height:80}} />
      </ScrollView>
    );
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredDiscovery = sortedDiscovery.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.username.toLowerCase().includes(q) ||
      (item.fullName && item.fullName.toLowerCase().includes(q)) ||
      item.interests.some(i => i.toLowerCase().includes(q))
    );
  });

  const renderDiscovery = () => {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search bar */}
        <View style={s.searchWrap}>
          <Ionicons name="search" size={18} color={TEXT3} />
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
            <TouchableOpacity onPress={() => setSearchQuery('')} style={s.searchClear}>
              <Ionicons name="close-circle" size={18} color={TEXT3} />
            </TouchableOpacity>
          )}
        </View>

        {/* Match requests */}
        {matchRequests.length > 0 && (
          <View style={s.requestSection}>
            <Text style={s.igSectionTitle}>Eşleşme İstekleri</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
              {matchRequests.map(req => {
                const reqAccent = req.fromUser.gender === 'female' ? '#e91e63' : '#3498db';
                return (
                  <View key={req.id} style={s.requestStoryCard}>
                    <View style={[s.reqStoryAvatar, { borderColor: reqAccent }]}>
                      <Image source={{ uri: req.fromUser.avatarUri || '' }} style={{ width: '100%', height: '100%', borderRadius: 999 }} contentFit="cover" cachePolicy="memory-disk" />
                    </View>
                    <Text style={s.reqStoryName} numberOfLines={1}>{req.fromUser.username}</Text>
                    <View style={s.reqStoryBtns}>
                      <TouchableOpacity style={s.reqStoryAccept} onPress={() => acceptMatchRequest(req)}>
                        <Text style={s.reqStoryAcceptTxt}>Kabul</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.reqStoryReject} onPress={() => rejectMatchRequest(req.id)}>
                        <Text style={s.reqStoryRejectTxt}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Suggested — Instagram style */}
        <View style={s.suggestedSection}>
          <View style={s.suggestedHeader}>
            <Text style={s.igSectionTitle}>Önerilen Kişiler</Text>
            <Text style={s.igSeeAll}>Tümünü Gör</Text>
          </View>

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
              <View key={item.id} style={s.igCard}>
                {/* Avatar */}
                <View style={[s.igAvatarWrap, { borderColor: accentColor }]}>
                  {item.avatarUri ? (
                    <Image
                      source={{ uri: item.avatarUri }}
                      style={s.igAvatar}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      blurRadius={user.isPro ? 0 : 6}
                    />
                  ) : (
                    <View style={s.igAvatarFallback}>
                      <Ionicons name="person" size={22} color={accentColor} />
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={s.igInfo}>
                  <Text style={s.igName} numberOfLines={1}>{displayName}</Text>
                  <Text style={s.igCompat}>{compatLabel(compat)} · %{compat}</Text>
                  {item.interests.length > 0 ? (
                    <View style={s.igInterests}>
                      {item.interests.slice(0, 3).map(int => {
                        const icon = INTEREST_ICON[int] ?? 'star-outline';
                        return (
                          <View key={int} style={s.igInterestChip}>
                            <Ionicons name={icon} size={10} color="#2E7D32" />
                            <Text style={s.igInterestTxt}>{int}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={s.igNoInterests}>İlgi alanı eklenmemiş</Text>
                  )}
                </View>

                {/* Action button */}
                {isSent ? (
                  <TouchableOpacity style={s.igCancelBtn} onPress={() => cancelMatchRequest(item.id)} activeOpacity={0.8}>
                    <Text style={s.igCancelTxt}>Geri Çek</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={s.igFollowBtn} onPress={() => sendMatchRequest(item)} activeOpacity={0.8}>
                    <Text style={s.igFollowTxt}>Eşleş</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {mate ? renderActiveMatch() : renderDiscovery()}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {flex:1, backgroundColor:BG},
  header: {paddingHorizontal:20, paddingTop:24, paddingBottom:16},
  title: {fontSize:32, color:TEXT, fontWeight:'900', letterSpacing:-1},
  subTitle: {fontSize:14, color:TEXT2, marginTop:4, fontWeight:'500'},
  
  // Active Match
  mateCard: {marginHorizontal:16, paddingVertical:20, borderBottomWidth:1, borderBottomColor:BORDER},
  mateTop: {flexDirection:'row', alignItems:'center', gap:14, marginBottom:24},
  avatar: {width:56, height:56, borderRadius:28, borderWidth:2, backgroundColor:BG, alignItems:'center', justifyContent:'center'},
  mateName: {fontSize:18, color:TEXT, fontWeight:'800'},
  mateScore: {fontSize:13, fontWeight:'600', marginTop:2},
  profileBtn: {flexDirection:'row', alignItems:'center', gap:2},
  profileBtnTxt: {fontSize:13, color:TEXT2, fontWeight:'600'},
  stats: {flexDirection:'row', justifyContent:'space-between', gap:16, marginTop:16, marginBottom:8, paddingHorizontal:8},
  statItem: {flexDirection:'row', alignItems:'center', gap:12},
  statTextGroup: {alignItems:'flex-start'},
  statNum: {fontSize:16, color:TEXT, fontWeight:'900', letterSpacing:-0.5},
  statDenom: {fontSize:12, color:TEXT3, fontWeight:'700'},
  statLabel: {fontSize:10, color:TEXT2, marginTop:0, fontWeight:'700', letterSpacing:1},
  sectionHeader: {paddingHorizontal:16, paddingTop:24, paddingBottom:10},
  sectionTitle: {fontSize:22, color:TEXT, fontWeight:'900', letterSpacing:-0.5},
  list: {paddingHorizontal:16, paddingTop:4},
  row: {flexDirection:'row', alignItems:'center', gap:10, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:BORDER},
  checkBox: {width:20, height:20, borderRadius:10, borderWidth:1, alignItems:'center', justifyContent:'center', backgroundColor:BG},
  rowName: {fontSize:14, color:TEXT, fontWeight:'500'},
  rowMeta: {fontSize:11, color:TEXT3, marginTop:1},
  empty: {alignItems:'center', paddingTop:40, gap:12},
  emptyTxt: {fontSize:14, color:TEXT2},

  // Instagram-style Discovery
  searchWrap: {flexDirection:'row', alignItems:'center', backgroundColor:SURFACE, borderRadius:12, marginHorizontal:16, marginVertical:12, paddingHorizontal:12, height:40},
  searchInput: {flex:1, fontSize:14, color:TEXT, marginLeft:8},
  searchClear: {paddingLeft:8},

  // Match requests — horizontal stories
  requestSection: {paddingVertical:12},
  igSectionTitle: {fontSize:15, color:TEXT, fontWeight:'500', marginLeft:16, marginBottom:10},
  requestStoryCard: {width:90, alignItems:'center', gap:4},
  reqStoryAvatar: {width:64, height:64, borderRadius:32, borderWidth:2.5, overflow:'hidden'},
  reqStoryName: {fontSize:11, color:TEXT, fontWeight:'600', textAlign:'center'},
  reqStoryBtns: {flexDirection:'row', gap:4},
  reqStoryAccept: {backgroundColor:RED, borderRadius:6, paddingHorizontal:8, paddingVertical:3},
  reqStoryAcceptTxt: {color:'#fff', fontSize:10, fontWeight:'700'},
  reqStoryReject: {backgroundColor:SURFACE, borderRadius:6, width:24, height:24, alignItems:'center', justifyContent:'center'},
  reqStoryRejectTxt: {fontSize:10, color:TEXT2},

  // Suggested — Instagram card style
  suggestedSection: {paddingTop:0},
  suggestedHeader: {flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:16, marginBottom:10, marginTop:12},
  igSeeAll: {fontSize:13, color:TEXT2, fontWeight:'600'},
  igCard: {flexDirection:'row', alignItems:'flex-start', paddingHorizontal:16, paddingVertical:12, gap:12},
  igAvatarWrap: {width:44, height:44, borderRadius:22, borderWidth:2, overflow:'hidden', flexShrink:0},
  igAvatar: {width:'100%', height:'100%'},
  igAvatarFallback: {width:'100%', height:'100%', backgroundColor:SURFACE, alignItems:'center', justifyContent:'center'},
  igInfo: {flex:1, gap:3},
  igName: {fontSize:14, color:TEXT, fontWeight:'600'},
  igCompat: {fontSize:12, color:TEXT2, fontWeight:'500'},
  igInterests: {flexDirection:'row', flexWrap:'wrap', gap:4, marginTop:4},
  igInterestChip: {flexDirection:'row', alignItems:'center', gap:3, backgroundColor:'#E8F5E9', borderRadius:6, paddingHorizontal:8, paddingVertical:4, borderWidth:0.5, borderColor:'#C8E6C9'},
  igInterestTxt: {fontSize:11, color:'#2E7D32', fontWeight:'600'},
  igNoInterests: {fontSize:11, color:TEXT3, marginTop:2},
  igFollowBtn: {backgroundColor:RED, borderRadius:8, paddingHorizontal:16, paddingVertical:7},
  igFollowTxt: {color:'#fff', fontSize:13, fontWeight:'700'},
  igCancelBtn: {backgroundColor:SURFACE, borderRadius:8, paddingHorizontal:12, paddingVertical:7},
  igCancelTxt: {color:TEXT2, fontSize:12, fontWeight:'600'},
});
