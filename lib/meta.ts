// Integração (somente leitura) com a Marketing API do Meta.
// Puxa as métricas (insights) da conta de anúncio de um cliente.
// Token em META_ACCESS_TOKEN (variável de ambiente secreta).

const API = "https://graph.facebook.com/v23.0";

export type MetaPeriodo = "this_month" | "last_30d" | "last_7d";

export const META_PERIODOS: { key: MetaPeriodo; label: string }[] = [
  { key: "this_month", label: "Mês atual" },
  { key: "last_30d", label: "30 dias" },
  { key: "last_7d", label: "7 dias" },
];

export type MetaInsights = {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number; // %
  cpc: number; // R$ por clique
  cpm: number; // R$ por mil impressões
  resultados: { tipo: string; valor: number }[];
};

export function metaConfigurado(): boolean {
  return Boolean(process.env.META_ACCESS_TOKEN);
}

// Tipos de ação do Meta -> rótulos amigáveis (e consolidação de equivalentes).
const ACTION_LABELS: Record<string, string> = {
  lead: "Leads",
  "onsite_conversion.lead_grouped": "Leads",
  "offsite_conversion.fb_pixel_lead": "Leads",
  link_click: "Cliques no link",
  landing_page_view: "Visitas à página",
  purchase: "Compras",
  "onsite_conversion.purchase": "Compras",
  "offsite_conversion.fb_pixel_purchase": "Compras",
  messaging_conversation_started_7d: "Conversas iniciadas",
  post_engagement: "Engajamento",
  video_view: "Views de vídeo",
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

// Busca os insights agregados da conta no período. Lança erro com a mensagem
// do Meta se a API falhar; retorna null se o token não estiver configurado.
export async function getMetaInsights(
  adAccountId: string,
  periodo: MetaPeriodo = "this_month"
): Promise<MetaInsights | null> {
  const token = process.env.META_ACCESS_TOKEN?.trim();
  if (!token) return null;

  const fields = "spend,impressions,reach,clicks,ctr,cpc,cpm,actions";
  const url = `${API}/${encodeURIComponent(
    adAccountId
  )}/insights?fields=${fields}&date_preset=${periodo}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    // Cache de 10 min para não martelar a API a cada carregamento.
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    let msg = `Meta respondeu ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error?.message) msg = j.error.message;
    } catch {
      /* corpo não-JSON */
    }
    throw new Error(msg);
  }

  const json = await res.json();
  const row = json?.data?.[0];
  if (!row) {
    return {
      spend: 0,
      impressions: 0,
      reach: 0,
      clicks: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      resultados: [],
    };
  }

  const consolidado = new Map<string, number>();
  if (Array.isArray(row.actions)) {
    for (const a of row.actions) {
      const label = ACTION_LABELS[a.action_type];
      if (label) consolidado.set(label, (consolidado.get(label) ?? 0) + num(a.value));
    }
  }

  return {
    spend: num(row.spend),
    impressions: num(row.impressions),
    reach: num(row.reach),
    clicks: num(row.clicks),
    ctr: num(row.ctr),
    cpc: num(row.cpc),
    cpm: num(row.cpm),
    resultados: Array.from(consolidado, ([tipo, valor]) => ({ tipo, valor })),
  };
}
