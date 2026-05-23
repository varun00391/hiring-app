import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar.jsx";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}
