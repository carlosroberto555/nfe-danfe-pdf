import { format, parseISO } from 'date-fns';
import PDFKit from 'pdfkit';
import QRCode from 'qrcode';
import { loadFontsNFCe } from '../../../application/helpers/generate-pdf/nfe/load-fontes';
import { negrito } from '../../../application/helpers/generate-pdf/nfe/negrito';
import { normal } from '../../../application/helpers/generate-pdf/nfe/normal';
import type { NFe, NFeProc } from '../../../types';
import { formatCnpj, formatCpf, formatNumber, formatPostalCode } from '../utils';
import { MoneyMaskBR } from '../../../utils';

function calcularAlturaDinamica(NFe: NFe) {
  const { det, pag, infAdic } = NFe.infNFe;
  let altura = 0;

  // Margem + cabeçalho da empresa e título
  altura += 90;

  // Itens (cada produto ocupa ~7pt + espaçamento)
  altura += det.length * 8 + 10;

  // Totais
  altura += 60;

  // Formas de pagamento
  altura += (pag.detPag?.length ?? 0) * 8 + 15;

  // QR Code + chave + dados do cliente
  altura += 200;

  // Observações (depende do tamanho do texto)
  const infCpl = infAdic?.infCpl ?? "";
  const linhasObs = Math.ceil(infCpl.length / 70); // ~70 chars por linha
  altura += linhasObs * 8;

  // Margem final
  altura += 30;

  return altura;
}

function linha(doc: PDFKit.PDFDocument) {
  doc.lineWidth(0.5);
  doc.strokeColor('#555');

  const margin: number = Number(doc.options.margins!.left) || 0;
  const width: number = Number(doc.options.size?.[0]) || 210;

  doc.moveTo(margin, doc.y + 2)
   .lineTo(width - margin, doc.y + 2)
   .stroke();

  doc.y += 4;
}

export async function pdfNFCe(nf: NFeProc, pathLogo?: string): Promise<PDFKit.PDFDocument> {
  const { NFe, protNFe } = nf;
  const { infProt } = protNFe;
  const { ide, emit, det, total, pag, dest, infAdic } = NFe.infNFe;
  const larguraPagina = 201;
  const margemPadrao = 2.5;

  const altura = calcularAlturaDinamica(NFe);

  const doc = new PDFKit({
    size: [larguraPagina, altura],
    margins: {
      top: margemPadrao,
      bottom: 0,
      left: margemPadrao,
      right: margemPadrao
    }
  });

  loadFontsNFCe(doc);

  negrito({
    doc,
    value: emit.xNome,
    x: 0,
    y: doc.y,
    largura: larguraPagina,
    tamanho: 9,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0
  });
  negrito({
    doc,
    value: formatCnpj(emit.CNPJ),
    x: 0,
    y: doc.y,
    largura: larguraPagina,
    tamanho: 9,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0
  });

  doc.y += 4;

  normal({
    doc,
    value: `${emit.enderEmit.xLgr}, ${emit.enderEmit.nro}${emit.enderEmit.xCpl !== undefined ? ' ' + emit.enderEmit.xCpl : ''}. ${
      emit.enderEmit.xBairro
    }, ${emit.enderEmit.xMun}-${emit.enderEmit.UF}. ${formatPostalCode(emit.enderEmit.CEP ?? '')}`,
    x: 0,
    y: doc.y,
    largura: larguraPagina,
    tamanho: 8,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0
  });
  doc.y += 5;
  negrito({
    doc,
    value: 'Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica',
    x: 0,
    y: doc.y,
    largura: larguraPagina,
    tamanho: 8,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0
  });

  doc.y += 5;

  linha(doc);

  let posicao = doc.y;

  normal({
    doc,
    value: 'CODIGO',
    x: 0,
    y: posicao,
    largura: 26.5,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: margemPadrao,
    margemTopo: 0,
    alinhamento: 'left'
  });
  normal({
    doc,
    value: 'DESCRICAO',
    x: 31,
    y: posicao,
    largura: 74.5,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'left'
  });
  normal({
    doc,
    value: 'UN',
    x: 105,
    y: posicao,
    largura: 15,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'center'
  });
  normal({
    doc,
    value: 'QTD',
    x: 120,
    y: posicao,
    largura: 20,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'center'
  });
  normal({
    doc,
    value: 'VL UN',
    x: 140,
    y: posicao,
    largura: 27,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'center'
  });
  normal({
    doc,
    value: 'VL TOTAL',
    x: 167,
    y: posicao,
    largura: larguraPagina - 167,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'center'
  });

  linha(doc);

  det.forEach((element) => {
    posicao = doc.y;
    normal({
      doc,
      value: element.prod.cProd.padStart(9, '0').substring(0, 9),
      x: 0 + margemPadrao,
      y: posicao,
      largura: 28,
      tamanho: 6,
      ajusteX: 0,
      ajusteY: 0,
      margemEsquerda: 0,
      margemTopo: 0,
      alinhamento: 'left'
    });
    normal({
      doc,
      value: ajusteTamanhoTexto(doc, ide.tpAmb === '1' ? element.prod.xProd.substring(0, 26) : 'NOTA FISCAL EMITIDA EM AMB', 73.5),
      x: 31,
      y: posicao,
      largura: 73.5,
      tamanho: 6,
      ajusteX: 0,
      ajusteY: 0,
      margemEsquerda: 0,
      margemTopo: 0,
      alinhamento: 'left'
    });
    normal({
      doc,
      value: element.prod.uCom,
      x: 105,
      y: posicao,
      largura: 15,
      tamanho: 6,
      ajusteX: 0,
      ajusteY: 0,
      margemEsquerda: 0,
      margemTopo: 0,
      alinhamento: 'center'
    });
    normal({
      doc,
      value: formatNumber(element.prod.qCom, 3),
      x: 120,
      y: posicao,
      largura: 20,
      tamanho: 6,
      ajusteX: 0,
      ajusteY: 0,
      margemEsquerda: 0,
      margemTopo: 0,
      alinhamento: 'center'
    });
    normal({
      doc,
      value: formatNumber(element.prod.vUnCom, 2),
      x: 140,
      y: posicao,
      largura: 27,
      tamanho: 6,
      ajusteX: 0,
      ajusteY: 0,
      margemEsquerda: 0,
      margemTopo: 0,
      alinhamento: 'center'
    });
    normal({
      doc,
      value: MoneyMaskBR(+element.prod.vProd),
      x: 167,
      y: posicao,
      largura: larguraPagina - 167,
      tamanho: 6,
      ajusteX: -margemPadrao,
      ajusteY: 0,
      margemEsquerda: 0,
      margemTopo: 0,
      alinhamento: 'right'
    });
    posicao += 7;
  });

  doc.y += 10

  linha(doc);

  normal({
    doc,
    value: 'Quantidade Total de Itens',
    x: margemPadrao,
    y: doc.y,
    largura: larguraPagina,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'left'
  });
  doc.y -= 7;
  normal({
    doc,
    value: String(det.length),
    x: 0,
    y: doc.y,
    largura: larguraPagina - margemPadrao,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'right'
  });
  normal({
    doc,
    value: 'Valor Total',
    x: margemPadrao,
    y: doc.y,
    largura: larguraPagina,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'left'
  });
  doc.y -= 7;
  normal({
    doc,
    value: MoneyMaskBR(+total.ICMSTot.vProd),
    x: 0,
    y: doc.y,
    largura: larguraPagina - margemPadrao,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'right'
  });
  normal({
    doc,
    value: 'Desconto',
    x: margemPadrao,
    y: doc.y,
    largura: larguraPagina,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'left'
  });
  doc.y -= 7;
  normal({
    doc,
    value: MoneyMaskBR(+total.ICMSTot.vDesc),
    x: 0,
    y: doc.y,
    largura: larguraPagina - margemPadrao,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'right'
  });
  normal({
    doc,
    value: 'Adicional/Frete/Seguro',
    x: margemPadrao,
    y: doc.y,
    largura: larguraPagina,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'left'
  });
  doc.y -= 7;
  normal({
    doc,
    value: MoneyMaskBR(+total.ICMSTot.vFrete),
    x: 0,
    y: doc.y,
    largura: larguraPagina - margemPadrao,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'right'
  });
  normal({
    doc,
    value: 'Valor a Pagar',
    x: margemPadrao,
    y: doc.y,
    largura: larguraPagina,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'left'
  });
  doc.y -= 7;
  normal({
    doc,
    value: MoneyMaskBR(+total.ICMSTot.vNF),
    x: 0,
    y: doc.y,
    largura: larguraPagina - margemPadrao,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'right'
  });
  doc.y += 5;

  linha(doc)

  normal({
    doc,
    value: 'FORMA DE PAGAMENTO',
    x: margemPadrao,
    y: doc.y,
    largura: larguraPagina,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'left'
  });
  doc.y -= 7;
  normal({
    doc,
    value: 'VALOR PAGO',
    x: 0,
    y: doc.y,
    largura: larguraPagina - margemPadrao,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'right'
  });
  pag.detPag.forEach((element) => {
    normal({
      doc,
      value: getPagName(element.tPag),
      x: margemPadrao,
      y: doc.y,
      largura: larguraPagina,
      tamanho: 7,
      ajusteX: 0,
      ajusteY: 0,
      margemEsquerda: 0,
      margemTopo: 0,
      alinhamento: 'left'
    });
    doc.y -= 7;
    normal({
      doc,
      value: MoneyMaskBR(+element.vPag),
      x: 0,
      y: doc.y,
      largura: larguraPagina - margemPadrao,
      tamanho: 7,
      ajusteX: 0,
      ajusteY: 0,
      margemEsquerda: 0,
      margemTopo: 0,
      alinhamento: 'right'
    });
  });
  normal({
    doc,
    value: 'TROCO',
    x: margemPadrao,
    y: doc.y,
    largura: larguraPagina,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'left'
  });
  doc.y -= 7;
  normal({
    doc,
    value: MoneyMaskBR(Number(pag.vTroco ?? 0)),
    x: 0,
    y: doc.y,
    largura: larguraPagina - margemPadrao,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'right'
  });
  doc.y += 5;

  linha(doc);

  negrito({
    doc,
    value: 'Consulte pela chave de acesso em',
    x: 0,
    y: doc.y,
    largura: larguraPagina - margemPadrao * 2,
    tamanho: 8,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'center'
  });
  normal({
    doc,
    value: NFe.infNFeSupl?.urlChave ?? '',
    x: 0,
    y: doc.y,
    largura: larguraPagina - margemPadrao,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'center'
  });
  doc.y += 7;
  normal({
    doc,
    value: nf.protNFe.infProt.chNFe.replace(/(.{4})(?=.)/g, '$1 '),
    x: 0,
    y: doc.y,
    largura: larguraPagina - margemPadrao,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'center'
  });
  doc.y += 7;
  normal({
    doc,
    value: dest?.xNome !== undefined ? dest.xNome : 'CONSUMIDOR NAO IDENTIFICADO',
    x: 0,
    y: doc.y,
    largura: larguraPagina - margemPadrao,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'center'
  });
  if (dest?.CNPJ !== undefined) {
    normal({
      doc,
      value: 'CNPJ: ' + formatCnpj(dest.CNPJ),
      x: 0,
      y: doc.y,
      largura: 112,
      tamanho: 7,
      ajusteX: 0,
      ajusteY: 0,
      margemEsquerda: 0,
      margemTopo: 0,
      alinhamento: 'center'
    });
  } else if (dest?.CPF !== undefined) {
    normal({
      doc,
      value: 'CPF: ' + formatCpf(dest.CPF),
      x: 0,
      y: doc.y,
      largura: 112,
      tamanho: 7,
      ajusteX: 0,
      ajusteY: 0,
      margemEsquerda: 0,
      margemTopo: 0,
      alinhamento: 'center'
    });
  }
  doc.y += 7;
  normal({
    doc,
    value: `Série: ${ide.serie}, Número: ${ide.nNF}, Data Emissão: ${format(parseISO(ide.dhEmi), 'dd/MM/yyyy HH:mm:ss')}`,
    x: 0,
    y: doc.y,
    largura: larguraPagina - margemPadrao,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'center'
  });
  normal({
    doc,
    value: `Protocolo de Autorização: ${infProt.nProt}`,
    x: 0,
    y: doc.y,
    largura: larguraPagina - margemPadrao,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'center'
  });
  normal({
    doc,
    value: infProt.dhRecbto ? `Data Autorização: ${format(parseISO(infProt.dhRecbto), 'dd/MM/yyyy HH:mm:ss')}` : '',
    x: 0,
    y: doc.y,
    largura: larguraPagina - margemPadrao,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'center'
  });
  doc.y += 5;

  const qrImage = await QRCode.toDataURL(NFe.infNFeSupl?.qrCode ?? '');
  doc.image(qrImage, larguraPagina / 2 - 40, doc.y, { fit: [80, 80], align: 'center' });

  doc.y += 85;

  normal({
    doc,
    value: 'Informações de interesse do contribuinte:',
    x: margemPadrao,
    y: doc.y,
    largura: larguraPagina - margemPadrao * 2,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: margemPadrao,
    margemTopo: 0,
    alinhamento: 'center'
  });
  normal({
    doc,
    value: infAdic.infCpl ?? '',
    x: margemPadrao,
    y: doc.y,
    largura: larguraPagina - margemPadrao * 2,
    tamanho: 7,
    ajusteX: 0,
    ajusteY: 0,
    margemEsquerda: 0,
    margemTopo: 0,
    alinhamento: 'center'
  });
  doc.end();
  return doc;
}

function ajusteTamanhoTexto(doc: PDFKit.PDFDocument, value: string, tamanho: number) {
  while (doc.widthOfString(value) > tamanho) {
    value = value.substring(0, value.length - 1);
  }
  return value;
}

function getPagName(value: string) {
  if (value === '01') {
    return 'Dinheiro';
  }
  if (value === '02') {
    return 'Cheque';
  }
  if (value === '03') {
    return 'Cartão de Crédito';
  }
  if (value === '04') {
    return 'Cartão de Débito';
  }
  if (value === '05') {
    return 'Crédito Loja';
  }
  if (value === '10') {
    return 'Vale Alimentação';
  }
  if (value === '11') {
    return 'Vale Refeição';
  }
  if (value === '12') {
    return 'Vale Presente';
  }
  if (value === '13') {
    return 'Vale Combustível';
  }
  if (value === '14') {
    return 'Duplicata Mercantil';
  }
  if (value === '15') {
    return 'Boleto Bancário';
  }
  if (value === '16') {
    return 'Depósito Bancário';
  }
  if (value === '17') {
    return 'Pagamento Instantâneo (PIX)';
  }
  if (value === '18') {
    return 'Transferência bancária, Carteira Digital';
  }
  if (value === '19') {
    return 'Programa de fidelidade, CashBack, Crédito Virtual';
  }
  if (value === '90') {
    return 'Sem pagamento';
  }
  return 'Outros';
}
