import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import AddTicketModal from "./AddTicketModal";
import ViewJobs from "./ViewJobs";
import TechnicianRatings from "./TechnicianRatings";
import IntelligentAddTicketModal from "./IntelligentAddTicketModal";
import SettingsModal from "./SettingsModal";
import PerformanceView from "./PerformanceView";
import { WebhookStatus, TicketStatus } from "../types";

const AdminDashboard: React.FC<{ onViewTicket: (id: string) => void }> = ({
  onViewTicket,
}) => {
  // ✅ SAFE DEFAULTS
  const ctx = useAppContext();

  const user = ctx.user;
  const logout = ctx.logout ?? (() => {});
  const fetchLatestData = ctx.fetchLatestData ?? (() => {});
  const technicians = ctx.technicians ?? [];
  const tickets = ctx.tickets ?? [];
  const webhookStatus = ctx.webhookStatus ?? WebhookStatus.Unknown;
  const checkWebhookHealth = ctx.checkWebhookHealth ?? (() => {});
  const isSyncing = ctx.isSyncing ?? false;

  const [activeView, setActiveView] = useState("jobs");
  const [showManual, setShowManual] = useState(false);
  const [showIntel, setShowIntel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const onlineCount = useMemo(() => {
    const fiveMins = 5 * 60 * 1000;
    return technicians.filter(
      (t: any) =>
        t.lastSeen &&
        Date.now() - new Date(t.lastSeen).getTime() < fiveMins
    ).length;
  }, [technicians]);



  const counts = useMemo(
    () => ({
      new: tickets.filter((t: any) => t.status === TicketStatus.New).length,
      pending: tickets.filter(
        (t: any) => t.status === TicketStatus.InProgress
      ).length,
      completed: tickets.filter(
        (t: any) => t.status === TicketStatus.Completed
      ).length,
    }),
    [tickets]
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Dashboard</h1>

      <p>
        Live Technicians: <b>{onlineCount}</b> | Webhook:{" "}
        <b>{webhookStatus}</b>
      </p>

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button onClick={() => fetchLatestData()} disabled={isSyncing}>
          {isSyncing ? "Syncing..." : "Refresh"}
        </button>
        <button onClick={() => setShowManual(true)}>New Ticket</button>
        <button onClick={() => setShowIntel(true)}>AI Scan</button>
        <button onClick={() => setShowSettings(true)}>Settings</button>
        <button onClick={logout}>Logout</button>
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setActiveView("jobs")}>Jobs</button>
        <button onClick={() => setActiveView("performance")}>
          Performance
        </button>
        <button onClick={() => setActiveView("ratings")}>Ratings</button>
      </div>

      <div style={{ marginTop: 20 }}>
        {activeView === "jobs" && (
          <ViewJobs onViewTicket={onViewTicket} />
        )}
        {activeView === "ratings" && <TechnicianRatings />}
        {activeView === "performance" && <PerformanceView />}
      </div>

      {showManual && <AddTicketModal onClose={() => setShowManual(false)} />}
      {showIntel && (
        <IntelligentAddTicketModal
          mode="text"
          onClose={() => setShowIntel(false)}
          onParsed={() => {
            setShowIntel(false);
            setShowManual(true);
          }}
        />
      )}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default AdminDashboard;
