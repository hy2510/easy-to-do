import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-url-polyfill/auto";

export default function App() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#f5f5f5" },
        }}
      />
    </SafeAreaProvider>
  );
}
