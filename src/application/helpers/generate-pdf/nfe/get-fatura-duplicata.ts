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
    secao({ doc, value: 'FATURA/DUPLICATA', x: 1.5, y: y + 12, largura: 0, ajusteX, ajusteY, margemEsquerda, margemTopo });

    // Criar layout em grid onde primeira célula é a fatura e demais são duplicatas
    // Calcular número de colunas baseado na largura disponível
    const larguraMinimaColuna = 80; // Largura mínima necessária para cada célula
    const margemInternaCelulas = 1.5; // Margem igual às outras seções (titulo x: 1.5)
    const margemDireitaCelulas = 1.5; // Margem direita para simetria
    const larguraDisponivel = larguraDoFormulario - margemInternaCelulas - margemDireitaCelulas; // Largura útil
    const colunas = Math.floor(larguraDisponivel / larguraMinimaColuna); // Colunas dinâmicas
    const larguraColuna = larguraDisponivel / colunas; // Largura exata para preenchimento completo
    const alturaLinha = 34; // Altura de cada célula
    let yAtual = y + 24;
    let xAtual = margemInternaCelulas; // Começar exatamente como outras seções (x: 1.5)
    let coluna = 0;

    // PRIMEIRA CÉLULA: Dados da Fatura
    if (cobr.fat !== undefined) {
      const xColuna = margemEsquerda + ajusteX + xAtual + coluna * larguraColuna;
      const yColuna = margemTopo + ajusteY + yAtual;

      // Desenhar bordas da célula da fatura com estilo elegante
      doc
        .lineWidth(0.5) // Linha mais fina para elegância
        .roundedRect(xColuna, yColuna, larguraColuna, alturaLinha, 3) // Cantos arredondados
        .stroke()
        .lineWidth(1); // Restaurar espessura padrão para outros elementos

      // Conteúdo da fatura na primeira célula
      doc
        .font('negrito')
        .fontSize(6)
        .fillColor(DEFAULT_NFE.corDoTitulo)
        .text('Número da Fatura:', xColuna + 2, yColuna + 2, {
          width: larguraColuna - 4,
          align: 'left'
        })
        .font('normal')
        .fontSize(6)
        .fillColor('black')
        .text(cobr.fat.nFat, xColuna + 2, yColuna + 8, {
          width: larguraColuna - 4,
          align: 'left'
        })
        .font('negrito')
        .fontSize(6)
        .fillColor(DEFAULT_NFE.corDoTitulo)
        .text(`Valor Original: R$ ${formatNumber(cobr.fat.vOrig, 2)}`, xColuna + 2, yColuna + 14, {
          width: larguraColuna - 4,
          align: 'left'
        })
        .font('normal')
        .fontSize(6)
        .fillColor('black')
        .text(`Desconto: R$ ${formatNumber(cobr.fat.vDesc, 2)}`, xColuna + 2, yColuna + 20, {
          width: larguraColuna - 4,
          align: 'left'
        })
        .font('negrito')
        .fontSize(6)
        .fillColor(DEFAULT_NFE.corDoTitulo)
        .text(`Valor Líquido: R$ ${formatNumber(cobr.fat.vLiq, 2)}`, xColuna + 2, yColuna + 26, {
          width: larguraColuna - 4,
          align: 'left'
        });

      // Avança para próxima coluna após a fatura
      coluna++;
    }

    // CÉLULAS SEGUINTES: Duplicatas
    if (cobr.dup !== undefined) {
      cobr.dup.forEach((dup, index) => {
        // Calcular posição da célula com ajustes de margem
        const xColuna = margemEsquerda + ajusteX + xAtual + coluna * larguraColuna;
        const yColuna = margemTopo + ajusteY + yAtual;

        // Desenhar bordas da célula com estilo elegante
        doc
          .lineWidth(0.5) // Linha mais fina para elegância
          .roundedRect(xColuna, yColuna, larguraColuna, alturaLinha, 3) // Cantos arredondados
          .stroke()
          .lineWidth(1); // Restaurar espessura padrão para outros elementos

        // Adicionar conteúdo da duplicata na célula
        doc
          .font('negrito')
          .fontSize(6)
          .fillColor(DEFAULT_NFE.corDoTitulo)
          .text('Duplicata:', xColuna + 2, yColuna + 2, {
            width: larguraColuna - 4,
            align: 'left'
          })
          .font('normal')
          .fontSize(6)
          .fillColor('black')
          .text(dup.nDup, xColuna + 2, yColuna + 8, {
            width: larguraColuna - 4,
            align: 'left'
          })
          .font('negrito')
          .fontSize(6)
          .fillColor(DEFAULT_NFE.corDoTitulo)
          .text(`R$ ${formatNumber(dup.vDup, 2)}`, xColuna + 2, yColuna + 14, {
            width: larguraColuna - 4,
            align: 'left'
          })
          .font('normal')
          .fontSize(6)
          .fillColor('black')
          .text(format(parseISO(dup.dVenc), 'dd/MM/yyyy'), xColuna + 2, yColuna + 20, {
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

    // Posicionar cursor após as células com margem consistente
    doc.text('', margemInternaCelulas, yAtual);
  }

  return doc.y;
}
