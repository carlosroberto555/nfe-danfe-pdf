# 🚀 Exemplo Rápido - Integração nfe-danfe-pdf com NestJS

Guia prático com código pronto para integrar o pacote `nfe-danfe-pdf` no seu projeto NestJS.

---

## 📦 1. Instalação

### Opção A: Pacote Publicado no NPM

```bash
npm install nfe-danfe-pdf
npm install --save-dev @types/pdfkit @types/xml2js
```

### Opção B: Instalação Local (Desenvolvimento)

```bash
# 1. No diretório do pacote nfe-danfe-pdf
cd c:\developer\trabalho\skilldigital\danfe-rapida\nfe-danfe-pdf
pnpm run build
npm pack

# 2. No seu projeto NestJS
npm install ./nfe-danfe-pdf-1.0.0.tgz
npm install --save-dev @types/pdfkit @types/xml2js
```

---

## 🛠️ 2. Service

Crie o arquivo `src/danfe/danfe.service.ts`:

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { gerarPDF } from 'nfe-danfe-pdf';

@Injectable()
export class DanfeService {
  async gerarDanfePDF(xmlContent: string, logoPath?: string): Promise<Buffer> {
    try {
      const opcoes = logoPath ? { pathLogo: logoPath } : undefined;
      const pdfDoc = await gerarPDF(xmlContent, opcoes);

      return new Promise((resolve, reject) => {
        const buffers: Buffer[] = [];

        pdfDoc.on('data', (chunk) => buffers.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(buffers)));
        pdfDoc.on('error', reject);

        pdfDoc.end();
      });
    } catch (error) {
      throw new BadRequestException(`Erro ao gerar PDF: ${error.message}`);
    }
  }
}
```

---

## 🎯 3. Controller

Crie o arquivo `src/danfe/danfe.controller.ts`:

```typescript
import { Controller, Post, Body, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { DanfeService } from './danfe.service';

@Controller('danfe')
export class DanfeController {
  constructor(private readonly danfeService: DanfeService) {}

  @Post('gerar')
  async gerarDanfe(@Body('xml') xmlContent: string, @Body('logoPath') logoPath?: string, @Res() res: Response) {
    if (!xmlContent) {
      throw new BadRequestException('XML é obrigatório');
    }

    const pdfBuffer = await this.danfeService.gerarDanfePDF(xmlContent, logoPath);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="danfe.pdf"'
    });

    res.send(pdfBuffer);
  }

  @Post('base64')
  async gerarDanfeBase64(@Body('xml') xmlContent: string, @Body('logoPath') logoPath?: string) {
    if (!xmlContent) {
      throw new BadRequestException('XML é obrigatório');
    }

    const pdfBuffer = await this.danfeService.gerarDanfePDF(xmlContent, logoPath);

    return {
      success: true,
      pdf: pdfBuffer.toString('base64'),
      size: pdfBuffer.length
    };
  }
}
```

---

## 📋 4. Module

Crie o arquivo `src/danfe/danfe.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DanfeController } from './danfe.controller';
import { DanfeService } from './danfe.service';

@Module({
  controllers: [DanfeController],
  providers: [DanfeService],
  exports: [DanfeService]
})
export class DanfeModule {}
```

---

## 🏠 5. App Module

Atualize o arquivo `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DanfeModule } from './danfe/danfe.module';

@Module({
  imports: [DanfeModule]
  // ... outros imports
})
export class AppModule {}
```

---

## 🧪 6. Teste Rápido

### Iniciar aplicação

```bash
npm run start:dev
```

### Teste com curl

```bash
# Gerar PDF direto
curl -X POST http://localhost:3000/danfe/gerar \
  -H "Content-Type: application/json" \
  -d '{
    "xml": "<?xml version=\"1.0\"?>...[SEU XML AQUI]..."
  }' \
  --output danfe.pdf

# Gerar Base64
curl -X POST http://localhost:3000/danfe/base64 \
  -H "Content-Type: application/json" \
  -d '{
    "xml": "<?xml version=\"1.0\"?>...[SEU XML AQUI]..."
  }'
```

---

## 💡 7. Exemplo de Uso em Outro Service

```typescript
import { Injectable } from '@nestjs/common';
import { DanfeService } from '../danfe/danfe.service';
import * as fs from 'fs';

@Injectable()
export class NotaFiscalService {
  constructor(private danfeService: DanfeService) {}

  async processarNFe(xmlContent: string): Promise<string> {
    // Gerar PDF
    const pdfBuffer = await this.danfeService.gerarDanfePDF(xmlContent);

    // Salvar arquivo
    const nomeArquivo = `danfe-${Date.now()}.pdf`;
    const caminhoCompleto = `./uploads/${nomeArquivo}`;

    await fs.promises.writeFile(caminhoCompleto, pdfBuffer);

    return caminhoCompleto;
  }
}
```

---

## 📊 8. Upload de Arquivo (Opcional)

Adicione no `DanfeController`:

```typescript
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Post('upload')
@UseInterceptors(FileInterceptor('xmlFile'))
async gerarDanfeUpload(
  @UploadedFile() file: Express.Multer.File,
  @Res() res: Response
) {
  if (!file) {
    throw new BadRequestException('Arquivo XML é obrigatório');
  }

  const xmlContent = file.buffer.toString('utf-8');
  const pdfBuffer = await this.danfeService.gerarDanfePDF(xmlContent);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="danfe.pdf"',
  });

  res.send(pdfBuffer);
}
```

---

## 🔧 9. Configurações Adicionais

### Configurar limites para arquivos grandes

No arquivo `src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar limite para arquivos grandes
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  await app.listen(3000);
}
bootstrap();
```

### Validação de XML

Adicione no `DanfeService`:

```typescript
private validarXML(xmlContent: string): void {
  if (!xmlContent.includes('<?xml')) {
    throw new BadRequestException('Conteúdo não é um XML válido');
  }

  if (!xmlContent.includes('NFe') && !xmlContent.includes('NFCe')) {
    throw new BadRequestException('XML não contém dados de NFe ou NFCe');
  }
}

async gerarDanfePDF(xmlContent: string, logoPath?: string): Promise<Buffer> {
  this.validarXML(xmlContent);
  // ... resto do código
}
```

---

## ✅ 10. Checklist de Implementação

- [ ] Instalar dependências (`nfe-danfe-pdf` + tipos)
- [ ] Criar `DanfeService`
- [ ] Criar `DanfeController`
- [ ] Criar `DanfeModule`
- [ ] Importar `DanfeModule` no `AppModule`
- [ ] Configurar middleware para arquivos grandes
- [ ] Testar endpoint `/danfe/gerar`
- [ ] Testar endpoint `/danfe/base64`
- [ ] Implementar validações
- [ ] Adicionar logs
- [ ] Configurar testes

---

## 🎯 Resumo Rápido

| Passo | Ação       | Arquivo                         |
| ----- | ---------- | ------------------------------- |
| 1     | Instalar   | `npm install nfe-danfe-pdf`     |
| 2     | Service    | `src/danfe/danfe.service.ts`    |
| 3     | Controller | `src/danfe/danfe.controller.ts` |
| 4     | Module     | `src/danfe/danfe.module.ts`     |
| 5     | Import     | `src/app.module.ts`             |
| 6     | Testar     | `POST /danfe/gerar`             |

---

## 🚀 Resultado Final

Seu projeto NestJS agora pode:

- ✅ **Gerar DANFEs em PDF** para NFe (modelo 55) e NFCe (modelo 65)
- ✅ **Usar logo personalizado** via parâmetro `logoPath`
- ✅ **Retornar PDF direto** ou em **Base64**
- ✅ **Upload de arquivos XML**
- ✅ **Layout otimizado** FATURA/DUPLICATA com células dinâmicas
- ✅ **Validação robusta** de XML
- ✅ **Tratamento de erros** adequado

---

> **💡 Dica**: Para produção, considere adicionar logs estruturados, cache de PDFs, rate limiting, documentação Swagger e testes unitários/integração.
