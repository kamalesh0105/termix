import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import DashBoard from "./pages/DashBoard.jsx";
import Hero from "./pages/Hero.jsx";
import Termix from "./pages/Termix.jsx";
const App = () => {
  return (
    <>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Hero />}></Route>
          <Route path="/dashboard" element={<DashBoard />}></Route>
          <Route path="/terminal" element={<Termix />}></Route>
        </Routes>
      </Router>
    </>
  );
};

export default App;
