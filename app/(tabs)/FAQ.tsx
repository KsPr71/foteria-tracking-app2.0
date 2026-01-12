import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 1,
    question: "¿Cómo busco mi orden?",
    answer:
      'Ingresa tu número de orden en el formato XXXXX-XXX-XXXX (por ejemplo: 01005-001-0003) en el campo de búsqueda. El sistema agregará automáticamente los guiones mientras escribes. Luego haz clic en "Buscar Orden" para ver el estado de tu pedido.',
  },
  {
    id: 2,
    question: "¿Cuáles son las etapas del proceso?",
    answer:
      'Tu pedido pasa por 6 etapas: 1) Sesión Realizada - tu sesión fotográfica ha sido completada, 2) Preparación - preparamos tus fotos para edición, 3) Edición - editamos y retocamos tus imágenes, 4) Impresión - imprimimos tus productos, 5) Lista para Entrega - tu orden está lista para retirar, 6) Entregado - tu orden ha sido entregada.',
  },
  {
    id: 3,
    question: "¿Cuánto tiempo tarda cada etapa?",
    answer:
      'Los tiempos varían según el tipo de producto y la cantidad de pedidos. En promedio se trata de entregar antes de los tres meses para las sesiones habituales y antes del mes para los menores de 1 año. Nuestro equipo se esfuerza por cumplir con estos plazos y te notificará si hay algún retraso.',
  },
  {
    id: 4,
    question: "¿Dónde puedo retirar mi orden?",
    answer:
      'Puedes retirar tu orden en nuestro estudio ubicado en La Fotería. Cuando tu orden esté en estado "Lista para Entrega", recibirás una notificación. Dirección: Calle Ignacio Agramonte nº 110, entre Palma y Verges.',
  },
  {
    id: 5,
    question: "¿Puedo modificar mi orden después de la sesión?",
    answer:
      'Una vez que tu sesión ha sido realizada y comienza la etapa de preparación, los cambios son limitados. Si necesitas realizar cambios, por favor contacta directamente a nuestro equipo lo antes posible. Cambios después de la etapa de edición pueden no ser posibles.',
  },
  {
    id: 6,
    question: "¿Qué hago si no encuentro mi orden?",
    answer:
      'Verifica que estés ingresando el número de orden correcto en el formato XXXXX-XXX-XXXX. Si aún no aparece, es posible que tu orden aún no haya sido registrada en el sistema. Contacta a nuestro equipo de atención al cliente para obtener asistencia.',
  },
  {
    id: 7,
    question: "¿Cómo puedo contactar al equipo de La Fotería?",
    answer:
      'Puedes contactarnos a través de: Teléfono: +53 5371 0376, Email: foteriaestudio@gmail.com, Dirección: Calle Ignacio Agramonte nº 110, entre Palma y Verges. Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 horas.',
  },
  {
    id: 8,
    question: "¿Es segura esta aplicación?",
    answer:
      'Sí, utilizamos conexiones seguras (HTTPS) y encriptación para proteger tus datos. Tu información de búsqueda no se almacena en nuestros servidores. Solo utilizamos tu número de orden para mostrarte el estado de tu pedido.',
  },
];

export default function FAQ() {
  const colors = useColors();
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (id: number) => {
    const newSet = new Set(openItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setOpenItems(newSet);
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 8, flexGrow: 1 }}>
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
            <IconSymbol name="questionmark.circle" size={42} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.brand, { color: colors.primary }]}>La Fotería</Text>
            <ThemedText type="title">FAQ</ThemedText>
            <ThemedText type="subtitle">Preguntas frecuentes</ThemedText>
          </View>
        </View>

        <View>
          {FAQ_ITEMS.map((item) => {
            const isOpen = openItems.has(item.id);
            return (
              <View key={item.id} style={{ marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.85}
                  style={[
                    styles.questionCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>

                    <View style={{ flex: 1, paddingLeft: 12 }}>
                      <ThemedText type="defaultSemiBold">{item.question}</ThemedText>
                    </View>
                  </View>

                  <IconSymbol name={isOpen ? "chevron.up" : "chevron.down"} size={22} color={colors.muted} />
                </TouchableOpacity>

                <View
                  style={{
                    marginTop: 8,
                    padding: 14,
                    backgroundColor: colors.surface,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: isOpen ? colors.primary : colors.border,
                    display: isOpen ? 'flex' : 'none',
                  }}
                >
                  <ThemedText type="default">{item.answer}</ThemedText>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ marginTop: 8, borderColor: colors.primary, borderTopWidth: 1, borderWidth: 1, paddingTop: 12, paddingHorizontal: 8, backgroundColor: colors.surface, borderRadius: 12, paddingBottom: 16 }}>
          <ThemedText type="subtitle">¿Aún tienes preguntas?</ThemedText>
          <ThemedText>
            Si no encontraste la respuesta que buscas, nuestro equipo de atención al cliente está aquí para ayudarte.
          </ThemedText>
          <ThemedText type="defaultSemiBold">Email: foteriaestudio@gmail.com</ThemedText>
          <ThemedText type="defaultSemiBold">Teléfono: +53 5371 0376</ThemedText>
        </View>
      </ScrollView>
      {/* Floating WhatsApp button */}

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    justifyContent: 'center',
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  questionCard: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  qIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

