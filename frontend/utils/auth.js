import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem("token", token);
  } catch (err) {
    console.error("Error storing token", err);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem("token");
  } catch (err) {
    console.error("Error getting token", err);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem("token");
  } catch (err) {
    console.error("Error removing token", err);
  }
};