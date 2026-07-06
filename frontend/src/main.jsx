import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles/global.css';

// Buttery smooth scrolling (Framer-like), synced with GSAP ScrollTrigger.
gsap.registerPlugin(ScrollTrigger);
const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
import './styles/app.css';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Landing from './pages/Landing.jsx';
import Services from './pages/Services.jsx';
import Track from './pages/Track.jsx';
import Admin from './pages/Admin.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { AuthProvider } from './lib/auth.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/services" element={<Services />} />
          <Route path="/track" element={<Track />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
