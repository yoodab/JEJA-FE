import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  checkIn,
  getSchedules as getCheckableSchedules,
  type CheckInRequestDto,
} from "../services/attendanceService";
import type { Schedule } from "../types/schedule";

function GuestAttendancePage() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | null;
    text: string;
    showRegisterLink?: boolean;
  }>({ type: null, text: "" });

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        // 출석 가능한 일정 조회 (Admin 일정 포함, 이미 오늘 날짜로 필터링됨)
        const todaySchedules = await getCheckableSchedules();

        // 시간 필터링 (현재 시간 기준 +- 20분)
        // 백엔드에서도 하지만, 클라이언트 시간 기준으로도 즉각적인 UX를 위해 필터링
        const now = new Date();
        const validSchedules = todaySchedules.filter(s => {
          const start = new Date(s.startDate);
          // start - 20 <= now <= start + 20
          // => now - start >= -20 && now - start <= 20
          const diffMinutes = (now.getTime() - start.getTime()) / (1000 * 60);
          return diffMinutes >= -20 && diffMinutes <= 20;
        });
        
        // 타입 호환성을 위해 형변환
        setSchedules(validSchedules as unknown as Schedule[]);
        
        // 일정이 하나뿐이면 자동 선택
        if (validSchedules.length === 1) {
          setSelectedScheduleId(validSchedules[0].scheduleId);
        }
      } catch (error) {
        console.error("일정 조회 실패:", error);
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage({
        type: "error",
        text: "이름을 입력해주세요.",
      });
      setTimeout(() => setMessage({ type: null, text: "" }), 3000);
      return;
    }

    if (!birthDate.trim() || birthDate.length !== 6) {
      setMessage({
        type: "error",
        text: "생년월일 6자리를 정확히 입력해주세요.",
      });
      setTimeout(() => setMessage({ type: null, text: "" }), 3000);
      return;
    }

    if (!selectedScheduleId) {
      setMessage({
        type: "error",
        text: "참석할 일정을 선택해주세요.",
      });
      setTimeout(() => setMessage({ type: null, text: "" }), 3000);
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: null, text: "" });

    try {
      let latitude: number | undefined;
      let longitude: number | undefined;

      // 예배인 경우에만 위치 정보 가져오기
      const selectedSchedule = schedules.find(s => s.scheduleId === selectedScheduleId);
      if (selectedSchedule?.type === 'WORSHIP') {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("위치 정보를 지원하지 않는 브라우저입니다."));
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }

      // 생년월일 파싱 (YYMMDD -> YYYY-MM-DD)
      // 50보다 크면 1900년대, 아니면 2000년대로 가정 (일반적인 기준)
      const yy = parseInt(birthDate.substring(0, 2), 10);
      const mm = birthDate.substring(2, 4);
      const dd = birthDate.substring(4, 6);
      
      const fullYear = yy > 40 ? 1900 + yy : 2000 + yy; // 40년생까지는 2040년으로 보지 않고 1940년으로 봄
      const parsedBirthDate = `${fullYear}-${mm}-${dd}`;

      const requestData: CheckInRequestDto = {
        name: name.trim(),
        birthDate: parsedBirthDate,
        latitude,
        longitude,
      };

      // 통합 출석 API 호출 (기존 로그인 유저와 동일한 API)
      await checkIn(selectedScheduleId, requestData);

      setMessage({
        type: "success",
        text: `${name}님, 출석이 완료되었습니다!`,
      });
      setName(""); // 성공 시 이름 필드 초기화
      setBirthDate(""); // 생년월일 초기화
      setTimeout(() => setMessage({ type: null, text: "" }), 5000);
    } catch (error) {
      console.error("출석 체크 실패:", error);
      const httpErr = error as { response?: { data?: { message?: string; code?: string } } };
      let errorMessage =
        httpErr.response?.data?.message ||
        (error instanceof Error ? error.message : '') ||
        "출석 처리에 실패했습니다. 다시 시도해주세요.";
      
      // 위치 정보 에러 처리
      if (error instanceof GeolocationPositionError) {
        if (error.code === error.PERMISSION_DENIED) {
           errorMessage = "위치 정보 권한이 차단되었습니다. 브라우저 주소창의 자물쇠/설정 아이콘을 눌러 위치 권한을 '허용'해주세요.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
           errorMessage = "위치 정보를 가져올 수 없습니다. GPS가 켜져 있는지 확인해주세요.";
        } else if (error.code === error.TIMEOUT) {
           errorMessage = "위치 정보 확인 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
        }
      }

      const isMemberNotFound = httpErr.response?.data?.code === 'MEM01' || errorMessage.includes('존재하지 않는');
      const isTimeExpired = httpErr.response?.data?.code === 'ATT14';

      setMessage({
        type: "error",
        text: isTimeExpired ? "출석 가능 시간이 지났습니다." : errorMessage,
        showRegisterLink: isMemberNotFound
      });
      // 5초 후 메시지 사라짐 (등록 링크가 있으면 좀 더 오래 유지하거나 유지)
      if (!isMemberNotFound && !isTimeExpired) {
          setTimeout(() => setMessage({ type: null, text: "" }), 5000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              출석하기
            </h1>
            <p className="text-slate-600">
              이름을 입력하여 출석을 완료해주세요
            </p>
          </div>

          {/* 출석 폼 카드 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 일정 선택 섹션 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  참석 일정
                </label>
                {isLoadingSchedules ? (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    일정을 불러오는 중...
                  </div>
                ) : schedules.length > 0 ? (
                  <div className="space-y-2">
                    {schedules.map((schedule) => (
                      <div
                        key={schedule.scheduleId}
                        onClick={() => setSelectedScheduleId(schedule.scheduleId)}
                        className={`cursor-pointer rounded-lg border p-3 transition-all ${
                          selectedScheduleId === schedule.scheduleId
                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900">
                            {schedule.title}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(schedule.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                    오늘 예정된 출석 가능한 일정이 없습니다.
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  이름
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg"
                  disabled={isSubmitting}
                  
                />
              </div>

              <div>
                <label
                  htmlFor="birthDate"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  생년월일 (6자리)
                </label>
                <input
                  id="birthDate"
                  type="text"
                  value={birthDate}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                    setBirthDate(val);
                  }}
                  placeholder="예: 980101"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg tracking-widest"
                  disabled={isSubmitting}
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !birthDate.trim() || !selectedScheduleId}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    처리 중...
                  </span>
                ) : (
                  "출석하기"
                )}
              </button>
            </form>

            {/* 메시지 표시 */}
            {message.type && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center">
                    {message.type === "success" ? (
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                    <span className="font-medium">{message.text}</span>
                  </div>
                  
                  {message.showRegisterLink && (
                    <div className="ml-7">
                        <p className="text-sm text-red-600 mb-2">아직 등록되지 않은 정보입니다.</p>
                        <Link 
                            to="/newcomer/register"
                            className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 underline"
                        >
                            새가족 등록하러 가기 &rarr;
                        </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 안내 문구 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-800">
              💡 QR 코드로 접속하신 분들은 이름만 입력하시면 출석이 완료됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestAttendancePage;
