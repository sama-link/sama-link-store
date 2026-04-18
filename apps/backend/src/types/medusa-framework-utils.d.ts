declare module "@medusajs/framework/utils" {
  export function loadEnv(env: string, directory: string): void;
  export function defineConfig<T>(config: T): T;
}
