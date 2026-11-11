export type DadosEmitenteEvento = {
  nome?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  endereco?: string;
  municipioUf?: string;
  telefone?: string;
};

export type DadosDestinatarioEvento = {
  nome?: string;
  documento?: string;
  inscricaoEstadual?: string;
};

export type RetornoEvento = {
  cStat?: string;
  xMotivo?: string;
  nProt?: string;
  dhRegEvento?: string;
};

export type OpcoesPdfEvento = {
  xmlNFe?: string;
  pathLogo?: string;
  emitente?: DadosEmitenteEvento;
  destinatario?: DadosDestinatarioEvento;
  retorno?: RetornoEvento;
  textoRodape?: string;
};
