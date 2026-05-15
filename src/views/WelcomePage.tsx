import { RipsLogo } from '../components/RipsLogo';

interface Props {
  onLogin: () => void;
}

export function WelcomePage({ onLogin }: Props) {
  return (
    <div className="welcome-page">
      <nav className="welcome-nav">
        <RipsLogo size={28} bg="var(--paper)" />
        <button className="rips-btn" onClick={onLogin}>Logg inn</button>
      </nav>
      <div className="welcome-hero">
        <div className="welcome-content">
          <div className="welcome-eyebrow">Risikostyring · Norge · 2026</div>
          <h1 className="welcome-headline">Se risiko <em>klart.</em></h1>
          <p className="welcome-lede">
            Rips er et stille verktøy for arbeidet som ikke tåler kaos: kartlegg risiko, eie tiltak, og legg sporet ned for revisor — uten å heve stemmen.
          </p>
          <div className="welcome-actions">
            <button className="rips-btn" style={{ padding:'11px 24px', fontSize:15 }} onClick={onLogin}>Logg inn</button>
          </div>
          <div className="welcome-meta">
            <div><span className="cap">Samlinger</span><span className="welcome-val">Ubegrenset</span></div>
            <div><span className="cap">Risikomatrise</span><span className="welcome-val">Innebygd</span></div>
            <div><span className="cap">Tiltak</span><span className="welcome-val">Med frist og eier</span></div>
          </div>
        </div>
        <img className="welcome-cluster" src="assets/rips-cluster-large.svg" alt="" />
      </div>
    </div>
  );
}
