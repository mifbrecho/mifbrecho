import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { STORE, whatsappLink } from "@/lib/store-info";

// Só existem estas páginas; qualquer outro endereço vira "página não encontrada"
export const dynamicParams = false;

type InfoPage = {
  title: string;
  description: string;
  body: React.ReactNode;
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-lg font-semibold text-text">{children}</h2>;
}

const UPDATED = "24 de setembro de 2026";

const PAGES: Record<string, InfoPage> = {
  sobre: {
    title: "Sobre a MIF BRECHO",
    description:
      "Brechó online de Campo Grande - MS com peças únicas, selecionadas com carinho.",
    body: (
      <>
        <p>
          A MIF BRECHO é um brechó online de {STORE.city}. Selecionamos as peças
          com carinho para você encontrar roupas e acessórios cheios de estilo,
          com história e por um preço justo.
        </p>
        <p>
          Cada peça é única. Quando alguém leva, ela sai da loja. Por isso vale
          ficar de olho nas novidades e garantir a sua.
        </p>
        <div>
          <H2>Como funciona</H2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Escolha suas peças e coloque no carrinho.</li>
            <li>Faça o pagamento por Pix.</li>
            <li>Combinamos a entrega com você pelo WhatsApp.</li>
          </ol>
        </div>
        <p>
          Acompanhe as novidades no Instagram{" "}
          <a
            href={STORE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline"
          >
            {STORE.instagramHandle}
          </a>{" "}
          e tire suas dúvidas pelo WhatsApp.
        </p>
      </>
    ),
  },

  contato: {
    title: "Contato",
    description: "Fale com a MIF BRECHO pelo WhatsApp, Instagram ou e-mail.",
    body: (
      <>
        <p>Estamos por aqui para ajudar. Escolha o canal que preferir:</p>
        <ul className="space-y-3">
          <li>
            <strong className="text-text">WhatsApp:</strong>{" "}
            <a
              href={whatsappLink("Olá! Vim pelo site da MIF BRECHO.")}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline"
            >
              {STORE.whatsappDisplay}
            </a>
          </li>
          <li>
            <strong className="text-text">Instagram:</strong>{" "}
            <a
              href={STORE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline"
            >
              {STORE.instagramHandle}
            </a>
          </li>
          <li>
            <strong className="text-text">E-mail:</strong>{" "}
            <a
              href={`mailto:${STORE.email}`}
              className="font-semibold text-primary underline"
            >
              {STORE.email}
            </a>
          </li>
          <li>
            <strong className="text-text">Localização:</strong> {STORE.city}
          </li>
        </ul>
        <p>Respondemos assim que possível.</p>
      </>
    ),
  },

  entrega: {
    title: "Entrega",
    description:
      "Retirada ou motoboy em Campo Grande e envio pelos Correios em Mato Grosso do Sul.",
    body: (
      <>
        <div>
          <H2>Campo Grande - MS</H2>
          <p>
            Você pode <strong>retirar</strong> a peça com a gente ou receber por{" "}
            <strong>motoboy</strong>. O valor da entrega muda conforme o
            endereço e é combinado pelo WhatsApp depois que o pagamento é
            confirmado.
          </p>
        </div>
        <div>
          <H2>Outras cidades de Mato Grosso do Sul</H2>
          <p>
            Enviamos pelos <strong>Correios</strong>. O valor do frete é
            combinado pelo WhatsApp.
          </p>
        </div>
        <div>
          <H2>Outros estados</H2>
          <p>No momento, não fazemos entrega para fora de Mato Grosso do Sul.</p>
        </div>
        <div>
          <H2>Como funciona</H2>
          <p>
            Assim que o seu pagamento for confirmado, chamamos você no WhatsApp
            com os dados do pedido e combinamos a entrega e o prazo.
          </p>
        </div>
      </>
    ),
  },

  trocas: {
    title: "Trocas e devoluções",
    description: "Como funcionam trocas, devoluções e o direito de arrependimento.",
    body: (
      <>
        <p>
          Peças de brechó são únicas e já foram usadas. Por isso{" "}
          <strong>não fazemos troca por tamanho, cor ou gosto</strong>.
        </p>
        <div>
          <H2>Direito de arrependimento</H2>
          <p>
            Como a compra é feita pela internet, você pode desistir dela em até{" "}
            <strong>7 dias corridos</strong> depois de receber a peça, conforme o
            Código de Defesa do Consumidor (art. 49). Para isso, chame a gente
            pelo WhatsApp dentro desse prazo. A peça deve voltar nas mesmas
            condições em que foi enviada, e o valor pago é devolvido.
          </p>
        </div>
        <div>
          <H2>Peça diferente do anunciado</H2>
          <p>
            Se a peça chegar diferente do que foi mostrado ou com algum defeito
            que não estava descrito, fale com a gente em até 7 dias depois do
            recebimento, pelo WhatsApp, com fotos. Vamos resolver com você.
          </p>
        </div>
        <p>
          Combinamos a forma de devolução pelo WhatsApp:{" "}
          <a
            href={whatsappLink("Olá! Preciso de ajuda com um pedido da MIF BRECHO.")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline"
          >
            {STORE.whatsappDisplay}
          </a>
          .
        </p>
      </>
    ),
  },

  privacidade: {
    title: "Política de privacidade",
    description: "Como a MIF BRECHO cuida dos seus dados pessoais.",
    body: (
      <>
        <p>
          Esta página explica como a MIF BRECHO usa os seus dados, de acordo com
          a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018). Última
          atualização: {UPDATED}.
        </p>
        <div>
          <H2>Quem é responsável pelos seus dados</H2>
          <p>
            {STORE.legalName}, CPF {STORE.cpf}, {STORE.address}, responsável
            pela MIF BRECHO. Para qualquer assunto sobre os seus dados, fale
            pelo{" "}
            <a
              href={`mailto:${STORE.email}`}
              className="font-semibold text-primary underline"
            >
              {STORE.email}
            </a>{" "}
            ou pelo WhatsApp {STORE.whatsappDisplay}.
          </p>
        </div>
        <div>
          <H2>Quais dados coletamos</H2>
          <p>
            Nome, e-mail, telefone, endereço de entrega, pedidos e peças
            favoritas. A sua senha é guardada de forma protegida (criptografada)
            e nem a MIF BRECHO tem acesso a ela.
          </p>
        </div>
        <div>
          <H2>Para que usamos e por que podemos usar</H2>
          <p>
            Usamos os seus dados para criar a sua conta, processar pedidos e
            pagamentos, combinar a entrega e falar com você sobre o seu pedido.
            Isso é feito com base na execução do contrato de compra e venda
            entre você e a MIF BRECHO (art. 7º, V, da LGPD) — ou seja, são
            dados necessários para a compra acontecer, não pedimos consentimento
            à parte para isso.
          </p>
        </div>
        <div>
          <H2>Com quem compartilhamos e onde ficam guardados</H2>
          <p>
            Compartilhamos apenas com quem precisa para a compra acontecer: o
            Mercado Pago (para processar o Pix), o Supabase (banco de dados e
            login, empresa internacional com servidores fora do Brasil) e a
            Vercel (hospedagem do site, idem), além de quem faz a entrega
            (Correios ou motoboy). Esses serviços têm as próprias regras de
            segurança e privacidade. Não vendemos nem alugamos os seus dados
            para ninguém.
          </p>
        </div>
        <div>
          <H2>Por quanto tempo guardamos</H2>
          <p>
            Guardamos os seus dados enquanto sua conta existir. Dados de
            pedidos já pagos podem ser mantidos por mais tempo para cumprir
            obrigações fiscais e de defesa em caso de disputa, mesmo que você
            apague a conta.
          </p>
        </div>
        <div>
          <H2>Cookies</H2>
          <p>
            Usamos apenas cookies necessários para manter você logada e guardar
            o seu carrinho. Não usamos cookies de propaganda ou de rastreamento
            de terceiros.
          </p>
        </div>
        <div>
          <H2>Seus direitos</H2>
          <p>
            Você pode pedir para ver, corrigir, apagar ou pedir uma cópia dos
            seus dados a qualquer momento, conforme o art. 18 da LGPD. Basta
            escrever para{" "}
            <a
              href={`mailto:${STORE.email}`}
              className="font-semibold text-primary underline"
            >
              {STORE.email}
            </a>
            . Respondemos em até 15 dias.
          </p>
        </div>
        <div>
          <H2>Se algo der errado</H2>
          <p>
            Se você achar que seus dados não foram tratados corretamente, pode
            reclamar diretamente com a gente pelos canais acima, ou junto à
            Autoridade Nacional de Proteção de Dados (ANPD).
          </p>
        </div>
      </>
    ),
  },

  termos: {
    title: "Termos de uso",
    description: "Regras para usar o site e comprar na MIF BRECHO.",
    body: (
      <>
        <p>Ao usar o site e comprar na MIF BRECHO, você concorda com estas regras. Última atualização: {UPDATED}.</p>
        <div>
          <H2>Quem vende</H2>
          <p>
            A MIF BRECHO é operada por {STORE.legalName}, CPF {STORE.cpf}, com
            endereço em {STORE.address}, conforme exige o Decreto nº 7.962/2013
            (regras para lojas virtuais).
          </p>
        </div>
        <div>
          <H2>Quem pode comprar</H2>
          <p>
            É preciso ter 18 anos ou mais (ou ser emancipada) para criar uma
            conta e comprar na MIF BRECHO. Você é responsável por garantir que
            os dados informados no cadastro são verdadeiros.
          </p>
        </div>
        <div>
          <H2>Peças e preços</H2>
          <p>
            Todas as peças são únicas e usadas. Descrevemos e fotografamos cada
            uma com cuidado. Os preços são em reais. Se houver um erro evidente
            de preço, podemos corrigi-lo e falar com você antes de seguir com o
            pedido.
          </p>
        </div>
        <div>
          <H2>Pedidos e pagamento</H2>
          <p>
            O pagamento é feito por Pix. Ao gerar o Pix, a peça fica reservada
            por 30 minutos para você pagar. Passado esse tempo sem pagamento, o
            pedido é cancelado e a peça volta a ficar disponível para outras
            pessoas.
          </p>
        </div>
        <div>
          <H2>Entrega, trocas e devoluções</H2>
          <p>
            Veja as regras completas nas páginas{" "}
            <Link href="/entrega" className="font-semibold text-primary underline">
              Entrega
            </Link>{" "}
            e{" "}
            <Link href="/trocas" className="font-semibold text-primary underline">
              Trocas e devoluções
            </Link>
            .
          </p>
        </div>
        <div>
          <H2>Sua conta</H2>
          <p>
            Você é responsável por manter a sua senha em segurança e por
            informar dados corretos, principalmente o endereço de entrega.
          </p>
        </div>
        <div>
          <H2>Privacidade</H2>
          <p>
            Cuidamos dos seus dados conforme a nossa{" "}
            <Link href="/privacidade" className="font-semibold text-primary underline">
              Política de privacidade
            </Link>
            .
          </p>
        </div>
        <div>
          <H2>Responsabilidade</H2>
          <p>
            Fazemos o possível para descrever e fotografar as peças com
            fidelidade. Ainda assim, por serem peças usadas, pequenas variações
            de tom ou textura em relação à foto podem acontecer e não são
            consideradas defeito. A MIF BRECHO não se responsabiliza por atrasos
            causados por terceiros (Correios, motoboy) fora do nosso controle,
            mas ajuda você a resolver qualquer problema de entrega.
          </p>
        </div>
        <div>
          <H2>Se surgir algum problema</H2>
          <p>
            Primeiro, fale com a gente pelo WhatsApp{" "}
            <a
              href={whatsappLink("Olá! Preciso de ajuda com um pedido da MIF BRECHO.")}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline"
            >
              {STORE.whatsappDisplay}
            </a>{" "}
            — a maioria das coisas se resolve rápido assim. Se não for
            possível resolver diretamente, você também pode registrar uma
            reclamação em{" "}
            <a
              href="https://www.consumidor.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline"
            >
              consumidor.gov.br
            </a>{" "}
            ou no Procon da sua cidade.
          </p>
        </div>
        <div>
          <H2>Mudanças nestes termos</H2>
          <p>
            Podemos atualizar estes termos de vez em quando, principalmente se
            a lei mudar ou o site ganhar novas funcionalidades. A data da
            última atualização sempre aparece no topo desta página.
          </p>
        </div>
        <div>
          <H2>Legislação e foro</H2>
          <p>
            Estes termos seguem as leis brasileiras, especialmente o Código de
            Defesa do Consumidor. Em caso de disputa judicial, fica eleito o
            foro da comarca de {STORE.city}.
          </p>
        </div>
        <p>
          Dúvidas? Fale com a gente pelo{" "}
          <Link href="/contato" className="font-semibold text-primary underline">
            Contato
          </Link>
          .
        </p>
      </>
    ),
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug];

  if (!page) return {};

  return {
    title: `${page.title} | MIF BRECHO`,
    description: page.description,
  };
}

export default async function InfoPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = PAGES[slug];

  if (!page) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold text-text">{page.title}</h1>

        <div className="mt-6 space-y-6 leading-relaxed text-text-muted">
          {page.body}
        </div>
      </main>
    </div>
  );
}
