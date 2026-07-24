import { Platform } from "react-native";
import Constants from "expo-constants";

export async function getDeviceName(): Promise<string> {
  try {
    // On native platforms, use Expo Constants to get device info
    if (Platform.OS !== "web") {
      const deviceName = Constants.sessionId || Constants.installationId || "Unknown Device";
      const modelName = Constants.modelName || Constants.modelId || Platform.OS;
      return `${modelName} (${deviceName.substring(0, 8)})`;
    }
    // On web, use browser/OS info
    return `${Platform.OS} (${new Date().getTime().toString(36).substring(0, 8)})`;
  } catch {
    return "Unknown Device";
  }
}

export function getSimpleDeviceName(): string {
  if (Platform.OS === "ios") return "iPhone";
  if (Platform.OS === "android") return "Android Device";
  if (Platform.OS === "web") return "Web Browser";
  return "Device";
}
