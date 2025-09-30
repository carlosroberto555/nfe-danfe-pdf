import type { GeneratePdf } from '../../../../types';
import { MoneyMaskBR } from '../../../../utils';
import { cleanInfoComplementar } from '../../../../domain/use-cases/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { italico } from './italico';
import { linhaHorizontal } from './linha-horizontal';
import { linhaVertical } from './linha-vertical';
import { normal } from './normal';
import { secao } from './secao';
import { titulo } from './titulo';

/**
 * Quebra texto baseado na largura REAL da célula (não em caracteres estimados)
 * Usa doc.widthOfString() para precisão absoluta
 */
function quebrarTextoPorLargura(doc: PDFKit.PDFDocument, texto: string, larguraMaxima: number, tamanhoFonte: number = 6): string[] {
  const linhas: string[] = [];
  let textoRestante = texto.trim();

  // Aplicar fonte temporariamente para medição precisa
  doc.fontSize(tamanhoFonte);

  while (textoRestante.length > 0) {
    // Verificar se texto completo cabe na largura disponível
    const larguraCompleta = doc.widthOfString(textoRestante);

    if (larguraCompleta <= larguraMaxima) {
      linhas.push(textoRestante);
      break;
    }

    // Busca binária para encontrar máximo de texto que cabe
    let inicio = 1;
    let fim = textoRestante.length;
    let melhorCorte = 1;

    while (inicio <= fim) {
      const meio = Math.floor((inicio + fim) / 2);
      const textoTeste = textoRestante.substring(0, meio);
      const larguraTeste = doc.widthOfString(textoTeste);

      if (larguraTeste <= larguraMaxima) {
        melhorCorte = meio;
        inicio = meio + 1;
      } else {
        fim = meio - 1;
      }
    }

    // Aplicar quebra inteligente próximo ao ponto ideal
    let pontoCorte = melhorCorte;
    const textoParaCorte = textoRestante.substring(0, melhorCorte);
    const separadores = [' | ', ' - ', ': ', ' ', ',', '.', ';'];

    for (const separador of separadores) {
      const ultimaPosicao = textoParaCorte.lastIndexOf(separador);
      if (ultimaPosicao > melhorCorte * 0.7) {
        pontoCorte = ultimaPosicao + separador.length;
        break;
      }
    }

    // Garantir que não fica vazio
    if (pontoCorte === 0) {
      pontoCorte = Math.max(1, melhorCorte);
    }

    linhas.push(textoRestante.substring(0, pontoCorte).trim());
    textoRestante = textoRestante.substring(pontoCorte).trim();
  }

  return linhas;
}

/**
 * Função legada mantida para compatibilidade com seção do fisco
 */
function quebrarTextoInteligente(texto: string, maxCaracteres: number): string[] {
  const linhas: string[] = [];
  let textoRestante = texto;

  while (textoRestante.length > 0) {
    if (textoRestante.length <= maxCaracteres) {
      linhas.push(textoRestante);
      break;
    }

    let pontoCorte = maxCaracteres;
    const fatia = textoRestante.substring(0, maxCaracteres);
    const separadores = [' | ', ' - ', ': ', ' ', ',', '.'];
    let melhorCorte = -1;

    for (const separador of separadores) {
      const ultimaOcorrencia = fatia.lastIndexOf(separador);
      if (ultimaOcorrencia > maxCaracteres * 0.7) {
        melhorCorte = ultimaOcorrencia + separador.length;
        break;
      }
    }

    if (melhorCorte > -1) {
      pontoCorte = melhorCorte;
    }

    linhas.push(textoRestante.substring(0, pontoCorte).trim());
    textoRestante = textoRestante.substring(pontoCorte).trim();
  }

  return linhas;
}

export function getDadosAdicionais({
  doc,
  ajusteX,
  ajusteY,
  margemEsquerda,
  margemTopo,
  margemDireita,
  larguraDoFormulario,
  infAdic,
  extra,
  finalEspacoDet,
  textoRodape
}: GeneratePdf.InputDadosAdicionais): void {
  // Cálculo dinâmico da altura da seção baseado no conteúdo
  let alturaSecao = 821.8; // Altura padrão

  // Pré-cálculo do conteúdo para determinar espaço necessário
  const informacoesComplementares: string[] = [];

  // Z02 - infAdFisco: Informações Adicionais de Interesse do Fisco
  if (infAdic?.infAdFisco) {
    informacoesComplementares.push(`Inf. Fisco: ${cleanInfoComplementar(infAdic.infAdFisco)}`);
  }

  // Z03 - infCpl: Informações Complementares de Interesse do Contribuinte
  if (infAdic?.infCpl) {
    informacoesComplementares.push(`Inf. Contribuinte: ${cleanInfoComplementar(infAdic.infCpl)}`);
  }

  // Z04-Z06 - obsCont: Campos de uso livre do contribuinte (0-10 ocorrências)
  if (infAdic?.obsCont) {
    // Normalizar obsCont para sempre ser um array
    const obsContArray = Array.isArray(infAdic.obsCont) ? infAdic.obsCont : [infAdic.obsCont];

    obsContArray.forEach((obs) => {
      if (obs.xCampo && obs.xTexto) {
        informacoesComplementares.push(`${obs.xCampo}: ${cleanInfoComplementar(obs.xTexto)}`);
      }
    });
  }

  // Valor aproximado dos tributos (se disponível)
  if (extra?.vTotTrib) {
    informacoesComplementares.push(`Valor Aproximado dos Tributos: ${MoneyMaskBR(Number(extra.vTotTrib ?? '0'))}`);
  }

  // Email do destinatário (informação adicional, não especificada no manual)
  if (extra?.emailDest) {
    informacoesComplementares.push(`Email do Destinatário: ${extra.emailDest}`);
  }

  // Calcular altura necessária baseado na largura REAL - métrica precisa
  const textoCompleto = informacoesComplementares.join(' | ');
  const larguraDisponivel = 365; // MOC Z02: largura exata da célula
  const alturaLinha = 8;

  // Pré-calcular quantas linhas serão necessárias com largura real
  let linhasNecessarias = 1;
  if (informacoesComplementares.length > 0) {
    // Aplicar fonte temporária para medição
    doc.fontSize(6);
    const larguraTexto = doc.widthOfString(textoCompleto);

    if (larguraTexto > larguraDisponivel) {
      // Simular quebra para contar linhas reais
      const linhasSimuladas = quebrarTextoPorLargura(doc, textoCompleto, larguraDisponivel, 6);
      linhasNecessarias = linhasSimuladas.length;
    }
  }

  const alturaTexto = Math.max(1, linhasNecessarias) * alturaLinha;

  // Ajustar altura da seção se necessário (código ORIGINAL)
  const alturaMinima = finalEspacoDet + 25 + alturaTexto;
  if (alturaMinima > alturaSecao) {
    alturaSecao = Math.min(alturaMinima, 850); // Valor ORIGINAL
  }

  // Desenhar bordas da seção com cantos arredondados
  doc
    .lineWidth(0.5)
    .roundedRect(
      margemEsquerda + ajusteX,
      margemTopo + ajusteY + finalEspacoDet + 8,
      larguraDoFormulario,
      alturaSecao - (finalEspacoDet + 8),
      3
    )
    .stroke()
    .lineWidth(1); // Restaurar espessura padrão

  // Manter apenas divisória interna vertical
  linhaVertical({ y1: finalEspacoDet + 8, y2: alturaSecao, x: 367, doc, ajusteX, ajusteY, margemEsquerda, margemTopo }); // MOC Z02: 12,95 cm

  secao({ doc, value: 'DADOS ADICIONAIS', x: 1.5, y: finalEspacoDet, largura: 0, ajusteX, ajusteY, margemEsquerda, margemTopo });
  titulo({
    value: 'INFORMAÇÕES COMPLEMENTARES',
    x: 1.5,
    y: finalEspacoDet + 10,
    largura: 365.5, // MOC Z02: 12,95 cm = ~367px - margem
    ajusteX,
    ajusteY,
    doc,
    margemEsquerda,
    margemTopo
  });
  titulo({
    value: 'RESERVADO AO FISCO',
    x: 369, // MOC Z03: posição após divisória em 367px
    y: finalEspacoDet + 10,
    largura: 213, // MOC Z03: 7,62 cm = ~215px - margem
    ajusteX,
    ajusteY,
    doc,
    margemEsquerda,
    margemTopo
  });

  // Exibir informações complementares com quebra PRECISA baseada na largura real
  if (informacoesComplementares.length > 0) {
    const textoCompleto = informacoesComplementares.join(' | ');
    const larguraDisponivel = 365; // MOC Z02: largura exata da célula
    const alturaLinha = 8;

    // Verificar se precisa quebrar usando largura REAL
    doc.fontSize(6); // Aplicar fonte para medição
    const larguraTexto = doc.widthOfString(textoCompleto);

    if (larguraTexto > larguraDisponivel) {
      const linhas = quebrarTextoPorLargura(doc, textoCompleto, larguraDisponivel, 6);

      linhas.forEach((linha, index) => {
        normal({
          doc,
          value: linha,
          x: 1,
          y: finalEspacoDet + 17.5 + index * alturaLinha,
          largura: 365, // MOC Z02: largura máxima da seção
          alinhamento: 'left',
          tamanho: 6,
          ajusteX,
          ajusteY,
          margemEsquerda,
          margemTopo
        });
      });
    } else {
      // Para textos que cabem em uma linha
      normal({
        doc,
        value: textoCompleto,
        x: 1,
        y: finalEspacoDet + 17.5,
        largura: 365, // MOC Z02: largura máxima da seção
        alinhamento: 'justify',
        tamanho: 6,
        ajusteX,
        ajusteY,
        margemEsquerda,
        margemTopo
      });
    }
  }

  // Z07-Z09 - obsFisco: Campos de uso livre do Fisco na seção "RESERVADO AO FISCO"
  const informacoesFisco: string[] = [];

  if (infAdic?.obsFisco) {
    // Normalizar obsFisco para sempre ser um array
    const obsFiscoArray = Array.isArray(infAdic.obsFisco) ? infAdic.obsFisco : [infAdic.obsFisco];

    obsFiscoArray.forEach((obs) => {
      if (obs.xCampo && obs.xTexto) {
        informacoesFisco.push(`${obs.xCampo}: ${cleanInfoComplementar(obs.xTexto)}`);
      }
    });

    // Exibir informações do fisco na coluna direita com quebra PRECISA
    const textoFisco = informacoesFisco.join(' | ');
    const larguraFisco = 213; // MOC Z03: largura exata da coluna direita

    // Verificar se precisa quebrar usando largura REAL
    doc.fontSize(6); // Aplicar fonte para medição
    const larguraTextoFisco = doc.widthOfString(textoFisco);

    if (larguraTextoFisco > larguraFisco) {
      const linhasFisco = quebrarTextoPorLargura(doc, textoFisco, larguraFisco, 6);

      linhasFisco.forEach((linha, index) => {
        normal({
          doc,
          value: linha,
          x: 369, // MOC Z03: posição após divisória em 367px
          y: finalEspacoDet + 17.5 + index * 8,
          largura: 213, // MOC Z03: 7,62 cm = ~215px - margem
          alinhamento: 'left',
          tamanho: 6,
          ajusteX,
          ajusteY,
          margemEsquerda,
          margemTopo
        });
      });
    } else {
      normal({
        doc,
        value: textoFisco,
        x: 369, // MOC Z03: posição após divisória em 367px
        y: finalEspacoDet + 17.5,
        largura: 213, // MOC Z03: 7,62 cm = ~215px - margem
        alinhamento: 'justify',
        tamanho: 6,
        ajusteX,
        ajusteY,
        margemEsquerda,
        margemTopo
      });
    }
  }

  // Rodapé: Data/hora de geração e texto personalizado
  const alturaRodape = 8; // Valor ORIGINAL
  const yRodape = finalEspacoDet + 61.5 + alturaRodape; // Posicionamento ORIGINAL

  // Data e hora atual da geração do DANFE (lado esquerdo)
  const dataHoraAtual = format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  italico({
    doc,
    value: `Impresso em ${dataHoraAtual}`,
    x: 1.5,
    y: yRodape,
    largura: 280,
    alinhamento: 'left',
    tamanho: 6,
    ajusteX,
    ajusteY,
    margemEsquerda,
    margemTopo
  });

  // Texto personalizado (lado direito)
  if (textoRodape) {
    italico({
      doc,
      value: textoRodape,
      x: 285,
      y: yRodape,
      largura: 295,
      alinhamento: 'right',
      tamanho: 6,
      ajusteX,
      ajusteY,
      margemEsquerda,
      margemTopo
    });
  }
}
