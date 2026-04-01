
import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Technician, TicketStatus } from '../types';

// Helper function to check if a date is today
const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
           someDate.getMonth() === today.getMonth() &&
           someDate.getFullYear() === today.getFullYear();
};

// Helper for monthly stats
const isThisMonth = (someDate?: Date) => {
    if (!someDate) return false;
    const today = new Date();
    return someDate.getMonth() === today.getMonth() &&
           someDate.getFullYear() === today.getFullYear();
};

const PerformanceView: React.FC = () => {
    const { technicians, tickets, resetAllTechnicianPoints } = useAppContext();

    // --- Daily Performance Metrics ---
    const ticketsToday = tickets.filter(t => isToday(new Date(t.createdAt)) || (t.completedAt && isToday(new Date(t.completedAt))));
    
    const statusCounts = ticketsToday.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
    }, {} as Record<TicketStatus, number>);

    const newToday = statusCounts[TicketStatus.New] || 0;
    const inProgressToday = statusCounts[TicketStatus.InProgress] || 0;
    const completedToday = statusCounts[TicketStatus.Completed] || 0;
    const totalToday = ticketsToday.length;

    const totalRevenueToday = ticketsToday
        .filter(t => t.status === TicketStatus.Completed && t.amountCollected)
        .reduce((sum, t) => sum + (t.amountCollected || 0), 0);

    // --- MONTHLY ANALYTICS (NEW) ---
    const monthlyStats = useMemo(() => {
        const monthTickets = tickets.filter(t => isThisMonth(new Date(t.createdAt)));
        const completedMonth = monthTickets.filter(t => t.status === TicketStatus.Completed);
        const revenue = completedMonth.reduce((sum, t) => sum + (Number(t.amountCollected) || 0), 0);
        
        // Best Technician this month
        const techCounts: Record<string, number> = {};
        completedMonth.forEach(t => {
            if (t.technicianId) techCounts[t.technicianId] = (techCounts[t.technicianId] || 0) + 1;
        });
        
        let bestTechId = '';
        let maxCompleted = 0;
        Object.entries(techCounts).forEach(([id, count]) => {
            if (count > maxCompleted) {
                maxCompleted = count;
                bestTechId = id;
            }
        });
        
        const bestTech = technicians.find(t => t.id === bestTechId);

        return {
            given: monthTickets.length,
            completed: completedMonth.length,
            pending: monthTickets.filter(t => t.status !== TicketStatus.Completed && t.status !== TicketStatus.Cancelled).length,
            escalated: monthTickets.filter(t => t.isEscalated).length,
            revenue,
            bestTech: bestTech?.name || 'N/A',
            bestTechJobs: maxCompleted
        };
    }, [tickets, technicians]);

    const [showMonthlyReport, setShowMonthlyReport] = React.useState(false);
        
    const technicianPerformance = technicians.map(tech => {
        const completedJobs = ticketsToday.filter(
            t => String(t.technicianId) === String(tech.id) && t.status === TicketStatus.Completed
        ).length;
        return { ...tech, completedJobs };
    }).sort((a, b) => b.completedJobs - a.completedJobs);
    
    const maxJobs = Math.max(...technicianPerformance.map(t => t.completedJobs), 1);

    // Leaderboard
    const sortedTechnicians = [...technicians].sort((a, b) => b.points - a.points);

    // Styles
    const statusColors: Record<string, string> = {
        [TicketStatus.New]: '#007aff',
        [TicketStatus.InProgress]: '#ff9500',
        [TicketStatus.Completed]: '#34c759',
        [TicketStatus.Cancelled]: '#8e8e93',
    };

    const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 tracking-tight">Daily Snapshot</h3>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{new Date().toDateString()}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard title="Jobs Today" value={totalToday} />
                <StatCard title="Completed" value={completedToday} color="text-green-500" />
                <StatCard title="Revenue" value={`₹${totalRevenueToday}`} color="text-glen-blue" />
            </div>

            {/* --- MONTHLY SCOREBOARD (NEW) --- */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl text-white shadow-xl shadow-indigo-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h4 className="text-sm font-bold opacity-70 uppercase tracking-widest">Monthly Performance</h4>
                        <p className="text-2xl font-bold">{currentMonthName} Overview</p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-xl">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold">{monthlyStats.given}</p>
                        <p className="text-[10px] font-bold opacity-60 uppercase">Jobs Given</p>
                    </div>
                    <div className="text-center border-x border-white/10">
                        <p className="text-3xl font-bold">{monthlyStats.completed}</p>
                        <p className="text-[10px] font-bold opacity-60 uppercase">Completed</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold">{monthlyStats.pending}</p>
                        <p className="text-[10px] font-bold opacity-60 uppercase">Pending</p>
                    </div>
                </div>
                {monthlyStats.escalated > 0 && (
                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="opacity-70">Escalated Requests (Quality Issues):</span>
                        <span className="bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">{monthlyStats.escalated} Tickets</span>
                    </div>
                )}
                
                <button 
                   onClick={() => setShowMonthlyReport(true)}
                   className="w-full mt-6 bg-white/20 hover:bg-white/30 text-white py-3 rounded-2xl font-bold transition-all border border-white/10 flex items-center justify-center space-x-2"
                >
                    <span>📊</span>
                    <span>View Monthly P&L Report</span>
                </button>
            </div>

            {showMonthlyReport && (
                <MonthlyReportModal 
                    stats={monthlyStats} 
                    monthName={currentMonthName} 
                    onClose={() => setShowMonthlyReport(false)} 
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-700 mb-4 text-xs uppercase tracking-widest px-1">Staff Daily Output</h4>
                    <div className="space-y-4">
                        {technicianPerformance.map(tech => (
                             <div key={tech.id} className="w-full">
                                <div className="flex justify-between items-center mb-1 text-sm">
                                    <span className="font-semibold text-gray-600">{tech.name}</span>
                                    <span className="font-bold text-glen-blue">{tech.completedJobs}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div style={{ width: `${(tech.completedJobs / maxJobs) * 100}%` }} className="h-full bg-glen-blue rounded-full transition-all duration-700"></div>
                                </div>
                            </div>
                        ))}
                         {technicianPerformance.every(t => t.completedJobs === 0) && <p className="text-center text-gray-400 text-xs py-8 italic bg-gray-50 rounded-xl border border-dashed">No jobs closed yet today.</p>}
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-700 mb-6 text-xs uppercase tracking-widest text-center">Leaderboard Points</h4>
                    <div className="space-y-4">
                        {sortedTechnicians.slice(0, 5).map((tech, index) => (
                            <div key={tech.id} className="flex items-center space-x-4">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 text-gray-400'}`}>
                                   {index + 1}
                               </div>
                               <div className="flex-grow">
                                   <p className="text-sm font-bold text-gray-800 leading-tight">{tech.name}</p>
                                   <div className="h-1 bg-gray-50 mt-1.5 rounded-full overflow-hidden">
                                       <div style={{ width: `${Math.min(100, (tech.points / 1000) * 100)}%` }} className="h-full bg-indigo-500 rounded-full"></div>
                                   </div>
                               </div>
                               <div className="text-right">
                                    <p className="text-sm font-bold text-indigo-600">{tech.points}</p>
                               </div>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={resetAllTechnicianPoints}
                        className="w-full mt-6 py-2 text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest border border-dashed border-red-100 rounded-xl hover:bg-red-50 transition-colors"
                    >
                        Reset All Performance Points
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string | number; color?: string }> = ({ title, value, color = 'text-gray-800' }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
);

const MonthlyReportModal: React.FC<{ stats: any, monthName: string, onClose: () => void }> = ({ stats, monthName, onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="bg-indigo-600 p-6 text-white relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white">✕</button>
                <h3 className="text-2xl font-bold">Monthly P&L Report</h3>
                <p className="text-white/70 uppercase text-[10px] font-black tracking-widest mt-1">Period: {monthName} {new Date().getFullYear()}</p>
            </div>
            
            <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Total Revenue</p>
                        <p className="text-2xl font-black text-indigo-600">₹{stats.revenue.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-green-500 font-bold mt-1">✓ Collected</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">Best Performer</p>
                        <p className="text-lg font-black text-indigo-700 truncate">{stats.bestTech}</p>
                        <p className="text-[10px] text-indigo-400 font-bold mt-1">{stats.bestTechJobs} Jobs Done</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Job Statistics</h4>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Tickets Raised (New)</span>
                        <span className="font-bold text-gray-800">{stats.given}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Tickets Completed</span>
                        <span className="font-bold text-green-600">{stats.completed}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Tickets Pending</span>
                        <span className="font-bold text-orange-500">{stats.pending}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Quality Escalations</span>
                        <span className="font-bold text-red-500">{stats.escalated}</span>
                    </div>
                </div>

                <div className="pt-6">
                    <button onClick={() => window.print()} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-2xl font-bold text-sm transition-all">
                        📄 Download/Print Report
                    </button>
                    <button onClick={onClose} className="w-full mt-3 text-xs text-gray-400 font-bold uppercase tracking-widest hover:text-gray-600">
                        Close Report
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default PerformanceView;
