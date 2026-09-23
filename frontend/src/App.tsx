import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import MapView from "./pages/MapView";
import Terrain3D from "./pages/Terrain3D";
import WashRisk from "./pages/WashRisk";
import ResponseZones from "./pages/ResponseZones";
import Communities from "./pages/Communities";
import Infrastructure from "./pages/Infrastructure";
import AIAnalysis from "./pages/AIAnalysis";
import Reports from "./pages/Reports";
import Methodology from "./pages/Methodology";
import DataSources from "./pages/DataSources";
import SystemStatus from "./pages/SystemStatus";

function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)] md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/terrain-3d" element={<Terrain3D />} />
          <Route path="/wash-risk" element={<WashRisk />} />
          <Route path="/response-zones" element={<ResponseZones />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/infrastructure" element={<Infrastructure />} />
          <Route path="/ai-analysis" element={<AIAnalysis />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/data-sources" element={<DataSources />} />
          <Route path="/system-status" element={<SystemStatus />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
