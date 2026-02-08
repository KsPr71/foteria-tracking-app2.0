import { ScreenContainer } from "@/components/screen-container";
import { useNotifications } from "@/contexts/notifications-context";
import { hasNotificationService, NOTIFICATION_SERVICE_URL } from "@/constants/notifications";
import { useColors } from "@/hooks/use-colors";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const isExpoGo = Constants.executionEnvironment === "storeClient";

function maskUrl(url: string): string {
  if (!url || url.length < 20) return url;
  return `${url.slice(0, 24)}...${url.slice(-12)}`;
}

export default function NotificationTestScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    testConnection,
    testSnackbar,
    checkNow,
    syncTrackedOrdersNow,
    syncTrackedOrdersWithMockToken,
    diagnosePushToken,
    expoPushToken,
  } = useNotifications();
  const [connectionResult, setConnectionResult] = useState<{
    ok: boolean;
    error?: string;
    url?: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [syncMockResult, setSyncMockResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [syncingMock, setSyncingMock] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    token: string | null;
    permissionsStatus: string;
    error?: string;
    projectId: string;
  } | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionResult(null);
    try {
      const result = await testConnection();
      setConnectionResult(result);
    } finally {
      setTesting(false);
    }
  };

  const handleDiagnose = async () => {
    setDiagnosing(true);
    setDiagnosticResult(null);
    try {
      const result = await diagnosePushToken();
      setDiagnosticResult(result);
    } finally {
      setDiagnosing(false);
    }
  };

  const handleSyncWithMockToken = async () => {
    setSyncingMock(true);
    setSyncMockResult(null);
    try {
      await syncTrackedOrdersWithMockToken();
      setSyncMockResult({ ok: true });
    } catch (e) {
      setSyncMockResult({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSyncingMock(false);
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Probar microservicio de notificaciones
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Verifica conexión con el servicio y sincroniza órdenes rastreadas. Si hay problemas, prueba la conexión primero.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Estado</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.muted }]}>URL configurada</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>
              {hasNotificationService() ? "Sí" : "No"}
            </Text>
          </View>
          {hasNotificationService() && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.muted }]}>URL</Text>
              <Text style={[styles.value, { color: colors.foreground }]} numberOfLines={1}>
                {maskUrl(NOTIFICATION_SERVICE_URL)}
              </Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.muted }]}>Entorno</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>
              {Platform.OS === "web"
                ? "Web"
                : isExpoGo
                  ? "Expo Go"
                  : __DEV__
                    ? "Development build"
                    : "Production (APK)"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.muted }]}>Push token</Text>
            <Text style={[styles.value, { color: colors.foreground }]} numberOfLines={1}>
              {expoPushToken ? `${expoPushToken.slice(0, 20)}...` : "—"}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Diagnosticar token</Text>
          <Text style={[styles.hint, { color: colors.muted }]}>
            Si el token no aparece arriba, pulsa para ver el motivo exacto (permisos, error, etc.).
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, { borderColor: colors.border }]}
            onPress={handleDiagnose}
            disabled={diagnosing || Platform.OS === "web" || isExpoGo}
            activeOpacity={0.7}
          >
            {diagnosing ? (
              <ActivityIndicator size="small" color={colors.foreground} />
            ) : (
              <Text style={[styles.buttonTextSecondary, { color: colors.foreground }]}>
                Diagnosticar token push
              </Text>
            )}
          </TouchableOpacity>
          {diagnosticResult && (
            <View
              style={[
                styles.result,
                {
                  backgroundColor: diagnosticResult.token ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                  borderColor: diagnosticResult.token ? "#22c55e" : "#ef4444",
                },
              ]}
            >
              <Text
                style={[
                  styles.resultText,
                  { color: diagnosticResult.token ? "#22c55e" : "#ef4444" },
                ]}
              >
                {diagnosticResult.token
                  ? `✓ Token: ${diagnosticResult.token.slice(0, 30)}...`
                  : `✗ ${diagnosticResult.error ?? "Sin token"}`}
              </Text>
              <Text style={[styles.hint, { color: colors.muted, marginTop: 4 }]}>
                Permisos: {diagnosticResult.permissionsStatus} • projectId: {diagnosticResult.projectId.slice(0, 8)}...
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Acciones</Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleTestConnection}
            disabled={testing || !hasNotificationService()}
            activeOpacity={0.7}
          >
            {testing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Probar conexión (GET /api/health)</Text>
            )}
          </TouchableOpacity>
          {connectionResult && (
            <View
              style={[
                styles.result,
                {
                  backgroundColor: connectionResult.ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                  borderColor: connectionResult.ok ? "#22c55e" : "#ef4444",
                },
              ]}
            >
              <Text
                style={[
                  styles.resultText,
                  { color: connectionResult.ok ? "#22c55e" : "#ef4444" },
                ]}
              >
                {connectionResult.ok
                  ? "✓ Conexión OK"
                  : `✗ ${connectionResult.error ?? "Error"}`}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, { borderColor: colors.border }]}
            onPress={testSnackbar}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonTextSecondary, { color: colors.foreground }]}>
              Probar snackbar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, { borderColor: colors.border }]}
            onPress={() => checkNow()}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonTextSecondary, { color: colors.foreground }]}>
              Verificar cambios ahora (polling)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, { borderColor: colors.border }]}
            onPress={handleSyncWithMockToken}
            disabled={syncingMock || !hasNotificationService()}
            activeOpacity={0.7}
          >
            {syncingMock ? (
              <ActivityIndicator size="small" color={colors.foreground} />
            ) : (
              <Text style={[styles.buttonTextSecondary, { color: colors.foreground }]}>
                Sincronizar órdenes (token de prueba)
              </Text>
            )}
          </TouchableOpacity>
          {syncMockResult && (
            <View
              style={[
                styles.result,
                {
                  backgroundColor: syncMockResult.ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                  borderColor: syncMockResult.ok ? "#22c55e" : "#ef4444",
                },
              ]}
            >
              <Text
                style={[
                  styles.resultText,
                  { color: syncMockResult.ok ? "#22c55e" : "#ef4444" },
                ]}
              >
                {syncMockResult.ok
                  ? "✓ Register + sync OK"
                  : `✗ ${syncMockResult.error ?? "Error"}`}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, { borderColor: colors.border }]}
            onPress={() => syncTrackedOrdersNow()}
            disabled={!expoPushToken}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.buttonTextSecondary,
                { color: expoPushToken ? colors.foreground : colors.muted },
              ]}
            >
              Sincronizar órdenes (token real)
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Cómo probar</Text>
          <Text style={[styles.hint, { color: colors.muted }]}>
            • <Text style={[styles.bold, { color: colors.foreground }]}>Probar conexión</Text>:
            comprueba que el microservicio en Render responde. Funciona en Expo Go, web y dev
            build.
          </Text>
          <Text style={[styles.hint, { color: colors.muted }]}>
            • <Text style={[styles.bold, { color: colors.foreground }]}>Expo Go</Text>: usa
            “Sincronizar órdenes (token de prueba)” para probar register + sync sin token real.
          </Text>
          <Text style={[styles.hint, { color: colors.muted }]}>
            • <Text style={[styles.bold, { color: colors.foreground }]}>Dev build</Text> (
            npx expo run:android): obtienes token, se registra y sincroniza. El cron en
            Render puede enviar push cuando cambie una orden.
          </Text>
          <Text style={[styles.hint, { color: colors.muted }]}>
            • Añade una orden rastreada, cambia su estado en Supabase, dispara el cron (
            /api/cron?secret=...) o espera el polling; verás snackbar y/o push.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, { borderColor: colors.border }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonTextSecondary, { color: colors.foreground }]}>
            Volver
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32, gap: 16 },
  section: { gap: 4 },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 14 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  label: { fontSize: 14 },
  value: { fontSize: 14, flex: 1, textAlign: "right" },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  buttonTextSecondary: { fontSize: 15, fontWeight: "500" },
  result: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  resultText: { fontSize: 14, fontWeight: "500" },
  hint: { fontSize: 13, lineHeight: 20 },
  bold: { fontWeight: "600" },
});
