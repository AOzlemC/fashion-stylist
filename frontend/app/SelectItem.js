

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import { clothes as defaultClothes } from "../assets/clothing/index";
import { useLanguage } from "../contexts/LanguageContext";

export const options = {
  headerShown: false,
};
export default function SelectItem() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { date } = useLocalSearchParams();

  const [clothes, setClothes] = useState(defaultClothes);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const CUSTOM_DIR = FileSystem.documentDirectory + "clothes/custom/";

  useEffect(() => {
    const init = async () => {
      try {
        const dirInfo = await FileSystem.getInfoAsync(CUSTOM_DIR);
        if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(CUSTOM_DIR, { intermediates: true });

        const files = await FileSystem.readDirectoryAsync(CUSTOM_DIR);
        if (files.length > 0) {
          setClothes(prev => ({ ...prev, Custom: files.map(f => ({ uri: CUSTOM_DIR + f })) }));
        }
      } catch (err) {
        console.error("SelectItem load error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const categories = Object.keys(clothes);
  const filteredClothes = selectedCategory === "All" ? Object.values(clothes).flat() : clothes[selectedCategory] || [];

  const handleSelect = (item) => {
    router.replace({
      pathname: "/Home",
      params: { selectedItemUri: item.uri || item, selectedDate: date },
    });
  };

  if (loading) return <ActivityIndicator size="large" color="#ff9999" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{date ? (language === "tr" ? `${date} için kıyafet seç` : `Select Outfit for ${date}`) : (language === "tr" ? "Koleksiyonunuza öğe ekleyin" : "Add item to your collection")}</Text>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.categoryButton, selectedCategory === item && styles.selectedCategory]} onPress={() => setSelectedCategory(item)}>
            <Text style={[styles.categoryText, selectedCategory === item && styles.selectedText]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filteredClothes}
        numColumns={3}
        keyExtractor={(item, i) => i.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.itemBox} onPress={() => handleSelect(item)}>
            <Image source={item.uri ? { uri: item.uri } : item} style={styles.itemImage} />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffafc", padding: 15 },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 10 },
  categoryButton: { paddingVertical: 8, paddingHorizontal: 15, backgroundColor: "#f0f0f0", borderRadius: 20, marginHorizontal: 5 },
  selectedCategory: { backgroundColor: "#ffd8cc" },
  categoryText: { color: "#444", fontWeight: "500" },
  selectedText: { color: "#000" },
  itemBox: { width: "30%", margin: "1.5%", backgroundColor: "#f4f0ff", borderRadius: 15, alignItems: "center", justifyContent: "center", padding: 5 },
  itemImage: { width: 100, height: 120, borderRadius: 10 },
});