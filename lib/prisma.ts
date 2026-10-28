import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

let client: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (client) {
    return client;
  }

  const DATABASE_URL = process.env.DATABASE_URL!;

  // If Accelerate URL is detected, use the direct adapter as fallback
  // (Prisma Accelerate is an enterprise feature not available via npm)
  if (DATABASE_URL.startsWith("prisma+postgres://")) {
    // Fallback to direct connection via adapter-pg
    client = new PrismaClient({
      adapter: new PrismaPg({ connectionString: DATABASE_URL }),
    });
  } else {
    client = new PrismaClient({
      adapter: new PrismaPg({ connectionString: DATABASE_URL }),
    });
  }

  return client;
}

// Cache in development for hot reloads
if (process.env.NODE_ENV === "development") {
  const devClient = getPrismaClient();
  // Keep track for hot reload detection
  let devClientRef: PrismaClient | null = devClient;

  // On hot reload, check if the client needs resetting
  const checkHotReload = () => {
    // Prisma client handles its own lifecycle; we keep the singleton
    // in development until process restarts
  };

  // Use global cache with cleanup on disconnect
  (globalThis as any).__prisma_dev_client = devClient;
}