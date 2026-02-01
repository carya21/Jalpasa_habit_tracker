import React, { useState, useEffect } from 'react';
import { User, WorkoutRecord } from './types';
import { APP_TITLE } from './constants';
import { storageService } from './services/firebaseStorageService';
import Dashboard from './components/Dashboard';
import UploadModal from './components/UploadModal';
import { PlusCircle, UserPlus, RefreshCw, Activity } from 'lucide-react';

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const loadedUsers = await storageService.getUsers();
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = async (userId: string, record: Omit<WorkoutRecord, 'id'>) => {
    try {
      await storageService.addWorkoutRecord(userId, record);
      await loadUsers();
    } catch (error) {
      console.error('Error adding workout record:', error);
      alert('운동 기록 추가 중 오류가 발생했습니다.');
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim()) return;
    try {
      await storageService.addUser(newUserName.trim());
      await loadUsers();
      setNewUserName('');
      setIsAddUserOpen(false);
    } catch (error) {
      console.error('Error adding user:', error);
      alert('사용자 추가 중 오류가 발생했습니다.');
    }
  };

  const allRecords = users.flatMap(user => 
    (user.records || []).map(record => ({
      ...record,
      userId: user.id
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Activity className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
              {APP_TITLE}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsAddUserOpen(!isAddUserOpen)}
              className="p-2 text-gray-500 hover:text-emerald-600 transition-colors"
              title="팀원 추가"
            >
              <UserPlus className="w-6 h-6" />
            </button>
            <button 
              onClick={loadUsers}
              className="p-2 text-gray-400 hover:text-emerald-600 transition-colors text-xs"
              title="새로고침"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Add User Input (Conditional) */}
      {isAddUserOpen && (
        <div className="bg-emerald-50 border-b border-emerald-100 p-4 animate-fade-in-down">
          <div className="max-w-5xl mx-auto flex gap-2">
            <input 
              type="text" 
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
              placeholder="새로운 팀원 이름 입력"
              className="flex-1 p-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button 
              onClick={handleAddUser}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 whitespace-nowrap"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Dashboard users={users} />

        {/* Recent Records List */}
        <div className="mt-12">
          <h3 className="text-lg font-bold text-gray-800 mb-4 ml-1">최근 인증 내역</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allRecords.slice(0, 8).map(record => {
              const user = users.find(u => u.id === record.userId);
              return (
                <div key={record.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="relative aspect-video bg-gray-100">
                    <img src={record.imageUrl} alt="Workout" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-full font-bold">
                      {record.distance}km
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-gray-800">{user?.name || 'Unknown'}</span>
                      <span className="text-xs text-gray-500">{record.date}</span>
                    </div>
                    <div className={`text-xs font-bold ${record.isValid ? 'text-green-600' : 'text-red-500'}`}>
                      {record.isValid ? '인증 성공' : '기준 미달'}
                    </div>
                  </div>
                </div>
              );
            })}
            {allRecords.length === 0 && (
              <div className="col-span-full py-10 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                아직 인증된 기록이 없습니다.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsUploadModalOpen(true)}
        className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-4 shadow-xl transition-transform hover:scale-105 flex items-center gap-2 group z-40"
      >
        <PlusCircle className="w-6 h-6" />
        <span className="font-bold pr-1">인증하기</span>
      </button>

      {/* Modals */}
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        users={users}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}

export default App;
