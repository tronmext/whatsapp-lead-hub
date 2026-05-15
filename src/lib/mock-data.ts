export type LineId = "L1" | "L2";

export type Tag = {
  id: string;
  label: string;
  color: "orange" | "green" | "blue" | "yellow" | "red";
};

export type Message = {
  id: string;
  from: "lead" | "me";
  text: string;
  time: string;
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  line: LineId;
  initials: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  status: "novo" | "negociacao" | "qualificado" | "perdido";
  tags: Tag[];
  company?: string;
  role?: string;
  city?: string;
  source?: string;
  score: number;
  messages: Message[];
  notes: { id: string; text: string; at: string }[];
  insights?: {
    summary: string;
    bullets: string[];
    nextSteps: string[];
  };
};

export const ALL_TAGS: Tag[] = [
  { id: "t1", label: "Soja", color: "green" },
  { id: "t2", label: "Imóveis", color: "orange" },
  { id: "t3", label: "Alta prioridade", color: "red" },
  { id: "t4", label: "Indicação", color: "blue" },
  { id: "t5", label: "Frio", color: "yellow" },
  { id: "t6", label: "Retornar", color: "blue" },
];

export const LEADS: Lead[] = [
  {
    id: "ld_01",
    name: "Marina Albuquerque",
    phone: "+55 11 98214-5532",
    line: "L1",
    initials: "MA",
    lastMessage: "Topo fechar essa semana, manda a proposta.",
    lastTime: "agora",
    unread: 3,
    status: "negociacao",
    tags: [ALL_TAGS[1], ALL_TAGS[2]],
    company: "Albuquerque Holdings",
    role: "Diretora Comercial",
    city: "São Paulo, SP",
    source: "Indicação",
    score: 82,
    notes: [
      { id: "n1", text: "Já visitou 2 imóveis. Foco em zona sul.", at: "ontem 14:22" },
    ],
    messages: [
      { id: "m1", from: "lead", text: "Oi! Recebi seu contato pela Carla.", time: "10:02" },
      { id: "m2", from: "me", text: "Marina, prazer. Vi que tem interesse na unidade do Itaim.", time: "10:04" },
      { id: "m3", from: "lead", text: "Sim, e também na do Brooklin.", time: "10:05" },
      { id: "m4", from: "me", text: "Posso agendar uma visita amanhã 15h?", time: "10:07" },
      { id: "m5", from: "lead", text: "Topo fechar essa semana, manda a proposta.", time: "10:31" },
    ],
    insights: {
      summary:
        "Lead quente vindo de indicação direta, com interesse em 2 unidades de alto padrão na zona sul de SP. Demonstra urgência para fechar dentro da semana.",
      bullets: [
        "Decisora final, sem necessidade de aprovação de terceiros",
        "Comparando 2 imóveis: Itaim e Brooklin",
        "Sensível a prazo, não a preço",
      ],
      nextSteps: [
        "Enviar proposta formal das duas unidades até final do dia",
        "Agendar visita combinada amanhã às 15h",
        "Acionar jurídico para preparar minuta",
      ],
    },
  },
  {
    id: "ld_02",
    name: "João Pedro Nakamura",
    phone: "+55 65 99431-7720",
    line: "L2",
    initials: "JN",
    lastMessage: "Qual o preço por saca atualizado?",
    lastTime: "12 min",
    unread: 1,
    status: "novo",
    tags: [ALL_TAGS[0]],
    company: "Fazenda Três Rios",
    role: "Sócio",
    city: "Sorriso, MT",
    source: "Site",
    score: 64,
    notes: [],
    messages: [
      { id: "m1", from: "lead", text: "Boa tarde, vi o post sobre soja safrinha.", time: "13:40" },
      { id: "m2", from: "me", text: "Olá João, tudo bem? Posso te enviar o material.", time: "13:42" },
      { id: "m3", from: "lead", text: "Qual o preço por saca atualizado?", time: "13:48" },
    ],
  },
  {
    id: "ld_03",
    name: "Beatriz Solano",
    phone: "+55 21 99921-4471",
    line: "L1",
    initials: "BS",
    lastMessage: "Beleza, me chama amanhã.",
    lastTime: "1h",
    unread: 0,
    status: "qualificado",
    tags: [ALL_TAGS[5], ALL_TAGS[3]],
    company: "Solano Arquitetura",
    role: "Founder",
    city: "Rio de Janeiro, RJ",
    source: "Instagram",
    score: 71,
    notes: [{ id: "n1", text: "Já assinou contrato no ano passado.", at: "hoje 09:10" }],
    messages: [
      { id: "m1", from: "me", text: "Bia, lembrei de você pro novo lançamento.", time: "11:22" },
      { id: "m2", from: "lead", text: "Beleza, me chama amanhã.", time: "11:30" },
    ],
  },
  {
    id: "ld_04",
    name: "Rodrigo Vasques",
    phone: "+55 47 99800-1122",
    line: "L2",
    initials: "RV",
    lastMessage: "Fica pra próxima oportunidade.",
    lastTime: "3h",
    unread: 0,
    status: "perdido",
    tags: [ALL_TAGS[4]],
    company: "RV Logística",
    role: "Operações",
    city: "Joinville, SC",
    source: "Indicação",
    score: 22,
    notes: [],
    messages: [
      { id: "m1", from: "lead", text: "Fica pra próxima oportunidade.", time: "10:00" },
    ],
  },
  {
    id: "ld_05",
    name: "Camila Furtado",
    phone: "+55 31 99544-2010",
    line: "L1",
    initials: "CF",
    lastMessage: "Me liga até as 18h.",
    lastTime: "5h",
    unread: 2,
    status: "negociacao",
    tags: [ALL_TAGS[2], ALL_TAGS[5]],
    company: "Furtado & Co",
    role: "CEO",
    city: "Belo Horizonte, MG",
    source: "Evento",
    score: 77,
    notes: [],
    messages: [
      { id: "m1", from: "lead", text: "Me liga até as 18h.", time: "08:11" },
    ],
  },
  {
    id: "ld_06",
    name: "Heitor Mendonça",
    phone: "+55 81 99102-7714",
    line: "L2",
    initials: "HM",
    lastMessage: "Ainda avaliando, te respondo amanhã.",
    lastTime: "ontem",
    unread: 0,
    status: "negociacao",
    tags: [ALL_TAGS[0], ALL_TAGS[3]],
    company: "Engenho Norte",
    role: "Diretor",
    city: "Recife, PE",
    source: "Site",
    score: 58,
    notes: [],
    messages: [
      { id: "m1", from: "lead", text: "Ainda avaliando, te respondo amanhã.", time: "ontem" },
    ],
  },
];

export const STATUS_LABELS: Record<Lead["status"], string> = {
  novo: "Novo",
  negociacao: "Em negociação",
  qualificado: "Qualificado",
  perdido: "Perdido",
};

export const TAG_COLOR_CLASSES: Record<Tag["color"], string> = {
  orange: "bg-[oklch(0.74_0.18_45/0.15)] text-[oklch(0.82_0.16_55)] border-[oklch(0.74_0.18_45/0.35)]",
  green: "bg-[oklch(0.88_0.22_155/0.12)] text-[oklch(0.86_0.2_155)] border-[oklch(0.88_0.22_155/0.3)]",
  blue: "bg-[oklch(0.68_0.18_245/0.15)] text-[oklch(0.78_0.14_240)] border-[oklch(0.68_0.18_245/0.35)]",
  yellow: "bg-[oklch(0.84_0.16_85/0.14)] text-[oklch(0.86_0.14_85)] border-[oklch(0.84_0.16_85/0.35)]",
  red: "bg-[oklch(0.62_0.24_18/0.16)] text-[oklch(0.78_0.18_22)] border-[oklch(0.62_0.24_18/0.4)]",
};
