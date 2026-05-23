import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Join from "./pages/Join";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join/:roomCode" element={<Join />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;