


import React, { useState, useEffect, useMemo } from "react";
import {View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Alert, ScrollView} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { clothes } from "../../assets/clothing/index";
import { useLanguage } from "../../contexts/LanguageContext";

export default function WardrobeScreen({ onSelectOutfit }) {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const initialItems = Object.entries(clothes).flatMap(([category, images]) =>
    images.map((image, index) => ({
      id: `${category}-${index}`,
      category,
      image,
    }))
  );

  const [items, setItems] = useState(initialItems);
  const [categories, setCategories] = useState([
    "All",
    ...Object.keys(clothes),
  ]);

  const CLOTHES_DIR = FileSystem.documentDirectory + "clothes/custom/";

  useEffect(() => {
    FileSystem.makeDirectoryAsync(CLOTHES_DIR, { intermediates: true }).catch(() => {});
  }, []);

  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter((item) => item.category === selectedCategory);
  const totalItems = items.length;
  const categoryCount = useMemo(() => new Set(items.map((item) => item.category)).size, [items]);

  const handleAddItem = () => {
    Alert.alert(
      t("addNewItem"),
      t("chooseSource"),
      [
        { text: t("camera"), onPress: () => pickImage("camera") },
        { text: t("gallery"), onPress: () => pickImage("gallery") },
        { text: t("cancel"), style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const pickImage = async (source) => {
    try {
      let result;
      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return;
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return;
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
        });
      }

      if (result.canceled) return;

      const asset = result.assets[0];

      Alert.alert(
        t("selectCategory"),
        t("whichCategoryDoesThisItemBelongTo"),
        [
          ...categories
            .filter((c) => c !== "All")
            .map((cat) => ({
              text: cat,
              onPress: () => addToCategory(cat, asset),
            })),
          { text: t("cancel"), style: "cancel" },
        ],
        { cancelable: true }
      );
    } catch (err) {
      console.error("Image pick error:", err);
    }
  };

  const addToCategory = async (category, asset) => {
    try {
      const dest = CLOTHES_DIR + (asset.fileName || `custom-${Date.now()}.jpg`);
      await FileSystem.copyAsync({ from: asset.uri, to: dest });

      const newItem = {
        id: category + "-" + Date.now(),
        category,
        image: { uri: dest },
      };

      setItems((prev) => [newItem, ...prev]);
      if (!categories.includes(category))
        setCategories((prev) => [...prev, category]);
    } catch (err) {
      console.error("Image add error:", err);
    }
  };

  const renderItemCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onSelectOutfit?.(item.image)}
      activeOpacity={0.9}
    >
      <View style={styles.cardImageWrapper}>
        <Image source={item.image.uri ? { uri: item.image.uri } : item.image} style={styles.image} />
      </View>
      <Text style={styles.cardCategory}>{item.category}</Text>
      <Text style={styles.cardHint}>{t("tapToStyle")}</Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.heroCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroEyebrow}>{t("curatedCloset")}</Text>
          <Text style={styles.heroTitle}>{t("wardrobe")}</Text>
          <Text style={styles.heroSubtitle}>{t("mixMatchAndCraft")}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addText}>{t("addItem")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{totalItems}</Text>
          <Text style={styles.metricLabel}>{t("items")}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{categoryCount}</Text>
          <Text style={styles.metricLabel}>{language === "tr" ? "Kategoriler" : "Categories"}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{filteredItems.length}</Text>
          <Text style={styles.metricLabel}>{t("visible")}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
            >
              <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                {cat === "All" ? (language === "tr" ? "Tümü" : "All Items") : cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={renderItemCard}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={32} color="#bdb8d1" />
            <Text style={styles.emptyTitle}>{t("noItemsYet")}</Text>
            <Text style={styles.emptyText}>{t("addYourFirstPiece")}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f2f8", paddingHorizontal: 16, paddingTop: 12 },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f1b4a",
    borderRadius: 30,
    padding: 22,
    marginBottom: 18,
  },
  heroEyebrow: { textTransform: "uppercase", letterSpacing: 1, color: "#bfbaff", fontSize: 12, marginBottom: 4 },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "700" },
  heroSubtitle: { color: "#d9d6ff", marginTop: 6, maxWidth: 220 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff8fb7",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  addText: { fontSize: 14, color: "#fff", fontWeight: "600" },
  metricsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  metricCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
  },
  metricValue: { fontSize: 18, fontWeight: "700", color: "#1f1b4a" },
  metricLabel: { color: "#7c7a92", fontSize: 12, marginTop: 4 },
  categoryScroll: { paddingVertical: 4, paddingHorizontal: 2, marginBottom: 18 },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd6ef",
    backgroundColor: "#fff",
    marginRight: 10,
  },
  categoryPillActive: { backgroundColor: "#1f1b4a", borderColor: "#1f1b4a" },
  categoryPillText: { color: "#6d6a83", fontWeight: "500" },
  categoryPillTextActive: { color: "#fff" },
  listContainer: { paddingBottom: 60 },
  row: { justifyContent: "space-between" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 16,
    marginBottom: 16,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
  },
  cardImageWrapper: {
    height: 150,
    borderRadius: 18,
    backgroundColor: "#f7f5ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  image: { width: "100%", height: "100%", resizeMode: "contain", borderRadius: 18 },
  cardCategory: { fontWeight: "600", color: "#1f1b4a", textTransform: "capitalize" },
  cardHint: { color: "#a19eb9", fontSize: 12, marginTop: 2 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 10, color: "#1f1b4a" },
  emptyText: { color: "#77738f", textAlign: "center", marginTop: 6 },
});

