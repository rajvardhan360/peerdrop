import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Session from "./pages/Session";
import Join from "./pages/Join";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session/:roomCode" element={<Session />} />
        <Route path="/join/:roomCode" element={<Join />} />
      </Routes>
    </Router>
  );
}

export default App;