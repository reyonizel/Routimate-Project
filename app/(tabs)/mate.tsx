import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import Svg, { Circle } from 'react-native-svg';

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
  const router = useRouter();
  const accent = mate.gender === 'female' ? '#e91e63' : '#3498db';

  const daysPassed = Math.floor((Date.now() - new Date(user.matchedSince).getTime()) / 86400000);
  const daysLeft = Math.max(30 - daysPassed, 0);
  const matchPct = Math.min(Math.floor((daysPassed / 30) * 100), 100);
  const doneToday = mate.routines.filter(r => r.completedDates.includes(today)).length;

  const FREQ_LABEL: Record<string,string> = { daily:'Günlük', weekly:'Haftalık', monthly:'Aylık' };
  const FREQ_COLOR: Record<string,string> = { daily:'#2980b9', weekly:'#8e44ad', monthly:'#d35400' };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Rutinmate</Text>
          {!user.isPro && (
            <TouchableOpacity style={s.headerPro} activeOpacity={0.7} onPress={() => router.push('/modal')}>
              <View style={s.headerProTop}>
                <FontAwesome5 name="crown" size={10} color={RED} />
                <Text style={s.headerProTxt}>Pro'ya Geç</Text>
              </View>
              <Text style={s.headerProSub}>profil kilidini aç</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Mate summary minimal */}
        <View style={s.mateCard}>
          <View style={s.mateTop}>
            <View style={[s.avatar, {borderColor: accent}]}>
              {user.isPro
                ? <Text style={[s.avatarLetter, {color: accent}]}>{mate.username[0].toUpperCase()}</Text>
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

          {/* Stats inline side-by-side with Circular Loaders */}
          <View style={s.stats}>
            <View style={s.statItem}>
              <CircularProgress 
                size={40} 
                strokeWidth={4} 
                progress={mate.routines.length > 0 ? doneToday / mate.routines.length : 0} 
                color={GREEN}
              >
                <Ionicons name="checkmark-outline" size={18} color={GREEN} />
              </CircularProgress>
              <View style={s.statTextGroup}>
                <Text style={s.statNum}>{doneToday}<Text style={s.statDenom}>/{mate.routines.length}</Text></Text>
                <Text style={s.statLabel}>Görev</Text>
              </View>
            </View>
            
            <View style={s.statItem}>
              <CircularProgress 
                size={40} 
                strokeWidth={4} 
                progress={daysPassed / 30} 
                color={accent}
              >
                <Ionicons name="calendar-outline" size={16} color={accent} />
              </CircularProgress>
              <View style={s.statTextGroup}>
                <Text style={s.statNum}>{daysPassed}<Text style={s.statDenom}>/30</Text></Text>
                <Text style={s.statLabel}>Geçen Gün</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Routines list */}
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
            {[...mate.routines]
              .sort((a, b) => {
                const aDone = a.completedDates.includes(today);
                const bDone = b.completedDates.includes(today);
                return aDone === bDone ? 0 : aDone ? -1 : 1;
              })
              .map(r => {
                const done = r.completedDates.includes(today);
                return (
                  <View key={r.id} style={s.row}>
                    <View style={[s.checkBox, {borderColor: done ? GREEN : GOLD}]}>
                      {done 
                        ? <Ionicons name="checkmark" size={14} color={GREEN} />
                        : <Ionicons name="hourglass-outline" size={10} color={GOLD} />}
                    </View>
                    <View style={{flex:1}}>
                      <Text style={[s.rowName, done && {color: TEXT2}]}>{r.name}</Text>
                      <Text style={[s.rowMeta, done && {color: TEXT3}]}>{FREQ_LABEL[r.frequency]} · {r.notificationTime}</Text>
                    </View>
                  </View>
                );
            })}
          </View>
        )}

        <View style={{height:80}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {flex:1, backgroundColor:BG},
  header: {flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop:16, paddingBottom:8},
  title: {fontSize:24, color:TEXT, fontWeight:'900', letterSpacing:-0.5},
  
  headerPro:   { alignItems:'flex-end', justifyContent:'center' },
  headerProTop:{ flexDirection:'row', alignItems:'center', gap:4 },
  headerProTxt:{ fontSize:12, color:RED, fontWeight:'800' },
  headerProSub:{ fontSize:9, color:TEXT3, marginTop:2, fontWeight:'600' },
  
  mateCard: {marginHorizontal:16, paddingVertical:20, borderBottomWidth:1, borderBottomColor:BORDER},
  mateTop: {flexDirection:'row', alignItems:'center', gap:14, marginBottom:24},
  avatar: {width:56, height:56, borderRadius:28, borderWidth:2, backgroundColor:BG, alignItems:'center', justifyContent:'center'},
  avatarLetter: {fontSize:24, fontWeight:'900'},
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
