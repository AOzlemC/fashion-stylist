
import React from "react";
import { View, TouchableOpacity, StyleSheet, Text, Platform } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../contexts/LanguageContext";

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const router = useRouter();
  const { t } = useLanguage();

  const renderTab = (route, index) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    let iconName;
    let label;
    switch (route.name) {
      case "Home":
        iconName = "home";
        label = t("home");
        break;
      case "Wardrobe":
        iconName = "shirt";
        label = t("wardrobe");
        break;
      case "AI":
        iconName = "chatbubbles";
        label = t("ai");
        break;
      case "Profile":
        iconName = "person";
        label = t("profile");
        break;
      default:
        iconName = "ellipse";
        label = route.name;
    }

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, isFocused && styles.iconContainerActive]}>
          <Ionicons
            name={isFocused ? iconName : `${iconName}-outline`}
            size={24}
            color={isFocused ? "#7c5cff" : "#b5b3c8"}
          />
        </View>
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.tabBarContainer}>
      {renderTab(state.routes[0], 0)} {/* Home */}
      {renderTab(state.routes[1], 1)} {/* Wardrobe */}
      
      {/* Add button in the middle */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/add-item")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {renderTab(state.routes[2], 2)} {/* AI */}
      {renderTab(state.routes[3], 3)} {/* Profile */}
    </View>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        tabBarStyle: { display: "none" }, // Hide default tab bar
      }}
    >
      <Tabs.Screen name="Home" options={{ title: "Home" }} />
      <Tabs.Screen name="Wardrobe" options={{ title: "Wardrobe" }} />
      <Tabs.Screen name="AI" options={{ title: "AI" }} />
      <Tabs.Screen name="Profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    height: Platform.OS === "ios" ? 88 : 70,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    paddingTop: 8,
    paddingHorizontal: 12,
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: "#f0edff",
  },
  tabLabel: {
    fontSize: 11,
    color: "#b5b3c8",
    fontWeight: "500",
    marginTop: 2,
  },
  tabLabelActive: {
    color: "#7c5cff",
    fontWeight: "600",
  },
  addButtonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7c5cff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c5cff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 4,
  },
});

/*
import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const router = useRouter();

  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          if (!isFocused) {
            navigation.navigate(route.name);
          }
        };

        // Ortadaki Add Item butonu için boş alan bırak
        if (route.name === "AI") {
          return (
            <View key={route.key} style={styles.fabPlaceholder}>
              <TouchableOpacity
                style={styles.fabTab}
                onPress={() => router.push("/add-item")}
              >
                <Ionicons name="add" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                route.name === "Home"
                  ? "home-outline"
                  : route.name === "Wardrobe"
                  ? "shirt-outline"
                  : route.name === "Profile"
                  ? "person-outline"
                  : "ellipse-outline"
              }
              size={24}
              color={isFocused ? "#7c5cff" : "#b5b3c8"}
            />
            <Text style={{ color: isFocused ? "#7c5cff" : "#b5b3c8", fontSize: 12 }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: { height: 70, backgroundColor: "#000" },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="Home" options={{ title: "Home" }} />
      <Tabs.Screen name="Wardrobe" options={{ title: "Wardrobe" }} />
      <Tabs.Screen name="AI" options={{ title: "Add" }} />
      <Tabs.Screen name="Profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    height: 70,
    backgroundColor: "#000",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  fabPlaceholder: {
    width: 70, // Buton için genişlik
    alignItems: "center",
  },
  fabTab: {
    width: 64,
    height: 64,
    borderRadius: 32, // Tam yuvarlak
    backgroundColor: "#ff8fb7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30, // Hafif yukarıda görünmesi için
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 6,
    elevation: 5,
  },
});*/