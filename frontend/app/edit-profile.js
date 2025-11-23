import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../contexts/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export const options = { headerShown: false };

export default function EditProfile() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [profileImage, setProfileImage] = useState(require("../assets/images/icon.png"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // AsyncStorage'dan bilgileri yükle
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log("Edit Profile: Loading user data...");
        const currentUserEmail = await AsyncStorage.getItem("currentUserEmail");
        if (!currentUserEmail) {
          console.log("Edit Profile: No current user email found");
          return;
        }

        const userDataKey = `userData_${currentUserEmail.toLowerCase()}`;
        const userData = await AsyncStorage.getItem(userDataKey);
        if (userData) {
          const user = JSON.parse(userData);
          console.log("Edit Profile: Loaded user data:", {
            name: user.name,
            email: user.email,
            hasDateOfBirth: !!user.dateofbirth,
            dateofbirth: user.dateofbirth
          });
          setName(user.name || "");
          setEmail(user.email || currentUserEmail);
          setBirthDate(user.dateofbirth || "");
          setPassword(""); // Don't load password
          if (user.profileImage) setProfileImage({ uri: user.profileImage });
        } else {
          console.log("Edit Profile: No user data found for key:", userDataKey);
          // Set default values so fields are visible
          setEmail(currentUserEmail);
        }
      } catch (err) {
        console.error("Edit Profile: Failed to load user data:", err);
      }
    };
    loadUser();
  }, []);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted)
      return Alert.alert(
        language === "tr" ? "İzin gerekli" : "Permission required",
        language === "tr" ? "Lütfen fotoğraf erişimine izin verin." : "Please allow photo access."
      );

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) setProfileImage({ uri: result.assets[0].uri });
  };

  const handleDateConfirm = (date) => {
    const formattedDate = date.toISOString().split("T")[0];
    setBirthDate(formattedDate);
    setDatePickerVisibility(false);
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSave = async () => {
    try {
      const currentUserEmail = await AsyncStorage.getItem("currentUserEmail");
      if (!currentUserEmail) {
        Alert.alert("Error", "User email not found. Please log in again.");
        return;
      }

      // If password is provided, update it on the backend first
      if (password && password.trim() !== "") {
        try {
          const response = await fetch("http://192.168.1.8:5050/auth/update-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: currentUserEmail,
              newPassword: password,
            }),
          });

          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            data = { message: text };
          }

          if (!response.ok) {
            Alert.alert("Error", data.message || "Failed to update password");
            return;
          }
        } catch (err) {
          console.error("Failed to update password:", err);
          Alert.alert("Error", "Server connection failed");
          return;
        }
      }

      // Update profile on backend
      try {
        const response = await fetch("http://192.168.1.8:5050/auth/update-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: currentUserEmail,
            name: name,
            dateofbirth: birthDate,
          }),
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }

        if (!response.ok) {
          Alert.alert("Error", data.message || "Failed to update profile");
          return;
        }
      } catch (err) {
        console.error("Failed to update profile:", err);
        Alert.alert("Error", "Server connection failed");
        return;
      }

      // Update email-specific AsyncStorage
      const userDataKey = `userData_${currentUserEmail.toLowerCase()}`;
      const updatedUser = {
        name,
        email: currentUserEmail,
        dateofbirth: birthDate,
        profileImage: profileImage.uri || null,
      };
      
      await AsyncStorage.setItem(userDataKey, JSON.stringify(updatedUser));
      
      // If email was changed, update the key
      if (email !== currentUserEmail) {
        await AsyncStorage.setItem("currentUserEmail", email.toLowerCase());
        const newKey = `userData_${email.toLowerCase()}`;
        await AsyncStorage.setItem(newKey, JSON.stringify({ ...updatedUser, email: email.toLowerCase() }));
        await AsyncStorage.removeItem(userDataKey);
      }
      
      const successMessage = password && password.trim() !== ""
        ? language === "tr"
          ? "Profiliniz ve şifreniz güncellendi."
          : "Your profile and password have been updated."
        : language === "tr"
        ? "Profiliniz güncellendi."
        : "Your profile has been updated.";
      
      Alert.alert(t("success"), successMessage);
      router.back();
    } catch (err) {
      console.error("Failed to save profile:", err);
      Alert.alert("Error", "Failed to save profile");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#1f1b4a" />
            </TouchableOpacity>
            <Text style={styles.title}>{t("editProfileTitle")}</Text>
            <View style={{ width: 40 }} />
          </View>

          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            <Image source={profileImage} style={styles.profileImage} />
            <View style={styles.imageOverlay}>
              <Ionicons name="camera" size={24} color="#fff" />
            </View>
            <Text style={styles.changePhoto}>{t("changePhoto")}</Text>
          </TouchableOpacity>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("username")}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#8a87a5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={t("enterYourName")}
                  placeholderTextColor="#9c9ab3"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("email")}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#8a87a5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t("enterYourEmail")}
                  placeholderTextColor="#9c9ab3"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("dateOfBirth")}</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setDatePickerVisibility(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color="#8a87a5" style={styles.inputIcon} />
                <Text
                  style={[
                    styles.dateInputText,
                    !birthDate && { color: "#9c9ab3" },
                  ]}
                >
                  {birthDate ? formatDateForDisplay(birthDate) : t("yyyyMmDd") || "Select date of birth"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#8a87a5" />
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={() => setDatePickerVisibility(false)}
                maximumDate={new Date()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#8a87a5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter new password (leave empty to keep current)"
                  placeholderTextColor="#9c9ab3"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#8a87a5"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>{t("save")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelText}>{t("cancel")}</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f2f8" },
  container: { flex: 1, backgroundColor: "#f4f2f8" },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: 25 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f1b4a",
    flex: 1,
    textAlign: "center",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 10,
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -55,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  changePhoto: { color: "#7c5cff", fontSize: 14, fontWeight: "600" },
  form: { width: "100%" },
  inputGroup: { marginBottom: 20 },
  label: {
    color: "#1f1b4a",
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e0ee",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f1b4a",
  },
  dateInputText: {
    flex: 1,
    fontSize: 16,
    color: "#1f1b4a",
  },
  eyeIcon: {
    padding: 4,
  },
  saveButton: {
    backgroundColor: "#7c5cff",
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    shadowColor: "#7c5cff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 18,
  },
  cancelButton: { padding: 12, marginTop: 10 },
  cancelText: { textAlign: "center", color: "#8a87a5", fontSize: 16, fontWeight: "500" },
});
