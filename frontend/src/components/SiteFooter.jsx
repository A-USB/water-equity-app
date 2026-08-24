const YEAR = new Date().getFullYear();

export default function SiteFooter({ onContinue }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-top">
        <div className="site-footer-brand">
          <span className="home-nav-mark">Amazi</span>
          <p>Connecting Sector officials and WASAC to track water availability across Rwanda.</p>
        </div>

        <div className="site-footer-col">
          <p className="site-footer-heading">Platform</p>
          <a href="#how-it-works">How it works</a>
          <button type="button" onClick={onContinue}>Sign in</button>
          <button type="button" onClick={onContinue}>Sign up</button>
        </div>

        <div className="site-footer-col">
          <p className="site-footer-heading">Portals</p>
          <a href="#portals">Sector officials</a>
          <a href="#portals">WASAC</a>
        </div>

        <div className="site-footer-col">
          <p className="site-footer-heading">Resources</p>
          <a href="https://www.wasac.rw" target="_blank" rel="noopener noreferrer">WASAC official site</a>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {YEAR} Amazi — a water equity pilot for Rwanda.</span>
        <span>Built for equitable water access 💧</span>
      </div>
    </footer>
  );
}
