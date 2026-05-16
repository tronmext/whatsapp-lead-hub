export type LeadStatus = "novo" | "negociacao" | "qualificado" | "perdido";

export const STATUS_LABELS: Record<LeadStatus, string> = {
  novo: "Novo",
  negociacao: "Em negociação",
  qualificado: "Qualificado",
  perdido: "Perdido",
};
