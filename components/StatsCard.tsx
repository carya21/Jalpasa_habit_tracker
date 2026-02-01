import React from 'react';
import { UserStats } from '../types';
import { CheckCircle2, CircleDashed, Footprints } from 'lucide-react';
import { MIN_DISTANCE_KM } from '../constants';

interface Props {
  stats: UserStats;
  rank: number;
}

const StatsCard: React.FC<Props> = ({ stats, rank }) => {
  const isDoneToday = stats.isDoneToday; // >= 3km (Success)
  const hasParticipated = stats.todayDistance > 0; // Any upload (Active)

  const getRankColor = (r: number) => {
    // If no participation, stay grayscale
    if (!hasParticipated) return 'bg-white text-gray-500 border-gray-200 grayscale opacity-80';
    
    switch (r) {
      case 1: return 'bg-yellow-50 text-yellow-900 border-yellow-200';
      case 2: return 'bg-slate-100 text-slate-900 border-slate-200'; // Silver/Slate
      case 3: return 'bg-orange-50 text-orange-900 border-orange-200';
      default: return 'bg-emerald-50 text-emerald-900 border-emerald-200';
    }
  };

  return (
    <div className={`relative p-5 rounded-2xl border-2 shadow-sm transition-all duration-300 
      ${getRankColor(rank)} 
      ${!hasParticipated ? 'hover:grayscale-0 hover:opacity-100 hover:border-emerald-200' : 'hover:scale-[1.02] shadow-md'}
    `}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-lg shadow-sm ${hasParticipated ? 'bg-white/60' : 'bg-gray-200 text-gray-500'}`}>
            {rank}
          </div>
          <h3 className="font-bold text-lg">{stats.name}</h3>
        </div>
        
        {/* Status Badge */}
        {isDoneToday ? (
           <div className="flex items-center text-emerald-600 bg-white/60 px-2 py-1 rounded-full shadow-sm">
             <CheckCircle2 className="w-5 h-5 mr-1" />
             <span className="text-xs font-bold">완료</span>
           </div>
        ) : hasParticipated ? (
           <div className="flex items-center text-blue-600 bg-white/60 px-2 py-1 rounded-full shadow-sm">
             <Footprints className="w-4 h-4 mr-1" />
             <span className="text-xs font-bold">진행중</span>
           </div>
        ) : (
           <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-400">미완료</span>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className={`flex flex-col items-center p-2 rounded-lg ${hasParticipated ? 'bg-white/40' : 'bg-gray-100'}`}>
          <span className="text-xs opacity-70 mb-1">오늘 거리</span>
          <span className={`font-bold text-lg ${stats.todayDistance >= MIN_DISTANCE_KM ? 'text-emerald-600' : 'text-gray-800'}`}>
            {stats.todayDistance.toFixed(1)}<span className="text-xs text-gray-500">/{MIN_DISTANCE_KM}</span>
          </span>
        </div>
        <div className={`flex flex-col items-center p-2 rounded-lg ${hasParticipated ? 'bg-white/40' : 'bg-gray-100'}`}>
          <span className="text-xs opacity-70 mb-1">인증일수</span>
          <span className="font-bold text-lg flex items-center">
            {stats.validDays}<span className="text-xs ml-0.5">일</span>
          </span>
        </div>
        <div className={`flex flex-col items-center p-2 rounded-lg ${hasParticipated ? 'bg-white/40' : 'bg-gray-100'}`}>
          <span className="text-xs opacity-70 mb-1">총 거리</span>
          <span className="font-bold text-lg flex items-center">
             {stats.totalDistance.toFixed(1)}
          </span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4 h-3 w-full bg-black/5 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${isDoneToday ? 'bg-emerald-500' : hasParticipated ? 'bg-blue-500' : 'bg-gray-400'}`}
          style={{ width: `${Math.min(stats.completionRate, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default StatsCard;