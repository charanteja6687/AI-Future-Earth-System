// FILE: frontend/src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Navbar      from "./components/Navbar";
import Sidebar     from "./components/Sidebar";
import Home        from "./pages/Home";
import Dashboard   from "./pages/Dashboard";
import Simulation  from "./pages/Simulation";
import MapPage     from "./pages/MapPage";
import Analytics   from "./pages/Analytics";
import Scenarios   from "./pages/Scenarios";
import Reports     from "./pages/Reports";
import Settings    from "./pages/Settings";
import "./App.css";

function Layout({ children }) {
  return (
    <div className="app-layout">

    {/* Background Video */}
    <video
        className="dashboard-video"
        autoPlay
        muted
        loop
        playsInline
    >
        <source src="/videos/bg.mp4" type="video/mp4" />
    </video>

    {/* Dark Overlay */}
    <div className="dashboard-overlay"></div>

    <Sidebar />

    <div className="app-main">
        <Navbar />

        <div className="app-content">
            {children}
        </div>
    </div>

</div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/dashboard"  element={<Layout><Dashboard /></Layout>} />
          <Route path="/simulation" element={<Layout><Simulation /></Layout>} />
          <Route path="/map"        element={<Layout><MapPage /></Layout>} />
          <Route path="/analytics"  element={<Layout><Analytics /></Layout>} />
          <Route path="/scenarios"  element={<Layout><Scenarios /></Layout>} />
          <Route path="/reports"    element={<Layout><Reports /></Layout>} />
          <Route path="/settings"   element={<Layout><Settings /></Layout>} />
        </Routes>
      </Router>
    </AppProvider>
  );
}