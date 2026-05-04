import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
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
const RED='#E60023'; const GREEN='#008800'; const GOLD='#D4860A';
const BORDER='#E8E8E8'; const PILL=999;

export default function MateScreen() {
  const user = useStore(s => s.user);
  const mate = useStore(s => s.mate);
  const discoveryUsers = useStore(s => s.discoveryUsers);
  const matchRequests = useStore(s => s.matchRequests);
  const sentRequests = useStore(s => s.sentMatchRequests);
  
  const sendMatchRequest = useStore(s => s.sendMatchRequest);
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
                ? <Image source={{ uri: mate.avatarUri || '' }} style={{ width: '100%', height: '100%', borderRadius: PILL }} />
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
        <View style={s.header}>
          <Text style={s.title}>Keşfet</Text>
          <Text style={s.subTitle}>Sana en uygun rutin arkadaşını bul</Text>
        </View>

        {matchRequests.length > 0 && (
          <View style={s.requestSection}>
            <Text style={s.sectionHeaderDiscovery}>Eşleşme İstekleri</Text>
            {matchRequests.map(req => (
              <View key={req.id} style={s.requestCard}>
                <Image source={{ uri: req.fromUser.avatarUri || '' }} style={s.reqAvatar} />
                <View style={{ flex: 1, marginLeft: 12 }}>
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
            ))}
          </View>
        )}

        <View style={s.discoverySection}>
          <Text style={s.sectionHeaderDiscovery}>Önerilen Kişiler</Text>
          {sortedDiscovery.map(item => {
            const isSent = sentRequests.includes(item.id);
            const similarity = calculateSimilarity(item);
            const accentColor = item.gender === 'female' ? '#e91e63' : '#3498db';

            return (
              <View key={item.id} style={s.discoveryCard}>
                <Image source={{ uri: item.avatarUri || '' }} style={s.discoveryAvatar} />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <View style={s.discoveryTopRow}>
                    <Text style={s.discoveryName}>@{item.username}</Text>
                    <View style={[s.similarityPill, { backgroundColor: accentColor + '15' }]}>
                      <Text style={[s.similarityTxt, { color: accentColor }]}>%{70 + similarity * 10} Uyum</Text>
                    </View>
                  </View>
                  <Text style={s.discoveryInterests}>{item.interests.slice(0, 3).join(' · ')}</Text>
                  <View style={s.discoveryBottomRow}>
                    <View style={s.scoreRow}>
                      <Ionicons name="trophy" size={12} color={GOLD} />
                      <Text style={s.scoreTxt}>{item.achievementScore} Başarı</Text>
                    </View>
                    <TouchableOpacity 
                      style={[s.matchBtn, isSent && s.matchBtnSent, { backgroundColor: accentColor }]} 
                      onPress={() => !isSent && sendMatchRequest(item)}
                      disabled={isSent}
                    >
                      <Text style={s.matchBtnTxt}>{isSent ? 'İstek Gönderildi' : 'Eşleş'}</Text>
                      {!isSent && <Ionicons name="heart" size={14} color="#fff" />}
                    </TouchableOpacity>
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
  
  // Discovery Styles
  requestSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeaderDiscovery: { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 12 },
  requestCard: { flexDirection: 'row', backgroundColor: CARD, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  reqAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: SURFACE },
  reqText: { fontSize: 13, color: TEXT, lineHeight: 18 },
  reqBtnRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  reqBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  acceptBtn: { backgroundColor: RED },
  acceptBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  rejectBtn: { backgroundColor: SURFACE },
  rejectBtnTxt: { color: TEXT2, fontSize: 12, fontWeight: '700' },

  discoverySection: { paddingHorizontal: 20 },
  discoveryCard: { flexDirection: 'row', backgroundColor: BG, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  discoveryAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: CARD },
  discoveryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  discoveryName: { fontSize: 17, fontWeight: '800', color: TEXT },
  similarityPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  similarityTxt: { fontSize: 11, fontWeight: '800' },
  discoveryInterests: { fontSize: 13, color: TEXT2, marginTop: 4 },
  discoveryBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreTxt: { fontSize: 12, color: TEXT2, fontWeight: '600' },
  matchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  matchBtnSent: { backgroundColor: TEXT3, opacity: 0.7 },
  matchBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },

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
