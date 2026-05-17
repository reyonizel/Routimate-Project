import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useStore, User, Mate, MatchRequest } from '../../store/useStore';
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

const today = new Date().toISOString().split('T')[0];
const BG='#FFFFFF'; const CARD='#F4F4F4'; const SURFACE='#EEEEEE';
const TEXT='#111111'; const TEXT2='#767676'; const TEXT3='#ABABAB';
const RED='#00bf63'; const GREEN='#008800'; const GOLD='#D4860A';
const BORDER='#E8E8E8'; const PILL=999;

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

  const calculateSimilarity = (other: Mate) => {
    if (!user.interests || !other.interests) return 0;
    const common = user.interests.filter(i => other.interests.includes(i));
    return common.length;
  };

  const sortedDiscovery = [...discoveryUsers]
    .filter(u => u.id !== user.id)
    .sort((a, b) => calculateSimilarity(b) - calculateSimilarity(a));

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

  const renderDiscovery = () => {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ height: 16 }} />

        {matchRequests.length > 0 && (
          <View style={s.requestSection}>
            <Text style={s.sectionHeaderDiscovery}>Eşleşme İstekleri</Text>
            {matchRequests.map(req => {
              const reqAccent = req.fromUser.gender === 'female' ? '#e91e63' : '#3498db';
              return (
                <View key={req.id} style={s.requestCard}>
                  <View style={[s.reqAvatarWrap, { borderColor: reqAccent }]}>
                    <Image source={{ uri: req.fromUser.avatarUri || '' }} style={s.reqAvatar} contentFit="cover" cachePolicy="memory-disk" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.reqText}><Text style={{ fontWeight: '800' }}>{req.fromUser.username}</Text> seninle eşleşmek istiyor.</Text>
                    <View style={s.reqBtnRow}>
                      <TouchableOpacity style={[s.reqBtn, s.acceptBtn]} onPress={() => acceptMatchRequest(req)}>
                        <Text style={s.acceptBtnTxt}>Kabul Et</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.reqBtn, s.rejectBtn]} onPress={() => rejectMatchRequest(req.id)}>
                        <Text style={s.rejectBtnTxt}>Reddet</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={s.discoverySection}>
          <Text style={s.sectionHeaderDiscovery}>Önerilen Kişiler</Text>
          {sortedDiscovery.length === 0 && (
            <View style={s.empty}>
              <Ionicons name="people-outline" size={40} color={TEXT3} />
              <Text style={s.emptyTxt}>Şu an önerilecek kimse yok</Text>
              <Text style={[s.emptyTxt, { fontSize: 12, marginTop: 4 }]}>Profil doldurunca eşleşmeler başlar</Text>
            </View>
          )}
          {sortedDiscovery.map(item => {
            const isSent = sentRequests.includes(item.id);
            const similarity = calculateSimilarity(item);
            const accentColor = item.gender === 'female' ? '#e91e63' : '#3498db';
            const compat = Math.min(70 + similarity * 10, 99);
            const displayName = item.fullName ?? item.username;

            return (
              <View key={item.id} style={s.discoveryCard}>
                {/* Avatar — blurred, gender border */}
                <View style={[s.discoveryAvatarWrap, { borderColor: accentColor }]}>
                  <Image
                    source={{ uri: item.avatarUri || '' }}
                    style={s.discoveryAvatar}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    blurRadius={6}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  {/* Name + compat */}
                  <View style={s.discoveryTopRow}>
                    <Text style={s.discoveryName}>{displayName}</Text>
                    <View style={s.similarityPill}>
                      <Text style={s.similarityTxt}>%{compat} uyum</Text>
                    </View>
                  </View>

                  {/* Interests */}
                  <View style={s.interestRow}>
                    {item.interests.slice(0, 3).map(int => {
                      const icon = INTEREST_ICON[int] ?? 'star-outline';
                      return (
                        <View key={int} style={s.interestChip}>
                          <Ionicons name={icon} size={11} color={TEXT3} />
                          <Text style={s.interestTxt}>{int}</Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Score + action */}
                  <View style={s.discoveryBottomRow}>
                    <View style={s.scoreRow}>
                      <Ionicons name="trophy" size={12} color={GOLD} />
                      <Text style={s.scoreTxt}>%{item.achievementScore} başarı</Text>
                    </View>
                    {isSent ? (
                      <TouchableOpacity style={s.cancelBtn} onPress={() => cancelMatchRequest(item.id)} activeOpacity={0.8}>
                        <Ionicons name="close" size={12} color={TEXT2} />
                        <Text style={s.cancelBtnTxt}>Geri Çek</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={[s.matchBtn, { backgroundColor: RED }]} onPress={() => sendMatchRequest(item)} activeOpacity={0.85}>
                        <Ionicons name="heart" size={12} color="#fff" />
                        <Text style={s.matchBtnTxt}>Eşleş</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
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
  discoverySpacer: { height: 16 },
  
  // Discovery Styles
  requestSection: { paddingHorizontal: 16, marginBottom: 8 },
  sectionHeaderDiscovery: { fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 10 },
  requestCard: { flexDirection: 'row', backgroundColor: CARD, padding: 12, borderRadius: 18, alignItems: 'center', marginBottom: 8, gap: 12 },
  reqAvatarWrap: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, overflow: 'hidden', flexShrink: 0 },
  reqAvatar: { width: '100%', height: '100%' },
  reqText: { fontSize: 13, color: TEXT, lineHeight: 17 },
  reqBtnRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  reqBtn: { flex: 1, paddingVertical: 7, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  acceptBtn: { backgroundColor: RED },
  acceptBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  rejectBtn: { backgroundColor: SURFACE },
  rejectBtnTxt: { color: TEXT2, fontSize: 12, fontWeight: '700' },

  discoverySection: { paddingHorizontal: 16 },
  discoveryCard: {
    flexDirection: 'row', gap: 14,
    backgroundColor: CARD, borderRadius: 18, padding: 14,
    marginBottom: 8,
  },
  discoveryAvatarWrap: { width: 58, height: 58, borderRadius: 29, borderWidth: 2.5, overflow: 'hidden', flexShrink: 0 },
  discoveryAvatar: { width: '100%', height: '100%' },
  discoveryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  discoveryName: { fontSize: 15, fontWeight: '800', color: TEXT, letterSpacing: -0.2 },
  similarityPill: { backgroundColor: SURFACE, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  similarityTxt: { fontSize: 10, fontWeight: '700', color: TEXT2 },
  interestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  interestChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: SURFACE, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  interestTxt: { fontSize: 11, fontWeight: '600', color: TEXT2 },
  discoveryBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreTxt: { fontSize: 12, color: TEXT2, fontWeight: '600' },
  matchBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  matchBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: SURFACE, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  cancelBtnTxt: { color: TEXT2, fontSize: 11, fontWeight: '700' },

  // Active Match Styles (Original)
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
});
