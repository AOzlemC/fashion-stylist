
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLanguage } from "../../contexts/LanguageContext";

import { clothes } from "../../assets/clothing/index";

const events = ["Daily", "Work", "Party", "Date", "Travel"];
const stylesOptions = ["Minimal", "Classic", "Sporty", "Glam", "Street"];

const styleNotes = {
  Daily: "Keep it effortless with breathable fabrics and soft colors.",
  Work: "Structured layers and muted palettes elevate your office look.",
  Party: "Lean into bold silhouettes, metallics, and statement accessories.",
  Date: "Balance comfort with a confident piece—like a silk shirt or blazer.",
  Travel: "Layer up with wrinkle-proof staples and go-anywhere sneakers.",
};

export default function AISuggestions() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [selectedEvent, setSelectedEvent] = useState("Daily");
  const [selectedStyle, setSelectedStyle] = useState("Minimal");
  const [outfit, setOutfit] = useState(null);

  const subtitle = useMemo(() => {
    if (!selectedEvent || !selectedStyle) return language === "tr" ? "Etkinlik ve stil seçin" : "Pick an event & style to see instant looks.";
    return `${selectedStyle} • ${selectedEvent}`;
  }, [selectedEvent, selectedStyle, language]);

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const buildOutfit = () => {
    const shirt = clothes.shirt ? pickRandom(clothes.shirt) : null;
    const pants = clothes.pants ? pickRandom(clothes.pants) : null;
    const shoes = clothes.shoes ? pickRandom(clothes.shoes) : null;
    
    // Fallback to first available category if needed
    const topCategories = clothes.shirt || clothes["t-shirt"] || clothes.longsleeve || [];
    const bottomCategories = clothes.pants || clothes.shorts || [];
    const shoeCategories = clothes.shoes || [];
    
    return {
      shirt: shirt || (topCategories.length > 0 ? pickRandom(topCategories) : null),
      pants: pants || (bottomCategories.length > 0 ? pickRandom(bottomCategories) : null),
      shoes: shoes || (shoeCategories.length > 0 ? pickRandom(shoeCategories) : null),
    };
  };

  useEffect(() => {
    setOutfit(buildOutfit());
  }, [selectedEvent, selectedStyle]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View>
          <Text style={styles.heroTitle}>{language === "tr" ? "AI Kıyafet Stüdyosu" : "AI Outfit Studio"}</Text>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>
        </View>
        <TouchableOpacity style={styles.chatButton} onPress={() => router.push("/Chatbot")}>
          <Ionicons name="sparkles-outline" size={16} color="#fff" />
          <Text style={styles.chatButtonText}>{language === "tr" ? "Stilistle Sohbet" : "Chat Stylist"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>{t("event")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {events.map((event) => {
            const isActive = selectedEvent === event;
            return (
              <TouchableOpacity
                key={event}
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => setSelectedEvent(event)}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{event}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>{language === "tr" ? "Stil Ruhu" : "Style Mood"}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {stylesOptions.map((style) => {
            const isActive = selectedStyle === style;
            return (
              <TouchableOpacity
                key={style}
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => setSelectedStyle(style)}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{style}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.tipBox}>
          <Ionicons name="bulb-outline" size={16} color="#7c5cff" />
          <Text style={styles.tipText}>{styleNotes[selectedEvent]}</Text>
        </View>
      </View>

      <View style={styles.outfitCard}>
        <View style={styles.outfitHeader}>
          <Text style={styles.outfitTitle}>{t("suggestedOutfit")}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={() => setOutfit(buildOutfit())}>
            <Ionicons name="refresh" size={16} color="#7c5cff" />
            <Text style={styles.refreshText}>{language === "tr" ? "Karıştır" : "Shuffle"}</Text>
          </TouchableOpacity>
        </View>

        {outfit && (outfit.shirt || outfit.pants || outfit.shoes) ? (
          <View style={styles.lookRow}>
            {outfit.shirt && (
              <View style={styles.lookTile}>
                <Text style={styles.lookLabel}>Top</Text>
                <Image source={outfit.shirt} style={styles.lookImage} />
              </View>
            )}
            {outfit.pants && (
              <View style={styles.lookTile}>
                <Text style={styles.lookLabel}>Bottom</Text>
                <Image source={outfit.pants} style={styles.lookImage} />
              </View>
            )}
            {outfit.shoes && (
              <View style={styles.lookTile}>
                <Text style={styles.lookLabel}>Shoes</Text>
                <Image source={outfit.shoes} style={styles.lookImage} />
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.emptyState}>{t("noOutfitsFoundYet")}</Text>
        )}
      </View>

      <View style={styles.noteCard}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#ff8fb7" />
        <Text style={styles.noteText}>
          Want more detail? Ask the stylist for accessories, weather-proofing, or color tweaks.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f2f8" },
  content: { padding: 20, paddingBottom: 40 },
  heroCard: {
    backgroundColor: "#1f1b4a",
    borderRadius: 28,
    padding: 22,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  heroSubtitle: { color: "#d9d6ff", marginTop: 6, fontSize: 14 },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7c5cff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  chatButtonText: { color: "#fff", fontWeight: "600" },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionLabel: { fontSize: 16, fontWeight: "700", color: "#1f1b4a", marginBottom: 10 },
  pillRow: { paddingVertical: 4 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d9d5e9",
    marginRight: 10,
    backgroundColor: "#faf9ff",
  },
  pillActive: { backgroundColor: "#1f1b4a", borderColor: "#1f1b4a" },
  pillText: { color: "#6d6a83", fontWeight: "500" },
  pillTextActive: { color: "#fff" },
  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f3f1ff",
    padding: 12,
    borderRadius: 16,
    marginTop: 16,
  },
  tipText: { color: "#534a96", flex: 1, fontSize: 13 },
  outfitCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
  },
  outfitHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  outfitTitle: { fontSize: 18, fontWeight: "700", color: "#1f1b4a" },
  refreshButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  refreshText: { color: "#7c5cff", fontWeight: "600" },
  lookRow: { flexDirection: "row", justifyContent: "space-between" },
  lookTile: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#f7f5ff",
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
  },
  lookLabel: { fontSize: 12, fontWeight: "600", color: "#7c5cff", marginBottom: 8 },
  lookImage: { width: 90, height: 110, borderRadius: 14, resizeMode: "cover" },
  emptyState: { textAlign: "center", color: "#8785a2", paddingVertical: 10 },
  noteCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#fff7fa",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
  },
  noteText: { flex: 1, color: "#5c4f63", fontSize: 13 },
});