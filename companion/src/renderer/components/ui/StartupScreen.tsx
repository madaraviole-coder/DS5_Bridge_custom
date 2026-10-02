import { BridgeMark } from './BridgeMark';

export function StartupScreen({ ready }: { ready: boolean }) {
  return (
    <main className={`startup-screen ${ready ? 'ready' : ''}`} aria-live="polite">
      <section className="startup-card" aria-label="Starting DS5 Bridge">
        <div className="startup-brand">
          <BridgeMark />
          <div>
            <strong>DS5 Bridge</strong>
            <span>Starting companion</span>
          </div>
        </div>
        <div className="startup-progress" aria-hidden="true">
          <span />
        </div>
      </section>
    </main>
  );
}
