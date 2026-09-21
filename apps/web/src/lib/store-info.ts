/** Dados da loja usados no site inteiro (rodapé, páginas, WhatsApp...). */
export const STORE = {
  name: "MIF BRECHO",
  siteUrl: "https://www.mifbrecho.com.br",
  whatsappNumber: "5567992701345", // 55 + DDD + número
  whatsappDisplay: "(67) 99270-1345",
  instagramUrl: "https://www.instagram.com/mifbrecho_",
  instagramHandle: "@mifbrecho_",
  email: "mifbrecho@gmail.com",
  city: "Campo Grande - MS",
} as const;
 
/** Link do WhatsApp. Sem número, abre o WhatsApp para escolher o contato. */
export function whatsappLink(message?: string, number: string = STORE.whatsappNumber) {
  const base = number ? `https://wa.me/${number}` : "https://wa.me/";
 
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
 
/** Transforma um telefone digitado pela cliente (ex.: 67 99999-9999) no formato do WhatsApp. */
export function phoneToWhatsappNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
 
  const digits = phone.replace(/\D/g, "");
 
  if (digits.length < 10) return null;
 
  return digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
}
