import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import ItemsScreen from "../(backoffice)/items";
import { router } from "expo-router";

export default function POSInventoryScreen() {
  const { hasPermission } = useAuth();
  const colors = useColors();

  if (!hasPermission("manageItemsFromPOS") && !hasPermission("manageItems") && !hasPermission("accessBackOffice")) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }] }>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginBottom: 12 }}>Inventory Access Denied</Text>
        <Text style={{ color: colors.mutedForeground, marginBottom: 18 }}>You do not have permission to manage inventory from this device. Contact a manager or admin.</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.btn, { backgroundColor: colors.primary }]}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Reuse the backoffice Items screen – provides full CRUD and image picker.
  return <ItemsScreen />;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 },
});
