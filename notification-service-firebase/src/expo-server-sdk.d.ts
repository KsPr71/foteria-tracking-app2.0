/** Shims expo-server-sdk when the IDE resolves from monorepo root (module lives in this package’s deps). */
declare module "expo-server-sdk" {
  const sdk: unknown;
  export default sdk;
}
