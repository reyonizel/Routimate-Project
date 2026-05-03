import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Dimensions, Alert, Image, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';

const BG='#FFFFFF'; const CARD='#F4F4F4'; const SURFACE='#EEEEEE';
const TEXT='#111111'; const TEXT2='#767676'; const TEXT3='#ABABAB';
const RED='#E60023'; const GOLD='#D4860A'; const BORDER='#E8E8E8'; const PILL=999;

const QUESTIONS = [
  'Bugün rutinlerini tamamladın mı? 👀',
  'Neden geciktiriyorsun, hesap ver!',
  'Hangi rutini bu hafta es geçtin?',
  'Motivasyon kaynağın nedir?',
  'Bu haftaki hedefin ne?',
  'Kaç gündür aralıksız gidiyorsun?',
  'Sabah rutinine sadık kalabiliyor musun?',
  'Zor günlerde nasıl devam ediyorsun?',
  'Hangi rutini en çok kaçırmak istiyorsun?',
  'Bu ay neyi değiştirdin?',
  'Spor mu yoksa meditasyon mu daha zor?',
  'Uyku düzenin nasıl gidiyor?',
  'Sıradaki hedefin ne?',
  'Hangi alışkanlığından en çok gurur duyuyorsun?',
  'Bugün ekstra bir şey yaptın mı?',
  'Hangi gün en çok zorlanıyorsun?',
  'Haftasonu rutinlerin var mı?',
  'Kendine ne vaadin var?',
  'Yıl sonuna kadar nerede olmak istiyorsun?',
  'Bu rutini bırakmayı düşündün mü hiç?',
];

const ANSWERS = [
  'Evet, hepsini tamamladım! 💪',
  'Hayır, bugün dinlenme günüm.',
  'Biraz gecikmeli ama devam ediyorum.',
  'Yarın kesinlikle telafi edeceğim!',
  'Zaten yaptım, sen takipte kal!',
  'Motivasyonum biraz düşük şu an.',
  'Biraz zorlandım ama yaptım.',
  'Beklenmedik bir şey çıktı, affet!',
  '%80 tamamladım, fena değil!',
  'Tamamen unuttum, özür dilerim!',
  'Harika gidiyorum, endişelenme!',
  'Enerji seviyem çok yüksek bugün!',
  'Bu hafta rekoru kırdım! 🏆',
  'Her şey planlandığı gibi.',
  'Dün çift yaptım, bugün dinleniyorum.',
  'Sabahları zorlanıyorum, geceleri telafi!',
  'Adım adım ilerliyorum!',
  'Senin sayende motive oldum! ❤️',
  'Bugün ekstra 1 saat daha çalıştım!',
  'Hep böyle olursa süper olur!',
];

type QATab = 'ask' | 'answer';

// Split array into pairs for 2-row horizontal layout
function toPairs<T>(arr: T[]): [T, T | null][] {
  const pairs: [T, T | null][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    pairs.push([arr[i], arr[i + 1] ?? null]);
  }
  return pairs;
}

export default function DMScreen() {
  const user        = useStore(s => s.user);
  const mate        = useStore(s => s.mate);
  const messages    = useStore(s => s.messages);
  const sendMessage = useStore(s => s.sendMessage);
  const deleteMessage = useStore(s => s.deleteMessage);
  const accent      = user.gender === 'female' ? '#e91e63' : '#3498db';

  const [input, setInput] = useState('');
  const [tab, setTab]     = useState<QATab>('ask');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const msgRef = useRef<ScrollView>(null);

  const handleTabPress = (val: QATab, idx: number) => {
    setTab(val);
    Animated.spring(slideAnim, {
      toValue: idx,
      useNativeDriver: true,
      bounciness: 0,
      speed: 16
    }).start();
  };

  const TAB_DATA: [QATab, string][] = [['ask', 'Soru Sor'], ['answer', 'Cevap Ver']];
  const tabWidth = Dimensions.get('window').width / 2;

  const send = (text: string) => {
    sendMessage(text);
    setTimeout(() => msgRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const handleLongPress = (m: typeof messages[0]) => {
    if (!m.sentByMe) return;
    const diff = Date.now() - new Date(m.timestamp).getTime();
    if (diff <= 30000) {
      Alert.alert('Mesajı Sil', 'Bu mesajı silmek istiyor musun?', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => deleteMessage(m.id) }
      ]);
    } else {
      Alert.alert('Süre Doldu', 'Sadece ilk 30 saniye içinde mesaj silebilirsin.');
    }
  };



  return (
    <SafeAreaView style={s.container} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={[s.avatar, { overflow: 'hidden' }]}>
          <Image 
            source={{ uri: `https://i.pravatar.cc/150?u=${mate.username}` }} 
            style={{ width: '100%', height: '100%' }}
            blurRadius={user.isPro ? undefined : 12}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.mateName}>{mate.username}</Text>
          <View style={s.onlineRow}>
            <View style={s.dot} /><Text style={s.onlineTxt}>Şu an aktif</Text>
          </View>
        </View>
        {!user.isPro && (
          <TouchableOpacity style={s.headerPro} activeOpacity={0.7} onPress={() => Alert.alert('Pro Özellik', 'Serbest mesajlaşmak için Pro üyeliğe geçiş yapmalısın.')}>
            <View style={s.headerProTop}>
              <FontAwesome5 name="crown" size={10} color={RED} />
              <Text style={s.headerProTxt}>Pro'ya Geç</Text>
            </View>
            <Text style={s.headerProSub}>serbest mesajlaş</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Messages ── */}
      <ScrollView ref={msgRef} style={s.messages} showsVerticalScrollIndicator={false}>
        <View style={s.datePill}><Text style={s.dateTxt}>Bugün</Text></View>
        {messages.map(m => {
          const t = new Date(m.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
          return (
            <View key={m.id} style={[s.bubbleRow, m.sentByMe && { justifyContent: 'flex-end' }]}>
              {!m.sentByMe && (
                <View style={[s.bubbleAvatar, { overflow: 'hidden' }]}>
                  <Image 
                    source={{ uri: `https://i.pravatar.cc/150?u=${mate.username}` }} 
                    style={{ width: '100%', height: '100%' }}
                    blurRadius={user.isPro ? undefined : 8}
                  />
                </View>
              )}
              <TouchableOpacity 
                style={[s.bubble, m.sentByMe ? s.bubbleMine : s.bubbleMate]}
                activeOpacity={m.sentByMe ? 0.7 : 1}
                onLongPress={() => handleLongPress(m)}
                delayLongPress={300}
              >
                <Text style={[s.bubbleTxt, m.sentByMe && { color: '#fff' }]}>{m.text}</Text>
                <Text style={[s.bubbleTime, m.sentByMe && { color: 'rgba(255,255,255,0.55)' }]}>{t}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
        <View style={{ height: 10 }} />
      </ScrollView>

      {/* ─── Quick Reply Section (non-Pro) ─── */}
      {!user.isPro && (
        <View style={s.quickWrap}>

          {/* Tab bar — elegant style */}
        <View style={s.tabs}>
          <Animated.View style={[s.tabIndicator, {
            width: tabWidth,
            transform: [{
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, tabWidth]
              })
            }]
          }]} />
          {TAB_DATA.map(([val, lbl], idx) => {
            const on = tab === val;
            return (
              <TouchableOpacity key={val} style={s.tab} onPress={() => handleTabPress(val, idx)}>
                <Text style={[s.tabText, on && s.tabTextActive]}>{lbl}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2-row horizontal chip carousel */}
        <ScrollView
          key={tab}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipScroll}
        >
          {toPairs(tab === 'ask' ? QUESTIONS : ANSWERS).map(([top, bottom], idx) => (
            <View key={idx} style={s.chipCol}>
              <TouchableOpacity
                style={s.chip}
                onPress={() => send(top)}
                activeOpacity={0.7}
              >
                <Text style={s.chipTxt} numberOfLines={2}>{top}</Text>
              </TouchableOpacity>
              {bottom && (
                <TouchableOpacity
                  style={s.chip}
                  onPress={() => send(bottom)}
                  activeOpacity={0.7}
                >
                  <Text style={s.chipTxt} numberOfLines={2}>{bottom}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          </ScrollView>
        </View>
      )}

      {/* ── Input ── */}
      {user.isPro && (
        <View style={s.inputBar}>
          <TextInput
            style={[s.textInput, input.length > 0 && { borderColor: TEXT }]}
            value={input}
            onChangeText={setInput}
            placeholder="Mesaj yaz..."
            placeholderTextColor={TEXT3}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[s.sendBtn, !!input.trim() && s.sendBtnOn]}
            onPress={() => { if (input.trim()) { send(input.trim()); setInput(''); } }}
          >
            <Ionicons name="send" size={15} color={input.trim() ? '#fff' : TEXT3} />
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: BG },

  header:      { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:BORDER },
  avatar:      { width:44, height:44, borderRadius:22, alignItems:'center', justifyContent:'center', backgroundColor:SURFACE },
  avatarLetter:{ fontSize:18, fontWeight:'900' },
  mateName:    { fontSize:16, color:TEXT, fontWeight:'700' },
  onlineRow:   { flexDirection:'row', alignItems:'center', gap:5, marginTop:2 },
  dot:         { width:6, height:6, borderRadius:3, backgroundColor:'#008800' },
  onlineTxt:   { fontSize:12, color:TEXT2, fontWeight:'500' },

  headerPro:   { alignItems:'flex-end', justifyContent:'center', paddingLeft:8 },
  headerProTop:{ flexDirection:'row', alignItems:'center', gap:4 },
  headerProTxt:{ fontSize:12, color:RED, fontWeight:'800' },
  headerProSub:{ fontSize:9, color:TEXT3, marginTop:2, fontWeight:'600' },

  messages:    { flex:1, paddingHorizontal:14 },
  datePill:    { alignItems:'center', paddingVertical:16 },
  dateTxt:     { fontSize:11, color:TEXT3, fontWeight:'600' },
  bubbleRow:   { flexDirection:'row', alignItems:'flex-end', marginBottom:8, gap:7 },
  bubbleAvatar:{ width:26, height:26, borderRadius:13, alignItems:'center', justifyContent:'center' },
  bubble:      { maxWidth:'75%', borderRadius:20, paddingHorizontal:14, paddingVertical:10 },
  bubbleMine:  { backgroundColor:RED },
  bubbleMate:  { backgroundColor:CARD },
  bubbleTxt:   { fontSize:14, color:TEXT, lineHeight:19 },
  bubbleTime:  { fontSize:10, color:TEXT3, marginTop:4, alignSelf:'flex-end' },

  // Quick section
  quickWrap: { 
    paddingTop: 0, 
    backgroundColor: BG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 15,
    borderTopWidth: 0,
  },

  // Tabs
  tabs:        { flexDirection:'row', borderBottomWidth:0.5, borderBottomColor:BORDER, marginBottom:8, position:'relative' },
  tabIndicator:{ position:'absolute', bottom:-0.5, left:0, height:2, backgroundColor:TEXT },
  tab:         { flex:1, paddingVertical:8, alignItems:'center' },
  tabText:     { fontSize:12, color:TEXT2, fontWeight:'500' },
  tabTextActive:{ color:TEXT, fontWeight:'700' },

  // 2-row chip scroll
  chipScroll:  { paddingLeft:14, paddingRight:8, paddingBottom:12, gap:8 },
  chipCol:     { gap:8, flexDirection:'column', maxWidth:200 },
  chip:        { borderRadius:14, backgroundColor:'#FFF5F6', borderWidth:1, borderColor:'#FFE0E5', paddingHorizontal:12, paddingVertical:8, maxWidth:200 },
  chipTxt:     { fontSize:12, fontWeight:'500', lineHeight:16, color:TEXT },

  // Input
  inputBar:   { flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:16, paddingVertical:10, borderTopWidth:0.5, borderTopColor:BORDER },
  textInput:  { flex:1, backgroundColor:CARD, borderRadius:22, paddingHorizontal:20, paddingTop:12, paddingBottom:12, fontSize:15, color:TEXT, maxHeight:90 },
  sendBtn:    { width:44, height:44, borderRadius:22, backgroundColor:SURFACE, alignItems:'center', justifyContent:'center' },
  sendBtnOn:  { backgroundColor:RED },
});
