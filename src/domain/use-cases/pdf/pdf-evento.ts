import bwipjs from 'bwip-js';
import PDFKit from 'pdfkit';
import { loadFonts } from '../../../application/helpers/generate-pdf/nfe/load-fontes';
import { optionsDocNFe } from '../../../application/helpers/generate-pdf/nfe/options-doc';
import { deserializeXml } from '../../../application/helpers/xml';
import type { OpcoesPdfEvento, RetornoEvento } from '../../../types/pdf-evento';
import { formatCnpj, formatCpf, formatDateTime, formatKey, formatNumber, formatPhone, formatStateRegistration } from '../utils';

const LARGURA_PAGINA = 595.44;
const ALTURA_PAGINA = 841.68;
const MARGEM = 30;
const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;
const ESPACO = 3;
const ALTURA_CAMPO = 22;
const RAIO = 3;

const TIPO_CARTA_CORRECAO = '110110';
const TIPOS_CANCELAMENTO = ['110111', '110112'];

const CONDICOES_DE_USO_PADRAO =
  'A Carta de Correção é disciplinada pelo § 1º-A do art. 7º do Convênio S/N, de 15 de dezembro de 1970 e pode ser utilizada para regularização de erro ocorrido na emissão de documento fiscal, desde que o erro não esteja relacionado com: I - as variáveis que determinam o valor do imposto tais como: base de cálculo, alíquota, diferença de preço, quantidade, valor da operação ou da prestação; II - a correção de dados cadastrais que implique mudança do remetente ou do destinatário; III - a data de emissão ou de saída.';

type Coluna = { largura?: number; rotulo: string; valor?: string; alinhamento?: 'left' | 'right' | 'center' };

type DadosEvento = {
  chave: string;
  tipo: string;
  descricao: string;
  sequencia: string;
  dataEvento: string;
  ambiente: string;
  textoEvento: string;
  condicoesDeUso: string;
  protocoloEvento: string;
  situacao: string;
};

type DadosNota = {
  modelo: string;
  serie: string;
  numero: string;
  dataEmissao: string;
  protocoloAutorizacao: string;
  valorTotal: string;
  emitenteNome: string;
  emitenteDocumento: string;
  emitenteIe: string;
  emitenteEndereco: string;
  emitenteMunicipioUf: string;
  emitenteTelefone: string;
  destinatarioNome: string;
  destinatarioDocumento: string;
  destinatarioIe: string;
  destinatarioEndereco: string;
  destinatarioMunicipio: string;
  destinatarioUf: string;
  destinatarioCep: string;
};

function buscarNo(no: any, nome: string): any {
  if (no === null || typeof no !== 'object') return undefined;
  for (const chave of Object.keys(no)) {
    if (chave.split(':').pop() === nome && no[chave] !== null && typeof no[chave] === 'object') return no[chave];
  }
  for (const chave of Object.keys(no)) {
    const encontrado = buscarNo(no[chave], nome);
    if (encontrado !== undefined) return encontrado;
  }
  return undefined;
}

function texto(valor: unknown): string {
  if (valor === undefined || valor === null) return '';
  if (typeof valor === 'object') return '';
  return String(valor).trim();
}

function formatarDocumento(documento: string): string {
  const digitos = documento.replace(/\D/g, '');
  if (digitos.length === 14) return formatCnpj(digitos);
  if (digitos.length === 11) return formatCpf(digitos);
  return documento;
}

function formatarNumeroNota(numero: string): string {
  const digitos = numero.replace(/\D/g, '');
  if (!digitos) return '';
  return digitos.padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
}

function protocoloComData(protocolo: string, data: string): string {
  if (!protocolo) return '';
  return data ? `${protocolo} - ${formatDateTime(data)}` : protocolo;
}

function dataHoraAtual(): string {
  const agora = new Date();
  const doisDigitos = (n: number): string => String(n).padStart(2, '0');
  return `${doisDigitos(agora.getDate())}/${doisDigitos(agora.getMonth() + 1)}/${agora.getFullYear()} ${doisDigitos(agora.getHours())}:${doisDigitos(agora.getMinutes())}:${doisDigitos(agora.getSeconds())}`;
}

function extrairEvento(xmlEvento: any, retornoInformado?: RetornoEvento): DadosEvento {
  const eventoEnviado = buscarNo(buscarNo(xmlEvento, 'evento') ?? {}, 'infEvento') ?? buscarNo(xmlEvento, 'infEvento') ?? {};
  const retornoXml = buscarNo(buscarNo(xmlEvento, 'retEvento') ?? {}, 'infEvento') ?? {};
  const detalhe = eventoEnviado.detEvento ?? {};

  const cStat = texto(retornoInformado?.cStat) || texto(retornoXml.cStat) || texto(eventoEnviado.cStat);
  const xMotivo = texto(retornoInformado?.xMotivo) || texto(retornoXml.xMotivo) || texto(eventoEnviado.xMotivo);
  const nProt = texto(retornoInformado?.nProt) || texto(retornoXml.nProt) || texto(eventoEnviado.nProt);
  const dhRegEvento = texto(retornoInformado?.dhRegEvento) || texto(retornoXml.dhRegEvento) || texto(eventoEnviado.dhRegEvento);

  const tipo = texto(eventoEnviado.tpEvento) || texto(retornoXml.tpEvento);
  const ambiente = texto(eventoEnviado.tpAmb) || texto(retornoXml.tpAmb);

  return {
    chave: texto(eventoEnviado.chNFe) || texto(retornoXml.chNFe),
    tipo,
    descricao: texto(detalhe.descEvento) || texto(eventoEnviado.xEvento) || texto(retornoXml.xEvento),
    sequencia: texto(eventoEnviado.nSeqEvento) || texto(retornoXml.nSeqEvento) || '1',
    dataEvento: texto(eventoEnviado.dhEvento) || dhRegEvento,
    ambiente: ambiente === '2' ? '2 - HOMOLOGAÇÃO' : '1 - PRODUÇÃO',
    textoEvento: texto(detalhe.xCorrecao) || texto(detalhe.xJust),
    condicoesDeUso: texto(detalhe.xCondUso) || (tipo === TIPO_CARTA_CORRECAO ? CONDICOES_DE_USO_PADRAO : ''),
    protocoloEvento: protocoloComData(nProt, dhRegEvento),
    situacao: [cStat, xMotivo].filter(Boolean).join(' - ').toUpperCase()
  };
}

function extrairNota(nfe: any, chave: string, opcoes?: OpcoesPdfEvento): DadosNota {
  const infNFe = buscarNo(nfe, 'infNFe') ?? {};
  const infProt = buscarNo(nfe, 'infProt') ?? {};
  const ide = infNFe.ide ?? {};
  const emit = infNFe.emit ?? {};
  const dest = infNFe.dest ?? {};
  const enderEmit = emit.enderEmit ?? {};
  const enderDest = dest.enderDest ?? {};
  const vNF = texto(infNFe.total?.ICMSTot?.vNF);
  const digitosChave = chave.replace(/\D/g, '');

  const enderecoEmitente = [[texto(enderEmit.xLgr), texto(enderEmit.nro)].filter(Boolean).join(', '), texto(enderEmit.xBairro)]
    .filter(Boolean)
    .join(' - ');
  const municipioUfEmitente = [texto(enderEmit.xMun), texto(enderEmit.UF), texto(enderEmit.CEP)].filter(Boolean).join(' - ');

  return {
    modelo: texto(ide.mod) || digitosChave.substring(20, 22),
    serie: (texto(ide.serie) || digitosChave.substring(22, 25)).padStart(3, '0'),
    numero: formatarNumeroNota(texto(ide.nNF) || digitosChave.substring(25, 34)),
    dataEmissao: formatDateTime(texto(ide.dhEmi)),
    protocoloAutorizacao: protocoloComData(texto(infProt.nProt), texto(infProt.dhRecbto)),
    valorTotal: vNF ? `R$ ${formatNumber(vNF, 2)}` : '',
    emitenteNome: opcoes?.emitente?.nome ?? texto(emit.xNome),
    emitenteDocumento: formatarDocumento(opcoes?.emitente?.cnpj ?? (texto(emit.CNPJ) || texto(emit.CPF) || digitosChave.substring(6, 20))),
    emitenteIe: opcoes?.emitente?.inscricaoEstadual ?? formatStateRegistration(texto(emit.IE), texto(enderEmit.UF)),
    emitenteEndereco: opcoes?.emitente?.endereco ?? enderecoEmitente,
    emitenteMunicipioUf: opcoes?.emitente?.municipioUf ?? municipioUfEmitente,
    emitenteTelefone: opcoes?.emitente?.telefone ?? (formatPhone(texto(enderEmit.fone)) || texto(enderEmit.fone)),
    destinatarioNome: opcoes?.destinatario?.nome ?? texto(dest.xNome),
    destinatarioDocumento: formatarDocumento(
      opcoes?.destinatario?.documento ?? (texto(dest.CNPJ) || texto(dest.CPF) || texto(dest.idEstrangeiro))
    ),
    destinatarioIe: opcoes?.destinatario?.inscricaoEstadual ?? formatStateRegistration(texto(dest.IE), texto(enderDest.UF) || undefined),
    destinatarioEndereco: [[texto(enderDest.xLgr), texto(enderDest.nro)].filter(Boolean).join(', '), texto(enderDest.xBairro)]
      .filter(Boolean)
      .join(' - '),
    destinatarioMunicipio: texto(enderDest.xMun),
    destinatarioUf: texto(enderDest.UF),
    destinatarioCep: texto(enderDest.CEP).replace(/^(\d{5})(\d{3})$/, '$1-$2')
  };
}

function caixa(doc: PDFKit.PDFDocument, x: number, y: number, largura: number, altura: number, espessura = 0.5): void {
  doc.lineWidth(espessura).roundedRect(x, y, largura, altura, RAIO).stroke().lineWidth(1);
}

function tituloDeSecao(doc: PDFKit.PDFDocument, valor: string, y: number): number {
  doc.font('negrito').fontSize(7.5).fillColor('black').text(valor.toUpperCase(), MARGEM, y, { width: LARGURA_UTIL });
  return y + 10;
}

function linhaDeCampos(doc: PDFKit.PDFDocument, y: number, colunas: Coluna[]): number {
  const larguraFixa = colunas.reduce((soma, coluna) => soma + (coluna.largura ?? 0), 0);
  const flexiveis = colunas.filter((coluna) => coluna.largura === undefined).length;
  const larguraFlexivel = (LARGURA_UTIL - larguraFixa - ESPACO * (colunas.length - 1)) / Math.max(flexiveis, 1);

  let x = MARGEM;
  for (const coluna of colunas) {
    const largura = coluna.largura ?? larguraFlexivel;
    caixa(doc, x, y, largura, ALTURA_CAMPO);
    doc
      .font('normal')
      .fontSize(6.4)
      .fillColor('black')
      .text(coluna.rotulo.toUpperCase(), x + 4.5, y + 2.5, { width: largura - 9, align: coluna.alinhamento ?? 'left', lineBreak: false });
    doc
      .font('negrito')
      .fontSize(9)
      .text(coluna.valor ?? '', x + 4.5, y + 10.5, {
        width: largura - 9,
        align: coluna.alinhamento ?? 'left',
        lineBreak: false,
        ellipsis: true
      });
    x += largura + ESPACO;
  }
  return y + ALTURA_CAMPO + ESPACO;
}

function marcaDagua(doc: PDFKit.PDFDocument): void {
  doc
    .save()
    .rotate(-30, { origin: [LARGURA_PAGINA / 2, ALTURA_PAGINA / 2] })
    .font('negrito')
    .fontSize(48)
    .fillColor('#d9d9d9')
    .text('SEM VALOR FISCAL', 0, ALTURA_PAGINA / 2 - 24, { width: LARGURA_PAGINA, align: 'center' })
    .restore()
    .fillColor('black');
}

async function cabecalho(
  doc: PDFKit.PDFDocument,
  evento: DadosEvento,
  nota: DadosNota,
  titulo: string,
  subtitulo: string,
  pathLogo?: string
): Promise<number> {
  const y = MARGEM;
  const altura = 96;
  const larguraEmitente = 200;
  const larguraTitulo = 105;
  const larguraChave = LARGURA_UTIL - larguraEmitente - larguraTitulo - ESPACO * 2;
  const xTitulo = MARGEM + larguraEmitente + ESPACO;
  const xChave = xTitulo + larguraTitulo + ESPACO;

  caixa(doc, MARGEM, y, larguraEmitente, altura);
  let xTexto = MARGEM + 6;
  if (pathLogo) {
    doc.image(pathLogo, MARGEM + 6, y + 6, { fit: [48, 48] });
    xTexto = MARGEM + 60;
  }
  const larguraTexto = MARGEM + larguraEmitente - 6 - xTexto;
  doc
    .font('negrito')
    .fontSize(9.5)
    .fillColor('black')
    .text(nota.emitenteNome.toUpperCase(), xTexto, y + 7, { width: larguraTexto });
  const linhasEmitente = [
    nota.emitenteEndereco,
    nota.emitenteMunicipioUf,
    nota.emitenteTelefone ? `Fone: ${nota.emitenteTelefone}` : '',
    nota.emitenteDocumento ? `CNPJ: ${nota.emitenteDocumento}` : '',
    nota.emitenteIe ? `IE: ${nota.emitenteIe}` : ''
  ].filter(Boolean);
  doc
    .font('normal')
    .fontSize(8)
    .text(linhasEmitente.join('\n'), xTexto, doc.y + 2, { width: larguraTexto, lineGap: 0.5 });

  caixa(doc, xTitulo, y, larguraTitulo, altura);
  let tamanhoTitulo = 19.5;
  doc.font('negrito');
  while (tamanhoTitulo > 8 && doc.fontSize(tamanhoTitulo).widthOfString(titulo) > larguraTitulo - 10) tamanhoTitulo -= 0.5;
  doc.fontSize(tamanhoTitulo).text(titulo, xTitulo + 4, y + 18, { width: larguraTitulo - 8, align: 'center' });
  doc
    .font('normal')
    .fontSize(7.5)
    .text(subtitulo.toUpperCase(), xTitulo + 6, doc.y + 3, { width: larguraTitulo - 12, align: 'center' });
  doc
    .font('negrito')
    .fontSize(8.5)
    .text(`EVENTO Nº ${evento.sequencia}`, xTitulo + 4, doc.y + 4, { width: larguraTitulo - 8, align: 'center' });

  caixa(doc, xChave, y, larguraChave, altura);
  if (evento.chave) {
    const codigoDeBarras = await bwipjs.toBuffer({ bcid: 'code128', text: evento.chave, height: 12, width: 130 });
    doc.image(codigoDeBarras, xChave + 6, y + 6, { fit: [larguraChave - 12, 33], align: 'center' });
  }
  doc
    .font('negrito')
    .fontSize(7)
    .text('CHAVE DE ACESSO DA NF-e', xChave + 6, y + 44, { width: larguraChave - 12 });
  doc
    .font('negrito')
    .fontSize(8)
    .text(formatKey(evento.chave), xChave + 4, y + 55, { width: larguraChave - 8, align: 'center', lineBreak: false });
  doc
    .font('normal')
    .fontSize(7.5)
    .text('Consulta de autenticidade no portal nacional da NF-e\nwww.nfe.fazenda.gov.br/portal', xChave + 4, y + 70, {
      width: larguraChave - 8,
      align: 'center'
    });

  return y + altura + 8;
}

function blocoDeTexto(doc: PDFKit.PDFDocument, rotulo: string, valor: string, y: number, alturaMinima: number, tamanho = 10): number {
  y = tituloDeSecao(doc, rotulo, y);
  doc.font('normal').fontSize(tamanho);
  const alturaTexto = doc.heightOfString(valor, { width: LARGURA_UTIL - 18, lineGap: 2 });
  const altura = Math.max(alturaMinima, alturaTexto + 14);
  caixa(doc, MARGEM, y, LARGURA_UTIL, altura);
  doc.text(valor, MARGEM + 9, y + 7, { width: LARGURA_UTIL - 18, lineGap: 2, align: 'justify' });
  return y + altura + 8;
}

function rodape(doc: PDFKit.PDFDocument, textoRodape?: string): void {
  const y = ALTURA_PAGINA - MARGEM - 10;
  doc
    .lineWidth(0.5)
    .moveTo(MARGEM, y - 4)
    .lineTo(MARGEM + LARGURA_UTIL, y - 4)
    .stroke()
    .lineWidth(1);
  const esquerda = [`Impresso em ${dataHoraAtual()}`, textoRodape].filter(Boolean).join(' - ');
  doc
    .font('normal')
    .fontSize(7.5)
    .fillColor('black')
    .text(esquerda, MARGEM, y, { width: LARGURA_UTIL / 2, lineBreak: false });
  doc.text('Página 1 de 1', MARGEM + LARGURA_UTIL / 2, y, { width: LARGURA_UTIL / 2, align: 'right', lineBreak: false });
}

export async function pdfEvento(xmlEvento: string, opcoes?: OpcoesPdfEvento): Promise<PDFKit.PDFDocument> {
  const eventoXml = await deserializeXml(xmlEvento);
  const evento = extrairEvento(eventoXml, opcoes?.retorno);
  const nfeXml = opcoes?.xmlNFe ? await deserializeXml(opcoes.xmlNFe) : {};
  const nota = extrairNota(nfeXml, evento.chave, opcoes);

  const cartaDeCorrecao = evento.tipo === TIPO_CARTA_CORRECAO;
  const cancelamento = TIPOS_CANCELAMENTO.includes(evento.tipo);

  const doc = new PDFKit({ ...optionsDocNFe, bufferPages: false });
  loadFonts(doc);

  if (evento.ambiente.startsWith('2')) marcaDagua(doc);

  const titulo = cartaDeCorrecao ? 'DACCE' : cancelamento ? 'CANCELAMENTO' : 'EVENTO';
  const subtitulo = cartaDeCorrecao
    ? 'Documento Auxiliar da Carta de Correção Eletrônica'
    : cancelamento
      ? 'Documento auxiliar do evento de cancelamento de NF-e'
      : 'Documento auxiliar de evento da NF-e';

  let y = await cabecalho(doc, evento, nota, titulo, subtitulo, opcoes?.pathLogo);

  if (cancelamento) {
    caixa(doc, MARGEM, y, LARGURA_UTIL, 24, 1.5);
    doc
      .font('negrito')
      .fontSize(12)
      .text('NF-e CANCELADA - SEM VALIDADE PARA OPERAÇÃO', MARGEM, y + 7, {
        width: LARGURA_UTIL,
        align: 'center',
        characterSpacing: 0.5
      });
    y += 32;
  }

  y = tituloDeSecao(doc, 'Dados da NF-e', y);
  y = linhaDeCampos(doc, y, [
    { largura: 45, rotulo: 'Modelo', valor: nota.modelo },
    { largura: 45, rotulo: 'Série', valor: nota.serie },
    { largura: 82.5, rotulo: 'Número', valor: nota.numero },
    { largura: 97.5, rotulo: 'Data de emissão', valor: nota.dataEmissao },
    { rotulo: 'Protocolo de autorização de uso', valor: nota.protocoloAutorizacao },
    { largura: 90, rotulo: 'Valor total da nota', valor: nota.valorTotal, alinhamento: 'right' }
  ]);
  y += 5;

  y = tituloDeSecao(doc, 'Destinatário / Remetente', y);
  y = linhaDeCampos(doc, y, [
    { rotulo: 'Nome / Razão social', valor: nota.destinatarioNome.toUpperCase() },
    { largura: 127.5, rotulo: 'CNPJ / CPF', valor: nota.destinatarioDocumento },
    { largura: 112.5, rotulo: 'Inscrição estadual', valor: nota.destinatarioIe }
  ]);
  if (nota.destinatarioEndereco || nota.destinatarioMunicipio) {
    y = linhaDeCampos(doc, y, [
      { rotulo: 'Endereço', valor: nota.destinatarioEndereco.toUpperCase() },
      { largura: 150, rotulo: 'Município', valor: nota.destinatarioMunicipio.toUpperCase() },
      { largura: 37.5, rotulo: 'UF', valor: nota.destinatarioUf },
      { largura: 90, rotulo: 'CEP', valor: nota.destinatarioCep }
    ]);
  }
  y += 5;

  y = tituloDeSecao(doc, 'Evento', y);
  y = linhaDeCampos(doc, y, [
    { rotulo: 'Tipo do evento', valor: [evento.tipo, evento.descricao.toUpperCase()].filter(Boolean).join(' - ') },
    { largura: 67.5, rotulo: 'Sequência', valor: evento.sequencia },
    { largura: 127.5, rotulo: 'Data / hora do evento', valor: formatDateTime(evento.dataEvento) }
  ]);
  y = linhaDeCampos(doc, y, [
    { largura: 172.5, rotulo: cancelamento ? 'Protocolo do cancelamento' : 'Protocolo do evento', valor: evento.protocoloEvento },
    { rotulo: 'Situação', valor: evento.situacao },
    { largura: 112.5, rotulo: 'Ambiente', valor: evento.ambiente }
  ]);
  y += 5;

  if (cartaDeCorrecao) {
    y = blocoDeTexto(doc, 'Correção', evento.textoEvento, y, 225);
    if (evento.condicoesDeUso) blocoDeTexto(doc, 'Condições de uso', evento.condicoesDeUso, y, 0, 8.5);
  } else {
    blocoDeTexto(doc, cancelamento ? 'Justificativa' : 'Descrição', evento.textoEvento || evento.descricao, y, 150);
  }

  rodape(doc, opcoes?.textoRodape);
  doc.end();
  return doc;
}
