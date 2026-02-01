import React, { useMemo, useState, useEffect } from 'react';
import { User, WorkoutRecord, UserStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatsCard from './StatsCard';
import { MIN_DISTANCE_KM, PENALTY_AMOUNT } from '../constants';
import { Calendar, TrendingUp, Flame, Activity, Clock, Hourglass, Siren, Coins } from 'lucide-react';

interface Props {
  users: User[];
  records: WorkoutRecord[];
}

interface PenaltyStats {
  userId: string;
  name: string;
  missedDays: number;
  totalPenalty: number;
}

const Dashboard: React.FC<Props> = ({ users, records }) => {
  const [now, setNow] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();
  
  const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

  // Timer Logic
  const getTimerStats = () => {
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const timeDiff = endOfDay.getTime() - now.getTime();
    const totalSeconds = Math.max(0, Math.floor(timeDiff / 1000));
    
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    // Total seconds in a day = 86400
    const totalDaySeconds = 24 * 60 * 60;
    const percentageLeft = (totalSeconds / totalDaySeconds) * 100;

    return { h, m, s, percentageLeft, totalSeconds };
  };

  const { h, m, s, percentageLeft, totalSeconds } = getTimerStats();

  // Determine Timer Theme based on urgency
  let timerTheme = {
    bar: 'bg-emerald-500',
    text: 'text-emerald-700',
    timeText: 'text-emerald-900',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    iconColor: 'text-emerald-600',
    label: '여유있게 달성해보세요!'
  };

  if (totalSeconds < 3600) { // < 1 hour (Critical)
    timerTheme = {
      bar: 'bg-rose-600 animate-pulse',
      text: 'text-rose-700',
      timeText: 'text-rose-900',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      iconColor: 'text-rose-600 animate-bounce',
      label: '마감이 임박했습니다! 서두르세요!'
    };
  } else if (totalSeconds < 3 * 3600) { // < 3 hours (Urgent)
    timerTheme = {
      bar: 'bg-orange-500',
      text: 'text-orange-700',
      timeText: 'text-orange-900',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      iconColor: 'text-orange-600',
      label: '오늘 하루가 얼마 남지 않았어요.'
    };
  } else if (totalSeconds < 12 * 3600) { // < 12 hours (Warning)
    timerTheme = {
      bar: 'bg-yellow-400',
      text: 'text-yellow-700',
      timeText: 'text-yellow-900',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      label: '오늘 운동은 하셨나요?'
    };
  }

  // Calculate stats
  const stats: UserStats[] = useMemo(() => {
    return users.map(user => {
      const monthRecords = records.filter(r => {
        const rDate = new Date(r.date);
        return r.userId === user.id && 
               r.isValid &&
               rDate.getMonth() === currentDate.getMonth() &&
               rDate.getFullYear() === currentDate.getFullYear();
      });

      const todayRecords = monthRecords.filter(r => r.date === todayStr);
      const todayDistance = todayRecords.reduce((acc, curr) => acc + curr.distance, 0);
      const isDoneToday = todayDistance >= MIN_DISTANCE_KM;

      const distanceByDate: Record<string, number> = {};
      monthRecords.forEach(r => {
        distanceByDate[r.date] = (distanceByDate[r.date] || 0) + r.distance;
      });

      let validDaysCount = 0;
      Object.values(distanceByDate).forEach(dist => {
        if (dist >= MIN_DISTANCE_KM) validDaysCount++;
      });

      const totalDistance = monthRecords.reduce((acc, curr) => acc + curr.distance, 0);
      const completionRate = currentDay > 0 ? (validDaysCount / currentDay) * 100 : 0;

      return {
        userId: user.id,
        name: user.name,
        totalDistance,
        validDays: validDaysCount,
        completionRate,
        todayDistance,
        isDoneToday
      };
    }).sort((a, b) => b.todayDistance - a.todayDistance);
  }, [users, records, currentDay, currentMonth, currentYear, todayStr]);

  // Calculate Penalty Stats
  const penaltyStats: PenaltyStats[] = useMemo(() => {
    const todayStart = new Date(currentYear, currentMonth - 1, currentDay);
    const monthStart = new Date(currentYear, currentMonth - 1, 1);

    return users.map(user => {
      let missedDays = 0;
      
      // Calculate effective start date (Join date or Month Start)
      // We rely on browser's local time interpretation for simplicity
      const joinDate = user.joinedAt ? new Date(user.joinedAt) : monthStart;
      // Normalize join date to start of day
      const joinDayStart = new Date(joinDate.getFullYear(), joinDate.getMonth(), joinDate.getDate());
      
      // Start checking from whichever is later: Month Start or Join Date
      let checkDate = new Date(Math.max(monthStart.getTime(), joinDayStart.getTime()));

      // Loop until Yesterday (do not count today as missed yet)
      while (checkDate < todayStart) {
        const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        
        // Sum valid distance for this date
        const dayDistance = records
          .filter(r => r.userId === user.id && r.date === checkStr && r.isValid)
          .reduce((sum, r) => sum + r.distance, 0);
        
        if (dayDistance < MIN_DISTANCE_KM) {
          missedDays++;
        }

        // Next day
        checkDate.setDate(checkDate.getDate() + 1);
      }

      return {
        userId: user.id,
        name: user.name,
        missedDays,
        totalPenalty: missedDays * PENALTY_AMOUNT
      };
    }).sort((a, b) => b.totalPenalty - a.totalPenalty);
  }, [users, records, currentYear, currentMonth, currentDay]);

  const totalTeamPenalty = penaltyStats.reduce((sum, p) => sum + p.totalPenalty, 0);

  // Calculate Today's Team Stats
  const dailyStats = useMemo(() => {
    const completers = stats.filter(s => s.isDoneToday).length;
    const total = users.length;
    const rate = total > 0 ? (completers / total) * 100 : 0;
    
    return { count: completers, total, rate };
  }, [stats, users]);

  const COLORS = ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'];

  if (users.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
        <p className="text-gray-500 mb-2">등록된 팀원이 없습니다.</p>
        <p className="text-lg font-bold text-gray-800">우측 상단 + 버튼을 눌러 팀원을 추가해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Timer Section */}
      <div className={`rounded-2xl p-5 shadow-sm border ${timerTheme.bg} ${timerTheme.border} relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-3 relative z-10 gap-2">
           <div className="flex items-center space-x-3">
              <div className={`p-2 bg-white rounded-full shadow-sm ${timerTheme.iconColor}`}>
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${timerTheme.text}`}>
                   {now.toLocaleDateString()}
                </div>
                <div className={`text-3xl font-bold font-mono tracking-tight leading-none ${timerTheme.timeText}`}>
                   {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                </div>
              </div>
           </div>
           <div className={`text-sm font-semibold flex items-center ${timerTheme.text}`}>
              {totalSeconds < 3600 && <Hourglass className="w-4 h-4 mr-1 animate-spin" />}
              {timerTheme.label}
           </div>
        </div>
        <div className="h-3 w-full bg-black/5 rounded-full overflow-hidden backdrop-blur-sm">
           <div 
              className={`h-full transition-all duration-1000 ease-linear shadow-sm ${timerTheme.bar}`} 
              style={{ width: `${percentageLeft}%` }}
           />
        </div>
      </div>

      {/* Header Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Challenge Card */}
        <div className={`rounded-2xl p-6 shadow-lg relative overflow-hidden group transition-colors duration-500
          ${dailyStats.rate >= 100 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gradient-to-br from-emerald-600 to-teal-600'}
        `}>
           <div className="relative z-10 text-white">
              <div className="flex items-center justify-between mb-2 opacity-90">
                 <div className="flex items-center space-x-2">
                    <Flame className="w-5 h-5 text-orange-300 animate-pulse" />
                    <span className="font-semibold text-sm uppercase tracking-wider">오늘의 챌린지</span>
                 </div>
                 <span className="text-xs bg-white/20 px-2 py-1 rounded-md font-medium">
                   {currentMonth}월 {currentDay}일
                 </span>
              </div>
              
              <div className="flex items-end space-x-2 mt-1">
                  <span className="text-5xl font-bold tracking-tight">{dailyStats.rate.toFixed(0)}%</span>
                  <span className="text-white/80 mb-1.5 font-medium">팀 달성률</span>
              </div>
              
              <p className="mt-4 text-sm text-white/90 font-medium">
                 전체 <span className="text-white font-bold">{dailyStats.total}명</span> 중 
                 <span className="text-white font-bold text-lg mx-1">{dailyStats.count}명</span>이 
                 <br className="sm:hidden" /> 목표({MIN_DISTANCE_KM}km)를 달성했습니다!
              </p>
              
              <div className="mt-5 bg-black/20 rounded-full h-2.5 overflow-hidden backdrop-blur-sm">
                 <div 
                    style={{width: `${dailyStats.rate}%`}} 
                    className="bg-white h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                 />
              </div>
           </div>
           <Activity className="absolute -right-6 -bottom-6 w-40 h-40 text-white mix-blend-overlay opacity-20 rotate-12 group-hover:scale-110 transition-transform duration-700" />
        </div>

        {/* Monthly Context Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
           <div className="flex items-center space-x-2 text-gray-500 mb-3 text-sm font-medium">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>이번 달 진행 현황</span>
           </div>
           
           <div className="flex items-baseline space-x-3 mb-4">
              <span className="text-4xl font-bold text-gray-800">{currentDay}<span className="text-2xl ml-0.5">일차</span></span>
              <span className="text-gray-400 font-medium">/ 총 {new Date(currentYear, currentMonth, 0).getDate()}일</span>
           </div>
           
           <div className="mt-auto pt-4 border-t border-gray-100">
             <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">일일 목표</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{MIN_DISTANCE_KM}km 이상</span>
             </div>
             <p className="text-xs text-gray-400 mt-2">
               * 합산 가능, 회당 최소 1km 이상 <br/>
               * 페이스 20분/km(시속 3km) 이상 필수
             </p>
           </div>
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((userStat, index) => (
          <StatsCard key={userStat.userId} stats={userStat} rank={index + 1} />
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
          <TrendingUp className="mr-2 text-blue-600" />
          팀원 월간 달성률
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} unit="%" hide />
              <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 14, fontWeight: 600}} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, '달성률']}
              />
              <Bar dataKey="completionRate" radius={[0, 4, 4, 0]} barSize={32}>
                {stats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Penalty Section (Bottom) */}
      <div className="bg-red-50 rounded-2xl p-6 shadow-sm border border-red-100">
        <h3 className="text-xl font-bold text-red-900 mb-6 flex items-center">
          <Siren className="mr-2 text-red-600 animate-pulse" />
          {currentMonth}월 누적 벌금 현황
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-red-200 text-left">
                <th className="pb-3 pl-2 text-sm font-semibold text-red-800">이름</th>
                <th className="pb-3 text-sm font-semibold text-red-800 text-right">실패 횟수</th>
                <th className="pb-3 pr-2 text-sm font-semibold text-red-800 text-right">벌금</th>
              </tr>
            </thead>
            <tbody>
              {penaltyStats.map((stat, idx) => (
                <tr key={stat.userId} className={`border-b border-red-100 last:border-0 ${idx < 3 && stat.totalPenalty > 0 ? 'bg-red-100/50' : ''}`}>
                  <td className="py-3 pl-2 font-medium text-gray-800">{stat.name}</td>
                  <td className="py-3 text-right text-gray-600">
                    {stat.missedDays > 0 ? (
                      <span className="font-bold text-red-600">{stat.missedDays}회</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 pr-2 text-right">
                    {stat.totalPenalty > 0 ? (
                      <span className="font-bold text-red-700">{stat.totalPenalty.toLocaleString()}원</span>
                    ) : (
                      <span className="text-green-600 font-medium text-sm bg-green-100 px-2 py-1 rounded">면제</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 pt-4 border-t border-red-200 flex justify-between items-center">
          <div className="flex items-center text-red-800 font-semibold">
            <Coins className="w-5 h-5 mr-2" />
            팀 전체 누적 벌금
          </div>
          <div className="text-3xl font-bold text-red-600">
            {totalTeamPenalty.toLocaleString()}<span className="text-lg ml-1 text-red-800">원</span>
          </div>
        </div>
        <p className="text-xs text-red-400 mt-2 text-right">* 실패 1회당 {PENALTY_AMOUNT.toLocaleString()}원 (오늘 제외)</p>
      </div>
    </div>
  );
};

export default Dashboard;