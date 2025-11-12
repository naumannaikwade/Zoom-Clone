import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components
import Header from './components/Header/Header';

import Hero from './components/Hero/Hero';
import Stats from './components/Stats/Stats';
import Solutions from './components/Solutions/Solutions';
import Products from './components/Products/Products';
import Pricing from './components/Pricing/Pricing';
import Resources from './components/Resources/Resources';

import Footer from './components/Footer/Footer';

import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
          <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <>
                <Hero />
                <Stats />
                <Solutions />
                <Products />
                <Pricing />
                <Resources />
              </>
            } />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/products" element={<Products />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/resources" element={<Resources />} />
          </Routes>
        </main>
         <Footer />
      </div>
    </Router>
  );
}

export default App;