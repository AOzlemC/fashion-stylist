import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export const options = { headerShown: false };

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="shirt-outline" size={48} color="#7c5cff" />
          </View>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appName}>Fashion Stylist</Text>
          <Text style={styles.tagline}>Your personal style companion</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Login</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { marginTop: 16 }]}
            onPress={() => router.push("/signup")}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1f1b4a",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 30,
    paddingTop: 100,
    paddingBottom: 60,
  },
  header: {
    alignItems: "center",
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 18,
    color: "#bfbaff",
    marginBottom: 8,
    letterSpacing: 1,
  },
  appName: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    color: "#d9d6ff",
    textAlign: "center",
    marginTop: 8,
  },
  buttonContainer: {
    width: "100%",
  },
  primaryButton: {
    backgroundColor: "#7c5cff",
    paddingVertical: 18,
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#7c5cff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 18,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
