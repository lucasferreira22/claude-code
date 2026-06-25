// Helpers para abrir conversas no WhatsApp via link click-to-chat (wa.me).
// Sem API/custo: monta a URL com o número e uma mensagem pré-preenchida.

// Normaliza um telefone brasileiro para o formato exigido pelo wa.me (só dígitos,
// com DDI 55). Retorna null se não parecer um número válido.
export function normalizePhoneBR(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.length < 10) return null; // curto demais para DDD + número
  if (d.length <= 11) d = "55" + d; // número local: adiciona DDI do Brasil
  return d;
}

// Monta o link wa.me com mensagem pré-preenchida. Retorna null se o número for
// inválido (aí o botão não é exibido).
export function waLink(
  raw: string | null | undefined,
  message: string
): string | null {
  const phone = normalizePhoneBR(raw);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// Mensagem padrão de lembrete de cobrança.
export function cobrancaMessage(opts: {
  competenciaLabel: string;
  valorLabel: string;
  diaVencimento?: number | null;
  atrasada?: boolean;
}): string {
  const venc = opts.diaVencimento
    ? `, com vencimento no dia ${opts.diaVencimento}`
    : "";
  if (opts.atrasada) {
    return (
      `Olá! 😊 Passando pra lembrar que a mensalidade de ${opts.competenciaLabel} ` +
      `no valor de ${opts.valorLabel}${venc} consta em aberto por aqui. ` +
      `Pode verificar pra mim? Qualquer dúvida, estou à disposição!`
    );
  }
  return (
    `Olá! 😊 Passando pra lembrar da mensalidade de ${opts.competenciaLabel} ` +
    `no valor de ${opts.valorLabel}${venc}. Qualquer dúvida, estou à disposição!`
  );
}

// Mensagem padrão de lembrete de renovação de hospedagem/domínio (anual).
export function hospedagemMessage(opts: {
  valorLabel?: string | null;
  dataLabel?: string | null;
}): string {
  const valor = opts.valorLabel ? ` no valor de ${opts.valorLabel}` : "";
  const data = opts.dataLabel ? ` (vencimento em ${opts.dataLabel})` : "";
  return (
    `Olá! 😊 Passando pra avisar que a renovação anual da sua hospedagem/domínio` +
    `${valor} está chegando${data}. Qualquer dúvida, estou à disposição!`
  );
}
