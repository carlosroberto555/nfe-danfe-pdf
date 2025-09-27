# Tratamento de Informações Complementares Longas

## 📋 Visão Geral

Este documento explica como a biblioteca trata situações onde as **Informações Complementares** no XML contêm muito texto, garantindo que o PDF seja gerado corretamente sem quebras de layout ou texto cortado.

## 🔍 Problemas Identificados

Quando um XML NFe contém informações complementares extensas (como no exemplo com 572+ caracteres), os seguintes problemas podem ocorrer:

### 1. **Limitações de Espaço**
- Coluna "Informações Complementares": apenas **386px** de largura
- Coluna "Reservado ao Fisco": apenas **193px** de largura
- Fonte pequena (tamanho 6) pode causar texto ilegível

### 2. **Layout Inadequado**
- Texto contínuo sem quebras inteligentes
- Justificação forçada pode criar espaçamentos estranhos
- Altura fixa da seção pode cortar conteúdo

## ✅ Soluções Implementadas

### 1. **Quebra Inteligente de Texto**

```typescript
function quebrarTextoInteligente(texto: string, maxCaracteres: number): string[]
```

**Características:**
- **Prioriza separadores**: ` | `, ` - `, `: `, espaços, vírgulas, pontos
- **Evita palavras cortadas**: Só quebra em 70%+ da linha se encontrar separador
- **Múltiplas linhas**: Distribui conteúdo em várias linhas conforme necessário

### 2. **Altura Dinâmica da Seção**

```typescript
// Cálculo automático baseado no conteúdo
const linhasNecessarias = Math.ceil(textoCompleto.length / maxCaracteresPorLinha);
const alturaTexto = Math.max(1, linhasNecessarias) * alturaLinha;
const alturaMinima = finalEspacoDet + 25 + alturaTexto;
```

**Benefícios:**
- **Expansão automática**: Seção cresce conforme necessidade
- **Limite máximo**: Respeita limites da página (850px máximo)
- **Espaçamento adequado**: Mantém legibilidade entre linhas

### 3. **Tratamento Diferenciado por Coluna**

#### Coluna "Informações Complementares" (esquerda)
- **Largura**: 386px
- **Caracteres por linha**: ~90 caracteres
- **Campos incluídos**: `infAdFisco`, `infCpl`, `obsCont`, tributos, email

#### Coluna "Reservado ao Fisco" (direita)  
- **Largura**: 193px
- **Caracteres por linha**: ~45 caracteres
- **Campos incluídos**: `obsFisco`

## 📝 Exemplo de Processamento

### Entrada (XML)
```xml
<infCpl>Docnum: 0250381079 Cli: 0006613525 FFt: 4166 Emp: BR10 Org. Vendas: BRL1 / 06 / 00 Fvd: Remessa: 8510934814 Doct.Fat: 9947529570 N. Carga: BRAP005163 Parceiro 11416683 Pedido: 5518416663 *Boleto Anexo* Tax Perm 72.0000000 PedCli: 7556631 Base de Cálculo Reduzida - Termo de Acordo Decreto 7.799/2000 - Processo 342263/2018-7 Vol(M3): 0.161Valor Líquido: 1.232,81Redução da Base</infCpl>
<obsCont>
  <xCampo>FATURA</xCampo>
  <xTexto>Cond.Pagto: 07/14/21 Broker BR Venc: 16.08.25</xTexto>
</obsCont>
```

### Saída (PDF)
```
Linha 1: Inf. Contribuinte: Docnum: 0250381079 Cli: 0006613525 FFt: 4166 Emp: BR10 Org. |
Linha 2: Vendas: BRL1 / 06 / 00 Fvd: Remessa: 8510934814 Doct.Fat: 9947529570 N. Carga: |
Linha 3: BRAP005163 Parceiro 11416683 Pedido: 5518416663 *Boleto Anexo* Tax Perm |
Linha 4: 72.0000000 PedCli: 7556631 Base de Cálculo Reduzida - Termo de Acordo Decreto |
Linha 5: 7.799/2000 - Processo 342263/2018-7 Vol(M3): 0.161Valor Líquido: 1.232,81 |
Linha 6: FATURA: Cond.Pagto: 07/14/21 Broker BR Venc: 16.08.25
```

## ⚙️ Parâmetros Configuráveis

### Limites de Caracteres
```typescript
const maxCaracteresPorLinha = 90;      // Coluna esquerda
const maxCaracteresFisco = 45;         // Coluna direita
```

### Espaçamento
```typescript
const alturaLinha = 8;                 // Pixels entre linhas
const alturaMinima = finalEspacoDet + 25 + alturaTexto;
```

### Alinhamento
- **Textos longos**: `left` (mais legível)
- **Textos curtos**: `justify` (padrão original)

## 🎯 Benefícios da Solução

### ✅ **Compatibilidade**
- Funciona com XMLs de qualquer tamanho
- Mantém compatibilidade com layout existente
- Preserva formatação para textos curtos

### ✅ **Legibilidade**
- Quebras inteligentes respeitam palavras
- Alinhamento otimizado por contexto
- Espaçamento adequado entre linhas

### ✅ **Robustez**  
- Altura dinâmica evita cortes
- Limites máximos previnem problemas de layout
- Tratamento diferenciado por coluna

### ✅ **Conformidade**
- Segue Manual de Orientação do Contribuinte
- Inclui todos os campos obrigatórios
- Decodifica entidades HTML corretamente

## 🔧 Casos de Uso Suportados

1. **Texto curto** (< 90 caracteres): Layout tradicional
2. **Texto médio** (90-300 caracteres): 2-4 linhas com quebra inteligente  
3. **Texto longo** (300+ caracteres): Múltiplas linhas com altura dinâmica
4. **Texto muito longo**: Limitado a altura máxima da página

## 📊 Impacto na Performance

- **Pré-cálculo**: Determina espaço necessário antes de renderizar
- **Processamento otimizado**: Quebra texto apenas quando necessário
- **Memória eficiente**: Processa linha por linha
- **Sem impacto**: Performance mantida para casos normais

---

Esta implementação garante que **qualquer XML NFe será processado corretamente**, independentemente da quantidade de informações complementares, mantendo a qualidade e legibilidade do PDF gerado.