import pino from "pino";

// Campos que NUNCA devem aparecer nos logs — sanitização de dados sensíveis
const REDACTED_FIELDS = [
  "password",
  "senha",
  "token",
  "secret",
  "authorization",
  "cookie",
  "accessToken",
  "refreshToken",
];

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: REDACTED_FIELDS,
    censor: "[REDACTED]",
  },
  // Em desenvolvimento, formata de forma legível; em produção, JSON puro
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } }
      : undefined,
  base: {
    env: process.env.NODE_ENV,
    app: "estoque-app",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Gera um ID único por requisição para rastrear o fluxo nos logs
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Cria um logger filho com contexto de usuário e ação — facilita o rastreamento
export function createContextLogger(context: {
  userId?: string;
  action: string;
  requestId?: string;
}) {
  return logger.child(context);
}

export default logger;
