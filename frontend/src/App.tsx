import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
// Placeholder imports for now
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { Create } from './pages/Create';
import { Portfolio } from './pages/Portfolio';
import { Detail } from './pages/Detail';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/create" element={<Create />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/asset/:id" element={<Detail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
