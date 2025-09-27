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
 * Quebra texto longo em linhas de forma inteligente, respeitando palavras e espaço disponível
 */
function quebrarTextoInteligente(texto: string, maxCaracteres: number): string[] {
  const linhas: string[] = [];
  let textoRestante = texto;

  while (textoRestante.length > 0) {
    if (textoRestante.length <= maxCaracteres) {
      linhas.push(textoRestante);
      break;
    }

    // Encontra o melhor ponto de quebra
    let pontoCorte = maxCaracteres;
    const fatia = textoRestante.substring(0, maxCaracteres);

    // Procura por separadores ideais em ordem de prioridade
    const separadores = [' | ', ' - ', ': ', ' ', ',', '.'];
    let melhorCorte = -1;

    for (const separador of separadores) {
      const ultimaOcorrencia = fatia.lastIndexOf(separador);
      if (ultimaOcorrencia > maxCaracteres * 0.7) {
        // Só aceita se for pelo menos 70% da linha
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
  if (infAdic?.obsCont && infAdic.obsCont.length > 0) {
    infAdic.obsCont.forEach((obs) => {
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

  // Calcular altura necessária com base no texto
  const textoCompleto = informacoesComplementares.join(' | ');
  const maxCaracteresPorLinha = 87; // Ajustado para largura MOC Z02 (367px vs 386px anterior)
  const alturaLinha = 8;
  const linhasNecessarias = Math.ceil(textoCompleto.length / maxCaracteresPorLinha);
  const alturaTexto = Math.max(1, linhasNecessarias) * alturaLinha;

  // Ajustar altura da seção se necessário (mínimo de espaço para o texto)
  const alturaMinima = finalEspacoDet + 25 + alturaTexto;
  if (alturaMinima > alturaSecao) {
    alturaSecao = Math.min(alturaMinima, 850); // Máximo permitido na página
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

  // Exibir informações complementares com tratamento para textos longos
  if (informacoesComplementares.length > 0) {
    const textoCompleto = informacoesComplementares.join(' | ');
    const maxCaracteresPorLinha = 87; // MOC Z02: 12,95 cm = ~367px
    const alturaLinha = 8; // Altura de cada linha de texto

    // Se o texto é muito longo, quebre em múltiplas linhas
    if (textoCompleto.length > maxCaracteresPorLinha) {
      const linhas = quebrarTextoInteligente(textoCompleto, maxCaracteresPorLinha);

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
      // Para textos curtos, usa o método original
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

  if (infAdic?.obsFisco && infAdic.obsFisco.length > 0) {
    infAdic.obsFisco.forEach((obs) => {
      if (obs.xCampo && obs.xTexto) {
        informacoesFisco.push(`${obs.xCampo}: ${cleanInfoComplementar(obs.xTexto)}`);
      }
    });

    // Exibir informações do fisco na coluna direita com quebra inteligente
    const textoFisco = informacoesFisco.join(' | ');
    const maxCaracteresFisco = 50; // MOC Z03: 7,62 cm = ~215px (aumentado de 45 para 50)

    if (textoFisco.length > maxCaracteresFisco) {
      const linhasFisco = quebrarTextoInteligente(textoFisco, maxCaracteresFisco);

      linhasFisco.forEach((linha, index) => {
        normal({
          doc,
          value: linha,
          x: 369, // MOC Z03: posição após divisória em 367px
          y: finalEspacoDet + 17.5 + index * alturaLinha,
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
  const alturaRodape = 8; // Espaço reduzido para o rodapé
  const yRodape = finalEspacoDet + 61.5 + alturaRodape; // Posicionado mais próximo da seção dados adicionais

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
