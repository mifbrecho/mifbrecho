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

const UPDATED = "20 de setembro de 2026";

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
          a Lei Geral de Proteção de Dados (LGPD). Última atualização:{" "}
          {UPDATED}.
        </p>
        <div>
          <H2>Quais dados coletamos</H2>
          <p>
            Nome, e-mail, telefone, endereço de entrega, pedidos e peças
            favoritas. A sua senha é guardada de forma protegida.
          </p>
        </div>
        <div>
          <H2>Para que usamos</H2>
          <p>
            Para criar a sua conta, processar pedidos e pagamentos, combinar a
            entrega e falar com você sobre o seu pedido.
          </p>
        </div>
        <div>
          <H2>Com quem compartilhamos</H2>
          <p>
            Apenas com quem precisa para a compra acontecer: os serviços que
            mantêm o site funcionando (hospedagem, banco de dados e envio de
            e-mails), o serviço de pagamento por Pix e quem faz a entrega
            (Correios ou motoboy). Não vendemos os seus dados.
          </p>
        </div>
        <div>
          <H2>Cookies</H2>
          <p>
            Usamos apenas cookies necessários para manter você logada e guardar
            o seu carrinho.
          </p>
        </div>
        <div>
          <H2>Seus direitos</H2>
          <p>
            Você pode pedir para ver, corrigir ou apagar os seus dados a
            qualquer momento. Basta escrever para{" "}
            <a
              href={`mailto:${STORE.email}`}
              className="font-semibold text-primary underline"
            >
              {STORE.email}
            </a>
            .
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
