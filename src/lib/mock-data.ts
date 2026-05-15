export type LineId = "L1" | "L2";

export type Tag = {
  id: string;
  label: string;
  color: "orange" | "green" | "blue" | "yellow" | "red";
};

export const ALL_TAGS: Tag[] = [
  { id: "t1", label: "Soja", color: "green" },
  { id: "t2", label: "Imóveis", color: "orange" },
  { id: "t3", label: "Alta prioridade", color: "red" },
  { id: "t4", label: "Indicação", color: "blue" },
  { id: "t5", label: "Frio", color: "yellow" },
  { id: "t6", label: "Retornar", color: "blue" },
];

export type LeadStatus = "novo" | "negociacao" | "qualificado" | "perdido";

export const STATUS_LABELS: Record<LeadStatus, string> = {
  novo: "Novo",
  negociacao: "Em negociação",
  qualificado: "Qualificado",
  perdido: "Perdido",
};
