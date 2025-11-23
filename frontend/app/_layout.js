

import React from "react";
import { Stack } from "expo-router";
import { LanguageProvider } from "../contexts/LanguageContext";

export default function Layout() {
  return (
    <LanguageProvider>
      <Stack>
        {/* Tabs burada, headerShown false yapmayın */}
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }} // Bu Stack başlığı gizli, sadece modal için başlık gösterilecek
        />

        {/* SelectItem modal ekran */}
        <Stack.Screen
          name="SelectItem"
          options={{
            headerShown: true,
            title: "Select Item",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="Chatbot"
          options={{
            headerShown: true,
            title: "Chatbot",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="language-settings"
          options={{
            headerShown: true,
            title: "Language",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="add-item"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </LanguageProvider>
  );
}

