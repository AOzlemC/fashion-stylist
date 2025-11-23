


import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { clothes as defaultClothes } from "../../assets/clothing/index";
import { useLanguage } from "../../contexts/LanguageContext";

const createPiece = (value) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  value,
});

const getSingleParam = (param) => (Array.isArray(param) ? param[0] : param);

const normalizePieces = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  return [items];
};

const resolveImageSource = (value) => {
  if (!value) return null;
  const base = typeof value === "object" && value.value !== undefined ? value.value : value;
  if (!base) return null;
  if (typeof base === "object" && base.uri) return { uri: base.uri };
  if (typeof base === "string") return { uri: base };
  return base;
};

export default function HomeScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { selectedItemUri, selectedDate, mode } = useLocalSearchParams();

  const [weather, setWeather] = useState(null);
  const [weatherForecast, setWeatherForecast] = useState({}); // Store forecast for each date
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [outfit, setOutfit] = useState({ top: null, bottom: null, shoes: null, text: "" });
  const [clothes, setClothes] = useState(defaultClothes);
  const [weekDates, setWeekDates] = useState([]);
  const [dailyOutfits, setDailyOutfits] = useState({});
  const [currentSelectedDate, setCurrentSelectedDate] = useState(new Date());
  const [recentItems, setRecentItems] = useState([]);

  const latitude = 41.0082;
  const longitude = 28.9784;
  const CUSTOM_DIR = FileSystem.documentDirectory + "clothes/custom/";
  const refreshIntervalRef = useRef(null);

  // Real-time weather fetching function
  const fetchWeather = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else if (!weather) {
        setLoading(true);
      }

      // Add timestamp to prevent caching and get real-time data
      const timestamp = Date.now();
      
      // Fetch current weather and 14-day forecast
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=14&_=${timestamp}`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.current_weather) {
        setWeather(data.current_weather);
        
        // Process forecast data for calendar
        if (data.daily && data.daily.time) {
          const forecastMap = {};
          data.daily.time.forEach((dateStr, index) => {
            const date = new Date(dateStr);
            const dateKey = date.toDateString();
            forecastMap[dateKey] = {
              temp_max: data.daily.temperature_2m_max[index],
              temp_min: data.daily.temperature_2m_min[index],
              weathercode: data.daily.weathercode[index],
            };
          });
          setWeatherForecast(forecastMap);
        }
        
        console.log("Weather updated:", {
          temperature: data.current_weather.temperature,
          time: new Date(data.current_weather.time).toLocaleString(),
          forecast_days: Object.keys(data.daily?.time || {}).length,
        });
      } else {
        throw new Error("Invalid weather data received");
      }
    } catch (error) {
      console.error("Weather fetch error:", error);
      // Only show alert if it's a user-initiated refresh
      if (showRefreshing) {
        Alert.alert(
          language === "tr" ? "Hata" : "Error",
          language === "tr" 
            ? "Hava durumu verileri alınamadı. Lütfen internet bağlantınızı kontrol edin."
            : "Could not fetch weather data. Please check your internet connection."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language]); // Remove weather dependency to avoid infinite loops

  // Hava durumu ve custom kıyafetleri yükle
  useEffect(() => {
    const loadCustomClothes = async () => {
      try {
        const info = await FileSystem.readDirectoryAsync(CUSTOM_DIR);
        if (info.length > 0) {
          setClothes((prev) => ({
            ...prev,
            Custom: info.map((file) => ({ uri: CUSTOM_DIR + file })),
          }));
        }
      } catch {
        console.log("Custom clothes not found yet.");
      }
    };

    fetchWeather();
    loadCustomClothes();

    // Set up automatic refresh every 10 minutes for real-time updates
    refreshIntervalRef.current = setInterval(() => {
      fetchWeather();
    }, 10 * 60 * 1000); // 10 minutes

    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []); // Only run once on mount

  // Otomatik kombin önerisi
  useEffect(() => {
    if (weather) chooseOutfit(weather.temperature);
  }, [weather, clothes]);

  const pushRecentItem = useCallback((value) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((item) => item.value !== value);
      return [createPiece(value), ...filtered].slice(0, 12);
    });
  }, []);

  const ensureCustomDir = async () => {
    try {
      const info = await FileSystem.getInfoAsync(CUSTOM_DIR);
      if (!info.exists) await FileSystem.makeDirectoryAsync(CUSTOM_DIR, { intermediates: true });
    } catch (err) {
      console.error("Custom dir error:", err);
    }
  };

  const saveAssetToCustom = async (asset) => {
    await ensureCustomDir();
    const fileName = asset.fileName || `custom-${Date.now()}.jpg`;
    const dest = CUSTOM_DIR + fileName;
    await FileSystem.copyAsync({ from: asset.uri, to: dest });
    return dest;
  };

  const addCustomPieceToState = (uri) => {
    setClothes((prev) => {
      const customItems = prev.Custom || [];
      return { ...prev, Custom: [{ uri }, ...customItems] };
    });
  };

  const pickNewItem = useCallback(
    async (source) => {
      try {
        if (source === "select") {
          router.push("/SelectItem?mode=recent");
          return;
        }

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

        if (result?.canceled) return;
        const asset = result.assets?.[0];
        if (!asset) return;
        const storedUri = await saveAssetToCustom(asset);
        addCustomPieceToState(storedUri);
        pushRecentItem(storedUri);
      } catch (err) {
        console.error("Pick item error:", err);
      }
    },
    [router, pushRecentItem]
  );

  const handleAddRecentItem = useCallback(() => {
    Alert.alert("Add Item", "Choose the source", [
      { text: "Camera", onPress: () => pickNewItem("camera") },
      { text: "Gallery", onPress: () => pickNewItem("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [pickNewItem]);

  // SelectItem ekranından dönen seçimi ilgili güne veya son eklenenlere ekle
  useEffect(() => {
    const pickedUri = getSingleParam(selectedItemUri);
    const pickedDate = getSingleParam(selectedDate);
    const pickedMode = getSingleParam(mode) || "planner";

    if (!pickedUri) return;

    if (pickedMode === "planner" && pickedDate) {
      const dateKey = typeof pickedDate === "string" ? pickedDate : new Date(pickedDate).toDateString();
      const newPiece = createPiece(pickedUri);
      setDailyOutfits((prev) => {
        const existingPieces = normalizePieces(prev[dateKey]);
        return { ...prev, [dateKey]: [...existingPieces, newPiece] };
      });
      pushRecentItem(pickedUri);
    }

    if (pickedMode === "recent") {
      pushRecentItem(pickedUri);
    }

    router.setParams({});
  }, [selectedItemUri, selectedDate, mode, pushRecentItem, router]);

  const chooseOutfit = (temp) => {
    const allCategories = Object.keys(clothes).filter((cat) => cat !== "All");
    const topCategories = allCategories.filter((cat) => /outwear|shirt|t-shirt|longsleeve|dress/i.test(cat));
    const bottomCategories = allCategories.filter((cat) => /pants|shorts|skirt/i.test(cat));
    const shoeCategories = allCategories.filter((cat) => /shoes/i.test(cat));

    let topCat, bottomCat, shoeCat;
    if (temp < 15) {
      topCat = topCategories.find((cat) => /outwear|longsleeve/i.test(cat)) || topCategories[0];
      bottomCat = bottomCategories.find((cat) => /pants/i.test(cat)) || bottomCategories[0];
    } else if (temp < 25) {
      topCat = topCategories.find((cat) => /shirt|longsleeve/i.test(cat)) || topCategories[0];
      bottomCat = bottomCategories[0];
    } else {
      topCat = topCategories.find((cat) => /t-shirt/i.test(cat)) || topCategories[0];
      bottomCat = bottomCategories.find((cat) => /shorts|skirt/i.test(cat)) || bottomCategories[0];
    }

    shoeCat = shoeCategories[0] || null;

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const topImg = pickRandom(clothes[topCat] || []);
    const bottomImg = pickRandom(clothes[bottomCat] || []);
    const shoesImg = shoeCat ? pickRandom(clothes[shoeCat] || []) : null;

    setOutfit({
      top: topImg,
      bottom: bottomImg,
      shoes: shoesImg,
      /*text: `Top: ${topCat || "N/A"}, Bottom: ${bottomCat || "N/A"}, Shoes: ${shoeCat || "N/A"}`,*/
    });
  };

  // 30 günlük takvim oluştur
  useEffect(() => {
    const start = new Date();
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    setWeekDates(dates);
  }, []);

  // Gün öğesini çiz
  const renderDayItem = ({ item }) => {
    const dateKey = item.toDateString();
    const isSelected = dateKey === currentSelectedDate.toDateString();
    const dayOutfit = normalizePieces(dailyOutfits[dateKey]);
    const dayForecast = weatherForecast[dateKey];
    const isToday = dateKey === new Date().toDateString();
    
    // Use current weather for today, forecast for future dates
    const displayTemp = isToday && weather 
      ? Math.round(weather.temperature)
      : dayForecast
      ? Math.round((dayForecast.temp_max + dayForecast.temp_min) / 2)
      : null;

    return (
      <View style={{ alignItems: "center", marginHorizontal: 5 }}>
        <TouchableOpacity
          style={[styles.dayButton, isSelected && styles.selectedDayButton]}
          onPress={() => setCurrentSelectedDate(item)}
        >
          <Text style={styles.dayText}>
            {item.toLocaleDateString("en-US", { day: "numeric", month: "short" })}
          </Text>
          <Text style={styles.dayText}>
            {item.toLocaleDateString("en-US", { weekday: "short" })}
          </Text>
          {displayTemp !== null ? (
            <Text style={styles.dayText}>{displayTemp}°C</Text>
          ) : (
            <ActivityIndicator size="small" color="#7c5cff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outfitSlot}
          onPress={() =>
            router.push({
              pathname: "/SelectItem",
              params: { date: dateKey, mode: "planner" },
            })
          }
        >
          {renderOutfitCollage(dayOutfit, "small")}
        </TouchableOpacity>
      </View>
    );
  };

  const renderOutfitCollage = (items, size = "large") => {
    const normalizedItems = normalizePieces(items);
    const hasItems = normalizedItems.length > 0;
    return (
      <View style={[styles.collageContainer, size === "small" && styles.collageContainerSmall]}>
        {hasItems ? (
          normalizedItems.map((piece, index) => {
            const shapedPiece =
              typeof piece === "object" && piece.id
                ? piece
                : { id: `legacy-${index}`, value: typeof piece === "object" && piece.value !== undefined ? piece.value : piece };
            const source = resolveImageSource(shapedPiece);
            if (!source) return null;
            return (
              <View key={shapedPiece.id} style={[styles.collagePiece, size === "small" && styles.collagePieceSmall]}>
                <Image source={source} style={[styles.collageImage, size === "small" && styles.collageImageSmall]} />
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyCollageText}>{size === "small" ? t("tapToAddItems") : t("piecesWillAppearHere")}</Text>
        )}
      </View>
    );
  };

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    fetchWeather(true);
  }, [fetchWeather]);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c5cff" />
      }
    >
      {loading ? (
        <ActivityIndicator size="large" color="#ff8fb7" />
      ) : (
        <>
          <View style={styles.heroCard}>
            <View>
              <Text style={styles.heroEyebrow}>{t("today")}</Text>
              <Text style={styles.heroTitle}>{Math.round(weather.temperature)}°C • {weather.weathercode === 0 ? t("clearSkies") : t("cloudsRollingIn")}</Text>
              <Text style={styles.heroSubtitle}>{t("weCuratedALook")}</Text>
            </View>
            <TouchableOpacity style={styles.heroButton} onPress={() => router.push("/Chatbot")}>
              <Text style={styles.heroButtonText}>{t("askStylist")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>{t("dailyRecommendation")}</Text>
                <Text style={styles.sectionTitle}>{t("todaysOutfit")}</Text>
              </View>
            </View>
            <View style={styles.outfitBoard}>
              {renderOutfitCollage(
                [outfit.top, outfit.bottom, outfit.shoes].filter(Boolean).map((piece, index) => ({
                  id: `suggestion-${index}`,
                  value: piece,
                }))
              )}
            </View>
            <Text style={styles.description}>{outfit.text}</Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/Chatbot")}>
              <Text style={styles.secondaryButtonText}>{t("whyThisLook")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>{t("monthlyOutfitPlanner")}</Text>
                <Text style={styles.sectionTitle}>{t("monthlyOutfitPlanner")}</Text>
              </View>
              <Text style={styles.sectionHelper}>{currentSelectedDate.toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", { month: "long", day: "numeric" })}</Text>
            </View>
            <FlatList
              data={weekDates}
              horizontal
              keyExtractor={(item) => item.toDateString()}
              renderItem={renderDayItem}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.plannerList}
            />
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>{t("recentlyAddedItems")}</Text>
                <Text style={styles.sectionTitle}>{t("recentlyAddedItems")}</Text>
              </View>
              <Text style={styles.sectionHelper}>{recentItems.length} {language === "tr" ? "parça" : "pieces"}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
              <TouchableOpacity style={styles.addRecentCard} onPress={handleAddRecentItem}>
                <Text style={styles.addRecentPlus}>＋</Text>
                <Text style={styles.addRecentLabel}>{language === "tr" ? "Ekle" : "Add"}</Text>
              </TouchableOpacity>
              {recentItems.length === 0 && <Text style={styles.recentEmptyText}>{t("addPiecesToBuild")}</Text>}
              {recentItems.map((item) => {
                const source = resolveImageSource(item);
                if (!source) return null;
                return (
                  <View key={item.id} style={styles.recentCard}>
                    <Image source={source} style={styles.recentImage} />
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f2f8" },
  content: { padding: 20, paddingBottom: 40 },
  heroCard: {
    backgroundColor: "#1f1b4a",
    borderRadius: 30,
    padding: 24,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroEyebrow: { color: "#bfbaff", letterSpacing: 1, textTransform: "uppercase", fontSize: 12, marginBottom: 6 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "700" },
  heroSubtitle: { color: "#d9d6ff", marginTop: 6, maxWidth: 220, fontSize: 14 },
  heroButton: { backgroundColor: "#ff8fb7", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, marginLeft:8 },
  heroButtonText: { color: "#fff", fontWeight: "600" },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionEyebrow: { color: "#8a87a5", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#1f1b4a" },
  sectionHelper: { color: "#9c9ab3", fontSize: 13 },
  outfitBoard: { backgroundColor: "#f7f5ff", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#ece1ff" },
  description: { textAlign: "center", color: "#6b6886", fontSize: 15, marginTop: 12 },
  secondaryButton: {
    marginTop: 14,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#7c5cff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  secondaryButtonText: { color: "#7c5cff", fontWeight: "600" },
  plannerList: { paddingVertical: 6 },
  dayButton: {
    padding: 12,
    borderRadius: 18,
    marginVertical: 5,
    marginHorizontal: 6,
    backgroundColor: "#f3f1ff",
    alignItems: "center",
    width: 90,
  },
  selectedDayButton: { backgroundColor: "#7c5cff" },
  dayText: { fontSize: 12, color: "#4b486c" },
  outfitSlot: {
    width: 110,
    height: 120,
    borderWidth: 1,
    borderColor: "#e5e0ee",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    backgroundColor: "#faf7ff",
    padding: 8,
  },
  collageContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  collageContainerSmall: { gap: 6 },
  collagePiece: {
    width: 90,
    height: 110,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  collagePieceSmall: { width: 42, height: 52, borderRadius: 12, padding: 4, shadowOpacity: 0 },
  collageImage: { width: "100%", height: "100%", borderRadius: 14 },
  collageImageSmall: { borderRadius: 10 },
  emptyCollageText: { color: "#9a8fbf", textAlign: "center" },
  recentScroll: { alignItems: "center" },
  addRecentCard: {
    width: 80,
    height: 110,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d5cef3",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    backgroundColor: "#f5f2ff",
  },
  addRecentPlus: { fontSize: 30, color: "#7c5cff", marginBottom: 4 },
  addRecentLabel: { color: "#7c5cff", fontSize: 12, fontWeight: "600" },
  recentCard: {
    width: 80,
    height: 110,
    borderRadius: 22,
    backgroundColor: "#fff",
    marginRight: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    overflow: "hidden",
  },
  recentImage: { width: "100%", height: "100%" },
  recentEmptyText: { color: "#9c9ab3", alignSelf: "center" },
});