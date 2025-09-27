/**
 * Retorna <valor> especificado com máscara do Inscrição Estadual.
 *
 * @param      {string}  stateRegistration
 * @param      {string}  uf - UF do estado (opcional, para formatação mais precisa)
 * @return     {string}
 */
export function formatStateRegistration(stateRegistration: string, uf?: string): string {
  if (!stateRegistration) return '';
  
  const cleanInscricao = stateRegistration.replace(/\D/g, '');
  const length = cleanInscricao.length;
  
  if (!cleanInscricao || length < 7 || length > 15) return stateRegistration;
  
  // Se a UF for fornecida, usa formatação específica por estado
  if (uf) {
    return formatByState(cleanInscricao, uf.toUpperCase());
  }
  
  // Formatação genérica baseada no tamanho (fallback)
  return formatGeneric(cleanInscricao, length);
}

function formatByState(cleanInscricao: string, uf: string): string {
  const length = cleanInscricao.length;
  
  switch (uf) {
    case 'AC': // 13 dígitos: 01.004.823/001-12
      if (length === 13) return cleanInscricao.replace(/(\d{2})(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3/$4-$5');
      break;
      
    case 'AL': // 9 dígitos: 24.123.456-7
      if (length === 9) return cleanInscricao.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
      break;
      
    case 'AP': // 9 dígitos: 03.012.345-9
      if (length === 9) return cleanInscricao.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
      break;
      
    case 'AM': // 9 dígitos: 04.123.456-7
      if (length === 9) return cleanInscricao.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
      break;
      
    case 'BA': // 8 ou 9 dígitos: 123456-63 ou 123.456.789
      if (length === 8) return cleanInscricao.replace(/(\d{6})(\d{2})/, '$1-$2');
      if (length === 9) return cleanInscricao.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
      break;
      
    case 'CE': // 9 dígitos: 12345678-9
      if (length === 9) return cleanInscricao.replace(/(\d{8})(\d{1})/, '$1-$2');
      break;
      
    case 'DF': // 13 dígitos: 073.00001.001-09
      if (length === 13) return cleanInscricao.replace(/(\d{3})(\d{5})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      break;
      
    case 'ES': // 9 dígitos: 12345678-0
      if (length === 9) return cleanInscricao.replace(/(\d{8})(\d{1})/, '$1-$2');
      break;
      
    case 'GO': // 9 dígitos: 10.987.654-7
      if (length === 9) return cleanInscricao.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
      break;
      
    case 'MA': // 9 dígitos: 12.345.678-9
      if (length === 9) return cleanInscricao.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
      break;
      
    case 'MT': // 11 dígitos: 0013000001-9
      if (length === 11) return cleanInscricao.replace(/(\d{10})(\d{1})/, '$1-$2');
      break;
      
    case 'MS': // 9 dígitos: 28.123.456-8
      if (length === 9) return cleanInscricao.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
      break;
      
    case 'MG': // 13 dígitos: 062.307.904/0081
      if (length === 13) return cleanInscricao.replace(/(\d{3})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3/$4');
      break;
      
    case 'PA': // 9 dígitos: 15-123456-5
      if (length === 9) return cleanInscricao.replace(/(\d{2})(\d{6})(\d{1})/, '$1-$2-$3');
      break;
      
    case 'PB': // 9 dígitos: 12345678-9
      if (length === 9) return cleanInscricao.replace(/(\d{8})(\d{1})/, '$1-$2');
      break;
      
    case 'PR': // 10 dígitos: 123.45678-50
      if (length === 10) return cleanInscricao.replace(/(\d{3})(\d{5})(\d{2})/, '$1.$2-$3');
      break;
      
    case 'PE': // 9 dígitos: 1234567-90
      if (length === 9) return cleanInscricao.replace(/(\d{7})(\d{2})/, '$1-$2');
      break;
      
    case 'PI': // 9 dígitos: 12345678-9
      if (length === 9) return cleanInscricao.replace(/(\d{8})(\d{1})/, '$1-$2');
      break;
      
    case 'RJ': // 8 dígitos: 12.345.67-8
      if (length === 8) return cleanInscricao.replace(/(\d{2})(\d{3})(\d{2})(\d{1})/, '$1.$2.$3-$4');
      break;
      
    case 'RN': // 10 dígitos: 20.123.456-7 (9+1)
      if (length === 10) return cleanInscricao.replace(/(\d{2})(\d{3})(\d{3})(\d{1})(\d{1})/, '$1.$2.$3-$4$5');
      break;
      
    case 'RS': // 10 dígitos: 123/4567890
      if (length === 10) return cleanInscricao.replace(/(\d{3})(\d{7})/, '$1/$2');
      break;
      
    case 'RO': // 9 ou 14 dígitos
      if (length === 9) return cleanInscricao.replace(/(\d{3})(\d{5})(\d{1})/, '$1.$2-$3');
      if (length === 14) return cleanInscricao.replace(/(\d{14})/, '$1'); // Sem formatação específica
      break;
      
    case 'RR': // 9 dígitos: 24.012.345-6
      if (length === 9) return cleanInscricao.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
      break;
      
    case 'SC': // 9 dígitos: 123.456.789
      if (length === 9) return cleanInscricao.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
      break;
      
    case 'SP': // 12 dígitos: 110.042.490.114
      if (length === 12) return cleanInscricao.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1.$2.$3.$4');
      break;
      
    case 'SE': // 9 dígitos: 12345678-9
      if (length === 9) return cleanInscricao.replace(/(\d{8})(\d{1})/, '$1-$2');
      break;
      
    case 'TO': // 9 dígitos: 12.345.678-9
      if (length === 9) return cleanInscricao.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
      break;
  }
  
  // Se não encontrou padrão específico, usa formatação genérica
  return formatGeneric(cleanInscricao, length);
}

function formatGeneric(cleanInscricao: string, length: number): string {
  const formats: { [key: number]: { format: string; regex: RegExp } } = {
    7: { format: '$1-$2', regex: /(\d{6})(\d{1})/ },
    8: { format: '$1.$2-$3', regex: /(\d{3})(\d{3})(\d{2})/ },
    9: { format: '$1.$2.$3-$4', regex: /(\d{2})(\d{3})(\d{3})(\d{1})/ },
    10: { format: '$1.$2.$3-$4', regex: /(\d{2})(\d{3})(\d{3})(\d{2})/ },
    11: { format: '$1.$2.$3-$4', regex: /(\d{3})(\d{3})(\d{3})(\d{2})/ },
    12: { format: '$1.$2.$3.$4', regex: /(\d{3})(\d{3})(\d{3})(\d{3})/ },
    13: { format: '$1.$2.$3.$4-$5', regex: /(\d{2})(\d{3})(\d{3})(\d{2})(\d{3})/ },
    14: { format: '$1.$2.$3.$4-$5', regex: /(\d{3})(\d{3})(\d{3})(\d{3})(\d{2})/ }
  };
  
  const pattern = formats[length];
  if (!pattern) return cleanInscricao;
  
  const match = cleanInscricao.match(pattern.regex);
  if (!match) return cleanInscricao;
  
  return pattern.format.replace(/\$(\d+)/g, (_, index) => match[parseInt(index)] || '');
}
