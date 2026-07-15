import './App.css';

const features = [
  {
    title: 'Video and audio',
    description: 'Meet with camera and microphone controls built into the room.',
  },
  {
    title: 'Screen sharing',
    description: 'Share your screen with everyone in the current meeting.',
  },
  {
    title: 'Meeting chat',
    description: 'Send messages and review the recent chat while you meet.',
  },
  {
    title: 'Host controls',
    description: 'Hosts can end a meeting for everyone; participants can leave at any time.',
  },
];

// Local development
// const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

// Vercel deployment
const appUrl = import.meta.env.VITE_APP_URL || 'https://xzoom-by-nauman.vercel.app';
const registerUrl = new URL('/register', appUrl).toString();
const loginUrl = new URL('/login', appUrl).toString();

function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="XZoom home">
          <img src="/xzoom-logo.svg" alt="XZoom" />
        </a>
        <nav aria-label="Primary navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a className="nav-action" href={loginUrl}>Sign in</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Simple video meetings</p>
            <h1 id="hero-title">
              Meet, share, and chat <span>in one room.</span>
            </h1>
            <p className="hero-description">
              Create a meeting, share its code, and talk with your team from the browser.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href={registerUrl}>Create an account</a>
              <a className="button button-secondary" href={loginUrl}>Sign in</a>
            </div>
          </div>

          <div className="meeting-preview" aria-label="Illustration of an XZoom meeting room">
            <div className="preview-header">
              <span>Team meeting</span>
              <span className="meeting-code">A1B2C3D4</span>
            </div>
            <div className="video-grid">
              <div className="video-tile video-tile-primary"><span>You</span></div>
              <div className="video-tile"><span>Participant</span></div>
            </div>
            <div className="meeting-controls" aria-hidden="true">
              <span>Mic</span>
              <span>Camera</span>
              <span>Share</span>
              <span>Chat</span>
            </div>
          </div>
        </section>

        <section className="section" id="features" aria-labelledby="features-title">
          <div className="section-heading">
            <p className="eyebrow">What is included</p>
            <h2 id="features-title">Everything currently available in XZoom.</h2>
          </div>
          <div className="feature-grid">
            {features.map((feature, index) => (
              <article className="feature-card" key={feature.title}>
                <span className="feature-number" aria-hidden="true">0{index + 1}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section steps" id="how-it-works" aria-labelledby="steps-title">
          <div className="section-heading">
            <p className="eyebrow">How it works</p>
            <h2 id="steps-title">Start a meeting in three steps.</h2>
          </div>
          <ol>
            <li><strong>Create an account.</strong><span>Sign up or sign in to open your dashboard.</span></li>
            <li><strong>Create or join.</strong><span>Start a meeting or enter a meeting code.</span></li>
            <li><strong>Allow your devices.</strong><span>Choose camera and microphone access, then meet.</span></li>
          </ol>
          <p className="history-note">Your dashboard keeps a list of meetings you created.</p>
        </section>

        <section className="final-callout" aria-labelledby="callout-title">
          <div>
            <p className="eyebrow">Ready when you are</p>
            <h2 id="callout-title">Open XZoom and start a meeting.</h2>
          </div>
          <a className="button button-primary" href={registerUrl}>Get started</a>
        </section>
      </main>

      <footer>
        <span>XZoom</span>
        <span>Browser-based video meetings.</span>
      </footer>
    </div>
  );
}

export default App;
