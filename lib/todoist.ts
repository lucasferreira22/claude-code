// Integração (uma via) com o Todoist: o CRM apenas LÊ e exibe as tarefas.
// O token fica em TODOIST_API_TOKEN (variável de ambiente secreta).
//
// Estrutura esperada no Todoist (projeto "Operacional"):
//   - cada CLIENTE é uma tarefa-pai (ex: "MR Heatlh - Cuida de Você")
//   - as DEMANDAS do cliente são as sub-tarefas dessa tarefa-pai
// A API REST v2 retorna apenas tarefas ativas (pendentes), que é o que importa.

const API = "https://api.todoist.com/rest/v2";
const PROJETO_PADRAO = "Operacional";

type TodoistDue = {
  date: string;
  datetime?: string | null;
  string?: string;
  is_recurring?: boolean;
} | null;

type TodoistTask = {
  id: string;
  content: string;
  description: string;
  project_id: string;
  section_id: string | null;
  parent_id: string | null;
  priority: number;
  due: TodoistDue;
  url: string;
};

export type Demanda = {
  id: string;
  titulo: string;
  url: string;
  due: string | null; // "AAAA-MM-DD" ou null
  vencimentoLabel: string | null;
  recorrente: boolean;
  emDias: number | null; // dias até vencer (negativo = atrasada)
};

export type ClienteTarefas = {
  taskId: string;
  nome: string;
  nomeNorm: string;
  pendentes: Demanda[];
};

export type TarefasData = {
  porCliente: ClienteTarefas[];
  comVencimento: { demanda: Demanda; clienteNome: string | null }[];
};

export function todoistConfigurado(): boolean {
  return Boolean(process.env.TODOIST_API_TOKEN);
}

export function normalizarNome(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function api<T>(path: string): Promise<T> {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) throw new Error("TODOIST_API_TOKEN não configurado");
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    // Cache de 5 min para não estourar o rate limit do Todoist.
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Todoist respondeu ${res.status}`);
  return res.json() as Promise<T>;
}

function diffDias(dateStr: string, hoje = new Date()): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  const a = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((due.getTime() - a.getTime()) / 86400000);
}

function toDemanda(t: TodoistTask): Demanda {
  const dueDate = t.due?.date ?? null;
  return {
    id: t.id,
    titulo: t.content,
    url: t.url,
    due: dueDate,
    vencimentoLabel: t.due?.string ?? dueDate,
    recorrente: Boolean(t.due?.is_recurring),
    emDias: dueDate ? diffDias(dueDate) : null,
  };
}

// Lê o projeto "Operacional" e organiza por cliente (tarefa-pai) + vencimentos.
export async function getTarefasOperacional(): Promise<TarefasData> {
  const projects = await api<{ id: string; name: string }[]>("/projects");
  const proj =
    projects.find((p) => normalizarNome(p.name) === normalizarNome(PROJETO_PADRAO)) ??
    projects.find((p) => normalizarNome(p.name).includes("operacional"));
  if (!proj) return { porCliente: [], comVencimento: [] };

  const tasks = await api<TodoistTask[]>(`/tasks?project_id=${proj.id}`);

  const parents = tasks.filter((t) => !t.parent_id);
  const subsPorPai = new Map<string, TodoistTask[]>();
  for (const t of tasks) {
    if (t.parent_id) {
      const arr = subsPorPai.get(t.parent_id) ?? [];
      arr.push(t);
      subsPorPai.set(t.parent_id, arr);
    }
  }

  const porCliente: ClienteTarefas[] = parents.map((p) => ({
    taskId: p.id,
    nome: p.content,
    nomeNorm: normalizarNome(p.content),
    pendentes: (subsPorPai.get(p.id) ?? []).map(toDemanda),
  }));

  const nomePorPai = new Map(parents.map((p) => [p.id, p.content]));
  const comVencimento = tasks
    .filter((t) => t.due?.date)
    .map((t) => ({
      demanda: toDemanda(t),
      clienteNome: t.parent_id ? nomePorPai.get(t.parent_id) ?? null : t.content,
    }))
    .sort((a, b) => (a.demanda.emDias ?? 0) - (b.demanda.emDias ?? 0));

  return { porCliente, comVencimento };
}

// Demandas pendentes de um cliente específico (casando por nome). Retorna null
// se a integração não estiver configurada ou a API falhar.
export async function getDemandasDoCliente(
  nomeCliente: string
): Promise<Demanda[] | null> {
  if (!todoistConfigurado()) return null;
  try {
    const { porCliente } = await getTarefasOperacional();
    const alvo = normalizarNome(nomeCliente);
    const match =
      porCliente.find((c) => c.nomeNorm === alvo) ??
      porCliente.find(
        (c) => c.nomeNorm.includes(alvo) || alvo.includes(c.nomeNorm)
      );
    return match ? match.pendentes : [];
  } catch {
    return null;
  }
}
