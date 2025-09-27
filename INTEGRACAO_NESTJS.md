# 🚀 Integração nfe-danfe-pdf com NestJS

Guia completo para integrar o pacote `nfe-danfe-pdf` em um projeto NestJS para geração de DANFE em PDF.

## 📦 1. Preparação do Pacote

### 1.1 Publicação (Opção 1 - NPM)

```bash
# No diretório do pacote nfe-danfe-pdf
cd c:\developer\trabalho\skilldigital\danfe-rapida\nfe-danfe-pdf
pnpm run build
npm publish --access public
```

### 1.2 Instalação Local (Opção 2 - Desenvolvimento)

```bash
# No diretório do pacote nfe-danfe-pdf
cd c:\developer\trabalho\skilldigital\danfe-rapida\nfe-danfe-pdf
pnpm run build
npm pack

# Isso gerará um arquivo: nfe-danfe-pdf-1.0.0.tgz
```

## 🏗️ 2. Configuração no Projeto NestJS

### 2.1 Instalação das Dependências

#### Se publicado no NPM:

```bash
npm install nfe-danfe-pdf
# ou
yarn add nfe-danfe-pdf
# ou
pnpm add nfe-danfe-pdf
```

#### Se usando pacote local:

```bash
# Copie o arquivo nfe-danfe-pdf-1.0.0.tgz para o projeto NestJS
npm install ./nfe-danfe-pdf-1.0.0.tgz
```

### 2.2 Instalação das Dependências de Tipos (se necessário)

```bash
npm install --save-dev @types/pdfkit @types/xml2js
```

## 🛠️ 3. Implementação no NestJS

### 3.1 Criação do Service

```typescript
// src/pdf/pdf.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { gerarPDF } from 'nfe-danfe-pdf';
import type { OpcoesPDF } from 'nfe-danfe-pdf';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  /**
   * Gera PDF da DANFE a partir de XML
   * @param xmlContent Conteúdo XML da NFe/NFCe
   * @param opcoes Opções para geração do PDF
   * @returns Buffer do PDF gerado
   */
  async gerarDanfePDF(xmlContent: string, opcoes?: OpcoesPDF): Promise<Buffer> {
    try {
      // Gerar o PDF usando o pacote nfe-danfe-pdf
      const pdfDoc = await gerarPDF(xmlContent, opcoes);

      // Converter para Buffer
      return new Promise((resolve, reject) => {
        const buffers: Buffer[] = [];

        pdfDoc.on('data', (chunk) => {
          buffers.push(chunk);
        });

        pdfDoc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        pdfDoc.on('error', (error) => {
          reject(error);
        });

        // Finalizar o documento
        pdfDoc.end();
      });
    } catch (error) {
      throw new BadRequestException(`Erro ao gerar PDF: ${error.message}`);
    }
  }

  /**
   * Gera PDF e salva em arquivo
   * @param xmlContent Conteúdo XML da NFe/NFCe
   * @param outputPath Caminho para salvar o arquivo
   * @param opcoes Opções para geração do PDF
   */
  async gerarDanfePDFArquivo(xmlContent: string, outputPath: string, opcoes?: OpcoesPDF): Promise<void> {
    const pdfBuffer = await this.gerarDanfePDF(xmlContent, opcoes);
    await fs.promises.writeFile(outputPath, pdfBuffer);
  }

  /**
   * Gera PDF com logo personalizado
   * @param xmlContent Conteúdo XML da NFe/NFCe
   * @param logoPath Caminho para o arquivo de logo
   * @returns Buffer do PDF gerado
   */
  async gerarDanfePDFComLogo(xmlContent: string, logoPath: string): Promise<Buffer> {
    // Verificar se o logo existe
    if (!fs.existsSync(logoPath)) {
      throw new BadRequestException('Arquivo de logo não encontrado');
    }

    const opcoes: OpcoesPDF = {
      pathLogo: logoPath,
      ajusteX: 0,
      ajusteY: 0
    };

    return this.gerarDanfePDF(xmlContent, opcoes);
  }
}
```

### 3.2 Criação do Controller

```typescript
// src/pdf/pdf.controller.ts
import { Controller, Post, Body, Res, UploadedFile, UseInterceptors, BadRequestException, Header } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('danfe')
  @Header('Content-Type', 'application/pdf')
  async gerarDanfe(@Body('xml') xmlContent: string, @Body('logoPath') logoPath?: string, @Res() res: Response) {
    if (!xmlContent) {
      throw new BadRequestException('Conteúdo XML é obrigatório');
    }

    try {
      const opcoes = logoPath ? { pathLogo: logoPath } : undefined;
      const pdfBuffer = await this.pdfService.gerarDanfePDF(xmlContent, opcoes);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="danfe.pdf"',
        'Content-Length': pdfBuffer.length.toString()
      });

      res.send(pdfBuffer);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('danfe/upload')
  @UseInterceptors(FileInterceptor('xmlFile'))
  @Header('Content-Type', 'application/pdf')
  async gerarDanfeUpload(@UploadedFile() file: Express.Multer.File, @Body('logoPath') logoPath?: string, @Res() res: Response) {
    if (!file) {
      throw new BadRequestException('Arquivo XML é obrigatório');
    }

    try {
      const xmlContent = file.buffer.toString('utf-8');
      const opcoes = logoPath ? { pathLogo: logoPath } : undefined;
      const pdfBuffer = await this.pdfService.gerarDanfePDF(xmlContent, opcoes);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="danfe.pdf"',
        'Content-Length': pdfBuffer.length.toString()
      });

      res.send(pdfBuffer);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('danfe/base64')
  async gerarDanfeBase64(@Body('xml') xmlContent: string, @Body('logoPath') logoPath?: string) {
    if (!xmlContent) {
      throw new BadRequestException('Conteúdo XML é obrigatório');
    }

    try {
      const opcoes = logoPath ? { pathLogo: logoPath } : undefined;
      const pdfBuffer = await this.pdfService.gerarDanfePDF(xmlContent, opcoes);

      return {
        success: true,
        data: {
          pdf: pdfBuffer.toString('base64'),
          size: pdfBuffer.length,
          mimeType: 'application/pdf'
        }
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
```

### 3.3 Criação do Module

```typescript
// src/pdf/pdf.module.ts
import { Module } from '@nestjs/common';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';

@Module({
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService] // Exportar para usar em outros módulos
})
export class PdfModule {}
```

### 3.4 Importar no App Module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { PdfModule } from './pdf/pdf.module';

@Module({
  imports: [
    PdfModule
    // outros módulos...
  ]
})
export class AppModule {}
```

## 📝 4. Exemplos de Uso

### 4.1 Via HTTP POST (JSON)

```bash
curl -X POST http://localhost:3000/pdf/danfe \
  -H "Content-Type: application/json" \
  -d '{
    "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
    "logoPath": "/path/to/logo.png"
  }' \
  --output danfe.pdf
```

### 4.2 Via Upload de Arquivo

```bash
curl -X POST http://localhost:3000/pdf/danfe/upload \
  -F "xmlFile=@caminho/para/arquivo.xml" \
  -F "logoPath=/path/to/logo.png" \
  --output danfe.pdf
```

### 4.3 Via Base64

```bash
curl -X POST http://localhost:3000/pdf/danfe/base64 \
  -H "Content-Type: application/json" \
  -d '{
    "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>..."
  }'
```

### 4.4 Uso Direto no Service

```typescript
// Em outro service/controller
import { Injectable } from '@nestjs/common';
import { PdfService } from './pdf/pdf.service';

@Injectable()
export class MyService {
  constructor(private pdfService: PdfService) {}

  async processarNFe(xmlContent: string): Promise<void> {
    // Gerar PDF
    const pdfBuffer = await this.pdfService.gerarDanfePDF(xmlContent);

    // Salvar arquivo
    await this.pdfService.gerarDanfePDFArquivo(xmlContent, './output/danfe.pdf');

    // Ou enviar por email, salvar no banco, etc.
  }
}
```

## ⚙️ 5. Configurações Opcionais

### 5.1 Interface de Opções

```typescript
// src/pdf/interfaces/pdf-options.interface.ts
export interface DanfePdfOptions {
  pathLogo?: string;
  ajusteX?: number;
  ajusteY?: number;
  outputPath?: string;
}
```

### 5.2 Middleware de Validação

```typescript
// src/pdf/middlewares/xml-validator.middleware.ts
import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class XmlValidatorMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.body.xml && typeof req.body.xml === 'string') {
      // Validação básica do XML
      if (!req.body.xml.includes('<?xml') || !req.body.xml.includes('NFe')) {
        throw new BadRequestException('XML inválido ou não é uma NFe');
      }
    }
    next();
  }
}
```

## 🧪 6. Testes

```typescript
// src/pdf/pdf.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';

describe('PdfService', () => {
  let service: PdfService;

  const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
  <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
    <!-- XML de exemplo -->
  </nfeProc>`;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService]
    }).compile();

    service = module.get<PdfService>(PdfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate PDF from XML', async () => {
    const pdfBuffer = await service.gerarDanfePDF(mockXml);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});
```

## 🔧 7. Troubleshooting

### 7.1 Problemas Comuns

**Erro de tipos TypeScript:**

```bash
npm install --save-dev @types/pdfkit @types/xml2js
```

**Erro de fontes não encontradas:**

- Certifique-se de que o diretório `lib/application/helpers/generate-pdf/fontes` existe
- Execute `npm run build` no pacote nfe-danfe-pdf

**Erro de memória com arquivos grandes:**

```typescript
// Configurar limite de memória no NestJS
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

### 7.2 Performance

```typescript
// Cache de PDFs gerados
import { Cache } from 'cache-manager';

@Injectable()
export class PdfService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async gerarDanfePDF(xmlContent: string): Promise<Buffer> {
    const hash = createHash('md5').update(xmlContent).digest('hex');

    let pdfBuffer = await this.cacheManager.get<Buffer>(hash);
    if (!pdfBuffer) {
      pdfBuffer = await this.generatePdf(xmlContent);
      await this.cacheManager.set(hash, pdfBuffer, 3600); // Cache 1h
    }

    return pdfBuffer;
  }
}
```

## 📋 8. Checklist de Implementação

- [ ] Instalar dependências
- [ ] Criar PdfService
- [ ] Criar PdfController
- [ ] Configurar PdfModule
- [ ] Importar no AppModule
- [ ] Testar endpoints
- [ ] Configurar validações
- [ ] Implementar tratamento de erros
- [ ] Adicionar logs
- [ ] Configurar testes
- [ ] Documentar API (Swagger)

---

✅ **Pronto!** Seu projeto NestJS agora pode gerar DANFEs em PDF usando o pacote `nfe-danfe-pdf`! 🎉
