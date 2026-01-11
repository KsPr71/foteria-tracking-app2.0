export interface OrderData {
  metadata: {
    fecha_generacion: string;
    total_registros: number;
    filtros_aplicados: {
      fecha_inicio: string;
      fecha_fin: string;
    };
    modelo: string;
  };
  data: Order[];
}

export interface Order {
  cliente: string;
  orden: string;
  fecha: string;
  estado: OrderStatus;
  productos_entrega_parcial: string | null;
}

export enum OrderStatus {
  SesionRealizada = 0,
  Preparacion = 1,
  Edicion = 2,
  Impresion = 3,
  ListaEntregaParcial = 4,
  ListaEntregaTotal = 5,
  Entregado = 6,
}

export interface Stage {
  id: OrderStatus;
  title: string;
  icon: string;
  description: string;
}

export const STAGES: Stage[] = [
  {
    id: OrderStatus.SesionRealizada,
    title: "Sesión realizada",
    icon: "camera",
    description: "Tu sesión fotográfica ha sido completada",
  },
  {
    id: OrderStatus.Preparacion,
    title: "Preparación",
    icon: "folder",
    description: "Estamos preparando tus fotografías",
  },
  {
    id: OrderStatus.Edicion,
    title: "Edición",
    icon: "edit",
    description: "Tus fotos están siendo editadas",
  },
  {
    id: OrderStatus.Impresion,
    title: "Impresión",
    icon: "print",
    description: "Estamos imprimiendo tus fotografías",
  },
  {
    id: OrderStatus.ListaEntregaParcial,
    title: "Lista para entrega parcial",
    icon: "package",
    description: "Parte de tu pedido está listo",
  },
  {
    id: OrderStatus.ListaEntregaTotal,
    title: "Lista para entrega total",
    icon: "check-circle",
    description: "Tu pedido completo está listo",
  },
  {
    id: OrderStatus.Entregado,
    title: "Entregado",
    icon: "check-circle",
    description: "Tu pedido ha sido entregado",
  },
];
