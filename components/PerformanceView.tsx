import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Technician, TicketStatus } from '../types';

// Helper function to check if a date is today
const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
           someDate.getMonth() === today.getMonth() &&
           someDate.getFullYear() === today.getFullYear();
};

const PerformanceView: React.FC = () => {
    const { technicians, tickets, resetAllTechnicianPoints } = useAppContext();

    // --- Daily Performance Metrics ---
    const ticketsToday = tickets.filter(t => isToday(t.createdAt) || (t.completedAt && isToday(t.completedAt)));
    
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
        
    const technicianPerformance = technicians.map(tech => {
        const completedJobs = ticketsToday.filter(
            t => t.technicianId === tech.id && t.status === TicketStatus.Completed
        ).length;
        return { ...tech, completedJobs };
    }).sort((a, b) => b.completedJobs - a.completedJobs);
    
    const maxJobs = Math.max(...technicianPerformance.map(t => t.completedJobs), 1); // Avoid division by zero

    // --- Leaderboard Metrics ---
    const sortedTechnicians = [...technicians].sort((a, b) => b.points - a.points);

    // --- Chart Components & Styling ---
    const statusColors: Record<string, string> = {
        [TicketStatus.New]: '#007aff', // glen-blue
        [TicketStatus.InProgress]: '#ff9500', // orange
        [TicketStatus.Completed]: '#34c759', // green
        [TicketStatus.Cancelled]: '#8e8e93', // gray
    };

    const pieChartGradient = () => {
        if (totalToday === 0) return 'conic-gradient(#e5e7eb 0% 100%)';
        
        const newPercent = (newToday / totalToday) * 100;
        const inProgressPercent = (inProgressToday / totalToday) * 100;
        const completedPercent = (completedToday / totalToday) * 100;

        let gradientParts = [];
        let currentPercent = 0;

        if (newPercent > 0) {
            gradientParts.push(`${statusColors.New} ${currentPercent}% ${currentPercent + newPercent}%`);
            currentPercent += newPercent;
        }
        if (inProgressPercent > 0) {
            gradientParts.push(`${statusColors.InProgress} ${currentPercent}% ${currentPercent + inProgressPercent}%`);
            currentPercent += inProgressPercent;
        }
        if (completedPercent > 0) {
            gradientParts.push(`${statusColors.Completed} ${currentPercent}% ${currentPercent + completedPercent}%`);
            currentPercent += completedPercent;
        }
        
        if (currentPercent < 100) {
            gradientParts.push(`#e5e7eb ${currentPercent}% 100%`);
        }

        return `conic-gradient(${gradientParts.join(', ')})`;
    };
    
    const getRankBG = (index: number) => {
        switch (index) {
            case 0: return 'bg-yellow-300'; // Gold
            case 1: return 'bg-gray-300'; // Silver
            case 2: return 'bg-yellow-600/70'; // Bronze
            default: return 'bg-gray-100';
        }
    };
    
     const getRankTextColor = (index: number) => {
        switch (index) {
            case 0: return 'text-yellow-800'; // Gold
            case 1: return 'text-gray-800'; // Silver
            case 2: return 'text-yellow-900'; // Bronze
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-800">Today's Performance Snapshot</h3>
                <p className="text-sm text-gray-500">A real-time summary of today's operations.</p>
            </div>
            
            {/* --- Summary Cards --- */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard title="Total Jobs Today" value={totalToday} />
                <StatCard title="Jobs Completed" value={completedToday} color="text-green-500" />
                <StatCard title="Revenue Today" value={`₹${totalRevenueToday.toLocaleString('en-IN')}`} color="text-glen-blue" />
            </div>

            {/* --- Charts --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h4 className="font-bold text-gray-700 mb-4 text-center">Status Distribution</h4>
                    <div className="flex justify-center items-center space-x-6">
                        <div style={{ background: pieChartGradient() }} className="w-28 h-28 rounded-full"></div>
                        <div className="text-sm space-y-2">
                            <LegendItem color={statusColors.New} label="New" value={newToday} />
                            <LegendItem color={statusColors.InProgress} label="In Progress" value={inProgressToday} />
                            <LegendItem color={statusColors.Completed} label="Completed" value={completedToday} />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h4 className="font-bold text-gray-700 mb-4 text-center">Technician Performance (Jobs Completed)</h4>
                    <div className="space-y-3">
                        {technicianPerformance.map(tech => (
                             <div key={tech.id} className="w-full">
                                <div className="flex justify-between items-center mb-1 text-sm">
                                    <span className="font-semibold text-gray-600">{tech.name}</span>
                                    <span className="font-bold text-glen-blue">{tech.completedJobs}</span>
                                </div>
                                <div className="h-4 bg-gray-200 rounded-full">
                                    <div style={{ width: `${(tech.completedJobs / maxJobs) * 100}%` }} className="h-4 bg-glen-blue rounded-full transition-all duration-500"></div>
                                </div>
                            </div>
                        ))}
                         {technicianPerformance.every(t => t.completedJobs === 0) && <p className="text-center text-gray-500 text-sm py-4">No jobs completed today.</p>}
                    </div>
                </div>
            </div>


            {/* --- Leaderboard (existing component) --- */}
            <div className="border-t pt-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Technician Leaderboard (All-Time)</h3>
                    <button 
                        onClick={resetAllTechnicianPoints}
                        className="bg-glen-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                        Reset All Points
                    </button>
                </div>
                
                {sortedTechnicians.length > 0 ? (
                    <div className="space-y-3 mt-4">
                        {sortedTechnicians.map((tech, index) => (
                            <div key={tech.id} className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${getRankBG(index)} ${getRankTextColor(index)}`}>
                                   {index + 1}
                               </div>
                               <div className="ml-4 flex-grow">
                                   <p className="font-semibold text-gray-800">{tech.name}</p>
                                   <p className="text-sm text-gray-500">ID: {tech.id}</p>
                               </div>
                               <div className="text-right">
                                    <p className="text-2xl font-bold text-glen-blue">{tech.points}</p>
                                    <p className="text-xs text-gray-400">POINTS</p>
                               </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        <p>No technicians available to display.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Helper Components for Charts ---
const StatCard: React.FC<{ title: string; value: string | number; color?: string }> = ({ title, value, color = 'text-gray-800' }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
);

const LegendItem: React.FC<{ color: string; label: string; value: number }> = ({ color, label, value }) => (
    <div className="flex items-center">
        <div style={{ backgroundColor: color }} className="w-3 h-3 rounded-full mr-2"></div>
        <span className="flex-grow text-gray-600">{label}</span>
        <span className="font-bold text-gray-800">{value}</span>
    </div>
);


export default PerformanceView;
