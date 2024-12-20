import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Navigation from './components/Navigation';
import Auth from './components/Auth';
import Home from './pages/Home';
import About from './pages/About';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Resources from './pages/Resources';
import Contact from './pages/Contact';
import './styles/main.css';

const App: React.FC = () => {
    return (
        <Router>
            <div>
                <Header />
                <Navigation />
                <Hero />
                <Switch>
                    <Route path="/" exact component={Home} />
                    <Route path="/about" component={About} />
                    <Route path="/features" component={Features} />
                    <Route path="/pricing" component={Pricing} />
                    <Route path="/resources" component={Resources} />
                    <Route path="/contact" component={Contact} />
                    <Route path="/auth" component={Auth} />
                </Switch>
            </div>
        </Router>
    );
};

export default App;