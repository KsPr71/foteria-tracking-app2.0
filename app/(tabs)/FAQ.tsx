import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

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
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary }}>
            <IconSymbol name="gearshape.fill" size={22} color="#fff" />
          </View>
          <View>
            <ThemedText type="title">FAQ</ThemedText>
            <ThemedText type="subtitle">Preguntas frecuentes</ThemedText>
          </View>
        </View>

        <View>
          {FAQ_ITEMS.map((item) => {
            const isOpen = openItems.has(item.id);
            return (
              <View key={item.id} className="mb-3">
                <TouchableOpacity
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.8}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    backgroundColor: colors.surface,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <ThemedText type="defaultSemiBold">{item.question}</ThemedText>
                  </View>

                  <IconSymbol name={isOpen ? "chevron.up" : "chevron.down"} size={22} color={colors.muted} />
                </TouchableOpacity>

                {isOpen && (
                  <View style={{ marginTop: 8, padding: 12, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                    <ThemedText type="default">{item.answer}</ThemedText>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ marginTop: 8 }}>
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
