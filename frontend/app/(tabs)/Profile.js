
// app/(tabs)/Profile.js
import React, { useEffect, useState, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../contexts/LanguageContext";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function Profile() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [user, setUser] = useState({
    name: "",
    email: "",
    dateofbirth: "",
    password: "",
    profileImage: require("../../assets/images/icon.png"),
  });
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({
    name: "",
    email: "",
    dateofbirth: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const settingsOptions = useMemo(() => [
    { label: t("personalInformation"), icon: "person-outline", action: () => {} },
    { label: t("language"), icon: "language-outline", action: () => router.push("/language-settings") },
    { label: t("notifications"), icon: "notifications-outline", action: () => {} },
    { label: t("location"), icon: "location-outline", action: () => {} },
  ], [t, language]);

  const quickActions = useMemo(() => [
    { label: t("editProfile"), icon: "create-outline", action: () => router.push("/edit-profile") },
    { label: t("styleGoals"), icon: "sparkles-outline", action: () => console.log("style goals") },
    { label: t("wardrobe"), icon: "shirt-outline", action: () => router.push("/(tabs)/Wardrobe") },
  ], [t, language]);

  const highlightCards = useMemo(() => [
    { title: t("Favorite outfits"), value: "12", accent: "#ffb5c2" },
    { title: t("moodBoards"), value: "5", accent: "#ffd38a" },
    { title: t("followingStylists"), value: "8", accent: "#c5d4ff" },
  ], [t, language]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      // Get current user email
      const currentUserEmail = await AsyncStorage.getItem("currentUserEmail");
      if (!currentUserEmail) {
        console.log("Profile: No current user email found");
        setIsLoading(false);
        return;
      }

      // Load user-specific data using email as key
      const userDataKey = `userData_${currentUserEmail.toLowerCase()}`;
      const userData = await AsyncStorage.getItem(userDataKey);
      
      console.log("Profile: Loading data for email:", currentUserEmail);
      console.log("Profile: UserData key:", userDataKey);
      console.log("Profile: UserData exists:", !!userData);
      
      if (userData) {
        const parsed = JSON.parse(userData);
        console.log("Profile: Loaded user data:", { 
          name: parsed.name, 
          email: parsed.email, 
          hasDateOfBirth: !!parsed.dateofbirth,
          dateofbirth: parsed.dateofbirth
        });
        
        setUser({
          name: parsed.name || "",
          email: parsed.email || currentUserEmail,
          dateofbirth: parsed.dateofbirth || "",
          password: "", // Don't store password in state
          profileImage: parsed.profileImage
            ? { uri: parsed.profileImage }
            : require("../../assets/images/icon.png"),
        });
        setEditValues({
          name: parsed.name || "",
          email: parsed.email || currentUserEmail,
          dateofbirth: parsed.dateofbirth || "",
          password: "",
        });
      } else {
        console.log("Profile: No user data found for key:", userDataKey);
        // Set default values so fields still show
        setUser({
          name: "",
          email: currentUserEmail,
          dateofbirth: "",
          password: "",
          profileImage: require("../../assets/images/icon.png"),
        });
        setEditValues({
          name: "",
          email: currentUserEmail,
          dateofbirth: "",
          password: "",
        });
      }
    } catch (err) {
      console.error("Profile: Failed to load user data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Reload data when screen comes into focus (e.g., after login)
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const handleEdit = (field) => {
    setEditingField(field);
    setEditValues((prev) => ({
      ...prev,
      [field]: user[field] || "",
    }));
  };

  const handleSave = async (field) => {
    // If password is being updated, call the backend API
    if (field === "password") {
      if (!editValues.password || editValues.password.trim() === "") {
        Alert.alert("Error", "Password cannot be empty!");
        return;
      }

      try {
        console.log("Updating password for email:", user.email);
        const response = await fetch("http://192.168.1.8:5050/auth/update-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            newPassword: editValues.password,
          }),
        });

        console.log("Response status:", response.status);
        const text = await response.text();
        console.log("Response text:", text);
        
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }

        if (response.ok) {
          // Update local state
          const updatedUser = {
            ...user,
            password: editValues.password,
          };
          setUser(updatedUser);
          setEditingField(null);

          // Save to email-specific AsyncStorage (but don't store password)
          const currentUserEmail = await AsyncStorage.getItem("currentUserEmail");
          if (currentUserEmail) {
            const userDataKey = `userData_${currentUserEmail.toLowerCase()}`;
            const userData = await AsyncStorage.getItem(userDataKey);
            const parsed = userData ? JSON.parse(userData) : {};
            await AsyncStorage.setItem(
              userDataKey,
              JSON.stringify({
                ...parsed,
                // Don't store password in AsyncStorage for security
              })
            );
          }
          Alert.alert("Success", "Password updated successfully! You can now log in with your new password.");
        } else {
          console.error("Password update failed:", data);
          Alert.alert("Error", data.message || `Failed to update password. Status: ${response.status}`);
        }
      } catch (err) {
        console.error("Failed to update password:", err);
        Alert.alert("Error", `Server connection failed: ${err.message}`);
      }
      return;
    }

    // For other fields, update on backend and then locally
    try {
      const currentUserEmail = await AsyncStorage.getItem("currentUserEmail");
      if (!currentUserEmail) {
        Alert.alert("Error", "User email not found. Please log in again.");
        return;
      }

      // Call backend API to update profile
      const updateData = { email: currentUserEmail };
      if (field === "name") updateData.name = editValues.name;
      if (field === "email") updateData.email = editValues.email;
      if (field === "dateofbirth") updateData.dateofbirth = editValues.dateofbirth;

      const response = await fetch("http://192.168.1.8:5050/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (response.ok) {
        // Update local state
        const updatedUser = {
          ...user,
          [field]: editValues[field],
        };
        setUser(updatedUser);
        setEditingField(null);

        // Save to email-specific AsyncStorage
        const userDataKey = `userData_${currentUserEmail.toLowerCase()}`;
        const userData = await AsyncStorage.getItem(userDataKey);
        const parsed = userData ? JSON.parse(userData) : {};
        await AsyncStorage.setItem(
          userDataKey,
          JSON.stringify({
            ...parsed,
            [field]: editValues[field],
          })
        );

        // If email was changed, update the key
        if (field === "email" && editValues.email !== currentUserEmail) {
          await AsyncStorage.setItem("currentUserEmail", editValues.email.toLowerCase());
          const newKey = `userData_${editValues.email.toLowerCase()}`;
          await AsyncStorage.setItem(newKey, JSON.stringify({ ...parsed, email: editValues.email }));
          await AsyncStorage.removeItem(userDataKey);
        }

        Alert.alert("Success", "Profile updated successfully!");
      } else {
        Alert.alert("Error", data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      Alert.alert("Error", "Server connection failed");
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValues({
      name: user.name,
      email: user.email,
      dateofbirth: user.dateofbirth,
      password: user.password,
    });
  };

  const handleDateConfirm = async (date) => {
    const formattedDate = date.toISOString().split("T")[0];
    setEditValues({ ...editValues, dateofbirth: formattedDate });
    setDatePickerVisibility(false);
    
    // Call handleSave to update on backend
    await handleSave("dateofbirth");
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

  const handleLogout = () => {
    Alert.alert(t("logOut"), t("areYouSureLogOut"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logOut"),
        style: "destructive",
        onPress: () => router.replace("/login"),
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(t("deleteAccount"), t("deleteAccountWarning"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => console.log("Account deleted"),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image source={user.profileImage} style={styles.profileImage} />
          <View style={styles.profileInfo}>
            <Text style={styles.badge}>{t("styleMember")}</Text>
            <Text style={styles.heroName}>{user.name}</Text>
            <Text style={styles.heroSubtitle}>{t("designingYourDailyLooks")}</Text>
          </View>
        </View>
        
      </View>

      <View style={styles.highlightRow}>
        {highlightCards.map((card) => (
          <View key={card.title} style={[styles.highlightCard, { backgroundColor: card.accent }]}>
            <Text style={styles.highlightValue}>{card.value}</Text>
            <Text style={styles.highlightTitle}>{card.title}</Text>
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        {quickActions.map((action) => (
          <TouchableOpacity key={action.label} style={styles.quickAction} onPress={action.action}>
            <Ionicons name={action.icon} size={20} color="#fff" />
            <Text style={styles.quickActionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{t("personalDetails")}</Text>

        {/* Name Field */}
        <View style={styles.editableField}>
          <Text style={styles.infoLabel}>Name</Text>
          {editingField === "name" ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editValues.name}
                onChangeText={(text) => setEditValues({ ...editValues, name: text })}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.saveButton, { marginLeft: 8 }]}
                onPress={() => handleSave("name")}
              >
                <Ionicons name="checkmark" size={20} color="#7c5cff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelButton, { marginLeft: 8 }]} onPress={handleCancel}>
                <Ionicons name="close" size={20} color="#8a87a5" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.valueContainer}>
              <Text style={styles.infoValue}>{user.name || "Tap to set name"}</Text>
              <TouchableOpacity onPress={() => handleEdit("name")}>
                <Ionicons name="create-outline" size={18} color="#7c5cff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Email Field */}
        <View style={styles.editableField}>
          <Text style={styles.infoLabel}>Email</Text>
          {editingField === "email" ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editValues.email}
                onChangeText={(text) => setEditValues({ ...editValues, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.saveButton, { marginLeft: 8 }]}
                onPress={() => handleSave("email")}
              >
                <Ionicons name="checkmark" size={20} color="#7c5cff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelButton, { marginLeft: 8 }]} onPress={handleCancel}>
                <Ionicons name="close" size={20} color="#8a87a5" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.valueContainer}>
              <Text style={styles.infoValue}>{user.email || "Tap to set email"}</Text>
              <TouchableOpacity onPress={() => handleEdit("email")}>
                <Ionicons name="create-outline" size={18} color="#7c5cff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Date of Birth Field */}
        <View style={styles.editableField}>
          <Text style={styles.infoLabel}>{t("dateOfBirth")}</Text>
          {editingField === "dateofbirth" ? (
            <View style={styles.editContainer}>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setDatePickerVisibility(true)}
              >
                <Text style={styles.dateInputText}>
                  {editValues.dateofbirth
                    ? formatDateForDisplay(editValues.dateofbirth)
                    : "Select date"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelButton, { marginLeft: 8 }]} onPress={handleCancel}>
                <Ionicons name="close" size={20} color="#8a87a5" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.valueContainer}>
              <Text style={styles.infoValue}>
                {user.dateofbirth ? formatDateForDisplay(user.dateofbirth) : "Tap to set date of birth"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  handleEdit("dateofbirth");
                  setDatePickerVisibility(true);
                }}
              >
                <Ionicons name="create-outline" size={18} color="#7c5cff" />
              </TouchableOpacity>
            </View>
          )}
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleDateConfirm}
            onCancel={() => {
              setDatePickerVisibility(false);
              handleCancel();
            }}
            maximumDate={new Date()}
          />
        </View>

        {/* Password Field */}
        <View style={styles.editableField}>
          <Text style={styles.infoLabel}>Password</Text>
          {editingField === "password" ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editValues.password}
                onChangeText={(text) => setEditValues({ ...editValues, password: text })}
                secureTextEntry={!showPassword}
                placeholder="Enter new password"
                placeholderTextColor="#9c9ab3"
                autoFocus
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={[styles.eyeButton, { marginLeft: 8 }]}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#8a87a5"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { marginLeft: 8 }]}
                onPress={() => handleSave("password")}
              >
                <Ionicons name="checkmark" size={20} color="#7c5cff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelButton, { marginLeft: 8 }]} onPress={handleCancel}>
                <Ionicons name="close" size={20} color="#8a87a5" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.valueContainer}>
              <Text style={styles.infoValue}>
                {user.password ? "••••••••" : "Tap to set password"}
              </Text>
              <TouchableOpacity onPress={() => handleEdit("password")}>
                <Ionicons name="create-outline" size={18} color="#7c5cff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("accountSettings")}</Text>
        {settingsOptions.map((option) => (
          <TouchableOpacity key={option.label} style={styles.optionItem} onPress={option.action}>
            <View style={styles.optionLeft}>
              <Ionicons name={option.icon} size={22} color="#555" />
              <View>
                <Text style={styles.optionText}>{option.label}</Text>
                <Text style={styles.optionSubtext}>{t("manageYourPreferences")}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#bbb" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={handleLogout}>
          <Text style={styles.footerButtonText}>{t("logOut")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteButtonText}>{t("deleteAccount")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f2f8" },
  content: { padding: 20, paddingBottom: 40 },
  heroCard: {
    backgroundColor: "#1f1b4a",
    padding: 22,
    borderRadius: 28,
    marginBottom: 22,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
  },
  profileImage: { width: 76, height: 76, borderRadius: 38, marginRight: 18 },
  profileInfo: { flex: 1 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    marginBottom: 6,
  },
  heroName: { color: "#fff", fontSize: 24, fontWeight: "700" },
  heroSubtitle: { color: "#dcd8ff", marginTop: 2 },
  heroEditButton: {
    marginTop: 18,
    alignSelf: "flex-start",
    backgroundColor: "#7c5cff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroEditText: { color: "#fff", fontWeight: "600" },
  highlightRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  highlightCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 4,
    backgroundColor: "#fee2e7",
  },
  highlightValue: { fontSize: 20, fontWeight: "700", color: "#1f1b4a" },
  highlightTitle: { color: "#473f7c", marginTop: 4 },
  quickActions: { flexDirection: "row", justifyContent: "space-between", marginBottom: 25 },
  quickAction: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c5cff",
    borderRadius: 18,
    paddingVertical: 14,
    marginHorizontal: 6,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
  },
  quickActionText: { color: "#fff", fontSize: 13, fontWeight: "600", textAlign: "center" },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
  },
  infoTitle: { fontSize: 18, fontWeight: "700", marginBottom: 20, color: "#1f1b4a" },
  editableField: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  valueContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  infoLabel: { color: "#8a87a5", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: "600", color: "#272343", flex: 1 },
  editContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  editInput: {
    flex: 1,
    backgroundColor: "#f7f5ff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f1b4a",
    borderWidth: 1,
    borderColor: "#e5e0ee",
  },
  dateInput: {
    flex: 1,
    backgroundColor: "#f7f5ff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e5e0ee",
  },
  dateInputText: {
    fontSize: 16,
    color: "#1f1b4a",
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0edff",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  eyeButton: {
    padding: 8,
  },
  section: { marginBottom: 25, backgroundColor: "#fff", borderRadius: 22, padding: 18 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12, color: "#333" },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  optionText: { fontSize: 16, color: "#333", fontWeight: "600" },
  optionSubtext: { fontSize: 13, color: "#777" },
  footer: { marginTop: 10, borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 20 },
  footerButton: { paddingVertical: 12 },
  footerButtonText: { fontSize: 16, color: "#007AFF", fontWeight: "600", textAlign: "center" },
  deleteButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,0,0,0.2)",
    borderRadius: 12,
    backgroundColor: "#fff5f5",
  },
  deleteButtonText: { color: "red", fontWeight: "700", fontSize: 16, textAlign: "center" },
});