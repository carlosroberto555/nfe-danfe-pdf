import fs from 'fs';
import path from 'path';
import { gerarPDF } from '../src';

async function gerarPDFTeste(
  nomeArquivo: string,
  opcoes: { pathLogo?: string; cancelada?: boolean; textoRodape?: string } = {}
): Promise<void> {
  const pathDoArquivoPdf = path.join(process.cwd(), nomeArquivo);
  const pathDoArquivoXml = path.join(__dirname, 'arquivos', 'arquivo-xml.xml');
  const pathLogo = path.join(__dirname, 'arquivos', 'logo.png');
  const xmlNFe = fs.readFileSync(pathDoArquivoXml).toString();

  console.log(`Gerando ${nomeArquivo}...`);
  const pdf = await gerarPDF(xmlNFe, { pathLogo, ...opcoes });
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
    // Teste 1: DANFE básico
    await gerarPDFTeste('danfe-basico.pdf');

    // Teste 2: DANFE com nota cancelada
    await gerarPDFTeste('danfe-cancelada.pdf', { cancelada: true });

    // Teste 3: DANFE com rodapé personalizado
    await gerarPDFTeste('danfe-rodape-personalizado.pdf', {
      textoRodape: 'Meu Sistema Danfe'
    });

    // Teste 4: DANFE completo (com logo, rodapé e nota cancelada)
    await gerarPDFTeste('danfe-completo.pdf', {
      cancelada: false,
      textoRodape: 'Meu Sistema Danfe'
    });

    // Teste 5: DANFE apenas com data/hora (sem texto personalizado)
    await gerarPDFTeste('danfe-sem-rodape-personalizado.pdf', {
      cancelada: false
      // textoRodape não definido intencionalmente
    });

    console.log('\n🎉 Todos os testes executados com sucesso!');
    console.log('\nArquivos gerados:');
    console.log('- danfe-basico.pdf');
    console.log('- danfe-cancelada.pdf');
    console.log('- danfe-rodape-personalizado.pdf');
    console.log('- danfe-completo.pdf');
    console.log('- danfe-sem-rodape-personalizado.pdf');
  } catch (error) {
    console.error('❌ Erro durante execução dos testes:', error);
    process.exit(1);
  }
}

// Executar testes
executarTestes();
