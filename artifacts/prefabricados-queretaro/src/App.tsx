import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRequestQuote } from '@workspace/api-client-react';
import { ArrowRight, ArrowUpRight, MapPin, Phone, Send } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

declare global {
  interface Window {
    hcaptcha?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback': () => void;
        'error-callback': () => void;
      }) => string;
      reset: (widgetId?: string) => void;
    };
    hcaptchaApiReady?: boolean;
    onHcaptchaApiLoad?: () => void;
  }
}

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;
const BUSINESS_EMAIL = 'prefabricadoshuimilpan@gmail.com';
const BUSINESS_PHONE = '4428228310';
const BUSINESS_LOCATIONS = [
  {
    id: 'queretaro',
    name: 'Lomas de Casa Blanca, Querétaro',
    address: 'C. 27 830, Lomas de Casa Blanca, 76080 Santiago de Querétaro, Qro., México',
  },
  {
    id: 'huimilpan',
    name: 'La Ceja, Huimilpan',
    address: 'Calle Querétaro 465, La Ceja, Huimilpan, Querétaro, México',
  },
];
const WHATSAPP_URL = `https://wa.me/52${BUSINESS_PHONE}?text=${encodeURIComponent('Hola, vi su página de Prefabricados Huimilpan. Me gustaría recibir información y una cotización sobre sus productos.')}`;

const productPhotos = [
  { name: 'IMG-20261012-WA0003.jpg', id: '1X8YTK_dBREnTDeUgRc7wyUEzRppohbWP', label: 'Armadura sobre elemento prefabricado' },
  { name: 'IMG-20261012-WA0004.jpg', id: '15UtKRGNOnvniT45FrQPOCdY54zWVBlKz', label: 'Vista de conjunto en área de trabajo' },
  { name: 'IMG-20261012-WA0005.jpg', id: '1xdXP02YEmPtMOp9RUvNlwgjQWlgyn45d', label: 'Detalle de piezas alineadas' },
  { name: 'IMG-20261012-WA0006.jpg', id: '1yizq-EXGmdMKce0DqCtGWZFxqREKdpLZ', label: 'Acercamiento a la armadura' },
  { name: 'IMG-20261012-WA0007.jpg', id: '1g3T0paFgJYTQy7kvsY9bdV769Xqkrynd', label: 'Detalle de fabricación' },
  { name: 'IMG-20261012-WA0008.jpg', id: '1EuqFwK3E8nSUWOK40re1uV9nlvvjcwsB', label: 'Unión de armadura y base' },
  { name: 'IMG-20261012-WA0009.jpg', id: '1z7ZRf8lUyNVdVckaV7HWY6TSqSXPsUPi', label: 'Piezas dispuestas en patio' },
  { name: 'IMG-20261012-WA0010.jpg', id: '11xTZEdlNcXE7dxnS2a4_pStf4S_dSG8A', label: 'Elementos apilados' },
  { name: 'IMG-20261012-WA0011.jpg', id: '16oV8G58C1x0qgKxOCJdNTO6DOPBWv3ga', label: 'Elementos en exterior' },
  { name: 'IMG-20261012-WA0012.jpg', id: '1IWef4yiy2uOn44AaWUH3jaLnqpQMObUC', label: 'Preparación para traslado' },
  { name: 'IMG-20261012-WA0013.jpg', id: '1sZ-WgLN-5WZLrQ_sHEQL87xXyq1-fKOZ', label: 'Vista cercana de piezas' },
  { name: 'IMG-20261012-WA0014.jpg', id: '1fq157lXbT0KDKDa6Pon7C_iieesvvv4x', label: 'Piezas blancas apiladas' },
  { name: 'IMG-20261012-WA0015.jpg', id: '1LNE02HblZrqvuqWCa-xbOEDDYV1ekd0O', label: 'Detalle de piezas moldeadas' },
  { name: 'IMG-20261012-WA0016.jpg', id: '14wil90mh1eTzU3cAaaitwcgM7feByZBH', label: 'Piezas en espacio de resguardo' },
  { name: 'IMG-20261012-WA0017.jpg', id: '1ZpPuISRNtpFOVE_gbOtTt1JVObBgiF5v', label: 'Piezas apiladas' },
  { name: 'IMG-20261012-WA0018.jpg', id: '1X3vVvsXSvkShEaD3SyPiLzZi4-Ngn0Xq', label: 'Pieza individual' },
];

const products = [
  {
    name: 'Semivigueta',
    category: 'Sistema de losa',
    description: 'Elemento prefabricado de concreto reforzado con armadura de acero. Se utiliza como soporte estructural en losas aligeradas junto con bovedillas.',
    specifications: ['Longitudes de 1 a 6 m', 'Peraltes de 15–20'],
  },
  {
    name: 'Bovedilla de poliestireno',
    category: 'Sistema de losa · Unicel',
    description: 'Pieza ligera de poliestireno expandido que se coloca entre semiviguetas para reducir el peso propio de la losa y aportar aislamiento térmico.',
    specifications: ['1.2 × 0.63 × 0.15', '1.2 × 0.63 × 0.20', 'Densidades 10 y 11 · medidas especiales'],
  },
  {
    name: 'Bovedilla de concreto',
    category: 'Sistema de losa',
    description: 'Pieza prefabricada que se coloca entre semiviguetas como elemento de relleno, aligerando la losa y reduciendo el concreto necesario.',
    specifications: ['Medida indicada: 15 × 25 × 75'],
  },
  {
    name: 'Casetón de poliestireno',
    category: 'Losas reticulares · Térmico',
    description: 'Elemento de poliestireno expandido para aligerar losas reticulares o nervadas y formar espacios entre las nervaduras de concreto.',
    specifications: ['15 × 40 × 40 · 20 × 40 × 40 · 25 × 40 × 40', '20 × 50 × 50 · 25 × 50 × 50 · 20 × 60 × 60', 'Densidad 8 · medidas especiales'],
  },
  {
    name: 'Placa de poliestireno (unicel)',
    category: 'Aislamiento térmico',
    description: 'Panel ligero que se usa como aislante térmico y material de relleno en muros, techos, plafones y otros sistemas constructivos.',
    specifications: ['1.2 × 2 × .4 × 1″', '1.2 × 2 × .4 × 2″', 'Medidas especiales'],
  },
  {
    name: 'Poste para cercar',
    category: 'Prefabricado de concreto',
    description: 'Elemento de concreto reforzado para colocar malla ciclónica, alambre de púas o alambre galvanizado y delimitar terrenos.',
    specifications: ['Sección de 10 × 10 cm', 'Longitudes de 2 m y 2.4 m'],
  },
];

function QuoteRequestForm() {
  const requestQuote = useRequestQuote();
  const captchaContainer = useRef<HTMLDivElement>(null);
  const captchaWidgetId = useRef<string | undefined>(undefined);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaError, setCaptchaError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!HCAPTCHA_SITE_KEY || !captchaContainer.current) return;

    const renderWidget = () => {
      if (!window.hcaptcha || !captchaContainer.current || captchaWidgetId.current) return;
      try {
        captchaWidgetId.current = window.hcaptcha.render(captchaContainer.current, {
          sitekey: HCAPTCHA_SITE_KEY,
          callback: (token) => {
            setCaptchaToken(token);
            setCaptchaError('');
          },
          'expired-callback': () => setCaptchaToken(''),
          'error-callback': () => {
            setCaptchaToken('');
            setCaptchaError('No fue posible verificar el captcha. Inténtalo de nuevo.');
          },
        });
        setCaptchaReady(true);
      } catch {
        setCaptchaError('No se pudo iniciar la verificación. Recarga la página e inténtalo de nuevo.');
      }
    };

    if (window.hcaptcha && window.hcaptchaApiReady) {
      renderWidget();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-hcaptcha-script]');
    const script = existingScript ?? document.createElement('script');
    const onApiLoad = () => {
      window.hcaptchaApiReady = true;
      renderWidget();
    };
    window.onHcaptchaApiLoad = onApiLoad;
    if (!existingScript) {
      script.src = 'https://js.hcaptcha.com/1/api.js?onload=onHcaptchaApiLoad&render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.hcaptchaScript = 'true';
      script.onerror = () => setCaptchaError('No se pudo cargar la verificación. Revisa tu conexión e inténtalo de nuevo.');
      document.head.appendChild(script);
    } else if (window.hcaptcha && window.hcaptchaApiReady) {
      renderWidget();
    }
    return () => {
      if (window.onHcaptchaApiLoad === onApiLoad) window.onHcaptchaApiLoad = undefined;
    };
  }, []);

  const resetCaptcha = () => {
    setCaptchaToken('');
    if (captchaWidgetId.current) window.hcaptcha?.reset(captchaWidgetId.current);
  };

  const getErrorMessage = (error: unknown) => {
    if (error && typeof error === 'object') {
      const details = error as { status?: number; statusCode?: number; message?: string };
      if (details.status === 429 || details.statusCode === 429) {
        return 'Recibimos varias solicitudes en poco tiempo. Espera un momento y vuelve a intentarlo.';
      }
      if (details.message && /429|too many|rate limit/i.test(details.message)) {
        return 'Recibimos varias solicitudes en poco tiempo. Espera un momento y vuelve a intentarlo.';
      }
    }
    return 'No pudimos enviar tu solicitud en este momento. Revisa tu conexión e inténtalo de nuevo.';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setFormError('');
    setSuccessMessage('');
    if (!captchaToken) {
      setCaptchaError('Completa la verificación antes de enviar tu solicitud.');
      return;
    }
    const formData = new FormData(form);
    const website = String(formData.get('website') ?? '');
    // The server also checks this honeypot; don't send bot-filled submissions.
    if (website) {
      setSuccessMessage('Gracias. Recibimos tu solicitud.');
      resetCaptcha();
      return;
    }
    const data = {
      name: String(formData.get('name') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      city: String(formData.get('city') ?? '').trim(),
      product: String(formData.get('product') ?? '').trim(),
      quantity: String(formData.get('quantity') ?? '').trim(),
      message: String(formData.get('message') ?? '').trim(),
      captchaToken,
      website,
    };
    try {
      const response = await requestQuote.mutateAsync({
        data: {
          name: data.name,
          email: data.email,
          ...(data.phone ? { phone: data.phone } : {}),
          ...(data.city ? { city: data.city } : {}),
          ...(data.product ? { product: data.product } : {}),
          ...(data.quantity ? { quantity: data.quantity } : {}),
          ...(data.message ? { message: data.message } : {}),
          captchaToken,
          ...(website ? { website } : {}),
        },
      });
      if (!response.success) {
        setFormError(response.message || 'No pudimos enviar tu solicitud. Inténtalo de nuevo.');
        return;
      }
      setSuccessMessage(response.message || 'Gracias. Recibimos tu solicitud.');
      form.reset();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      resetCaptcha();
    }
  };

  return (
    <section className="section quote-section" id="cotizacion" aria-labelledby="quote-heading" data-testid="quote-section">
      <div className="quote-layout">
        <div className="quote-intro">
          <div className="eyebrow">Hablemos de tu obra</div>
          <h2 id="quote-heading">Solicita una cotización.</h2>
      <p>Si ya lo sabes, cuéntanos qué prefabricado necesitas y en qué ciudad está tu obra. Si aún no tienes esos datos, déjalos en blanco y te contactaremos.</p>
          <div className="quote-aside">
            <span className="quote-aside-mark"><MapPin aria-hidden="true" /></span>
            <span><strong>Atención en Querétaro</strong><small>Querétaro, México</small></span>
          </div>
          <a className="quote-phone" href={`tel:+52${BUSINESS_PHONE}`}><Phone aria-hidden="true" /> 442 822 8310</a>
          <a className="quote-email" href={`mailto:${BUSINESS_EMAIL}`}>{BUSINESS_EMAIL}</a>
        </div>

        <form className="quote-form" onSubmit={handleSubmit} data-testid="quote-form">
          <div className="form-heading">
            <span className="panel-number">SOLICITUD / QRO</span>
            <span className="required-note">* Campos obligatorios</span>
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="quote-name">Nombre <span aria-hidden="true">*</span></label>
              <input id="quote-name" name="name" autoComplete="name" minLength={2} maxLength={100} required data-testid="input-quote-name" />
            </div>
            <div className="form-field">
              <label htmlFor="quote-email">Correo electrónico <span aria-hidden="true">*</span></label>
              <input id="quote-email" name="email" type="email" autoComplete="email" maxLength={254} required data-testid="input-quote-email" />
            </div>
            <div className="form-field">
              <label htmlFor="quote-phone">Teléfono <span className="optional-label">(opcional)</span></label>
              <input id="quote-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} data-testid="input-quote-phone" />
            </div>
            <div className="form-field">
              <label htmlFor="quote-city">Ciudad <span className="optional-label">(opcional)</span></label>
              <input id="quote-city" name="city" autoComplete="address-level2" maxLength={100} data-testid="input-quote-city" />
            </div>
            <div className="form-field">
              <label htmlFor="quote-product">Producto que buscas <span className="optional-label">(opcional)</span></label>
              <input id="quote-product" name="product" list="quote-products" placeholder="Ej. semivigueta o casetón" maxLength={120} aria-describedby="product-hint" data-testid="input-quote-product" />
              <datalist id="quote-products">
                {products.map((product) => <option key={product.name} value={product.name} />)}
              </datalist>
              <small id="product-hint">Puedes elegir un producto, escribir una medida especial o dejarlo en blanco.</small>
            </div>
            <div className="form-field">
              <label htmlFor="quote-quantity">Cantidad aproximada <span className="optional-label">(opcional)</span></label>
              <input id="quote-quantity" name="quantity" maxLength={100} data-testid="input-quote-quantity" />
            </div>
            <div className="form-field form-field-wide">
              <label htmlFor="quote-message">Detalles del proyecto o mensaje <span className="optional-label">(opcional)</span></label>
              <textarea id="quote-message" name="message" maxLength={2000} rows={5} aria-describedby="message-hint" data-testid="input-quote-message" />
              <small id="message-hint">Puedes añadir medidas u otros detalles, o dejarlo en blanco.</small>
            </div>
          </div>
          <div className="honeypot-field" aria-hidden="true">
            <label htmlFor="quote-website">Sitio web</label>
            <input id="quote-website" name="website" tabIndex={-1} autoComplete="off" data-testid="input-quote-website" />
          </div>
          <div className="captcha-area">
            <div className="captcha-heading">
              <strong>Verificación</strong>
              <span>Ayúdanos a confirmar que eres una persona.</span>
            </div>
            {HCAPTCHA_SITE_KEY ? (
              <div ref={captchaContainer} className="captcha-widget" data-testid="hcaptcha-widget" aria-label="Verificación hCaptcha" />
            ) : (
              <p className="captcha-config-note" data-testid="text-captcha-config">
                La verificación estará disponible cuando se configure el sitio.
              </p>
            )}
            {captchaError && <p className="form-feedback form-feedback-error" role="alert" data-testid="status-captcha-error">{captchaError}</p>}
          </div>
          <div className="form-submit-row">
            <button className="quote-submit" type="submit" disabled={requestQuote.isPending || !HCAPTCHA_SITE_KEY || !captchaReady} data-testid="button-submit-quote">
              {requestQuote.isPending ? 'Enviando solicitud…' : 'Enviar solicitud'}
              <Send aria-hidden="true" />
            </button>
            <span className="privacy-note">Usaremos estos datos únicamente para atender tu solicitud.</span>
          </div>
          {formError && <p className="form-feedback form-feedback-error" role="alert" data-testid="status-quote-error">{formError}</p>}
          {successMessage && <p className="form-feedback form-feedback-success" role="status" data-testid="status-quote-success">{successMessage}</p>}
        </form>
      </div>
    </section>
  );
}

function App() {
  return (
    <div className="site-shell">
      <div className="utility-bar" data-testid="site-contact-bar">
        <span>Prefabricados Huimilpan · Construcción en Querétaro</span>
        <div className="utility-contacts">
          <a href={`tel:+52${BUSINESS_PHONE}`} data-testid="utility-phone"><Phone aria-hidden="true" />442 822 8310</a>
          <a href={`mailto:${BUSINESS_EMAIL}`} data-testid="utility-email">{BUSINESS_EMAIL}</a>
        </div>
      </div>
      <header className="topbar" data-testid="site-header">
        <a className="brand" href="#inicio" aria-label="Prefabricados Huimilpan, inicio" data-testid="brand-home">
          <img className="brand-logo" src="/logo-ph.jpeg" alt="Logo de Prefabricados Huimilpan: Vigueta y Bovedilla" width="56" height="56" />
          <span className="brand-name">Prefabricados Huimilpan<small>Vigueta · Bovedilla · Querétaro</small></span>
        </a>
        <nav className="topnav" aria-label="Navegación principal">
          <a href="#productos" data-testid="nav-catalogo">Productos</a>
          <a href="#contacto" data-testid="nav-contacto">Contacto</a>
          <a className="nav-cta" href="#cotizacion" data-testid="nav-local">Pedir cotización</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="inicio" aria-labelledby="main-heading" data-testid="hero">
          <div className="hero-content">
            <div className="eyebrow reveal">Prefabricados Huimilpan · Querétaro</div>
            <h1 className="reveal-delay" id="main-heading">Prefabricados para <span>tu obra.</span></h1>
            <p className="hero-copy reveal-delay">
              Semivigueta, bovedillas, casetón, placa de unicel y postes para cercar. Consulta medidas y pide una cotización para tu obra en Querétaro.
            </p>
            <div className="hero-actions">
              <a className="button-primary" href="#cotizacion" data-testid="hero-offer-link">
                Solicitar cotización <ArrowRight aria-hidden="true" />
              </a>
              <a className="button-secondary" href="#productos" data-testid="hero-catalog-link">Ver productos</a>
              <span className="hero-note">Atención local · Querétaro, México</span>
            </div>
          </div>
          <div className="hero-photo" role="img" aria-label="Elementos prefabricados en el área de trabajo">
            <img
              src="https://drive.google.com/thumbnail?id=1X8YTK_dBREnTDeUgRc7wyUEzRppohbWP&sz=w1600"
              alt=""
              fetchPriority="high"
            />
            <span className="hero-photo-frame" aria-hidden="true" />
          </div>
        </section>

        <aside className="local-band" data-testid="local-coverage">
          <strong className="local-marker"><MapPin aria-hidden="true" /> Productos prefabricados para construcción</strong>
          <span>Semivigueta · Bovedilla · Casetón · Unicel · Poste</span>
        </aside>

        <section className="section products-section" id="productos" aria-labelledby="products-heading" data-testid="products-section">
          <div className="products-inner">
            <div className="products-heading">
              <div className="eyebrow">Catálogo de productos</div>
              <h2 id="products-heading">Prefabricados para losas, aislamiento y cercado.</h2>
              <p>Consulta los productos y medidas que manejamos. Para confirmar disponibilidad o cotizar medidas especiales, contáctanos directamente.</p>
            </div>
            <div className="products-grid">
              {products.map((product, index) => (
                <article className="product-card" key={product.name} data-testid={`product-card-${index + 1}`}>
                  <div className="product-category">{product.category}</div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <ul className="product-specifications">
                    {product.specifications.map((specification) => <li key={specification}>{specification}</li>)}
                  </ul>
                  <a className="product-quote-link" href="#cotizacion" aria-label={`Solicitar cotización de ${product.name}`}>
                    Cotizar este producto <ArrowRight aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>
            <p className="product-measure-note">Las medidas y densidades se muestran como fueron proporcionadas por el negocio. Confirma unidades y disponibilidad al solicitar tu cotización.</p>
          </div>
        </section>

        <section className="section gallery-section" id="galeria" aria-label="Galería de fotografías de Prefabricados Huimilpan" data-testid="catalog-section">
          <div className="gallery" aria-label="Galería de productos prefabricados">
            {productPhotos.map((photo, index) => (
              <figure className="gallery-item" key={photo.id} aria-label={photo.label} data-testid={`product-photo-${index + 1}`}>
                <img
                  src={`https://drive.google.com/thumbnail?id=${photo.id}&sz=w1600`}
                  alt=""
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </figure>
            ))}
          </div>
        </section>

        <section className="section contact-section" id="contacto" aria-labelledby="contact-heading" data-testid="contact-section">
          <div className="contact-panel">
            <div className="contact-copy">
              <div className="eyebrow">Contacto directo</div>
              <h2 id="contact-heading">¿Tienes dudas sobre medidas o tu pedido?</h2>
              <p>Comunícate con Prefabricados Huimilpan o envíanos los datos de tu obra desde el formulario de cotización.</p>
            </div>
            <div className="contact-actions">
              <a href={`tel:+52${BUSINESS_PHONE}`}><Phone aria-hidden="true" /><span><small>Llámanos</small>442 822 8310</span></a>
              <a href={`mailto:${BUSINESS_EMAIL}`}><span className="contact-mail-icon" aria-hidden="true">@</span><span><small>Escríbenos</small>{BUSINESS_EMAIL}</span></a>
              <a className="contact-whatsapp" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <FaWhatsapp aria-hidden="true" />
                <span><small>WhatsApp</small>Enviar mensaje</span>
              </a>
            </div>
          </div>
          {BUSINESS_LOCATIONS.map((location, index) => (
          <div className="location-panel" id={index === 0 ? 'ubicacion' : `ubicacion-${location.id}`} aria-labelledby={`location-heading-${location.id}`} data-testid={index === 0 ? 'business-location' : `business-location-${location.id}`} key={location.id}>
            <div className="location-info">
              <div className="eyebrow">{index === 0 ? 'Ubicación en Querétaro' : 'También estamos en Huimilpan'}</div>
              <h3 id={`location-heading-${location.id}`}>{location.name}</h3>
              <address className="business-address">
                <MapPin aria-hidden="true" />
                <span>{location.address}</span>
              </address>
              <a className="maps-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`} target="_blank" rel="noopener noreferrer">
                <MapPin aria-hidden="true" />
                Ver ubicación en Google Maps
                <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
            <div className="location-map">
              <iframe
                title={`Mapa de Prefabricados Huimilpan en ${location.name}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(location.address)}&z=16&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
          ))}
        </section>

        <QuoteRequestForm />

        <section className="closing" aria-label="Resumen de servicio" data-testid="closing-summary">
          <div className="closing-inner">
            <div>
              <div className="eyebrow">Prefabricados Huimilpan · Querétaro</div>
              <h2>Encuentra el prefabricado para tu obra.</h2>
              <p>Semivigueta, bovedilla, casetón, placa de unicel y poste para cercar. Solicita una cotización.</p>
            </div>
            <a className="closing-mark" href="#cotizacion" aria-label="Solicitar cotización" data-testid="closing-quote-link">
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer className="footer" data-testid="site-footer">
        <a className="footer-brand" href="#inicio" aria-label="Prefabricados Huimilpan, inicio">
          <img src="/logo-ph.jpeg" alt="" width="44" height="44" />
          <span>Prefabricados Huimilpan<small>Querétaro, México</small></span>
        </a>
        <a href="#inicio" data-testid="footer-home">Volver al inicio</a>
        <a href={`tel:+52${BUSINESS_PHONE}`}>442 822 8310</a>
        <a href={`mailto:${BUSINESS_EMAIL}`}>{BUSINESS_EMAIL}</a>
      </footer>
      <a
        className="whatsapp-float"
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribir a Prefabricados Huimilpan por WhatsApp"
        title="Escríbenos por WhatsApp"
        data-testid="whatsapp-float"
      >
        <FaWhatsapp aria-hidden="true" />
      </a>
    </div>
  );
}

export default App;
