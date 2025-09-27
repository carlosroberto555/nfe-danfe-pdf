import { format, parseISO } from 'date-fns';
import { formatNumber } from '../../../../domain/use-cases/utils';
import type { GeneratePdf } from '../../../../types';
import { DEFAULT_NFE } from './default';
import { linhaHorizontal } from './linha-horizontal';
import { linhaVertical } from './linha-vertical';
import { secao } from './secao';

export function getFaturaDuplicata({
  y,
  doc,
  ajusteX,
  ajusteY,
  margemDireita,
  margemEsquerda,
  margemTopo,
  larguraDoFormulario,
  cobr
}: GeneratePdf.InputFaturaDuplicata): number {
  if (cobr !== undefined && Object.keys(cobr).length > 0) {
    secao({ doc, value: 'FATURA / DUPLICATA', x: 1.5, y: y + 12, largura: 0, ajusteX, ajusteY, margemEsquerda, margemTopo });

    // Criar layout em grid onde primeira célula é a fatura e demais são duplicatas
    // Calcular número de colunas baseado na largura disponível
    const larguraMinimaColuna = 80; // Largura mínima necessária para cada célula
    const colunas = Math.floor(larguraDoFormulario / larguraMinimaColuna); // Colunas dinâmicas
    const larguraColuna = larguraDoFormulario / colunas;
    const alturaLinha = 32; // Altura de cada célula (aumentada para acomodar fatura)
    let yAtual = y + 24;
    let xAtual = 5;
    let coluna = 0;

    // PRIMEIRA CÉLULA: Dados da Fatura
    if (cobr.fat !== undefined) {
      const xColuna = xAtual + (coluna * larguraColuna);
      
      // Desenhar bordas da célula da fatura
      doc
        .rect(xColuna, yAtual, larguraColuna, alturaLinha)
        .stroke();

      // Conteúdo da fatura na primeira célula
      doc
        .font('negrito')
        .fontSize(6)
        .fillColor(DEFAULT_NFE.corDoTitulo)
        .text('Número da Fatura:', xColuna + 2, yAtual + 2, {
          width: larguraColuna - 4,
          align: 'left'
        })
        .font('normal')
        .fontSize(6)
        .fillColor('black')
        .text(cobr.fat.nFat, xColuna + 2, yAtual + 8, {
          width: larguraColuna - 4,
          align: 'left'
        })
        .font('negrito')
        .fontSize(6)
        .fillColor(DEFAULT_NFE.corDoTitulo)
        .text(`Valor Original: R$ ${formatNumber(cobr.fat.vOrig, 2)}`, xColuna + 2, yAtual + 14, {
          width: larguraColuna - 4,
          align: 'left'
        })
        .font('normal')
        .fontSize(6)
        .fillColor('black')
        .text(`Desconto: R$ ${formatNumber(cobr.fat.vDesc, 2)}`, xColuna + 2, yAtual + 20, {
          width: larguraColuna - 4,
          align: 'left'
        })
        .font('negrito')
        .fontSize(6)
        .fillColor(DEFAULT_NFE.corDoTitulo)
        .text(`Valor Líquido: R$ ${formatNumber(cobr.fat.vLiq, 2)}`, xColuna + 2, yAtual + 26, {
          width: larguraColuna - 4,
          align: 'left'
        });

      // Avança para próxima coluna após a fatura
      coluna++;
    }

    // CÉLULAS SEGUINTES: Duplicatas
    if (cobr.dup !== undefined) {
      cobr.dup.forEach((dup, index) => {
        // Calcular posição da célula
        const xColuna = xAtual + (coluna * larguraColuna);
        
        // Desenhar bordas da célula
        doc
          .rect(xColuna, yAtual, larguraColuna, alturaLinha)
          .stroke();

        // Adicionar conteúdo da duplicata na célula
        doc
          .font('negrito')
          .fontSize(6)
          .fillColor(DEFAULT_NFE.corDoTitulo)
          .text('Duplicata:', xColuna + 2, yAtual + 2, {
            width: larguraColuna - 4,
            align: 'left'
          })
          .font('normal')
          .fontSize(6)
          .fillColor('black')
          .text(dup.nDup, xColuna + 2, yAtual + 8, {
            width: larguraColuna - 4,
            align: 'left'
          })
          .font('negrito')
          .fontSize(6)
          .fillColor(DEFAULT_NFE.corDoTitulo)
          .text(`R$ ${formatNumber(dup.vDup, 2)}`, xColuna + 2, yAtual + 14, {
            width: larguraColuna - 4,
            align: 'left'
          })
          .font('normal')
          .fontSize(6)
          .fillColor('black')
          .text(format(parseISO(dup.dVenc), 'dd/MM/yyyy'), xColuna + 2, yAtual + 20, {
            width: larguraColuna - 4,
            align: 'left'
          });

        // Avançar para próxima coluna
        coluna++;
        
        // Se completou uma linha, vai para próxima
        if (coluna >= colunas) {
          coluna = 0;
          yAtual += alturaLinha;
        }
      });
    }

    // Ajustar posição Y final
    if (coluna > 0) {
      yAtual += alturaLinha; // Adicionar altura da última linha parcial
    }
    
    // Posicionar cursor após as células
    doc.text('', 5, yAtual);

    linhaHorizontal({ x1: 0, x2: 0, y: y + 20, doc, ajusteX, ajusteY, margemDireita, margemEsquerda, margemTopo });
    linhaHorizontal({ x1: 0, x2: 0, y: doc.y + 6, doc, ajusteX, ajusteY, margemDireita, margemEsquerda, margemTopo });
    linhaVertical({ y1: y + 20, y2: doc.y + 6, x: 0, doc, ajusteX, ajusteY, margemEsquerda, margemTopo });
    linhaVertical({ y1: y + 20, y2: doc.y + 6, x: larguraDoFormulario, doc, ajusteX, ajusteY, margemEsquerda, margemTopo });
  }

  return doc.y;
}
