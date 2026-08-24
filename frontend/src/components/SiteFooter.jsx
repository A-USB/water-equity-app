const YEAR = new Date().getFullYear();

export default function SiteFooter({ onContinue }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-top">
        <div className="site-footer-brand">
          <span className="site-footer-mark">Amazi<span aria-hidden="true">.</span></span>
          <p>A clearer picture of water access, built for the people who keep Rwanda flowing.</p>
          <div className="site-footer-socials" aria-label="Social media">
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" className="social-icon-fill" /></svg>
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4l14 16M19 4L5 20" /></svg>
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9v9M6 6.5v.01M10 18v-5a4 4 0 0 1 8 0v5M10 9v9" /></svg>
            </a>
            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 7.5a2.5 2.5 0 0 0-1.8-1.8C17.1 5.3 12 5.3 12 5.3s-5.1 0-6.7.4a2.5 2.5 0 0 0-1.8 1.8C3.1 9.1 3.1 12 3.1 12s0 2.9.4 4.5a2.5 2.5 0 0 0 1.8 1.8c1.6.4 6.7.4 6.7.4s5.1 0 6.7-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.5.4-4.5s0-2.9-.4-4.5Z" /><path d="m10 9 5 3-5 3Z" className="social-icon-fill" /></svg>
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" aria-label="Discord">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7.5a13 13 0 0 1 10 0 12 12 0 0 1 2 9.5 13 13 0 0 1-4-2M7 7.5a12 12 0 0 0-2 9.5 13 13 0 0 0 4 2M7 7.5l1-2 3 1M17 7.5l-1-2-3 1M8.5 14c.5.5 1.2.8 2 .8s1.5-.3 2-.8M15.5 14c-.5.5-1.2.8-2 .8s-1.5-.3-2-.8" /></svg>
            </a>
          </div>
        </div>

        <div className="site-footer-col">
          <p className="site-footer-heading">Explore</p>
          <a href="#how-it-works">How it works</a>
          <a href="#portals">The platform</a>
          <a href="#portals">Sector reporting</a>
          <a href="#portals">Live water data</a>
        </div>

        <div className="site-footer-col">
          <p className="site-footer-heading">For partners</p>
          <a href="#portals">Sector officials</a>
          <a href="#portals">WASAC teams</a>
          <button type="button" onClick={onContinue}>Sign in</button>
          <button type="button" onClick={onContinue}>Get started</button>
        </div>

        <div className="site-footer-col">
          <p className="site-footer-heading">Resources</p>
          <a href="https://www.wasac.rw" target="_blank" rel="noopener noreferrer">WASAC official site</a>
          <a href="#how-it-works">About Amazi</a>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {YEAR} Amazi. Built for equitable water access.</span>
        <div className="site-footer-legal">
          <a href="#how-it-works">Privacy</a>
          <a href="#how-it-works">Terms</a>
          <a href="#how-it-works">Accessibility</a>
        </div>
      </div>
    </footer>
  );
}
