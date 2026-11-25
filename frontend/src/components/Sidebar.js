// FILE: frontend/src/components/Sidebar.js
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

// Each item has its own unique route — no duplicates
const NAV = [
  { to:"/dashboard",  icon:"📊", label:"Dashboard"  },
  { to:"/simulation", icon:"🎮", label:"Simulation"  },
  { to:"/map",        icon:"🗺️", label:"Map View"   },
  { to:"/analytics",  icon:"📈", label:"Analytics"   },
  { to:"/scenarios",  icon:"🔀", label:"Scenarios"   },
  { to:"/reports",    icon:"📋", label:"Reports"     },
  { to:"/settings",   icon:"⚙️", label:"Settings"   },
];

const WORKFLOW = [
  { num:1, label:"Home",       sub:"Start here"       },
  { num:2, label:"Simulation", sub:"Set Inputs"        },
  { num:3, label:"Processing", sub:"AI is thinking"    },
  { num:4, label:"Results",    sub:"View predictions"  },
  { num:5, label:"Explore",    sub:"Map / Analysis"    },
  { num:6, label:"Report",     sub:"Download & share"  },
  { num:7, label:"Settings",   sub:"Customize system"  },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => navigate("/")}>
        <span className="sidebar-logo-icon">🌍</span>
        <span className="sidebar-logo-text">AI Future<br /><b>Earth Simulator</b></span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => "sidebar-item" + (isActive ? " active" : "")}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-status">
        <div className="status-title">System Status</div>
        <div className="status-row">
          <span className="status-dot green"></span>
          <span className="status-text">AI Systems</span>
        </div>
        <div className="status-row">
          <span className="status-dot green"></span>
          <span className="status-text">Operational</span>
        </div>
      </div>
    </aside>
  );
}
