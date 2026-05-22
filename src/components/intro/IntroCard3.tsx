interface IntroCard3Props {
  playKey: number;
}

export function IntroCard3({ playKey }: IntroCard3Props) {
  return (
    <div className="intro-card intro-card--pwa intro-card--mobile" key={playKey}>
      <div className="intro-eyebrow">Pro tip</div>
      <h2 className="intro-title intro-title--rules">
        INSTALL FOR
        <br />
        MORE SPACE.
      </h2>
      <p className="intro-body">
        Add this site to your home screen for a fullscreen experience. No
        address bar, no browser menus, just more space for trivia.
      </p>

      <div className="intro-install-steps">
        <div className="intro-install-step">
          <span className="intro-install-platform">Chrome</span>
          <span className="intro-install-hint">
            &#8942; menu <span className="intro-install-arrow">&rsaquo;</span> Add
            to Home screen
          </span>
        </div>
        <div className="intro-install-step">
          <span className="intro-install-platform">Firefox</span>
          <span className="intro-install-hint">
            &#8942; menu <span className="intro-install-arrow">&rsaquo;</span> Add
            to Home screen
          </span>
        </div>
        <div className="intro-install-step">
          <span className="intro-install-platform">Safari</span>
          <span className="intro-install-hint">
            Share <span className="intro-install-arrow">&rsaquo;</span> Add to Home
            Screen
          </span>
        </div>
      </div>
    </div>
  );
}
