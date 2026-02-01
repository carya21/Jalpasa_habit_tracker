import React, { useState, useRef } from 'react';
import { User, WorkoutRecord } from '../types';
import { verifyWorkoutImage } from '../services/geminiService';
import { storageService } from '../services/firebaseStorageService';
import { Loader2, Upload, CheckCircle, XCircle, Camera, AlertTriangle } from 'lucide-react';
import { MIN_UPLOAD_DISTANCE, MAX_PACE_MIN_PER_KM } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onUploadSuccess: (userId: string, record: Omit<WorkoutRecord, 'id'>) => void;
}

const UploadModal: React.FC<Props> = ({ isOpen, onClose, users, onUploadSuccess }) => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [validation, setValidation] = useState<{
    isValid: boolean;
    distance: number;
    pace: number;
    reason: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setValidation(null);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !previewUrl || !selectedUser) return;

    setIsAnalyzing(true);
    try {
      const base64Data = previewUrl.split(',')[1];
      const aiResult = await verifyWorkoutImage(base64Data);

      const rawDistance = aiResult.distance;
      const flooredDistance = Math.floor(rawDistance * 10) / 10;

      if (flooredDistance < MIN_UPLOAD_DISTANCE) {
        setValidation({
          isValid: false,
          distance: flooredDistance,
          pace: 0,
          reason: `1회 인증 최소 거리는 ${MIN_UPLOAD_DISTANCE}km 입니다. (측정됨: ${flooredDistance}km)`
        });
        return;
      }

      let pace = 0;
      if (aiResult.durationInMinutes > 0 && flooredDistance > 0) {
        pace = aiResult.durationInMinutes / flooredDistance;
      }

      if (aiResult.durationInMinutes === 0) {
        setValidation({
          isValid: false,
          distance: flooredDistance,
          pace: 0,
          reason: "운동 시간을 인식할 수 없어 페이스를 계산할 수 없습니다."
        });
        return;
      }

      if (pace > MAX_PACE_MIN_PER_KM) {
        setValidation({
          isValid: false,
          distance: flooredDistance,
          pace: pace,
          reason: `페이스가 너무 느립니다. (기준: 1km당 ${MAX_PACE_MIN_PER_KM}분 이내, 기록: ${pace.toFixed(1)}분/km)`
        });
        return;
      }

      setValidation({
        isValid: true,
        distance: flooredDistance,
        pace: pace,
        reason: "인증 기준을 충족했습니다."
      });

    } catch (e) {
      alert("분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!validation || !file || !validation.isValid) return;

    setIsUploading(true);
    try {
      // Firebase Storage에 이미지 업로드
      const imageUrl = await storageService.uploadImage(file);

      // 운동 기록 생성
      const record: Omit<WorkoutRecord, 'id'> = {
        userId: selectedUser,
        date: todayStr,
        distance: validation.distance,
        imageUrl: imageUrl,
        isValid: true,
        timestamp: Date.now()
      };

      await onUploadSuccess(selectedUser, record);
      handleClose();
    } catch (error) {
      console.error('Error uploading:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewUrl(null);
    setValidation(null);
    setSelectedUser('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
            <Camera className="mr-2 text-emerald-600" /> 오늘 운동 인증
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름 선택</label>
              <select 
                value={selectedUser} 
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              >
                <option value="">인증할 사람을 선택하세요</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">인증 날짜</label>
              <div className="w-full p-3 bg-gray-100 text-gray-500 rounded-xl border border-gray-200 font-medium select-none flex justify-between items-center">
                <span>{todayStr} (오늘)</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">변경 불가</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">스크린샷 업로드</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors bg-gray-50/50"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg shadow-md object-contain" />
                ) : (
                  <div className="text-center text-gray-400">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p>클릭하여 이미지 업로드</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                * 1km 이상, 페이스 20분/km 이내 필수   

                * 1.39km → 1.3km (소수점 첫째 자리 버림)
              </p>
            </div>

            <div className="mt-4">
              {isUploading ? (
                <button disabled className="w-full py-4 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center font-bold animate-pulse">
                  <Loader2 className="animate-spin mr-2" /> 업로드 중...
                </button>
              ) : isAnalyzing ? (
                <button disabled className="w-full py-4 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center font-bold animate-pulse">
                  <Loader2 className="animate-spin mr-2" /> AI가 꼼꼼히 분석 중...
                </button>
              ) : validation ? (
                <div className={`p-5 rounded-xl border-2 ${validation.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center mb-3">
                    {validation.isValid ? (
                      <CheckCircle className="text-green-600 w-6 h-6 mr-2" />
                    ) : (
                      <AlertTriangle className="text-red-600 w-6 h-6 mr-2" />
                    )}
                    <span className={`font-bold text-lg ${validation.isValid ? 'text-green-800' : 'text-red-800'}`}>
                      {validation.isValid ? '조건 충족!' : '인증 기준 미달'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-700 mb-4 bg-white/50 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-500">인정 거리 (버림적용)</span>
                      <span className="font-bold">{validation.distance}km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">계산된 페이스</span>
                      <span className="font-bold">{validation.pace > 0 ? `${validation.pace.toFixed(1)}분/km` : '-'}</span>
                    </div>
                  </div>

                  {!validation.isValid && (
                    <p className="text-sm text-red-600 font-medium mb-4 bg-red-100/50 p-2 rounded">
                      사유: {validation.reason}
                    </p>
                  )}
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => { setValidation(null); setFile(null); setPreviewUrl(null); }}
                      className="flex-1 py-3 text-gray-600 font-bold bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                    >
                      다시하기
                    </button>
                    <button 
                      onClick={handleConfirm}
                      className={`flex-1 py-3 rounded-xl text-white font-bold shadow-md transition-colors ${validation.isValid ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}
                      disabled={!validation.isValid}
                    >
                      기록 저장
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleAnalyze}
                  disabled={!file || !selectedUser}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95
                    ${(!file || !selectedUser) ? 'bg-gray-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  AI 분석 시작
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end rounded-b-2xl">
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 font-bold text-sm">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
