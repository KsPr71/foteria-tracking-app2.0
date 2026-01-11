import { OrderService } from "./order-service";

interface UploadResult {
  success: boolean;
  message: string;
}

export class AdminService {
  private static instance: AdminService;
  private supabaseUrl: string;
  private serviceRoleKey: string;

  private constructor() {
    this.supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
    this.serviceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || "";
  }

  static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  validateOrdersJSON(content: string): { valid: boolean; error?: string } {
    try {
      const data = JSON.parse(content);

      if (!data.metadata || !data.data || !Array.isArray(data.data)) {
        return {
          valid: false,
          error: "Estructura inválida. Debe contener 'metadata' y 'data' (array)",
        };
      }

      if (data.data.length === 0) {
        return {
          valid: false,
          error: "El archivo debe contener al menos una orden",
        };
      }

      const firstOrder = data.data[0];
      const requiredFields = ["cliente", "orden", "fecha", "estado"];
      const missingFields = requiredFields.filter((field) => !(field in firstOrder));

      if (missingFields.length > 0) {
        return {
          valid: false,
          error: `Campos faltantes en las órdenes: ${missingFields.join(", ")}`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: "El archivo no es un JSON válido",
      };
    }
  }

  async uploadOrdersFile(fileContent: string): Promise<UploadResult> {
    const validation = this.validateOrdersJSON(fileContent);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || "Archivo inválido",
      };
    }

    if (!this.supabaseUrl || !this.serviceRoleKey) {
      return {
        success: false,
        message: "Credenciales de Supabase no configuradas",
      };
    }

    try {
      const fileName = "datos-ordenes.json";
      const bucketName = "datos";

      // URL correcta para Supabase Storage: {supabaseUrl}/storage/v1/object/{bucketName}/{fileName}
      const uploadUrl = `${this.supabaseUrl}/storage/v1/object/${bucketName}/${fileName}`;

      console.log("Subiendo archivo a:", uploadUrl);

      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: fileContent,
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        console.error("Error uploading file:", errorMessage);
        return {
          success: false,
          message: `Error al subir archivo: ${errorMessage}`,
        };
      }

      // Limpiar caché para forzar recarga de datos
      const orderService = OrderService.getInstance();
      await orderService.clearCache();

      return {
        success: true,
        message: "Archivo actualizado exitosamente",
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      return {
        success: false,
        message: `Error de conexión: ${errorMessage}`,
      };
    }
  }
}
