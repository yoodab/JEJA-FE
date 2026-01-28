import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import UserHeader from "../components/UserHeader";
import Footer from "../components/Footer";
import WorshipSection from "../components/WorshipSection";
import {
  clearAuth,
  getUserRole,
  isLoggedIn as checkLoggedIn,
} from "../utils/auth";
import { getMyInfo, getMyAttendanceStats, type MyInfoResponse, type MyAttendanceStatsResponse } from "../services/userService";
import { getMyClubs } from "../services/clubService";
import type { Club } from "../types/club";

// 게시판 정보
const boardTypes = [
  {
    id: "free",
    name: "자유게시판",
    description: "자유롭게 소통하고 나누는 공간",
    color: "bg-blue-50 border-blue-200 hover:border-blue-300",
    textColor: "text-blue-700",
  },
  {
    id: "prayer",
    name: "기도제목게시판",
    description: "함께 기도할 제목을 나누는 공간",
    color: "bg-purple-50 border-purple-200 hover:border-purple-300",
    textColor: "text-purple-700",
  },
  {
    id: "question",
    name: "목사님께질문",
    description: "목사님께 궁금한 것을 질문하는 공간",
    color: "bg-emerald-50 border-emerald-200 hover:border-emerald-300",
    textColor: "text-emerald-700",
  },
  {
    id: "meal",
    name: "밥친구 신청",
    description: "함께 식사할 친구를 찾는 공간",
    color: "bg-amber-50 border-amber-200 hover:border-amber-300",
    textColor: "text-amber-700",
  },
];

const heroImages = [
  {
    id: 1,
    title: "Welcome to JEJA Youth",
    subtitle: "하나님이 세우시는 교회, 함께 예배하는 청년부",
  },
  {
    id: 2,
    title: "주일예배 & 순모임",
    subtitle: "말씀과 나눔으로 함께 성장해요",
  },
  {
    id: 3,
    title: "함께 웃고 울며 기도하는 공동체",
    subtitle: "청년부 소식과 사진들을 확인해 보세요",
  },
];

// 임시 데이터
const latestNotices = [
  {
    id: 1,
    date: "2025-12-16",
    title: "[공지] 12월 청년부 모임 일정 안내",
    isImportant: true,
  },
  {
    id: 2,
    date: "2025-12-14",
    title: "[안내] 연말 특별 예배 안내",
    isImportant: true,
  },
];

const latestAlbums = [
  {
    id: 1,
    title: "2024 전도특공대",
    date: "2024-03-16",
    thumbnail: "https://via.placeholder.com/150x100?text=전도특공대",
  },
  {
    id: 2,
    title: "청년부 수련회",
    date: "2024-07-20",
    thumbnail: "https://via.placeholder.com/150x100?text=수련회",
  },
];


interface DashboardSchedule {
  id: number;
  title: string;
  date: string;
  time: string;
  type: string;
  shareScope: "loggedIn" | "guest" | "private"; // private 포함 확인
}

const latestSchedules: DashboardSchedule[] = [
  {
    id: 1,
    title: "주일예배",
    date: "2024-12-22",
    time: "11:00",
    type: "예배",
    shareScope: "loggedIn" ,
  },
  {
    id: 2,
    title: "순모임",
    date: "2024-12-23",
    time: "19:00",
    type: "모임",
    shareScope: "loggedIn" ,
  },
  {
    id: 3,
    title: "연말 특별예배",
    date: "2024-12-31",
    time: "22:00",
    type: "예배",
    shareScope: "guest" ,
  },
];

const mockMyInfo = {
  name: "김청년",
  role: "일반청년",
  status: "재적",
  thisMonthAttendance: 8,
  thisYearAttendance: 45,
};

// 사용자가 속한 팀 목록 (실제로는 API에서 가져올 데이터)
const mockMyTeams = [
  { id: 2, name: "찬양팀" },
  { id: 4, name: "방송팀" },
  { id: 5, name: "컨텐츠팀" },
];

function UserDashboardPage() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [myInfo, setMyInfo] = useState<MyInfoResponse | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<MyAttendanceStatsResponse | null>(null);
  const [myTeams, setMyTeams] = useState<Club[]>([]);

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setActiveIndex(
      (prev) => (prev - 1 + heroImages.length) % heroImages.length
    );
  };

  // 자동 슬라이드
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  // 로그인/권한 상태 초기화
  useEffect(() => {
    setIsLoggedIn(checkLoggedIn());
    setUserRole(getUserRole());
  }, []);

  const handleLoginLogout = () => {
    if (isLoggedIn) {
      clearAuth();
      setIsLoggedIn(false);
      setUserRole(null);
    } else {
      navigate("/login");
    }
  };

  const current = heroImages[activeIndex];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          onLogout={handleLoginLogout}
        />

        {/* 상단 큰 사진 슬라이드 */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/80 shadow-lg">
          {/* 배경 (임시 그라데이션, 나중에 실제 이미지로 교체 가능) */}
          <div className="h-52 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 sm:h-72" />

          {/* 텍스트 오버레이 */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-center px-6 py-6 sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
              JEJA YOUTH
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
              {current.title}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-200 sm:text-base">
              {current.subtitle}
            </p>
          </div>

          {/* 좌우 화살표 */}
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-black/40 p-2 text-white shadow-sm backdrop-blur hover:bg-black/60"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-black/40 p-2 text-white shadow-sm backdrop-blur hover:bg-black/60"
          >
            ›
          </button>

          {/* 하단 인디케이터 */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {heroImages.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2 w-2 rounded-full transition ${
                  index === activeIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </section>

        {/* 팀 / 출석하기 / 내 정보 보기 영역 - 로그인 시에만 노출 (상단에 배치) */}
        {isLoggedIn && (
          <section className="grid gap-4 md:grid-cols-3">
            <div className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
              <button
                type="button"
                onClick={() => navigate("/club")}
                className="absolute right-3 top-3 text-[10px] font-semibold text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:text-blue-600"
              >
                전체 보기
              </button>
              <h2 className="text-sm font-semibold text-slate-900">팀</h2>
              <p className="mt-1 text-xs text-slate-500">
                내가 속한 팀 정보를 확인하세요.
              </p>
              <div className="mt-3 space-y-2">
                {myTeams.length > 0 ? (
                  myTeams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => navigate(`/club/${team.id}`)}
                      className="w-full rounded-lg bg-purple-50 px-3 py-2 text-left transition hover:bg-purple-100 hover:border-purple-300 border border-transparent"
                    >
                      <span className="text-sm font-semibold text-slate-900">
                        {team.name}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
                    <span className="text-xs text-slate-500">
                      속한 팀이 없습니다
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 게시판 카드 */}
            <div className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
              <h2 className="text-sm font-semibold text-slate-900">게시판</h2>
              <p className="mt-1 text-xs text-slate-500">
                다양한 게시판에서 소통하고 나누세요.
              </p>
              <div className="mt-3 flex-1 space-y-2 overflow-y-auto max-h-[150px] pr-1">
                {boardTypes.map((board) => (
                  <Link
                    key={board.id}
                    to={`/boards/${board.id}`}
                    className={`block w-full rounded-lg border px-3 py-2 text-left transition cursor-pointer ${board.color}`}
                  >
                    <span
                      className={`text-sm font-semibold ${board.textColor}`}
                    >
                      {board.name}
                    </span>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {board.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
              <button
                type="button"
                onClick={() => navigate("/my-info")}
                className="absolute right-3 top-3 text-[10px] font-semibold text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:text-blue-600"
              >
                상세 보기
              </button>
              <h2 className="text-sm font-semibold text-slate-900">
                내 정보 보기
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                나의 기본 정보와 출석 현황 등을 한 눈에 확인할 수 있습니다.
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">
                    이름
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {myInfo?.name || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">
                    역할
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {myInfo?.role || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">
                    이번 달 출석
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    {attendanceStats?.thisMonthCount ?? 0}회
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 청년부 예배 & 말씀 */}
        <WorshipSection />

        {/* 하단 여러 블록 영역 */}
        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
          {/* 청년부 공지사항 */}
          <div className="group relative col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <button
              type="button"
              onClick={() => navigate("/youth-notices")}
              className="absolute right-3 top-3 text-[10px] font-semibold text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:text-blue-600"
            >
              자세히 보기
            </button>
            <h2 className="text-sm font-semibold text-slate-900">
              청년부 공지사항
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              새로운 일정과 중요한 소식을 안내합니다.
            </p>
            <div className="mt-3 space-y-2">
              {latestNotices.map((notice) => (
                <div
                  key={notice.id}
                  className={`rounded-lg border px-3 py-2 ${
                    notice.isImportant
                      ? "border-red-200 bg-red-50/50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {notice.isImportant && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        중요
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {notice.date}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-900">
                    {notice.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 청년부 앨범 */}
          <div className="group relative col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <button
              type="button"
              onClick={() => navigate("/youth-album")}
              className="absolute right-3 top-3 text-[10px] font-semibold text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:text-blue-600"
            >
              자세히 보기
            </button>
            <h2 className="text-sm font-semibold text-slate-900">
              청년부 앨범
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              예배와 행사 사진들을 모아두는 공간입니다.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {latestAlbums.map((album) => (
                <div
                  key={album.id}
                  className="overflow-hidden rounded-lg border border-slate-200"
                >
                  <div className="aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={album.thumbnail}
                      alt={album.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="line-clamp-1 text-[10px] font-semibold text-slate-900">
                      {album.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {album.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 청년부 일정 */}
          <div className="group relative col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <button
              type="button"
              onClick={() => navigate("/schedules")}
              className="absolute right-3 top-3 text-[10px] font-semibold text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:text-blue-600"
            >
              자세히 보기
            </button>
            <h2 className="text-sm font-semibold text-slate-900">
              청년부 일정
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              다가오는 예배와 행사 일정을 확인하세요.
            </p>
            <div className="mt-3 space-y-2">
              {latestSchedules
                .filter((schedule) => {
                  // 비공개 일정은 제외
                  if (schedule.shareScope === 'private') return false
                  // 로그인하지 않은 사용자는 'guest' 공유 범위만 볼 수 있음
                  if (!isLoggedIn && schedule.shareScope === 'loggedIn') return false
                  return true
                })
                .map((schedule) => (
                  <div
                    key={schedule.id}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                              schedule.type === "예배"
                                ? "bg-blue-100 text-blue-700"
                                : schedule.type === "행사"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {schedule.type}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-900">
                            {schedule.title}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                          <span>{schedule.date}</span>
                          <span>•</span>
                          <span>{schedule.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}

export default UserDashboardPage;
