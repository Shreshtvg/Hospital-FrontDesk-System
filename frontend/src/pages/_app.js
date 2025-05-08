// src/pages/_app.js

import '../globals.css'; // Import global CSS once here

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
