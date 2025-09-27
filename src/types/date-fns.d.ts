// Tipos locais para date-fns v4.1.0
declare module 'date-fns' {
  export function format(date: Date, format: string, options?: any): string;
  export function parseISO(dateString: string): Date;
  // Adicionar outras funções conforme necessário
}
