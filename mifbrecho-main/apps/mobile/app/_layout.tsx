import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#FFF5F8" },
          headerTintColor: "#E91E63",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#FFF5F8" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "MIF BRECHO" }} />
        <Stack.Screen name="produtos" options={{ title: "Peças" }} />
        <Stack.Screen name="carrinho" options={{ title: "Carrinho" }} />
      </Stack>
    </>
  );
}
