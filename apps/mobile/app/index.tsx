import { View, Text, StyleSheet, Pressable } from "react-native";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>MIF BRECHO</Text>
      <Text style={styles.tagline}>
        Peças com história e muito carinho 💕
      </Text>

      <Link href="/produtos" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Ver peças</Text>
        </Pressable>
      </Link>

      <Link href="/carrinho" asChild>
        <Pressable style={[styles.button, styles.buttonOutline]}>
          <Text style={[styles.buttonText, styles.buttonOutlineText]}>
            Carrinho
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFF5F8",
  },
  logo: {
    fontSize: 42,
    fontWeight: "700",
    color: "#E91E63",
  },
  subtitle: {
    fontSize: 18,
    color: "#7B1FA2",
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: "#4A148C",
    textAlign: "center",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#E91E63",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 999,
    marginBottom: 12,
    minWidth: 200,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#E91E63",
  },
  buttonOutlineText: {
    color: "#E91E63",
  },
});
