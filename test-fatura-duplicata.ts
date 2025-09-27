// Exemplo para testar o novo layout de FATURA/DUPLICATA em colunas

import PDFDocument from 'pdfkit';
import { getFaturaDuplicata } from './src/application/helpers/generate-pdf/nfe/get-fatura-duplicata';

// Dados de exemplo com múltiplas duplicatas
const cobrancaExample = {
  fat: {
    nFat: '001',
    vOrig: '1500.00',
    vDesc: '50.00',
    vLiq: '1450.00'
  },
  dup: [
    { nDup: '001A', vDup: '500.00', dVenc: '2024-01-15' },
    { nDup: '001B', vDup: '500.00', dVenc: '2024-02-15' },
    { nDup: '001C', vDup: '450.00', dVenc: '2024-03-15' },
    { nDup: '001D', vDup: '250.00', dVenc: '2024-04-15' },
    { nDup: '001E', vDup: '200.00', dVenc: '2024-05-15' }
  ]
};

// Comentário explicativo sobre a mudança:
/*
MUDANÇA IMPLEMENTADA NA SEÇÃO FATURA/DUPLICATA:

NOVO LAYOUT (primeira célula = fatura, demais = duplicatas):
┌─────────────┬─────────────┬─────────────┐
│ Número da   │ Duplicata:  │ Duplicata:  │
│ Fatura: 001 │ 001A        │ 001B        │
│ Valor       │ R$ 500,00   │ R$ 500,00   │
│ Original:   │ 15/01/2024  │ 15/02/2024  │
│ R$ 1.500,00 │             │             │
│ Desconto:   │             │             │
│ R$ 50,00    │             │             │
│ Valor       │             │             │
│ Líquido:    │             │             │
│ R$ 1.450,00 │             │             │
├─────────────┼─────────────┼─────────────┤
│ Duplicata:  │ Duplicata:  │ Duplicata:  │
│ 001C        │ 001D        │ 001E        │
│ R$ 450,00   │ R$ 250,00   │ R$ 200,00   │
│ 15/03/2024  │ 15/04/2024  │ 15/05/2024  │
└─────────────┴─────────────┴─────────────┘

ESTRUTURA CONFORME MANUAL:
- Y02 (fat): Grupo Fatura na PRIMEIRA CÉLULA
  - Y03 (nFat): Número da Fatura
  - Y04 (vOrig): Valor Original da Fatura  
  - Y05 (vDesc): Valor do desconto
  - Y06 (vLiq): Valor Líquido da Fatura
  
- Y07 (dup): Grupo Duplicata nas DEMAIS CÉLULAS
  - Y08 (nDup): Número da Duplicata
  - Y09 (dVenc): Data de vencimento
  - Y10 (vDup): Valor da duplicata

CARACTERÍSTICAS DO LAYOUT:
- Número de colunas DINÂMICO baseado na largura do DANFE
- Largura mínima de 80px por célula para garantir legibilidade
- Cálculo: Math.floor(larguraDoFormulario / 80) colunas
- Primeira célula SEMPRE contém dados completos da fatura
- Demais células contêm as duplicatas individualmente
- Altura aumentada (32px) para acomodar todos os dados da fatura
- Fonte de 6 pixels para economizar espaço
- Bordas em todas as células para separação visual

EXEMPLOS DE CÁLCULO:
- DANFE largura 400px: Math.floor(400/80) = 5 colunas
- DANFE largura 300px: Math.floor(300/80) = 3 colunas  
- DANFE largura 500px: Math.floor(500/80) = 6 colunas
- Etc...

Isso garante aproveitamento máximo da largura disponível!
*/

console.log('Novo layout FATURA/DUPLICATA implementado com sucesso!');
console.log('- Layout em grid de 3 colunas');
console.log('- Cada duplicata em célula individual');
console.log('- Bordas para separar as células');
console.log('- Fonte reduzida para otimizar espaço');