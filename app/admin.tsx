import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { AdminService } from "@/lib/admin-service";
import { router } from "expo-router";

export default function AdminScreen() {
  const colors = useColors();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const adminService = AdminService.getInstance();

  const handleLogin = () => {
    if (!password.trim()) {
      Alert.alert("Error", "Por favor ingresa la contraseña");
      return;
    }

    if (password === "LaFoteria@Admin2026") {
      setIsAuthenticated(true);
      setPassword("");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      Alert.alert("Error", "Contraseña incorrecta");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    setSelectedFile(null);
  };

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      // Leer contenido del archivo
      const response = await fetch(file.uri);
      const content = await response.text();

      setSelectedFile({
        name: file.name,
        content,
      });

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("Error selecting file:", error);
      Alert.alert("Error", "No se pudo seleccionar el archivo");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert("Error", "Por favor selecciona un archivo primero");
      return;
    }

    setIsUploading(true);

    try {
      const result = await adminService.uploadOrdersFile(selectedFile.content);

      if (result.success) {
        Alert.alert("Éxito", result.message);
        setSelectedFile(null);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        Alert.alert("Error", result.message);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      Alert.alert("Error", "Ocurrió un error al subir el archivo");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.container}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.surface }]}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
                  <IconSymbol name="gearshape.fill" size={40} color="#ffffff" />
                </View>
              </View>

              <Text style={[styles.title, { color: colors.foreground }]}>Panel de Administración</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Ingresa la contraseña para acceder
              </Text>

              <View style={styles.form}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
                  ]}
                  placeholder="Contraseña"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />

                <TouchableOpacity
                  style={[styles.loginButton, { backgroundColor: colors.primary }]}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginButtonText}>Acceder</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Pantalla de administración (después de login)
  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.surface }]}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Administración</Text>
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: colors.surface }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <IconSymbol name="xmark" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>

          {/* Actualizar datos de órdenes */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Actualizar datos de órdenes</Text>
            <Text style={[styles.cardText, { color: colors.muted }]}>
              Selecciona un archivo JSON con los datos actualizados de las órdenes. El archivo será validado y subido
              al servidor.
            </Text>

            {selectedFile && (
              <View style={[styles.filePreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <IconSymbol name="paperplane.fill" size={24} color={colors.primary} />
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: colors.foreground }]}>{selectedFile.name}</Text>
                  <Text style={[styles.fileSize, { color: colors.muted }]}>
                    {(selectedFile.content.length / 1024).toFixed(2)} KB
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedFile(null)} activeOpacity={0.7}>
                  <IconSymbol name="xmark" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={handleSelectFile}
              activeOpacity={0.8}
              disabled={isUploading}
            >
              <IconSymbol name="folder.fill" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Seleccionar archivo JSON</Text>
            </TouchableOpacity>

            {selectedFile && (
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.success, borderColor: colors.success },
                  isUploading && styles.buttonDisabled,
                ]}
                onPress={handleUpload}
                activeOpacity={0.8}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <IconSymbol name="paperplane.fill" size={20} color="#ffffff" />
                    <Text style={styles.buttonText}>Subir archivo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
            <Text style={[styles.infoTitle, { color: colors.warning }]}>⚠️ Importante</Text>
            <Text style={[styles.infoText, { color: colors.muted }]}>
              El archivo JSON debe tener la estructura correcta con los campos: metadata, data (array de órdenes con
              cliente, orden, fecha, estado, productos_entrega_parcial).
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 24,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingBottom: 60,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  form: {
    width: "100%",
    gap: 16,
  },
  passwordInput: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
  },
  loginButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    flex: 1,
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
