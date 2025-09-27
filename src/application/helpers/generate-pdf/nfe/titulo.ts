import type { GeneratePdf } from '../../../../types';
import { DEFAULT_NFE } from './default';

export function titulo({
  doc,
  largura,
  value,
  x,
  y,
  margemEsquerda,
  margemTopo,
  ajusteX,
  ajusteY,
  alinhamento,
  tamanho
}: GeneratePdf.InputTitulo): void {
  const alignValue = (alinhamento ?? DEFAULT_NFE.alinhamentoDoTitulo) as 'left' | 'center' | 'right' | 'justify' | undefined;

  x = margemEsquerda + ajusteX + x;
  y = margemTopo + ajusteY + y;
  doc
    .font('normal')
    .fillColor(DEFAULT_NFE.corDoTitulo)
    .fontSize(tamanho ?? DEFAULT_NFE.tamanhoDaFonteDoTitulo)
    .text(value.toUpperCase(), x, y, {
      width: largura,
      align: alignValue
    });
}
