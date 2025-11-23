import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";

export default function LanguageSettings() {
  const router = useRouter();
  const { language, changeLanguage, t } = useLanguage();

  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  ];

  const handleLanguageChange = async (langCode) => {
    await changeLanguage(langCode);
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("language")}</Text>
        <Text style={styles.subtitle}>{language === "en" ? "Choose your preferred language" : "Tercih ettiğiniz dili seçin"}</Text>
      </View>

      <View style={styles.languageList}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.languageItem, language === lang.code && styles.languageItemActive]}
            onPress={() => handleLanguageChange(lang.code)}
            activeOpacity={0.7}
          >
            <View style={styles.languageLeft}>
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={[styles.languageName, language === lang.code && styles.languageNameActive]}>
                {lang.name}
              </Text>
            </View>
            {language === lang.code && (
              <Ionicons name="checkmark-circle" size={24} color="#7c5cff" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f2f8" },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "700", color: "#1f1b4a", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#8a87a5" },
  languageList: { padding: 20, paddingTop: 10 },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  languageItemActive: {
    borderWidth: 2,
    borderColor: "#7c5cff",
    backgroundColor: "#f0edff",
  },
  languageLeft: { flexDirection: "row", alignItems: "center" },
  flag: { fontSize: 28, marginRight: 12 },
  languageName: { fontSize: 17, fontWeight: "600", color: "#1f1b4a" },
  languageNameActive: { color: "#7c5cff" },
});

