import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar.jsx";

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-64 min-h-screen transition-all lg:ml-64">
        <Outlet />
      </div>
    </div>
  );
}
