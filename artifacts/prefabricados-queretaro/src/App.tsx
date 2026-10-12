import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRequestQuote } from '@workspace/api-client-react';
import { ArrowRight, ArrowUpRight, ClipboardList, Layers3, MapPin, Send } from 'lucide-react';

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

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <Layers3 strokeWidth={1.7} />
    </span>
  );
}

function ConstructionDiagram() {
  return (
    <svg className="diagram" viewBox="0 0 460 330" fill="none" aria-hidden="true">
      <path d="M56 262H396M83 278H370M103 294H349" stroke="#E9E1D1" strokeOpacity=".42" strokeWidth="1" />
      <path d="M108 236V125L227 57L348 125V236H108Z" fill="#D8D3C2" fillOpacity=".12" stroke="#EEE7D8" strokeWidth="2" />
      <path d="M108 125L227 193L348 125M227 193V57" stroke="#EEE7D8" strokeWidth="2" />
      <path d="M138 142V225M168 159V225M198 176V225M257 176V225M287 159V225M317 142V225" stroke="#EEE7D8" strokeOpacity=".64" strokeWidth="1.5" />
      <path d="M100 113L227 40L356 113M95 245H359" stroke="#E77B4C" strokeWidth="2" />
      <path d="M82 113H61M82 245H61M68 119V239" stroke="#E77B4C" strokeWidth="1.4" />
      <path d="M59 113L55 120M59 113L63 120M59 245L55 238M59 245L63 238" stroke="#E77B4C" strokeWidth="1.4" />
      <path d="M374 125V236M367 125H382M367 236H382" stroke="#E77B4C" strokeWidth="1.4" />
      <circle cx="68" cy="180" r="17" fill="#E77B4C" />
      <path d="M63 180H73M68 175V185" stroke="white" strokeWidth="1.5" />
      <text x="46" y="104" fill="#F3EBDD" fontFamily="monospace" fontSize="10" letterSpacing="1">A—01</text>
      <text x="387" y="185" fill="#F3EBDD" fontFamily="monospace" fontSize="10" letterSpacing="1" transform="rotate(90 387 185)">REFERENCIA</text>
      <path d="M124 251V260M332 251V260M124 256H332" stroke="#E77B4C" strokeWidth="1" />
      <path d="M124 256L130 252M124 256L130 260M332 256L326 252M332 256L326 260" stroke="#E77B4C" strokeWidth="1" />
      <text x="208" y="272" fill="#F3EBDD" fontFamily="monospace" fontSize="9" letterSpacing="1">ESQUEMA ILUSTRATIVO</text>
    </svg>
  );
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
          <div className="eyebrow">Cuéntanos de tu proyecto</div>
          <h2 id="quote-heading">Solicita información para tu obra.</h2>
          <p>
            Comparte qué producto buscas y algunos detalles de tu proyecto. La información específica
            del catálogo aún está en preparación; puedes describir lo que necesitas en tu mensaje.
          </p>
          <div className="quote-aside">
            <span className="quote-aside-mark"><MapPin aria-hidden="true" /></span>
            <span><strong>Atención local</strong><small>Querétaro, México</small></span>
          </div>
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
      <header className="topbar" data-testid="site-header">
        <a className="brand" href="#inicio" aria-label="Prefabricados en Querétaro, inicio" data-testid="brand-home">
          <BrandMark />
          <span className="brand-name">
            Prefabricados
            <small>Querétaro · Construcción</small>
          </span>
        </a>
        <nav className="topnav" aria-label="Navegación principal">
          <a href="#oferta" data-testid="nav-oferta">La oferta</a>
          <a href="#catalogo" data-testid="nav-catalogo">Información de productos</a>
          <a className="nav-cta" href="#cotizacion" data-testid="nav-local">Solicita información</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="inicio" aria-labelledby="main-heading" data-testid="hero">
          <div className="hero-content">
            <div className="eyebrow reveal">Materiales para avanzar</div>
            <h1 className="reveal-delay" id="main-heading">
              Prefabricados en <span>Querétaro</span>
            </h1>
            <p className="hero-copy reveal-delay">
              Un punto de partida local para encontrar prefabricados para construcción en Querétaro.
              Información clara para profesionales de obra, sin rodeos.
            </p>
            <div className="hero-actions">
              <a className="button-primary" href="#oferta" data-testid="hero-offer-link">
                Conoce la oferta <ArrowRight aria-hidden="true" />
              </a>
              <span className="hero-note">Suministro local · Querétaro, México</span>
            </div>
          </div>
          <div className="visual-wrap" aria-label="Esquema arquitectónico ilustrativo">
            <div className="visual-plate">
              <ConstructionDiagram />
              <span className="plate-label">Construcción · Prefabricados</span>
            </div>
            <div className="visual-index">QRO / 01</div>
            <div className="visual-caption"><span className="caption-dot" />Referencia gráfica, no a escala</div>
          </div>
        </section>

        <aside className="local-band" id="ubicacion" data-testid="local-coverage">
          <strong className="local-marker"><MapPin aria-hidden="true" /> Un proveedor local para tus proyectos</strong>
          <span>Querétaro, México</span>
        </aside>

        <section className="section" id="oferta" aria-labelledby="offer-heading" data-testid="offer-section">
          <div className="section-inner">
            <div className="section-heading">
              <div className="eyebrow">Qué encontrarás aquí</div>
              <div>
                <h2 id="offer-heading">Prefabricados para construcción en <em>un solo lugar.</em></h2>
                <p>
                  Este negocio vende productos prefabricados para construcción en Querétaro.
                  La página está pensada para que constructores y profesionales ubiquen rápido
                  el tipo de proveedor que buscan.
                </p>
              </div>
            </div>
            <div className="offer-grid">
              <article className="offer-panel primary-panel" data-testid="offer-overview">
                <div className="panel-topline">
                  <span className="panel-number">01 / OFERTA</span>
                  <span className="panel-tag">Para profesionales de obra</span>
                </div>
                <h3>Soluciones prefabricadas para construcción</h3>
                <p>
                  Un proveedor local de prefabricados en Querétaro. Consulta aquí la información
                  general mientras preparamos los detalles de cada producto.
                </p>
                <div className="panel-rule" />
                <div className="panel-foot">
                  <span>Enfoque local</span><span>Información en preparación</span>
                </div>
              </article>
              <article className="offer-panel" data-testid="offer-for-buyers">
                <div className="panel-topline">
                  <span className="panel-number">02 / PARA TU OBRA</span>
                  <span className="panel-tag">Consulta directa</span>
                </div>
                <h3>Primero, ubica lo que necesitas</h3>
                <p>
                  Si estás buscando prefabricados para una obra, la información de producto se
                  incorporará en una próxima actualización para ayudarte a revisar la oferta con más detalle.
                </p>
                <div className="panel-rule" />
                <div className="panel-foot">
                  <span>Sin datos por confirmar</span><span>Próxima actualización</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section catalog-section" id="catalogo" aria-labelledby="catalog-heading" data-testid="catalog-section">
          <div className="catalog-card">
            <div className="catalog-copy">
              <div className="eyebrow">Catálogo en preparación</div>
              <h2 id="catalog-heading">La información detallada viene en camino.</h2>
              <p>
                El catálogo y las fichas de producto se están preparando y se agregarán en una
                próxima actualización. Por ahora, aquí puedes identificar el enfoque: venta de
                prefabricados para construcción en Querétaro.
              </p>
            </div>
            <div className="catalog-status" data-testid="catalog-status" aria-label="Catálogo en preparación">
              <ClipboardList aria-hidden="true" />
              <span>En preparación</span>
            </div>
          </div>
        </section>

        <section className="section buyer-section" aria-labelledby="buyer-heading" data-testid="buyer-section">
          <div className="section-inner">
            <div className="buyer-intro">
              <div className="eyebrow">Claro desde el inicio</div>
              <h2 id="buyer-heading">Lo esencial para decidir si seguir.</h2>
              <p>Una visita útil empieza con información directa. Esto es lo que ya puedes saber:</p>
            </div>
            <div className="buyer-steps">
              <article className="buyer-step">
                <span className="step-num">01 — UBICACIÓN</span>
                <h3>Querétaro, México</h3>
                <p>La oferta está dirigida a quienes buscan un proveedor local de prefabricados en Querétaro.</p>
              </article>
              <article className="buyer-step">
                <span className="step-num">02 — ENFOQUE</span>
                <h3>Productos para construcción</h3>
                <p>El negocio se dedica a vender productos prefabricados para construcción.</p>
              </article>
              <article className="buyer-step">
                <span className="step-num">03 — SIGUIENTE PASO</span>
                <h3>Detalles en próxima actualización</h3>
                <p>El catálogo y la información específica de productos están en preparación.</p>
              </article>
            </div>
          </div>
        </section>

        <QuoteRequestForm />

        <section className="closing" aria-label="Resumen de servicio" data-testid="closing-summary">
          <div className="closing-inner">
            <div>
              <div className="eyebrow">Prefabricados · Querétaro</div>
              <h2>Una referencia local para tu búsqueda.</h2>
              <p>Productos prefabricados para construcción. Más información próximamente.</p>
            </div>
            <a className="closing-mark" href="#cotizacion" aria-label="Solicitar información" data-testid="closing-quote-link">
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer className="footer" data-testid="site-footer">
        <p>Prefabricados en Querétaro</p>
        <a href="#inicio" data-testid="footer-home">Volver al inicio ↑</a>
        <p>Información general · Catálogo en preparación</p>
      </footer>
    </div>
  );
}

export default App;
