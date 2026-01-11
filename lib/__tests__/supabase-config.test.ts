import { describe, it, expect } from "vitest";

describe("Supabase Configuration", () => {
  it("debe tener configuradas las variables de entorno de Supabase", () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    expect(supabaseUrl).toBeDefined();
    expect(supabaseUrl).toMatch(/^https:\/\/.+\.supabase\.co$/);

    expect(serviceRoleKey).toBeDefined();
    expect(serviceRoleKey).toContain("eyJ");
  });

  it("debe validar formato de JWT en service role key", () => {
    const serviceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    if (serviceRoleKey) {
      const parts = serviceRoleKey.split(".");
      expect(parts).toHaveLength(3);
      expect(parts[0]).toMatch(/^eyJ/);
    }
  });
});
