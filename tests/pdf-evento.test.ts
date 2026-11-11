import fs from 'fs';
import path from 'path';
import { gerarPdfEvento } from '../src';

async function gerarPdfEventoTeste(nomeArquivo: string, arquivoEvento: string): Promise<void> {
  const pathDoArquivoPdf = path.join(process.cwd(), nomeArquivo);
  const xmlEvento = fs.readFileSync(path.join(__dirname, 'arquivos', arquivoEvento)).toString();
  const xmlNFe = fs.readFileSync(path.join(__dirname, 'arquivos', 'evento-nfe.xml')).toString();
  const pathLogo = path.join(__dirname, 'arquivos', 'logo.png');

  console.log(`Gerando ${nomeArquivo}...`);
  const pdf = await gerarPdfEvento(xmlEvento, { xmlNFe, pathLogo });
  pdf.pipe(fs.createWriteStream(pathDoArquivoPdf));

  return new Promise((resolve, reject) => {
    pdf.on('end', () => {
      console.log(`✅ ${nomeArquivo} gerado com sucesso!`);
      resolve();
    });
    pdf.on('error', reject);
  });
}

async function executarTestes(): Promise<void> {
  try {
    await gerarPdfEventoTeste('evento-carta-correcao.pdf', 'evento-cce.xml');
    await gerarPdfEventoTeste('evento-cancelamento.pdf', 'evento-cancelamento.xml');
  } catch (error) {
    console.error('❌ Erro ao gerar PDF de evento:', error);
    process.exit(1);
  }
}

void executarTestes();
