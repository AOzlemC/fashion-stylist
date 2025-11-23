// app/signup.js
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export const options = {
  headerShown: true,
  title: "Sign Up",
  headerBackTitle: "",
  headerStyle: {
    backgroundColor: "#1f1b4a",
  },
  headerTintColor: "#fff",
  headerTitleStyle: {
    fontWeight: "600",
  },
};

export default function SignupScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    dateofbirth: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (key, value) => setFormData({ ...formData, [key]: value });

  const handleConfirm = (date) => {
    const formattedDate = date.toISOString().split("T")[0];
    setFormData({ ...formData, dateofbirth: formattedDate });
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

  const handleSignup = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.dateofbirth) {
      Alert.alert("Error", "Please fill all fields including date of birth!");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://192.168.1.14:5050/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (response.ok) {
        // Save user data to email-specific AsyncStorage key
        const userDataKey = `userData_${formData.email.toLowerCase()}`;
        await AsyncStorage.setItem(
          userDataKey,
          JSON.stringify({
            name: formData.name,
            email: formData.email.toLowerCase(),
            dateofbirth: formData.dateofbirth || "",
            profileImage: null,
            password: "", // Don't store password
          })
        );
        Alert.alert("Success", "Registration successful!");
        setTimeout(() => {
          router.push("/login");
        }, 500);
      } else {
        console.error("Signup failed:", data);
        Alert.alert("Error", data.message || data.error || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Server connection failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
            <View style={styles.iconContainer}>
              <Ionicons name="person-add-outline" size={40} color="#7c5cff" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us to get started</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#8a87a5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#9c9ab3"
                  value={formData.name}
                  onChangeText={(val) => handleChange("name", val)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#8a87a5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="example@mail.com"
                  placeholderTextColor="#9c9ab3"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(val) => handleChange("email", val)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#8a87a5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9c9ab3"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={formData.password}
                  onChangeText={(val) => handleChange("password", val)}
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setDatePickerVisibility(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color="#8a87a5" style={styles.inputIcon} />
                <Text
                  style={[
                    styles.input,
                    !formData.dateofbirth && { color: "#9c9ab3" },
                  ]}
                >
                  {formData.dateofbirth
                    ? formatDateForDisplay(formData.dateofbirth)
                    : "Select your date of birth"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#8a87a5" />
              </TouchableOpacity>

              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirm}
                onCancel={() => setDatePickerVisibility(false)}
                maximumDate={new Date()}
              />
            </View>

            <TouchableOpacity
              style={[styles.signupButton, isSubmitting && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.signupButtonText}>
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.footerLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f2f8",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#7c5cff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f1b4a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#8a87a5",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f1b4a",
    marginBottom: 8,
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
  eyeIcon: {
    padding: 4,
  },
  signupButton: {
    backgroundColor: "#7c5cff",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#7c5cff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#8a87a5",
  },
  footerLink: {
    fontSize: 14,
    color: "#7c5cff",
    fontWeight: "600",
  },
});
