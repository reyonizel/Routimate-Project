import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

const QUICK_MESSAGES = [
  { id: 'q1', icon: '🤔', text: 'Bugün neden yapılmadı?' },
  { id: 'q2', icon: '🔥', text: 'Harika gidiyorsun, devam et!' },
  { id: 'q3', icon: '💪', text: 'Disiplin her şeydir, hadi!' },
  { id: 'q4', icon: '📊', text: 'Hesap ver, nerede kaldın?' },
];

function MessageBubble({ msg }: { msg: any }) {
  const user = useStore((s) => s.user);
  const accentColor = user.gender === 'female' ? Colors.female : Colors.male;
  const time = new Date(msg.timestamp).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.bubbleWrap, msg.sentByMe && styles.bubbleWrapRight]}>
      {!msg.sentByMe && (
        <View style={[styles.avatarSmall, { backgroundColor: accentColor + '22', borderColor: accentColor + '55' }]}>
          <Text style={{ fontSize: 10, color: accentColor }}>M</Text>
        </View>
      )}
      <View style={[
        styles.bubble,
        msg.sentByMe
          ? { backgroundColor: accentColor }
          : { backgroundColor: Colors.card, borderColor: Colors.cardBorder, borderWidth: 0.5 },
      ]}>
        <Text style={[styles.bubbleText, msg.sentByMe && { color: '#fff' }]}>{msg.text}</Text>
        <Text style={[styles.bubbleTime, msg.sentByMe && { color: 'rgba(255,255,255,0.6)' }]}>{time}</Text>
      </View>
    </View>
  );
}

export default function DMScreen() {
  const user = useStore((s) => s.user);
  const mate = useStore((s) => s.mate);
  const messages = useStore((s) => s.messages);
  const sendMessage = useStore((s) => s.sendMessage);
  const accentColor = user.gender === 'female' ? Colors.female : Colors.male;

  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleSendQuick = (text: string) => {
    sendMessage(text);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.mateAvatar, { borderColor: accentColor }]}>
            {!user.isPro ? (
              <Text style={{ fontSize: 16 }}>🔒</Text>
            ) : (
              <Text style={{ fontSize: 20, color: accentColor }}>M</Text>
            )}
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <Text style={styles.mateName}>@{mate.username}</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: '#2ecc71' }]} />
              <Text style={styles.onlineText}>Aktif</Text>
            </View>
          </View>
          {!user.isPro && (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>FREE</Text>
            </View>
          )}
          {user.isPro && (
            <View style={[styles.freeBadge, { backgroundColor: Colors.proGold }]}>
              <Text style={[styles.freeBadgeText, { color: '#000' }]}>PRO</Text>
            </View>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesArea}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          <View style={styles.dateChip}>
            <Text style={styles.dateChipText}>Bugün</Text>
          </View>

          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Free Mode: Quick Action Buttons */}
        {!user.isPro && (
          <View style={styles.quickSection}>
            <Text style={styles.quickLabel}>HIZLI MESAJLAR</Text>
            <View style={styles.quickGrid}>
              {QUICK_MESSAGES.map((q) => (
                <TouchableOpacity
                  key={q.id}
                  style={[styles.quickBtn, { borderColor: accentColor + '44' }]}
                  onPress={() => handleSendQuick(q.text)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.quickBtnIcon}>{q.icon}</Text>
                  <Text style={styles.quickBtnText}>{q.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputArea}>
          {user.isPro ? (
            <>
              <TextInput
                style={[styles.textInput, { borderColor: accentColor + '44' }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Bir şeyler yaz..."
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={500}
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: inputText.trim() ? accentColor : Colors.surfaceAlt }]}
                onPress={handleSend}
              >
                <Text style={styles.sendIcon}>→</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.proPrompt, { borderColor: Colors.proGold + '44' }]}
              onPress={() => {}}
            >
              <Text style={styles.proPromptIcon}>🔓</Text>
              <Text style={styles.proPromptText}>
                Pro'ya geç ve serbestçe mesajlaş
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  mateAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  mateName: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '700',
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  freeBadge: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  freeBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  messagesArea: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  dateChip: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dateChipText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  bubbleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
    maxWidth: '82%',
  },
  bubbleWrapRight: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  bubble: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  bubbleText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  bubbleTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  quickSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: Colors.cardBorder,
  },
  quickLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickBtn: {
    flexBasis: '47%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickBtnIcon: {
    fontSize: 18,
  },
  quickBtnText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    lineHeight: 16,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  proPrompt: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.proGold + '11',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderWidth: 1,
    gap: 10,
  },
  proPromptIcon: {
    fontSize: 20,
  },
  proPromptText: {
    fontSize: FontSize.sm,
    color: Colors.proGold,
    fontWeight: '600',
  },
});
