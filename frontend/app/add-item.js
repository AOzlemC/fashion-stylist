
import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";

const CUSTOM_DIR = FileSystem.documentDirectory + "clothes/custom/";

export const options = { headerShown: false };

export default function AddItemScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [preview, setPreview] = useState(null);
  const [statusText, setStatusText] = useState(language === "tr" ? "Yeni parçanızı nasıl eklemek istediğinizi seçin." : "Choose how you want to add your new piece.");

  const ensureCustomDir = useCallback(async () => {
    const info = await FileSystem.getInfoAsync(CUSTOM_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(CUSTOM_DIR, { intermediates: true });
    }
  }, []);

  const persistAsset = useCallback(
    async (asset) => {
      await ensureCustomDir();
      const fileName = asset.fileName || `custom-${Date.now()}.jpg`;
      const destination = CUSTOM_DIR + fileName;
      await FileSystem.copyAsync({ from: asset.uri, to: destination });
      setPreview({ uri: destination });
      setStatusText(language === "tr" ? "Gardırobunuza kaydedildi! Artık herhangi bir kıyafete ekleyebilirsiniz." : "Saved to your closet! You can now attach it to any outfit.");
      Alert.alert(t("success"), t("itemAddedSuccessfully"));
    },
    [ensureCustomDir]
  );

  const handlePick = useCallback(
    async (source) => {
      try {
        if (source === "camera") {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return;
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
          });
          if (!result.canceled) await persistAsset(result.assets[0]);
        } else {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) return;
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
          });
          if (!result.canceled) await persistAsset(result.assets[0]);
        }
      } catch (error) {
        console.error("Add item error:", error);
        Alert.alert(t("error"), language === "tr" ? "Bu öğe eklenemedi. Lütfen tekrar deneyin." : "Unable to add this item. Please try again.");
      }
    },
    [persistAsset]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heroEyebrow}>{language === "tr" ? "Yeni Parça" : "New Piece"}</Text>
        <Text style={styles.heroTitle}>{t("addNewItem")}</Text>
        <Text style={styles.heroSubtitle}>{language === "tr" ? "Galerinizden yükleyin veya kamerayla yeni bir görünüm yakalayın." : "Upload from your gallery or capture a fresh look with the camera."}</Text>
      </View>

      <View style={styles.previewCard}>
        {preview ? (
          <Image source={preview} style={styles.previewImage} />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={40} color="#c5c2d8" />
            <Text style={styles.emptyTitle}>{language === "tr" ? "Öğe seçilmedi" : "No item selected"}</Text>
            <Text style={styles.emptyCopy}>{language === "tr" ? "Yeni bir şey eklediğinizde önizlemeniz burada görünecek." : "Your preview will appear here once you add something new."}</Text>
          </View>
        )}
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionCard, styles.cameraCard]} onPress={() => handlePick("camera")}>
          <Ionicons name="camera-outline" size={24} color="#fff" />
          <Text style={styles.actionTitle}>{language === "tr" ? "Kamera Kullan" : "Use Camera"}</Text>
          <Text style={styles.actionCopy}>{language === "tr" ? "Görünümünüzün fotoğrafını çekin." : "Capture a photo of your look."}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionCard, styles.galleryCard]} onPress={() => handlePick("gallery")}>
          <Ionicons name="images-outline" size={24} color="#fff" />
          <Text style={styles.actionTitle}>{t("gallery")}</Text>
          <Text style={styles.actionCopy}>{language === "tr" ? "Fotoğraf galerinizden yükleyin." : "Upload from your photo roll."}</Text>
        </TouchableOpacity>
      </View>

        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>{t("done")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f2f8" },
  container: { flex: 1, backgroundColor: "#f4f2f8" },
  content: { padding: 20, paddingBottom: 40 },
  hero: { backgroundColor: "#1f1b4a", borderRadius: 28, padding: 22, marginBottom: 20 },
  backButton: { alignSelf: "flex-start", marginBottom: 14 },
  backText: { color: "#d9d6ff", fontSize: 13 },
  heroEyebrow: { color: "#bfbaff", letterSpacing: 1, textTransform: "uppercase", fontSize: 12 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "700", marginTop: 6 },
  heroSubtitle: { color: "#d9d6ff", marginTop: 6 },
  previewCard: { backgroundColor: "#fff", borderRadius: 24, padding: 18, marginBottom: 18, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 } },
  previewImage: { width: "100%", height: 220, borderRadius: 18, resizeMode: "cover" },
  emptyState: { alignItems: "center", paddingVertical: 30 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1f1b4a", marginTop: 12 },
  emptyCopy: { color: "#7e7c95", textAlign: "center", marginTop: 4 },
  statusText: { color: "#6b6886", textAlign: "center", marginTop: 12 },
  actionsRow: { flexDirection: "row", justifyContent: "space-between" },
  actionCard: { flex: 1, borderRadius: 22, padding: 18, marginHorizontal: 6, gap: 8 },
  cameraCard: { backgroundColor: "#7c5cff" },
  galleryCard: { backgroundColor: "#ff8fb7" },
  actionTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  actionCopy: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  closeButton: { marginTop: 24, alignSelf: "center", borderRadius: 24, borderWidth: 1, borderColor: "#7c5cff", paddingHorizontal: 30, paddingVertical: 10 },
  closeText: { color: "#7c5cff", fontWeight: "600" },
});



