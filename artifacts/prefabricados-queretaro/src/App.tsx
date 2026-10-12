import { ArrowRight, ArrowUpRight, ClipboardList, Layers3, MapPin } from 'lucide-react';

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
          <a className="nav-cta" href="#ubicacion" data-testid="nav-local">Atención en Querétaro</a>
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

        <section className="closing" aria-label="Resumen de servicio" data-testid="closing-summary">
          <div className="closing-inner">
            <div>
              <div className="eyebrow">Prefabricados · Querétaro</div>
              <h2>Una referencia local para tu búsqueda.</h2>
              <p>Productos prefabricados para construcción. Más información próximamente.</p>
            </div>
            <a className="closing-mark" href="#inicio" aria-label="Volver al inicio" data-testid="back-to-top">
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
