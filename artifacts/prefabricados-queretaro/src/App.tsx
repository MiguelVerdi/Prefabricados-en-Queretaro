import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRequestQuote } from '@workspace/api-client-react';
import { ArrowRight, ArrowUpRight, Layers3, MapPin, Send } from 'lucide-react';

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
  }
}

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

const productPhotos = [
  { name: 'IMG-20261012-WA0003.jpg', id: '1X8YTK_dBREnTDeUgRc7wyUEzRppohbWP', label: 'Armadura sobre elemento prefabricado', group: 'Elementos para losa' },
  { name: 'IMG-20261012-WA0004.jpg', id: '15UtKRGNOnvniT45FrQPOCdY54zWVBlKz', label: 'Vista de conjunto en área de trabajo', group: 'Elementos para losa' },
  { name: 'IMG-20261012-WA0005.jpg', id: '1xdXP02YEmPtMOp9RUvNlwgjQWlgyn45d', label: 'Detalle de piezas alineadas', group: 'Elementos para losa' },
  { name: 'IMG-20261012-WA0006.jpg', id: '1yizq-EXGmdMKce0DqCtGWZFxqREKdpLZ', label: 'Acercamiento a la armadura', group: 'Elementos para losa' },
  { name: 'IMG-20261012-WA0007.jpg', id: '1g3T0paFgJYTQy7kvsY9bdV769Xqkrynd', label: 'Detalle de fabricación', group: 'Elementos para losa' },
  { name: 'IMG-20261012-WA0008.jpg', id: '1EuqFwK3E8nSUWOK40re1uV9nlvvjcwsB', label: 'Unión de armadura y base', group: 'Elementos para losa' },
  { name: 'IMG-20261012-WA0009.jpg', id: '1z7ZRf8lUyNVdVckaV7HWY6TSqSXPsUPi', label: 'Piezas dispuestas en patio', group: 'Elementos para losa' },
  { name: 'IMG-20261012-WA0010.jpg', id: '11xTZEdlNcXE7dxnS2a4_pStf4S_dSG8A', label: 'Elementos apilados', group: 'Elementos para losa' },
  { name: 'IMG-20261012-WA0011.jpg', id: '16oV8G58C1x0qgKxOCJdNTO6DOPBWv3ga', label: 'Elementos en exterior', group: 'Elementos para losa' },
  { name: 'IMG-20261012-WA0012.jpg', id: '1IWef4yiy2uOn44AaWUH3jaLnqpQMObUC', label: 'Preparación para traslado', group: 'Elementos para losa' },
  { name: 'IMG-20261012-WA0013.jpg', id: '1sZ-WgLN-5WZLrQ_sHEQL87xXyq1-fKOZ', label: 'Vista cercana de piezas', group: 'Elementos para losa' },
  { name: 'IMG-20261012-WA0014.jpg', id: '1fq157lXbT0KDKDa6Pon7C_iieesvvv4x', label: 'Piezas blancas apiladas', group: 'Piezas para construcción' },
  { name: 'IMG-20261012-WA0015.jpg', id: '1LNE02HblZrqvuqWCa-xbOEDDYV1ekd0O', label: 'Detalle de piezas moldeadas', group: 'Piezas para construcción' },
  { name: 'IMG-20261012-WA0016.jpg', id: '14wil90mh1eTzU3cAaaitwcgM7feByZBH', label: 'Piezas en espacio de resguardo', group: 'Piezas para construcción' },
  { name: 'IMG-20261012-WA0017.jpg', id: '1ZpPuISRNtpFOVE_gbOtTt1JVObBgiF5v', label: 'Piezas apiladas', group: 'Piezas para construcción' },
  { name: 'IMG-20261012-WA0018.jpg', id: '1X3vVvsXSvkShEaD3SyPiLzZi4-Ngn0Xq', label: 'Pieza individual', group: 'Piezas para construcción' },
];

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><Layers3 strokeWidth={1.7} /></span>;
}

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
    };

    if (window.hcaptcha) {
      renderWidget();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-hcaptcha-script]');
    const script = existingScript ?? document.createElement('script');
    const onLoad = () => renderWidget();
    script.addEventListener('load', onLoad);
    if (!existingScript) {
      script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.hcaptchaScript = 'true';
      script.onerror = () => setCaptchaError('No se pudo cargar la verificación. Revisa tu conexión e inténtalo de nuevo.');
      document.head.appendChild(script);
    }
    return () => script.removeEventListener('load', onLoad);
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
          ...data,
          ...(data.phone ? { phone: data.phone } : {}),
          ...(data.quantity ? { quantity: data.quantity } : {}),
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
          <p>Cuéntanos qué estás buscando y en qué ciudad está tu proyecto. Te responderemos para revisar los detalles contigo.</p>
          <div className="quote-aside">
            <span className="quote-aside-mark"><MapPin aria-hidden="true" /></span>
            <span><strong>Atención en Querétaro</strong><small>Querétaro, México</small></span>
          </div>
          <a className="quote-email" href="mailto:prefabricadoshuimilpan@gmail.com">prefabricadoshuimilpan@gmail.com</a>
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
              <label htmlFor="quote-city">Ciudad <span aria-hidden="true">*</span></label>
              <input id="quote-city" name="city" autoComplete="address-level2" minLength={2} maxLength={100} required data-testid="input-quote-city" />
            </div>
            <div className="form-field">
              <label htmlFor="quote-product">Producto que buscas <span aria-hidden="true">*</span></label>
              <input id="quote-product" name="product" minLength={2} maxLength={120} required aria-describedby="product-hint" data-testid="input-quote-product" />
              <small id="product-hint">Describe el prefabricado que necesitas.</small>
            </div>
            <div className="form-field">
              <label htmlFor="quote-quantity">Cantidad aproximada <span className="optional-label">(opcional)</span></label>
              <input id="quote-quantity" name="quantity" maxLength={100} data-testid="input-quote-quantity" />
            </div>
            <div className="form-field form-field-wide">
              <label htmlFor="quote-message">Detalles del proyecto o mensaje <span aria-hidden="true">*</span></label>
              <textarea id="quote-message" name="message" minLength={10} maxLength={2000} rows={5} required aria-describedby="message-hint" data-testid="input-quote-message" />
              <small id="message-hint">Incluye cualquier detalle que ayude a entender lo que necesitas.</small>
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
        <span>Prefabricados para construcción en Querétaro</span>
        <a href="mailto:prefabricadoshuimilpan@gmail.com" data-testid="utility-email">
          prefabricadoshuimilpan@gmail.com
        </a>
      </div>
      <header className="topbar" data-testid="site-header">
        <a className="brand" href="#inicio" aria-label="Prefabricados en Querétaro, inicio" data-testid="brand-home">
          <BrandMark />
          <span className="brand-name">Prefabricados<small>Querétaro · Construcción</small></span>
        </a>
        <nav className="topnav" aria-label="Navegación principal">
          <a href="#oferta" data-testid="nav-oferta">Qué ofrecemos</a>
          <a href="#catalogo" data-testid="nav-catalogo">Productos</a>
          <a className="nav-cta" href="#cotizacion" data-testid="nav-local">Pedir cotización</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="inicio" aria-labelledby="main-heading" data-testid="hero">
          <div className="hero-content">
            <div className="eyebrow reveal">Prefabricados · Querétaro</div>
            <h1 className="reveal-delay" id="main-heading">Materiales para <span>construir.</span></h1>
            <p className="hero-copy reveal-delay">
              Elementos prefabricados para profesionales de obra. Conoce parte de nuestra oferta y cuéntanos qué necesita tu proyecto.
            </p>
            <div className="hero-actions">
              <a className="button-primary" href="#cotizacion" data-testid="hero-offer-link">
                Solicitar cotización <ArrowRight aria-hidden="true" />
              </a>
              <span className="hero-note">Atención local · Querétaro, México</span>
            </div>
          </div>
          <div className="hero-photo" aria-label="Elementos prefabricados fotografiados en el área de trabajo">
            <img
              src="https://drive.google.com/thumbnail?id=1X8YTK_dBREnTDeUgRc7wyUEzRppohbWP&sz=w1600"
              alt="Elementos prefabricados con armadura expuestos en un patio de trabajo"
              fetchPriority="high"
            />
            <span className="photo-index">FOTO DE PRODUCTO</span>
            <div className="photo-caption">
              <strong>Prefabricados vistos de cerca, en el trabajo real.</strong>
              <span>Registro fotográfico</span>
            </div>
            <span className="hero-photo-frame" aria-hidden="true" />
          </div>
        </section>

        <aside className="local-band" id="ubicacion" data-testid="local-coverage">
          <strong className="local-marker"><MapPin aria-hidden="true" /> Un contacto local para tus proyectos</strong>
          <span>Querétaro · México</span>
        </aside>

        <section className="section" id="oferta" aria-labelledby="offer-heading" data-testid="offer-section">
          <div className="section-inner">
            <div className="section-heading">
              <div className="eyebrow">Una oferta para obra</div>
              <div>
                <h2 id="offer-heading">Lo que buscas para construir, <em>empieza aquí.</em></h2>
                <p>Somos un negocio local de venta de productos prefabricados para construcción. Si tienes un requerimiento específico, consúltanos directamente.</p>
              </div>
            </div>
            <div className="offer-grid">
              <article className="offer-panel primary-panel" data-testid="offer-overview">
                <div className="panel-topline">
                  <span className="panel-number">01 / MATERIALES</span>
                  <span className="panel-tag">Para profesionales de obra</span>
                </div>
                <h3>Elementos prefabricados para construcción</h3>
                <p>Consulta por piezas con armadura para sistemas de losa y otros elementos que aparecen en nuestras fotografías. Confirmamos contigo los detalles del producto que requieres.</p>
                <div className="panel-rule" />
                <div className="panel-foot"><span>Atención directa</span><span>Querétaro, México</span></div>
              </article>
              <article className="offer-panel" data-testid="offer-for-buyers">
                <div className="panel-topline">
                  <span className="panel-number">02 / PARA TU PROYECTO</span>
                  <span className="panel-tag">Consulta disponibilidad</span>
                </div>
                <h3>Revisemos juntos lo que necesitas</h3>
                <p>Comparte el producto, la ciudad de tu obra y cualquier referencia que tengas. Te contactaremos para conversar sobre tu solicitud.</p>
                <div className="panel-rule" />
                <div className="panel-foot"><span>Sin precios publicados</span><span>Cotización personalizada</span></div>
              </article>
            </div>
          </div>
        </section>

        <section className="section gallery-section" id="catalogo" aria-labelledby="catalog-heading" data-testid="catalog-section">
          <div className="gallery-top">
            <div>
              <div className="eyebrow">Fotografías de producto</div>
              <h2 id="catalog-heading">Así se ven en persona.</h2>
            </div>
            <p>Imágenes compartidas por el negocio. Para confirmar el nombre y las especificaciones de cada pieza, consulta directamente.</p>
          </div>
          <div className="gallery" aria-label="Galería de productos prefabricados">
            {productPhotos.map((photo, index) => (
              <figure className="gallery-item" key={photo.id} data-testid={`product-photo-${index + 1}`}>
                <img
                  src={`https://drive.google.com/thumbnail?id=${photo.id}&sz=w1600`}
                  alt={photo.label}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
                <figcaption className="gallery-caption">
                  <strong>{photo.label}</strong>
                  <span>{photo.group}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="gallery-note">Las imágenes son referencias visuales; pregunta por características y especificaciones del producto.</p>
        </section>

        <section className="section catalog-section" aria-labelledby="catalog-status-heading">
          <div className="catalog-card">
            <div className="catalog-copy">
              <div className="eyebrow">Información clara</div>
              <h2 id="catalog-status-heading">Cada obra tiene sus propios requerimientos.</h2>
              <p>Por eso no publicamos medidas, precios ni disponibilidad sin confirmarlos. Envíanos los datos de tu proyecto y revisamos contigo la solicitud.</p>
            </div>
            <div className="catalog-status" data-testid="catalog-status" aria-label="Consulta directa para confirmar producto">
              <Layers3 aria-hidden="true" />
              <span>Consulta directa</span>
            </div>
          </div>
        </section>

        <section className="section buyer-section" aria-labelledby="buyer-heading" data-testid="buyer-section">
          <div className="section-inner">
            <div className="buyer-intro">
              <div className="eyebrow">Directo al punto</div>
              <h2 id="buyer-heading">Pide información con lo esencial.</h2>
              <p>Para revisar tu solicitud, comparte algunos datos de la obra y el material que estás buscando.</p>
            </div>
            <div className="buyer-steps">
              <article className="buyer-step">
                <span className="step-num">01 — UBICACIÓN</span>
                <h3>¿Dónde está tu proyecto?</h3>
                <p>Indica la ciudad para que podamos entender el contexto de tu solicitud.</p>
              </article>
              <article className="buyer-step">
                <span className="step-num">02 — PRODUCTO</span>
                <h3>¿Qué necesitas?</h3>
                <p>Escribe el tipo de pieza o comparte una referencia en el mensaje.</p>
              </article>
              <article className="buyer-step">
                <span className="step-num">03 — DETALLES</span>
                <h3>Cuéntanos sobre la obra</h3>
                <p>Agrega cualquier información que nos ayude a comprender el requerimiento.</p>
              </article>
            </div>
          </div>
        </section>

        <QuoteRequestForm />

        <section className="closing" aria-label="Resumen de servicio" data-testid="closing-summary">
          <div className="closing-inner">
            <div>
              <div className="eyebrow">Prefabricados · Querétaro</div>
              <h2>¿Qué necesita tu obra?</h2>
              <p>Cuéntanos del proyecto. Revisamos contigo los detalles de tu solicitud.</p>
            </div>
            <a className="closing-mark" href="#cotizacion" aria-label="Solicitar cotización" data-testid="closing-quote-link">
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer className="footer" data-testid="site-footer">
        <p>Prefabricados en Querétaro</p>
        <a href="#inicio" data-testid="footer-home">Volver al inicio</a>
        <a href="mailto:prefabricadoshuimilpan@gmail.com">prefabricadoshuimilpan@gmail.com</a>
      </footer>
    </div>
  );
}

export default App;
