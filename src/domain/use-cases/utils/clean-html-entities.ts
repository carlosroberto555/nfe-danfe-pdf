/**
 * Decodifica entidades HTML e limpa tags HTML do texto
 * @param text Texto com entidades HTML codificadas
 * @returns Texto limpo e decodificado
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return text;

  // Mapeamento das entidades HTML mais comuns
  const htmlEntities: Record<string, string> = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };

  let decodedText = text;

  // Substituir entidades HTML
  Object.keys(htmlEntities).forEach(entity => {
    const regex = new RegExp(entity, 'gi');
    decodedText = decodedText.replace(regex, htmlEntities[entity]);
  });

  // Remover tags HTML comuns (br, p, div, etc.) e substituir por espaços ou quebras
  decodedText = decodedText
    .replace(/<br\s*\/?>/gi, ' ') // <br> vira espaço
    .replace(/<\/p>/gi, ' ') // </p> vira espaço
    .replace(/<p[^>]*>/gi, '') // <p> remove
    .replace(/<div[^>]*>/gi, '') // <div> remove
    .replace(/<\/div>/gi, ' ') // </div> vira espaço
    .replace(/<[^>]*>/g, '') // Remove outras tags HTML
    .replace(/\s+/g, ' ') // Remove espaços múltiplos
    .trim(); // Remove espaços no início e fim

  return decodedText;
}

/**
 * Limpa e formata texto de informações complementares
 * Especificamente para uso no DANFE
 */
export function cleanInfoComplementar(text: string): string {
  if (!text) return text;
  
  const cleaned = decodeHtmlEntities(text);
  
  // Limpezas específicas para textos de NFe
  return cleaned
    .replace(/\s*\.\s*$/, '') // Remove ponto final isolado
    .replace(/\s{2,}/g, ' ') // Remove espaços duplos
    .trim();
}