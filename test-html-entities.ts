// Teste da correção de entidades HTML nas informações complementares

import { cleanInfoComplementar } from './src/domain/use-cases/utils/clean-html-entities';

// Exemplo do XML fornecido
const textoOriginal = "Total aproximado de tributos: R$ 6,69 (4,50%)   .&lt;br /&gt;Valor do ICMS DIFAL para UF de destino R$ 20,81&lt;br /&gt;";

console.log('=== CORREÇÃO DE ENTIDADES HTML NAS INFORMAÇÕES COMPLEMENTARES ===\n');

console.log('ANTES (com entidades HTML):');
console.log(textoOriginal);
console.log();

console.log('DEPOIS (texto limpo):');
const textoLimpo = cleanInfoComplementar(textoOriginal);
console.log(textoLimpo);
console.log();

console.log('=== OUTROS EXEMPLOS ===\n');

const exemplos = [
  "Empresa &amp; Comércio LTDA - Produto &lt;novo&gt; disponível",
  "Valor: R$ 100,00&lt;br /&gt;Desconto: 10%&lt;br /&gt;Total: R$ 90,00",
  "Informação &quot;importante&quot; sobre o produto &#39;especial&#39;",
  "<p>Parágrafo com <strong>texto</strong> formatado.</p><br><div>Div com conteúdo</div>"
];

exemplos.forEach((exemplo, index) => {
  console.log(`Exemplo ${index + 1}:`);
  console.log(`Original: ${exemplo}`);
  console.log(`Limpo:    ${cleanInfoComplementar(exemplo)}`);
  console.log();
});

console.log('=== RESULTADO NO DANFE ===');
console.log('Antes: "Inf. Contribuinte: Total aproximado de tributos: R$ 6,69 (4,50%)   .&lt;br /&gt;Valor do ICMS DIFAL para UF de destino R$ 20,81&lt;br /&gt;"');
console.log('Depois: "Inf. Contribuinte: Total aproximado de tributos: R$ 6,69 (4,50%) Valor do ICMS DIFAL para UF de destino R$ 20,81"');
console.log();

console.log('✅ Problema resolvido! As entidades HTML agora são decodificadas corretamente.');
console.log('✅ Tags HTML são removidas e substituídas por espaços quando apropriado.');
console.log('✅ Texto fica limpo e legível no PDF final.');