import { useState } from "react";
import {
  checkGuestAttendance,
  type GuestAttendanceRequest,
} from "../services/attendanceService";

function GuestAttendancePage() {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | null;
    text: string;
  }>({ type: null, text: "" });

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

    setIsSubmitting(true);
    setMessage({ type: null, text: "" });

    try {
      const today = new Date().toISOString().split("T")[0];
      const requestData: GuestAttendanceRequest = {
        name: name.trim(),
        date: today,
      };

      // 비로그인 사용자용 출석 API 호출
      const response = await checkGuestAttendance(requestData);

      if (response.success) {
        setMessage({
          type: "success",
          text: `${name}님, 출석이 완료되었습니다!`,
        });
        setName(""); // 성공 시 이름 필드 초기화
        setTimeout(() => setMessage({ type: null, text: "" }), 5000);
      } else {
        throw new Error(response.message || "출석 처리에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("출석 체크 실패:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "출석 처리에 실패했습니다. 다시 시도해주세요.";
      setMessage({
        type: "error",
        text: errorMessage,
      });
      setTimeout(() => setMessage({ type: null, text: "" }), 5000);
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
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
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

