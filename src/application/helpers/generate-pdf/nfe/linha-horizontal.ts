import type { GeneratePdf } from '../../../../types';

export function linhaHorizontal({
  ajusteX,
  ajusteY,
  doc,
  x1,
  x2,
  y,
  margemDireita,
  margemEsquerda,
  margemTopo,
  tracejada = false
}: GeneratePdf.InputLinhaHorizontal): void {
  y = margemTopo + ajusteY + y;
  x1 = margemEsquerda + ajusteX + x1;
  x2 = margemDireita + ajusteX + x2;

  if (tracejada) {
    doc
      .lineWidth(0.5) // Linha mais fina para elegância
      .moveTo(x1, y)
      .lineTo(x2, y)
      .dash(3, { space: 5 })
      .stroke()
      .undash()
      .lineWidth(1); // Restaurar espessura padrão
  } else {
    doc
      .lineWidth(0.5) // Linha mais fina para elegância
      .moveTo(x1, y)
      .lineTo(x2, y)
      .stroke()
      .lineWidth(1); // Restaurar espessura padrão
  }
}
