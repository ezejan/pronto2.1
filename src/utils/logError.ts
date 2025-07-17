export function logError(error: unknown, context?: string) {
  if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error(error);
  }
  // Aquí se podría integrar un servicio de monitoreo como Sentry
}
