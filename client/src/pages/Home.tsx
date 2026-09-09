import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Screen = 1 | 3 | 4 | 5 | 6 | 7 | 21;
type SceneId = "reencontro" | "abracojesus" | "reencontronuvens" | "anjopraia";

type Scene = {
  id: SceneId;
  title: string;
  video: string;
  poster: string;
  onePhoto?: boolean;
};

type PixChargeResponse = {
  txid: string;
  pixCopiaECola: string;
  qrCodeDataUrl: string;
  expiresInSeconds: number;
};

const STORAGE = "/assets/";

const assets = {
  logo: `${STORAGE}eterniza-logo_96cbd70a.webp`,
  templates: `${STORAGE}templates-grid-eterniza_1add5e2f.webp`,
  checkoutHero: `${STORAGE}checkout-hero-reencontro_4128d645.webp`,
  shield: `${STORAGE}guarantee-shield_ecb7fe5b.png`,
  proof: [
    `${STORAGE}proof-1_c6c84d3b.webp`,
    `${STORAGE}proof-2_20235087.webp`,
    `${STORAGE}proof-3_b882ca04.webp`,
    `${STORAGE}proof-4_522a3b6a.webp`,
  ],
  exampleVideo: `${STORAGE}exemplo-reencontro_005a1359.mp4`,
  examplePoster: `${STORAGE}exemplo-reencontro-poster_7afdac36.webp`,
};

const TICKET_VALUES = [12.9, 14.97, 19.9, 24.9, 27.96];
const SERVICE_FEE = 0.96;
const ORIGINAL_PRICE = 54;

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const scenes: Scene[] = [
  {
    id: "reencontro",
    title: "A escadaria dourada",
    video: `${STORAGE}estilo-escadaria-nuvens_9cb6e8a1.mp4`,
    poster: `${STORAGE}estilo-escadaria-nuvens-poster_56948478.webp`,
  },
  {
    id: "abracojesus",
    title: "O abraço com Jesus",
    video: `${STORAGE}estilo-jesus-v2_bf4fca79.mp4`,
    poster: `${STORAGE}estilo-jesus-v2-poster_163a61af.webp`,
    onePhoto: true,
  },
  {
    id: "reencontronuvens",
    title: "O abraço nas nuvens",
    video: `${STORAGE}estilo-nuvens_3d1b3e0f.mp4`,
    poster: `${STORAGE}estilo-nuvens-poster_be0659e3.webp`,
  },
  {
    id: "anjopraia",
    title: "O anjo na praia",
    video: `${STORAGE}estilo-praia_6a39fbbf.mp4`,
    poster: `${STORAGE}estilo-praia-poster_a9424818.webp`,
  },
];

function screenClass(screen: Screen, current: Screen, extra = "") {
  return `screen ${screen === current ? "is-active" : ""} ${extra}`.trim();
}

function ProofCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [leavingIndex, setLeavingIndex] = useState<number | null>(null);
  const [sliding, setSliding] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((index) => {
        setLeavingIndex(index);
        setSliding(true);
        window.setTimeout(() => {
          setLeavingIndex(null);
          setSliding(false);
        }, 1150);
        return (index + 1) % assets.proof.length;
      });
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="carousel carousel--proof" aria-label="Depoimentos reais">
      <div className="carousel__track">
        {sliding && leavingIndex !== null && <div className="carousel__slide is-center proof-slide-out" key={`out-${assets.proof[leavingIndex]}`}><img src={assets.proof[leavingIndex]} alt="Depoimento real" loading="eager" decoding="async" /></div>}
        <div className={`carousel__slide is-center ${sliding ? "proof-slide-in" : "proof-slide-still"}`} key={`in-${assets.proof[activeIndex]}`}><img src={assets.proof[activeIndex]} alt="Depoimento real" loading="eager" decoding="async" /></div>
      </div>
    </div>
  );
}

function FakeQr() {
  const pattern = [
    "1111111001011111111",
    "1000001010011000001",
    "1011101011111011101",
    "1011101000011011101",
    "1011101011011011101",
    "1000001010111000001",
    "1111111010101111111",
    "0000000011110000000",
    "1011011100111011011",
    "0100110011001100100",
    "1110101110111011110",
    "0011010001100010110",
    "1100111110011101011",
    "0000000110100011000",
    "1111110011111110101",
    "1000001010000010011",
    "1011101110111011101",
    "1011101001101010010",
    "1011101110011111011",
    "1000001001110001100",
    "1111111010101011111",
  ];
  return (
    <svg className="fake-qr-svg" viewBox="0 0 21 21" role="img" aria-label="QR Code PIX">
      <rect width="21" height="21" fill="#fff" />
      {pattern.flatMap((row, y) =>
        row.split("").map((cell, x) => cell === "1" && <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#111" />),
      )}
    </svg>
  );
}

function ContactModal({
  open,
  email,
  whatsapp,
  onEmail,
  onWhatsapp,
  onClose,
  onSubmit,
  submitting,
  submitError,
}: {
  open: boolean;
  email: string;
  whatsapp: string;
  onEmail: (value: string) => void;
  onWhatsapp: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | boolean;
}) {
  const valid = /.+@.+\..+/.test(email) && whatsapp.replace(/\D/g, "").length === 11;
  return (
    <div className={`ctt ${open ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="cttTit">
      <div className="ctt__cx">
        <button className="ctt__x" type="button" onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <h2 className="ctt__t" id="cttTit">
          Pra onde enviamos o seu vídeo?
        </h2>
        <p className="ctt__s">Mandamos uma cópia no seu WhatsApp.</p>
        <input
          className="email-input"
          type="email"
          value={email}
          onChange={(event) => onEmail(event.target.value)}
          placeholder="Seu e-mail"
          autoComplete="email"
          inputMode="email"
        />
        <input
          className="email-input"
          type="tel"
          value={whatsapp}
          onChange={(event) => onWhatsapp(formatWhatsapp(event.target.value))}
          placeholder="Seu WhatsApp (com DDD)"
          autoComplete="tel"
          inputMode="tel"
          maxLength={15}
        />
        {submitError && <p className="ctt__error" role="alert">{typeof submitError === "string" ? submitError : "Não foi possível gerar seu PIX. Tente novamente."}</p>}
        <button className={`cta cta--inline cta--subscribe ${valid ? "" : "is-disabled"}`} type="button" disabled={!valid || submitting} onClick={onSubmit}>
          {submitting ? "GERANDO SEU PIX…" : "GERAR MEU PIX"}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>(21);
  const [selectedScene, setSelectedScene] = useState<SceneId>("reencontro");
  const [hasChosenScene, setHasChosenScene] = useState(false);
  const [photoA, setPhotoA] = useState<string | null>(null);
  const [photoB, setPhotoB] = useState<string | null>(null);
  const [photoAFile, setPhotoAFile] = useState<File | null>(null);
  const [photoBFile, setPhotoBFile] = useState<File | null>(null);
  const [progress, setProgress] = useState([0, 0, 0]);
  const [contactOpen, setContactOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [pixVisible, setPixVisible] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [ticketPrice, setTicketPrice] = useState(27.96);
  const [showBottomCta, setShowBottomCta] = useState(false);
  const [loadingTitleIndex, setLoadingTitleIndex] = useState(2);
  const [countdownSeconds, setCountdownSeconds] = useState(900);
  const [pixCode, setPixCode] = useState("");
  const [pixQrCode, setPixQrCode] = useState("");
  const [pixTxid, setPixTxid] = useState("");
  const [creatingCharge, setCreatingCharge] = useState(false);
  const [chargeError, setChargeError] = useState<string | boolean>(false);
  const [chargePaid, setChargePaid] = useState(false);

  const scene = useMemo(() => scenes.find((item) => item.id === selectedScene) ?? scenes[0], [selectedScene]);
  const discount = ORIGINAL_PRICE - SERVICE_FEE - ticketPrice;
  const discountPercent = Math.round((discount / ORIGINAL_PRICE) * 100);
  const canCreate = scene.onePhoto ? Boolean(photoA) : Boolean(photoA && photoB);

  useEffect(() => {
    if (!pixTxid) return;
    let cancelled = false;
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/pix/status/${encodeURIComponent(pixTxid)}`, { credentials: "same-origin" });
        if (!response.ok) return;
        const data = await response.json() as { paid?: boolean };
        if (!cancelled && data.paid) {
          setChargePaid(true);
          setScreen(7);
        }
      } catch {
        // A temporary status failure does not interrupt checkout.
      }
    };
    void checkStatus();
    const timer = window.setInterval(checkStatus, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pixTxid]);

  useEffect(() => {
    const active = document.querySelector<HTMLElement>(".screen.is-active .screen__scroll");
    active?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setShowBottomCta(false);
  }, [screen, pixVisible]);

  useEffect(() => {
    if (screen !== 6 || pixVisible) {
      setShowBottomCta(false);
      return;
    }
    const scrollArea = document.querySelector<HTMLElement>("#screen-6 .screen__scroll");
    if (!scrollArea) return;
    const onScroll = () => setShowBottomCta(scrollArea.scrollTop > 180);
    onScroll();
    scrollArea.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollArea.removeEventListener("scroll", onScroll);
  }, [screen, pixVisible]);

  useEffect(() => {
    if (screen !== 3) return;
    setLoadingTitleIndex(2);
    setProgress([0, 0, 0]);
    const titleTimer = window.setInterval(() => setLoadingTitleIndex((index) => (index + 1) % 3), 1250);
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      setProgress([Math.min(100, step * 8), Math.min(100, Math.max(0, (step - 3) * 9)), Math.min(100, Math.max(0, (step - 7) * 12))]);
      if (step >= 13) {
        window.clearInterval(timer);
        window.setTimeout(() => {
          setScreen(6);
        }, 380);
      }
    }, 170);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(titleTimer);
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== 6) return;
    setCountdownSeconds(900);
    const timer = window.setInterval(() => setCountdownSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (screen !== 21) return;
    const videos = document.querySelectorAll<HTMLVideoElement>("#screen-21 video");
    const timers = Array.from(videos, (video) => window.setTimeout(() => {
      video.load();
      video.play().catch(() => undefined);
    }, 0));
    return () => timers.forEach(window.clearTimeout);
  }, [screen]);

  useEffect(() => {
    let cancelled = false;
    const assignTicket = (seed: string) => {
      let hash = 0;
      for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) | 0;
      if (!cancelled) setTicketPrice(TICKET_VALUES[Math.abs(hash) % TICKET_VALUES.length]);
    };

    const saved = window.localStorage.getItem("etz-ticket-seed");
    if (saved) {
      assignTicket(saved);
      return () => { cancelled = true; };
    }

    fetch("https://api.ipify.org?format=json")
      .then((response) => response.json() as Promise<{ ip?: string }>)
      .then((data) => {
        const seed = data.ip || `${navigator.userAgent}-${window.screen.width}`;
        window.localStorage.setItem("etz-ticket-seed", seed);
        assignTicket(seed);
      })
      .catch(() => assignTicket(`${navigator.userAgent}-${window.screen.width}-${window.screen.height}`));

    return () => { cancelled = true; };
  }, []);

  const onFile = (which: "a" | "b") => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (which === "a") {
      setPhotoA(url);
      setPhotoAFile(file);
    } else {
      setPhotoB(url);
      setPhotoBFile(file);
    }
  };

  const chooseScene = (id: SceneId) => {
    setSelectedScene(id);
    setHasChosenScene(true);
    if (id === "abracojesus") {
      setPhotoB(null);
      setPhotoBFile(null);
    }
    setScreen(1);
  };

  const submitContact = async () => {
    window.localStorage.setItem("etz-contact", JSON.stringify({ email, whatsapp, createdAt: new Date().toISOString() }));
    setCreatingCharge(true);
    setChargeError(false);
    try {
      const response = await fetch("/api/pix/create", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: ticketPrice, email, whatsapp }),
      });
      const payload = await response.json() as Partial<PixChargeResponse> & { detail?: string; providerStatus?: number | null };
      if (!response.ok) throw new Error(payload.detail ? `Efí: ${payload.detail}${payload.providerStatus ? ` (HTTP ${payload.providerStatus})` : ""}` : "Não foi possível gerar seu PIX. Tente novamente.");
      const charge = payload as PixChargeResponse;
      setPixCode(charge.pixCopiaECola);
      setPixQrCode(charge.qrCodeDataUrl);
      setPixTxid(charge.txid);
      setCountdownSeconds(charge.expiresInSeconds);
      setContactOpen(false);
      setPixVisible(true);
    } catch (error) {
      setChargeError(error instanceof Error ? error.message : true);
    } finally {
      setCreatingCharge(false);
    }
  };

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
    } catch {
      // Clipboard permission is optional in previews; the visible state still confirms the action.
    }
    setPixCopied(true);
  };

  const loadingTitles = ["Reconhecendo os dois rostos...", "preparando o encontro...", "Criando o abraço…"];
  const minutes = String(Math.floor(countdownSeconds / 60)).padStart(2, "0");
  const seconds = String(countdownSeconds % 60).padStart(2, "0");

  return (
    <div id="app" className="restauro etz-bloco etz-bloco-v1">
      <section className={screenClass(21, screen)} id="screen-21" data-screen="21">
        <div className="screen__scroll center">
          <header className="badge">
            <img loading="eager" fetchPriority="high" decoding="async" src={assets.logo} alt="Eterniza" />
          </header>
          <h1 className="heading">Escolha o cenário</h1>
          <p className="estilo-sub">Toque na cena e veja novamente quem fez tanta&nbsp;falta 💛</p>
          <div className="estilos">
            {scenes.map((item) => (
              <button
                className={`estilo ${hasChosenScene && selectedScene === item.id ? "is-picked" : ""}`}
                key={item.id}
                type="button"
                aria-label={item.title}
                onClick={() => chooseScene(item.id)}
              >
                <video poster={item.poster} muted loop playsInline autoPlay preload="auto" src={item.video} />
                <span className="estilo__txt">
                  <b>{item.title}</b>
                </span>
              </button>
            ))}
          </div>
          {scene.onePhoto && <p className="estilo-sub estilo-aviso">✝️ Esta cena usa <b>só a foto de quem partiu</b>.</p>}
        </div>
      </section>

      <section className={screenClass(1, screen)} id="screen-1" data-screen="1">
        <div className="screen__scroll center">
          <header className="badge">
            <img loading="lazy" decoding="async" src={assets.logo} alt="Eterniza" />
          </header>
          <h1 className="heading">{scene.onePhoto ? "Envie a foto de quem partiu e veja o abraço com Jesus ✝️" : "Envie 2 fotos e reviva o abraço de vocês ✨"}</h1>
          {!scene.onePhoto && <div className="slot-labels">
            <span>Você</span>
            <span>Quem partiu</span>
          </div>}
          <div className={`uploads ${scene.onePhoto ? "uploads--single" : ""}`}>
            <label className={`upload ${photoA ? "has-photo" : ""}`} id="upload-1">
              <input type="file" accept="image/*" hidden onChange={onFile("a")} />
              {photoA && <img className="upload__img" src={photoA} alt="Sua foto" />}
              <span className="upload__plus">+</span>
              <span className="upload__label">{scene.onePhoto ? "FOTO DE QUEM PARTIU" : "SUA FOTO"}</span>
              <span className="upload__change">TROCAR</span>
            </label>
            {!scene.onePhoto && <label className={`upload ${photoB ? "has-photo" : ""}`} id="upload-2">
              <input type="file" accept="image/*" hidden onChange={onFile("b")} />
              {photoB && <img className="upload__img" src={photoB} alt="Foto de quem partiu" />}
              <span className="upload__plus">+</span>
              <span className="upload__label">A FOTO DELE(A)</span>
              <span className="upload__change">TROCAR</span>
            </label>}
          </div>
          <p className="upload-safe">🔒 Suas fotos são usadas só para criar o seu vídeo.</p>
          <button className={`cta cta--inline ${canCreate ? "" : "is-disabled"}`} disabled={!canCreate} type="button" onClick={() => setScreen(3)}>
            CRIAR MEU REENCONTRO
          </button>
          <h2 className="section-title">{scene.onePhoto ? "Um abraço de fé e esperança" : <>Um abraço que a vida<br />não deixou acontecer 🕊️</>}</h2>
          <div className="templates">
            {screen === 1 && <img loading="lazy" decoding="async" src={assets.templates} alt="Exemplos de reencontro" />}
          </div>
        </div>
      </section>

      <section className={screenClass(3, screen)} id="screen-3" data-screen="3">
        <div className="screen__scroll center loading-screen">
          <div className="loading-head">
            <h1 className="heading loading-title" aria-live="polite">{loadingTitles[loadingTitleIndex]}</h1>
            <p className="subhead">Seu reencontro está sendo preparado com carinho</p>
          </div>
          <div className="bars" id="bars">
            {["Reconhecendo os dois rostos...", "preparando o encontro...", "Criando o abraço…"].map((label, index) => (
              <div className="bar" data-bar={index} key={label}>
                <div className="bar__top"><span className="bar__label">{label}</span><span className="bar__pct">{progress[index] >= 100 ? "100% ✓" : `${progress[index]}%`}</span></div>
                <div className="bar__track"><div className="bar__fill" style={{ width: `${progress[index]}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="loading-example">
            <p className="loading-example__cap">Um exemplo do que estamos criando pra você 💛</p>
            {screen === 3 && <video className="loading-example__vid" poster={scene.poster} src={scene.video} preload="auto" muted loop autoPlay playsInline key={scene.video} />}
          </div>
        </div>
      </section>

      <section className={screenClass(4, screen)} id="screen-4" data-screen="4">
        <div className="screen__scroll center">
          <header className="badge"><img src={assets.logo} alt="Eterniza" /></header>
          <h1 className="heading wheel-h">Você ganhou 1 giro na<br />roleta do desconto 🎁</h1>
          <p className="wheel-copy">Toque na roleta e garanta seu desconto exclusivo. Vale só um giro por pessoa.</p>
          <div className="wheel-stage"><div className="wheel-glow" /><div className="wheel-pointer" /><div className="wheel-wrap" id="wheelWrap"><div className="wheel-fallback">50%<small>OFF</small></div><div className="wheel-hub" /></div></div>
          <p className="wheel-hint">TOQUE EM QUALQUER LUGAR PARA GIRAR</p>
        </div>
        <div className="cta-dock"><button className="cta cta--pulse" type="button" onClick={() => setScreen(5)}>Continuar</button></div>
      </section>

      <section className={screenClass(5, screen)} id="screen-5" data-screen="5">
        <div className="screen__scroll center">
          <header className="badge"><img src={assets.logo} alt="Eterniza" /></header>
          <h1 className="heading">Pra onde enviamos a sua <span className="accent">cópia</span> do vídeo?</h1>
          <p className="help-text">Você vê o vídeo aqui na hora e ainda mandamos uma cópia no seu WhatsApp e e-mail pra guardar pra sempre. <strong>Confira se estão corretos.</strong></p>
        </div>
        <div className="cta-dock"><button className="cta" type="button" onClick={() => setContactOpen(true)}>GERAR MEU PIX</button></div>
      </section>

      <section className={screenClass(6, screen, pixVisible ? "is-pagando" : "")} id="screen-6" data-screen="6">
        <div className="screen__scroll co">
          <div className="countdown" id="countdown">🎁 {discountPercent}% OFF aplicado · expira em <strong>{minutes}:{seconds}</strong></div>
          <div className="co-hero">
            {screen === 6 && <img className="co-hero__img" loading="eager" decoding="async" src={assets.checkoutHero} alt="Abraço no céu" />}
            <div className="co-hero__veil" />
            <div className="co-hero__overlay"><div className="co-hero__lock">🔒</div></div>
          </div>
          <div className="co-head">
            <span className="co-eyebrow">FALTA SÓ O PAGAMENTO</span>
            <h1 className="co-title">Você está a 1 passo de reencontrar quem partiu</h1>
            <div className="co-microproof">⭐️ 4,9/5 · <b>milhares de famílias</b> emocionadas</div>
          </div>
          <div className="cocheck" id="coCheck">
            <div className="plans plans--single" id="plans">
              <button className="plan is-selected plan--bloco plan--bloco-v1" type="button">
                <span className="bloco__tarja">FALTA SÓ O PAGAMENTO</span>
                <span className="bloco__rrow"><span className="bloco__rlab">Vídeo do reencontro</span><span className="bloco__rval"><span className="plan__prices"><s>R$ 54,00</s> <span className="plan__tag">OFERTA TESTE</span></span></span></span>
                <span className="bloco__rrow bloco__rrow--desc"><span className="bloco__rlab">Desconto de hoje ({discountPercent}%)</span><span className="bloco__rval">− {formatBRL(discount)}</span></span>
                <span className="bloco__rrow bloco__rrow--fee"><span className="plan__fee">Taxa de serviço <b>{formatBRL(SERVICE_FEE)}</b></span></span>
                <span className="bloco__rtot"><span className="bloco__rtl">Total hoje<small>pagamento único · PIX</small></span><span className="bloco__rtv"><b className="plan__big">{formatBRL(ticketPrice)}</b></span></span>
              </button>
            </div>
            <div className="cocheck__head"><span className="cocheck__bolt">⚡</span> Pague com <b>PIX</b> · aprovação na hora</div>
            {!pixVisible && <div className="cocheck__body" id="coCta"><button className="pix-copy pix-copy--hero cta--subscribe" type="button" onClick={() => setContactOpen(true)}>QUERO VIVER ESTE REENCONTRO!</button><p className="co-cta-secure">🔒 Pagamento seguro via PIX · aprovação na hora</p></div>}
            {pixVisible && (
              <div className="cocheck__body" id="coPix">
                <span className="pix-selo">⚡ PIX · aprovação na hora</span>
                <div className="pix-amount">{formatBRL(ticketPrice)}</div>
                <p className="pix-sub">Pagamento único · seu vídeo chega no WhatsApp</p>
                <button className={`pix-copy pix-copy--hero ${pixCopied ? "is-done" : ""}`} type="button" onClick={copyPix}>
                  {!pixCopied && <svg className="pix-copy__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>}
                  <span>{pixCopied ? "Código PIX copiado ✓" : "Copiar código PIX e pagar"}</span>
                </button>
                <ol className="pix-steps">
                  <li><span className="pix-steps__n">1</span><span>Abra o app do seu banco</span></li>
                  <li><span className="pix-steps__n">2</span><span>Cole em <b>Pix Copia e Cola</b></span></li>
                  <li><span className="pix-steps__n">3</span><span>Seu vídeo chega no <b>WhatsApp</b></span></li>
                </ol>
                <div className="pix-help">
                  <details open={codeOpen} onToggle={(event) => setCodeOpen(event.currentTarget.open)}>
                    <summary>▾ <span className="pix-summary-icon" aria-hidden="true">▤</span> Ver o código</summary>
                    <textarea className="pix-code" value={pixCode} readOnly aria-label="Código PIX copia e cola" />
                  </details>
                  <details open={qrOpen} onToggle={(event) => setQrOpen(event.currentTarget.open)}>
                    <summary>▾ <span className="pix-summary-icon" aria-hidden="true">▦</span> Ver QR Code</summary>
                    <div className="pix-qr">{pixQrCode ? <img src={pixQrCode} alt="QR Code PIX desta cobrança" /> : <FakeQr />}</div>
                    <p className="pix-qr-cap">Aponte a câmera do seu banco 📷</p>
                  </details>
                </div>
                <div className="pix-status"><span className="pix-dot" /><span><strong>{chargePaid ? "Pagamento confirmado" : "Aguardando o pagamento"}</strong><small>{chargePaid ? "Seu pedido já está confirmado" : "Você não precisa fazer mais nada"}</small></span></div>
                <p className="pix-mini">🔒 Pagamento seguro via PIX · aprovação na hora</p>
              </div>
            )}
          </div>
          <div className="pass"><h2 className="pass__title">✨ O que você recebe</h2><ul className="pass__list"><li>🎬 O vídeo do reencontro de vocês, em movimento</li><li>🎵 Com música emocionante e sem marca d'água</li><li>📱 Aparece na sua tela em ~2 minutos (+ cópia no WhatsApp)</li><li>💳 Pagamento único — sem mensalidade</li></ul></div>
          <div className="guarantee">{screen === 6 && <img className="guarantee__shield" loading="lazy" decoding="async" src={assets.shield} alt="Garantia de 14 dias" />}<h2 className="guarantee__title">Emoção garantida<br />ou seu dinheiro de volta</h2><p className="guarantee__text">Se o seu reencontro não tocar o seu coração, devolvemos 100% do seu dinheiro em até 14 dias.</p><p className="guarantee__text">Sem pegadinha e sem mensalidade. É uma compra única.</p></div>
          <div className="social"><div className="social__rating">⭐️ 4,9/5 · milhares de famílias emocionadas</div><h2 className="social__title">Amado por milhares de<br />famílias brasileiras 👇</h2>{screen === 6 && <ProofCarousel />}</div>
          <footer className="footer"><a href="https://eternizamemorias.com.br/termos" target="_blank" rel="noreferrer">Termos de Uso</a><a href="https://eternizamemorias.com.br/privacidade" target="_blank" rel="noreferrer">Política de Privacidade</a><div className="footer__help">Precisa de ajuda?<br /><a href="mailto:contato@eternizandomomentos.com">contato@eternizandomomentos.com</a></div></footer>
        </div>
        {!pixVisible && showBottomCta && <div className="cta-dock co-dock"><button className="cta cta--subscribe co-dock__btn" type="button" onClick={() => setContactOpen(true)}><span className="co-dock__txt">QUERO MEU REENCONTRO</span><span className="co-dock__preco">{formatBRL(ticketPrice)}</span></button></div>}
      </section>

      <section className={screenClass(7, screen)} id="screen-7" data-screen="7">
        <div className="screen__scroll"><div className="gen"><div className="gen__h">🎉 Seu reencontro está pronto!</div><div className="gen__sub">Seu vídeo do reencontro entra na fila e chega no WhatsApp 💛</div></div></div>
      </section>

      <ContactModal open={contactOpen} email={email} whatsapp={whatsapp} onEmail={setEmail} onWhatsapp={setWhatsapp} onClose={() => setContactOpen(false)} onSubmit={() => { void submitContact(); }} submitting={creatingCharge} submitError={chargeError} />
    </div>
  );
}
