import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SUPABASE_URL =
  "https://lcuaqykvynaqtyqofdsv.supabase.co/storage/v1/object/public/datos/datos-ordenes.json";

export function Footer() {
  const colors = useColors();
  const currentYear = new Date().getFullYear();
  const [fechaFin, setFechaFin] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(SUPABASE_URL);
        if (!res.ok) return;
        const json = await res.json();
        const fecha = json?.metadata?.filtros_aplicados?.fecha_fin ?? null;
        if (mounted && fecha) setFechaFin(String(fecha));
      } catch (e) {
        // ignore fetch errors
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const formatted = (() => {
    if (!fechaFin) return null;
    try {
      // Parsear la fecha como fecha local para evitar problemas de zona horaria
      // Si la fecha viene en formato YYYY-MM-DD, parsearla correctamente
      const fechaParts = String(fechaFin).split("-");
      if (fechaParts.length === 3) {
        const year = parseInt(fechaParts[0], 10);
        const month = parseInt(fechaParts[1], 10) - 1; // Los meses en JS son 0-indexed
        const day = parseInt(fechaParts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("es-ES", { 
            day: "numeric", 
            month: "long", 
            year: "numeric",
          });
        }
      }
      // Fallback: intentar parsear normalmente
      const d = new Date(fechaFin);
      if (!isNaN(d.getTime()))
        return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
      // fallback
    }
    return fechaFin;
  })();

  const handleAboutPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/modal");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {formatted && (
        <Text style={[styles.updatedText, { color: colors.muted }]}>Actualizado: {formatted}</Text>
      )}
      <TouchableOpacity onPress={handleAboutPress} activeOpacity={0.7}>
        <Text style={[styles.text, { color: colors.muted }]}>© {currentYear} La Fotería. Todos los derechos reservados.</Text>
        <Text style={[styles.aboutLink, { color: colors.primary }]}>Acerca de</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    alignItems: "center",
    marginTop: 24,
  },
  text: {
    fontSize: 12,
    textAlign: "center",
  },
  updatedText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
  },
  aboutLink: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    textDecorationLine: "underline",
  },
});
