import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

// If not, replace with direct colors below:
// const Colors = { light: { primary: '#4CAF50', text: '#212121', gray: '#757575', background: '#fff', lightGray: '#f2f2f2' } };

interface ChatMessage {
  id: string;
  text: string;
  time: string;
  sender: 'user' | 'agent';
}

interface ChatWidgetProps {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const botResponses: Record<string, string> = {
  hello: 'Hi! Welcome to Jhola Bazar! How can I help you today? 😊',
  hi: 'Hello! What can I assist you with?',
  order: 'You can track your orders in Profile > My Orders section.',
  delivery: 'We deliver fresh groceries within 10-15 minutes in most areas! 🚚',
  payment: 'We accept UPI, Credit/Debit cards, and Cash on Delivery.',
  cancel: 'You can cancel orders before they are dispatched.',
  help: 'I can help with: Order tracking, Delivery, Payment issues, Products, Accounts.',
  product: 'Browse our fresh groceries and more! Use search to find items.',
  account: 'For account issues, go to Profile or contact support at +919262626392.',
  refund: 'Refunds are processed within 3-5 business days.',
  contact: '📞 +919262626392\n📧 support@jholabazar.com',
  timing: 'We are open 24/7. Delivery: 6 AM - 11 PM.',
  area: 'We deliver across major areas. Check pincode during checkout.',
  fresh: 'All our products are sourced fresh daily! 🥬🍎',
  discount: 'Check the app for daily deals and special offers!',
  default:
    'I understand you need help.\n\n📞 Call: +919262626392\n📧 support@jholabazar.com\n\nAsk me about orders, delivery, or payments! 😊',
};

const ChatWidget: React.FC<ChatWidgetProps> = ({ visible, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX > 0) translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SCREEN_WIDTH * 0.3) {
        translateX.value = withSpring(SCREEN_WIDTH, {}, () => {
          runOnJS(onClose)();
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    if (visible) translateX.value = 0;
  }, [visible]);

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      if (visible) {
        onClose();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [visible, onClose]);

  // Initial welcome message
  useEffect(() => {
    if (visible && messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: "Hello! Welcome to Jhola Bazar! 🛒\nI'm your virtual assistant. How can I help you today?",
          time: new Date().toLocaleTimeString(),
          sender: 'agent',
        },
      ]);
    }
  }, [visible]);

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    for (const [key, response] of Object.entries(botResponses)) {
      if (key !== 'default' && message.includes(key)) return response;
    }
    return botResponses.default;
  };

  const sendMessage = () => {
    if (!inputText.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      time: new Date().toLocaleTimeString(),
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputText.trim();
    setInputText('');
    setLoading(true);

    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(messageText),
        time: new Date().toLocaleTimeString(),
        sender: 'agent',
      };
      setMessages((prev) => [...prev, botMessage]);
      setLoading(false);
    }, 800 + Math.random() * 400);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === 'user' ? styles.userMessage : styles.agentMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          { color: item.sender === 'user' ? '#fff' : Colors.light.text },
        ]}
      >
        {item.text}
      </Text>
      <Text
        style={[
          styles.messageTime,
          { color: item.sender === 'user' ? '#fff' : Colors.light.gray },
        ]}
      >
        {item.time}
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.container, animatedStyle]}>
            <SafeAreaView style={styles.safeArea}>
              <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              >
                <View style={styles.header}>
                  <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Support Chat</Text>
                  <View style={styles.placeholder} />
                </View>

                <FlatList
                  ref={flatListRef}
                  data={messages}
                  renderItem={renderMessage}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.messageList}
                  onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: true })
                  }
                />

                {loading && (
                  <Text style={styles.typing}>Assistant is typing...</Text>
                )}

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type your message..."
                    multiline
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      { opacity: inputText.trim() ? 1 : 0.5 },
                    ]}
                    onPress={sendMessage}
                    disabled={!inputText.trim() || loading}
                  >
                    <Ionicons name="send" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
};

export default ChatWidget;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  backButton: { width: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  placeholder: { width: 40 },
  messageList: { padding: 12 },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 10,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.light.primary,
  },
  agentMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.lightGray,
  },
  messageText: { fontSize: 15 },
  messageTime: { fontSize: 11, opacity: 0.6, marginTop: 4 },
  typing: {
    fontStyle: 'italic',
    color: Colors.light.gray,
    marginLeft: 16,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#eee',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.light.primary,
    marginLeft: 8,
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
