import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Technician } from '../types';

const PerformanceView: React.FC = () => {
    const { technicians, resetAllTechnicianPoints } = useAppContext();

    // Sort technicians by points in descending order
    const sortedTechnicians = [...technicians].sort((a, b) => b.points - a.points);

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
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Technician Leaderboard</h3>
                <button 
                    onClick={resetAllTechnicianPoints}
                    className="bg-glen-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                    Reset All Points
                </button>
            </div>
            
            {sortedTechnicians.length > 0 ? (
                <div className="space-y-3">
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
    );
};

export default PerformanceView;
