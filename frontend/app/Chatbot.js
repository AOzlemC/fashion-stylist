

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLanguage } from "../contexts/LanguageContext";

export default function ChatScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [input, setInput] = useState("");
  
  const quickPrompts = useMemo(() => [
    t("suggestARainyDayOutfit"),
    t("whatToWearForAGala"),
    t("createASportyBrunchLook"),
  ], [t]);
  
  const initialBotMessage = useMemo(() => 
    language === "tr" 
      ? "Merhaba! Ben AI stilistiniz—bana etkinliği veya ruh halinizi söyleyin, size stil önerileri sunayım."
      : "Hi! I'm your AI stylist—tell me the vibe or event and I'll style you.",
    [language]
  );
  
  const [messages, setMessages] = useState([
    { sender: "bot", text: initialBotMessage },
  ]);
  const scrollViewRef = useRef();

  const handleSend = (textOverride) => {
    const payload = textOverride ?? input.trim();
    if (!payload) return;

    const userMessage = { sender: "user", text: payload };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      const reply = generateBotReply(payload);
      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    }, 650);
  };

  const generateBotReply = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes("rain"))
      return "Layer with a trench, waterproof boots, and add a bright accessory to lift the mood.";
    if (lower.includes("gala"))
      return "Go for sleek tailoring or a satin dress, paired with metallic shoes and minimalist jewelry.";
    if (lower.includes("sporty") || lower.includes("brunch"))
      return "Try structured leggings, a cropped hoodie, and chunky sneakers—athletic but chic.";
    if (lower.includes("work"))
      return "Work-ready: tailored trousers, a button-down, and loafers. Swap in a blazer for meetings.";
    return "Tell me more about the event, weather, or color palette you have in mind, and I’ll tailor it.";
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#1f1b4a" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{t("aiStylist")}</Text>
            <Text style={styles.headerSubtitle}>{t("realTimeOutfitCoaching")}</Text>
          </View>
          <View style={styles.statusDot}>
            <View style={styles.dot} />
            <Text style={styles.statusLabel}>{t("online")}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.chatArea}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View style={styles.promptRow}>
            {quickPrompts.map((prompt) => (
              <TouchableOpacity key={prompt} style={styles.promptChip} onPress={() => handleSend(prompt)}>
                <Ionicons name="flash-outline" size={14} color="#7c5cff" />
                <Text style={styles.promptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {messages.map((msg, idx) => (
            <View key={idx} style={[styles.message, msg.sender === "user" ? styles.userMsg : styles.botMsg]}>
              <Text style={msg.sender === "user" ? styles.userText : styles.botText}>{msg.text}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder={t("describeTheEventWeatherOrMood")}
            placeholderTextColor="#a6a3bd"
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f2f8" },
  container: { flex: 1, backgroundColor: "#f4f2f8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1f1b4a" },
  headerSubtitle: { color: "#8a87a5", fontSize: 13 },
  statusDot: { alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#5ed18a", marginBottom: 4 },
  statusLabel: { fontSize: 11, color: "#5ed18a", fontWeight: "600" },
  chatArea: { flex: 1, paddingHorizontal: 16 },
  promptRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  promptChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
  },
  promptText: { color: "#4a3db9", fontSize: 12, fontWeight: "600" },
  message: {
    marginVertical: 6,
    maxWidth: "80%",
    padding: 12,
    borderRadius: 18,
  },
  userMsg: {
    backgroundColor: "#7c5cff",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  botMsg: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
  },
  userText: { color: "#fff", fontSize: 15 },
  botText: { color: "#352f60", fontSize: 15 },
  inputCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 10, color: "#1f1b4a" },
  sendButton: {
    backgroundColor: "#7c5cff",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});