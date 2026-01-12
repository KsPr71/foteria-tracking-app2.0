import { useColors } from "@/hooks/use-colors";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

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
      const d = new Date(fechaFin);
      if (!isNaN(d.getTime()))
        return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
      // fallback
    }
    return fechaFin;
  })();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {formatted && (
        <Text style={[styles.updatedText, { color: colors.muted }]}>Actualizado: {formatted}</Text>
      )}
      <Text style={[styles.text, { color: colors.muted }]}>© {currentYear} La Fotería. Todos los derechos reservados.</Text>
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
});
