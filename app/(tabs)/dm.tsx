import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, Dimensions, KeyboardAvoidingView, Platform, Modal, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useStore, Message } from '../../store/useStore';
import { useRouter } from 'expo-router';
import { MessageAPI } from '../../lib/api';

const { width: SW } = Dimensions.get('window');

// â”€â”€ Palette â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CHAT_BG = '#FCF7F0';
const ME_BG   = '#2A6151';
const MATE_BG = '#F5EDE0';
const TEXT    = '#0A3B25';
const TEXT2   = '#3D6B58';
const TEXT3   = '#B2B7AA';
const BORDER  = '#B2B7AA';
const SURFACE = '#F5EDE0';
const GOLD    = '#D8C2A4';
const GREEN   = '#2A6151';


// â”€â”€ Quick-reply answer map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const QR_ANSWER_MAP: { keys: string[]; replies: string[] }[] = [
  {
    keys: ['rutin', 'tamamla', 'yaptın', 'hedef', 'görev'],
    replies: ['Evet, hepsini tamamladım! 💪', 'Birkaçını atlayabildim 😅', 'Henüz yapmadım, birazdan olacak', 'Bugün tam gaz! 🔥'],
  },
  {
    keys: ['nasıl', 'naber', 'ne haber', 'gidiyor', 'günün', 'nasılsın'],
    replies: ['İyiyim, sen nasılsın? 😊', 'Çok iyi gidiyor! 🔥', 'İdare eder 😊', 'Harika, teşekkürler!'],
  },
  {
    keys: ['neler yapıyorsun', 'ne yapıyorsun', 'neler'],
    replies: ['Rutinlerime odaklanıyorum 🎯', 'Biraz dinleniyorum ☕', 'Çalışıyorum, sen?', 'Spora gitmeye hazırlanıyorum 💪'],
  },
  {
    keys: ['mutlu'],
    replies: ['Rutinimi tamamlamak! 🎯', 'Güzel bir kahve içmek ☕', 'Beklemediğim güzel bir haber almak ✨', 'Henüz pek bir şey olmadı 😅'],
  },
  {
    keys: ['motivasyon', 'motive'],
    replies: ['Motivasyonum çok yüksek! 🚀', 'Bugün biraz düşük 😔', 'Sen motive ettin beni 💪', 'Her gün daha iyi hissediyorum'],
  },
  {
    keys: ['zor', 'zorlan', 'başaramıy'],
    replies: ['Devam et, yapabilirsin! 💪', 'Ben de aynı şekilde hissediyorum', 'Yarın daha iyi olacak', 'Küçük adımlar önemli 🎯'],
  },
  {
    keys: ['uyku', 'sabah', 'erken'],
    replies: ['Uyku düzenim iyi! 😴', 'Erken kalkmak zor 😅', 'Sabah rutini harika gidiyor', 'Dün geç yattım maalesef'],
  },
  {
    keys: ['spor', 'egzersiz', 'antrenman', 'koşu', 'yoga', 'pilates'],
    replies: ['Az önce bitirdim! 💪', 'Harika hissettirdi! 🔥', 'Bugün es geçtim 😅', 'Her gün yapıyorum!'],
  },
];
const QR_DEFAULT = ['Harika! 💪', 'Teşekkürler 😊', 'Anladım 👍', 'Biraz sonra yazacağım'];

function getAnswerReplies(text: string): string[] {
  const lower = text.toLowerCase();
  for (const { keys, replies } of QR_ANSWER_MAP) {
    if (keys.some(k => lower.includes(k))) return replies;
  }
  return QR_DEFAULT;
}

// â”€â”€ Question bank â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ALL_QUESTIONS = [
  // Rutin
  'Bugün tüm rutinlerini tamamladın mı? 👀',
  'Bu haftaki hedeflerine ulaşıyor musun? 🎯',
  'Hangi rutini en çok seviyorsun?',
  'En çok hangi rutinde zorlanıyorsun?',
  'Hafta sonları da rutinlerine sadık mısın?',
  'Bugün ekstra bir şey yaptın mı? 💪',
  'Bu ay kaç gün rutinini atladın?',
  'Sabah mı akşam mı rutin yapmayı tercih edersin?',
  'Bir rutini bırakmayı düşündüğünde ne yapıyorsun?',
  // Motivasyon
  'Motivasyonun şu sıralar nasıl? 🔥',
  'Seni en çok ne motive ediyor?',
  'Bu ay en büyük başarın ne oldu? 🏆',
  'Sıradaki büyük hedefin ne?',
  'Hedefine ne kadar yakınsın?',
  'Kendin için koyduğun en zorlu kural nedir?',
  // Sağlık & Spor
  'Bugün spor yaptın mı?',
  'Uyku düzenin nasıl? 😴',
  'Kaç saatlik uyku aldın?',
  'Beslenme düzenin nasıl?',
  'Suyu yeterince içiyor musun? 💧',
  'Soğuk duş denedin mi hiç?',
  'En sevdiğin egzersiz nedir?',
  // Genel
  'Merhaba, nasılsın? 👋',
  'Bugün nasıldı? ✨',
  'Neler yapıyorsun?',
  'Bugün seni en çok ne mutlu etti? 😊',
  'Bugün nasıl hissediyorsun?',
  'Bu hafta nasıl geçti?',
  'Kendin için ne yaptın bugün? 💚',
  'Stresliysen nasıl başa çıkıyorsun?',
  'En büyük hayalin ne?',
];

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function msgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}
function dateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(today); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Bugün';
  if (d.toDateString() === yest.toDateString()) return 'Dün';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

const GROUP_THRESHOLD = 3 * 60 * 1000;

type ChatItem =
  | { type: 'date';       id: string; label: string }
  | { type: 'msg';        id: string; msg: Message; isFirst: boolean; isLast: boolean }
  | { type: 'quickreply'; id: string; replies: string[] };

function buildChatItems(messages: Message[]): ChatItem[] {
  const items: ChatItem[] = [];
  let lastDate = '';

  messages.forEach((msg, i) => {
    const dateKey = new Date(msg.timestamp).toDateString();
    if (dateKey !== lastDate) {
      lastDate = dateKey;
      items.push({ type: 'date', id: `date-${dateKey}`, label: dateLabel(msg.timestamp) });
    }
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const sameAsPrev = prev && prev.sentByMe === msg.sentByMe &&
      new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime() < GROUP_THRESHOLD;
    const sameAsNext = next && next.sentByMe === msg.sentByMe &&
      new Date(next.timestamp).getTime() - new Date(msg.timestamp).getTime() < GROUP_THRESHOLD;
    items.push({ type: 'msg', id: msg.id, msg, isFirst: !sameAsPrev, isLast: !sameAsNext });
  });

  // Quick replies only when last message is received
  const lastMsg = messages[messages.length - 1];
  if (lastMsg && !lastMsg.sentByMe) {
    items.push({ type: 'quickreply', id: 'qr', replies: getAnswerReplies(lastMsg.text) });
  }

  return items;
}

// â”€â”€ Bubble â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type BubbleProps = {
  item: Extract<ChatItem, { type: 'msg' }>;
  mateAvatarUri: string;
  mateAccent: string;
  isPro: boolean;
  onLongPress: (id: string) => void;
};

const Bubble = React.memo(({ item, mateAvatarUri, mateAccent, isPro, onLongPress }: BubbleProps) => {
  const { msg, isFirst, isLast } = item;
  const mine = msg.sentByMe;
  const radius = {
    borderTopLeftRadius:     mine ? 18 : (isFirst ? 4 : 18),
    borderTopRightRadius:    mine ? (isFirst ? 4 : 18) : 18,
    borderBottomLeftRadius:  mine ? 18 : (isLast ? 4 : 18),
    borderBottomRightRadius: mine ? (isLast ? 4 : 18) : 18,
  };
  return (
    <View style={[s.bubbleRow, mine ? s.bubbleRowMine : s.bubbleRowMate, isFirst ? s.groupFirst : s.groupContinue]}>
      {!mine && (
        isLast
          ? <View style={[s.avatarSmall, { borderColor: mateAccent }]}>
              <Image source={{ uri: mateAvatarUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" blurRadius={isPro ? 0 : 8} />
            </View>
          : <View style={s.avatarSmallPlaceholder} />
      )}
      <TouchableOpacity activeOpacity={0.8} onLongPress={() => onLongPress(msg.id)} delayLongPress={350}
        style={[s.bubble, mine ? s.bubbleMine : s.bubbleMate, radius]}>
        <Text style={[s.bubbleTxt, mine && s.bubbleTxtMine]}>{msg.text}</Text>
        <View style={s.bubbleMeta}>
          <Text style={[s.bubbleTime, mine && s.bubbleTimeMine]}>{msgTime(msg.timestamp)}</Text>
          {mine && <Ionicons name="checkmark-done" size={13} color="rgba(255,255,255,0.7)" style={{ marginLeft: 2 }} />}
        </View>
      </TouchableOpacity>
    </View>
  );
});

// â”€â”€ QuickReplyList â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const QuickReplyList = React.memo(({ replies, onSend }: { replies: string[]; onSend: (t: string) => void }) => (
  <View style={s.qrSection}>
    <Text style={s.qrLabel}>Yanıt Ver</Text>
    {replies.map((r, i) => (
      <TouchableOpacity key={i} style={s.qrPill} onPress={() => onSend(r)} activeOpacity={0.65}>
        <Text style={s.qrPillTxt}>{r}</Text>
      </TouchableOpacity>
    ))}
  </View>
));

// â”€â”€ Main screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function DMScreen() {
  const isPro         = useStore(s => s.user.isPro);
  const userId        = useStore(s => s.user.id);
  const storeMate     = useStore(s => s.mate);
  const matchId       = useStore(s => s.matchId);
  const storeMessages = useStore(s => s.messages);
  const sendMessage   = useStore(s => s.sendMessage);
  const deleteMessage = useStore(s => s.deleteMessage);
  const appendMessage = useStore(s => s.appendMessage);
  const unmatch       = useStore(s => s.unmatch);
  const router        = useRouter();

  const mate     = storeMate;
  const messages = storeMessages;

  // Supabase Realtime subscription for live messages
  useEffect(() => {
    if (!matchId || !userId) return;
    const channel = MessageAPI.subscribeToMatch(matchId, userId, (msg) => {
      if (!msg.sentByMe) appendMessage(msg);
    });
    return () => { channel.unsubscribe(); };
  }, [matchId, userId, appendMessage]);

  const [input, setInput]           = useState('');
  const [sheetMsgId, setSheetMsgId] = useState<string | null>(null);
  const [moreOpen, setMoreOpen]     = useState(false);
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const [questionOpen, setQuestionOpen]     = useState(false);

  const listRef = useRef<FlatList<ChatItem>>(null);

  const mateAccent    = mate?.gender === 'female' ? '#e91e63' : '#3498db';
  const mateAvatarUri = mate?.avatarUri || '';
  const displayName   = (mate as any)?.fullName ?? mate?.username ?? '';

  const chatItems = useMemo(() => buildChatItems(messages), [messages]);

  const send = useCallback((text: string) => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setInput('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [sendMessage]);

  const renderItem = useCallback(({ item }: { item: ChatItem }) => {
    if (item.type === 'date') {
      return <View style={s.datePill}><Text style={s.dateTxt}>{item.label}</Text></View>;
    }
    if (item.type === 'quickreply') {
      if (isPro) return null;
      return <QuickReplyList replies={item.replies} onSend={send} />;
    }
    return <Bubble item={item} mateAvatarUri={mateAvatarUri} mateAccent={mateAccent} isPro={isPro} onLongPress={setSheetMsgId} />;
  }, [mateAvatarUri, mateAccent, isPro, send]);

  if (!mate) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.noMatchWrap}>
          <Ionicons name="chatbubbles-outline" size={56} color="#CCCCCC" />
          <Text style={s.noMatchTitle}>Henüz eşleşmen yok</Text>
          <Text style={s.noMatchSub}>Keşfet sekmesinden birileriyle eşleş,{'\n'}mesajlaşmaya başla!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={s.header}>
        <View style={[s.headerAvatar, { borderColor: mateAccent }]}>
          <Image source={{ uri: mateAvatarUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" blurRadius={isPro ? 0 : 12} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerName}>{displayName}</Text>
          <View style={s.onlineRow}>
            <View style={s.onlineDot} />
            <Text style={s.onlineTxt}>Şu an aktif</Text>
          </View>
        </View>
        <TouchableOpacity style={s.headerIcon} onPress={() => setMoreOpen(true)} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={20} color={TEXT2} />
        </TouchableOpacity>
      </View>

      {/* â”€â”€ KAV: pushes input above keyboard on both platforms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">

        {/* Chat area + floating "Soru Sor" button */}
        <View style={{ flex: 1 }}>
          <FlatList
            ref={listRef}
            data={chatItems}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            style={s.list}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />

          {/* Floating question button — non-Pro only */}
          {!isPro && (
            <TouchableOpacity style={s.questionBtn} onPress={() => setQuestionOpen(true)} activeOpacity={0.85}>
              <Text style={s.questionBtnText}>❓</Text>
              <Text style={s.questionBtnLabel}>Soru Sor</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Non-Pro bar */}
        {!isPro && (
          <View style={s.nonProBar}>
            <FontAwesome5 name="crown" size={10} color={GOLD} />
            <Text style={s.nonProTxt}>Serbest mesaj için </Text>
            <TouchableOpacity onPress={() => router.push('/pro-upgrade')} activeOpacity={0.8}>
              <Text style={s.nonProLink}>Pro'ya geç</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pro input bar */}
        {isPro && (
          <View style={s.inputBar}>
            <TextInput
              style={s.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Mesaj yaz..."
              placeholderTextColor={TEXT3}
              multiline
              maxLength={1000}
              textAlignVertical="center"
              selectionColor={GREEN}
            />
            {!!input.trim() && (
              <TouchableOpacity style={s.sendBtn} onPress={() => send(input)} activeOpacity={0.85}>
                <Ionicons name="send" size={17} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}

      </KeyboardAvoidingView>

      {/* â”€â”€ Question popup (centered square card) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {questionOpen && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setQuestionOpen(false)}>
          <TouchableOpacity style={s.qpOverlay} activeOpacity={1} onPress={() => setQuestionOpen(false)}>
            <View style={s.qpCard} onStartShouldSetResponder={() => true}>
              <View style={s.qpHeader}>
                <Text style={s.qpTitle}>Soru Sor</Text>
                <TouchableOpacity onPress={() => setQuestionOpen(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close" size={20} color={TEXT3} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {ALL_QUESTIONS.map((q, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={s.qpDivider} />}
                    <TouchableOpacity style={s.qpRow} activeOpacity={0.65}
                      onPress={() => { send(q); setQuestionOpen(false); }}>
                      <Text style={s.qpRowTxt}>{q}</Text>
                      <Ionicons name="chevron-forward" size={14} color={TEXT3} style={{ flexShrink: 0 }} />
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
                <View style={{ height: 8 }} />
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* â”€â”€ Message long-press sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {sheetMsgId && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setSheetMsgId(null)}>
          <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setSheetMsgId(null)}>
            <View style={s.sheet}>
              <View style={s.sheetHandle} />
              <TouchableOpacity style={s.sheetRow} onPress={() => { deleteMessage(sheetMsgId); setSheetMsgId(null); }}>
                <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                <Text style={[s.sheetRowTxt, { color: '#e74c3c' }]}>Mesajı Sil</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* â”€â”€ More menu sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {moreOpen && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setMoreOpen(false)}>
          <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setMoreOpen(false)}>
            <View style={s.sheet}>
              <View style={s.sheetHandle} />
              <TouchableOpacity style={s.sheetRow} onPress={() => { setMoreOpen(false); router.push('/mate-profile'); }}>
                <Ionicons name="person-outline" size={20} color={TEXT} />
                <Text style={s.sheetRowTxt}>Profili Gör</Text>
              </TouchableOpacity>
              <View style={s.sheetDivider} />
              <TouchableOpacity style={s.sheetRow} onPress={() => { setMoreOpen(false); setConfirmUnmatch(true); }}>
                <Ionicons name="heart-dislike-outline" size={20} color="#e74c3c" />
                <Text style={[s.sheetRowTxt, { color: '#e74c3c' }]}>Eşleşmeyi Bitir</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* â”€â”€ Unmatch confirm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {confirmUnmatch && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setConfirmUnmatch(false)}>
          <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setConfirmUnmatch(false)}>
            <View style={s.sheet}>
              <View style={s.sheetHandle} />
              <Text style={s.sheetTitle}>Eşleşmeyi Bitir</Text>
              <Text style={s.sheetMsg}>Bu kişiyle eşleşmen ve tüm mesajlar kalıcı olarak silinecek.</Text>
              <TouchableOpacity style={s.sheetRow} onPress={() => setConfirmUnmatch(false)}>
                <Text style={s.sheetRowTxt}>Vazgeç</Text>
              </TouchableOpacity>
              <View style={s.sheetDivider} />
              <TouchableOpacity style={s.sheetRow} onPress={() => { unmatch(); setConfirmUnmatch(false); }}>
                <Text style={[s.sheetRowTxt, { color: '#e74c3c', fontWeight: '800' }]}>Evet, Bitir</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

    </SafeAreaView>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // No match empty state
  noMatchWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  noMatchTitle: { fontSize: 20, fontWeight: '800', color: TEXT, letterSpacing: -0.4 },
  noMatchSub:   { fontSize: 14, color: TEXT2, textAlign: 'center', lineHeight: 20 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: BORDER, backgroundColor: '#FFFFFF',
  },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, overflow: 'hidden', backgroundColor: SURFACE },
  headerName:   { fontSize: 16, fontWeight: '700', color: TEXT, letterSpacing: -0.2 },
  onlineRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2A6151' },
  onlineTxt:    { fontSize: 12, color: TEXT2 },
  headerIcon:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // List
  list:        { flex: 1, backgroundColor: CHAT_BG },
  listContent: { paddingHorizontal: 8, paddingTop: 12, paddingBottom: 64 }, // extra bottom so last item clears the floating btn

  // Date pill
  datePill: { alignItems: 'center', marginVertical: 12 },
  dateTxt:  { fontSize: 11, fontWeight: '600', color: TEXT2, backgroundColor: '#DDE1E7', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },

  // Bubble rows
  bubbleRow:     { flexDirection: 'row', alignItems: 'flex-end', maxWidth: '88%' },
  bubbleRowMine: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  bubbleRowMate: { alignSelf: 'flex-start' },
  groupFirst:    { marginTop: 6 },
  groupContinue: { marginTop: 2 },

  // Avatar
  avatarSmall:            { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', backgroundColor: SURFACE, marginRight: 4, flexShrink: 0 },
  avatarSmallPlaceholder: { width: 32, flexShrink: 0 },

  // Bubble
  bubble: { maxWidth: SW * 0.7, paddingHorizontal: 13, paddingTop: 8, paddingBottom: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  bubbleMine:     { backgroundColor: ME_BG, marginLeft: 4 },
  bubbleMate:     { backgroundColor: MATE_BG, marginRight: 4 },
  bubbleTxt:      { fontSize: 15, color: TEXT, lineHeight: 21 },
  bubbleTxtMine:  { color: '#FFFFFF' },
  bubbleMeta:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3, gap: 1 },
  bubbleTime:     { fontSize: 10, color: TEXT3 },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.65)' },

  // Quick replies — floating pills
  qrSection: { marginLeft: 40, marginRight: 16, marginTop: 8, marginBottom: 8, gap: 5 },
  qrLabel:   { fontSize: 10, fontWeight: '700', color: TEXT3, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 2 },
  qrPill: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  qrPillTxt: { fontSize: 14, color: TEXT, lineHeight: 19 },

  // Floating "Soru Sor" button
  questionBtn: {
    position: 'absolute', right: 14, bottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFFFFF', borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: 9,
    shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 6,
  },
  questionBtnText:  { fontSize: 16 },
  questionBtnLabel: { fontSize: 13, fontWeight: '700', color: TEXT },

  // Non-Pro bar
  nonProBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 16, gap: 3,
    backgroundColor: '#FFFFFF', borderTopWidth: 0.5, borderTopColor: BORDER,
  },
  nonProTxt:  { fontSize: 12, color: TEXT2 },
  nonProLink: { fontSize: 12, color: GOLD, fontWeight: '700' },

  // Pro input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10,
    backgroundColor: '#FFFFFF', borderTopWidth: 0.5, borderTopColor: BORDER,
  },
  textInput: {
    flex: 1, backgroundColor: SURFACE, borderRadius: 22,
    paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11,
    fontSize: 15, color: TEXT, maxHeight: 120, minHeight: 44, lineHeight: 20,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: GREEN,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GREEN, shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },

  // Question popup
  qpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'center', paddingHorizontal: 20 },
  qpCard:    { backgroundColor: '#FFFFFF', borderRadius: 20, maxHeight: '72%', overflow: 'hidden' },
  qpHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  qpTitle:   { fontSize: 17, fontWeight: '800', color: TEXT },
  qpDivider: { height: 0.5, backgroundColor: BORDER, marginHorizontal: 20 },
  qpRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  qpRowTxt:  { fontSize: 14, color: TEXT, flex: 1, lineHeight: 20 },

  // Sheets
  overlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#FFFFFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
  sheetHandle:  { width: 40, height: 4, backgroundColor: SURFACE, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:   { fontSize: 16, fontWeight: '800', color: TEXT, textAlign: 'center', marginBottom: 6 },
  sheetMsg:     { fontSize: 13, color: TEXT2, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  sheetRow:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15 },
  sheetRowTxt:  { fontSize: 16, color: TEXT, fontWeight: '600' },
  sheetDivider: { height: 0.5, backgroundColor: BORDER },
});

