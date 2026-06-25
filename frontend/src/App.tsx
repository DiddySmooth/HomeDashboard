import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}
