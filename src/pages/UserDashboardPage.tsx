import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import UserHeader from "../components/UserHeader";
import Footer from "../components/Footer";
import WorshipSection from "../components/WorshipSection";
import UserAttendanceSection from "../components/UserAttendanceSection";
import {
  clearAuth,
  getUserRole,
  isLoggedIn as checkLoggedIn,
} from "../utils/auth";
import { getMyInfo, getMyAttendanceStats, type MyInfoResponse, type MyAttendanceStatsResponse } from "../services/userService";
import { getMyClubs } from "../services/clubService";
import { getNotices, type NoticeSimple } from "../services/noticeService";
import { getBoards, type Board } from "../services/boardService";
import { getAlbums, type AlbumListItem, getFileUrl } from "../services/albumService";
import { getUpcomingSchedules } from "../services/scheduleService";
import type { Schedule } from "../types/schedule";
import { getSlidesPublic, type Slide } from "../services/homepageService";
import { getAvailableForms } from "../services/formService";
import type { FormTemplate } from "../types/form";
import type { Club } from "../types/club";

const BOARD_COLORS = [
  {
    color: "bg-blue-50 border-blue-200 hover:border-blue-300",
    textColor: "text-blue-700",
  },
  {
    color: "bg-purple-50 border-purple-200 hover:border-purple-300",
    textColor: "text-purple-700",
  },
  {
    color: "bg-emerald-50 border-emerald-200 hover:border-emerald-300",
    textColor: "text-emerald-700",
  },
  {
    color: "bg-amber-50 border-amber-200 hover:border-amber-300",
    textColor: "text-amber-700",
  },
  {
    color: "bg-rose-50 border-rose-200 hover:border-rose-300",
    textColor: "text-rose-700",
  },
  {
    color: "bg-indigo-50 border-indigo-200 hover:border-indigo-300",
    textColor: "text-indigo-700",
  },
];

function UserDashboardPage() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(checkLoggedIn());
  const [userRole, setUserRole] = useState<string | null>(getUserRole());
  
  const [myInfo, setMyInfo] = useState<MyInfoResponse | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<MyAttendanceStatsResponse | null>(null);
  const [myTeams, setMyTeams] = useState<Club[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [latestNotices, setLatestNotices] = useState<NoticeSimple[]>([]);
  const [latestAlbums, setLatestAlbums] = useState<AlbumListItem[]>([]);
  const [latestSchedules, setLatestSchedules] = useState<Schedule[]>([]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [availableForms, setAvailableForms] = useState<FormTemplate[]>([]);

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length === 0) return;
    setActiveIndex(
      (prev) => (prev - 1 + slides.length) % slides.length
    );
  }, [slides.length]);

  // 자동 슬라이드
  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [slides.length, nextSlide]);

  // 사용자 정보 및 팀 정보 로드 (로그인 시에만)
  useEffect(() => {
    if (isLoggedIn) {
      const fetchUserInfo = async () => {
        try {
          const info = await getMyInfo();
          setMyInfo(info);
        } catch (err) {
          console.error("Failed to fetch user info:", err);
        }
      };

      const fetchAttendance = async () => {
        try {
          const stats = await getMyAttendanceStats();
          setAttendanceStats(stats);
        } catch (err) {
          console.error("Failed to fetch attendance stats:", err);
        }
      };

      const fetchMyTeams = async () => {
        try {
          const clubs = await getMyClubs();
          setMyTeams(clubs);
        } catch (err) {
          console.error("Failed to fetch my teams:", err);
        }
      };

      const fetchAvailableForms = async () => {
        try {
          const forms = await getAvailableForms();
          setAvailableForms(forms);
        } catch (err) {
          console.error("Failed to fetch available forms:", err);
        }
      };

      fetchUserInfo();
      fetchAttendance();
      fetchMyTeams();
      fetchAvailableForms();
    }
  }, [isLoggedIn]);

  // 공지사항 로드
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        // 고정되지 않은 최신 공지사항 2개를 가져오기 위해 넉넉히 10개를 가져와서 필터링
        const data = await getNotices({ page: 0, size: 10 });
        const normalNotices = data.notices
          .filter(notice => !notice.notice) // notice: true인거 제외
          .slice(0, 3); // 상위 3개 선택
        setLatestNotices(normalNotices);
      } catch (err) {
        console.error("Failed to fetch notices:", err);
      }
    };
    fetchNotices();

    const fetchBoards = async () => {
      try {
        const data = await getBoards();
        setBoards(data);
      } catch (err) {
        console.error("Failed to fetch boards:", err);
      }
    };
    fetchBoards();

    const fetchSlides = async () => {
      try {
        const data = await getSlidesPublic();
        setSlides(data);
      } catch (err) {
        console.error("Failed to fetch slides:", err);
      }
    };
    fetchSlides();

    const fetchAlbums = async () => {
      try {
        const data = await getAlbums(0, 2);
        setLatestAlbums(data.content);
      } catch (err) {
        console.error("Failed to fetch albums:", err);
      }
    };
    fetchAlbums();

    const fetchSchedules = async () => {
      try {
        const schedules = await getUpcomingSchedules();
        setLatestSchedules(schedules);
      } catch (err) {
        console.error("Failed to fetch schedules:", err);
      }
    };
    fetchSchedules();
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

  const current = slides[activeIndex];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          onLogout={handleLoginLogout}
        />

        {/* 상단 큰 사진 슬라이드 */}
        {(slides.length > 0 && current) ? (
          <section className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/80 shadow-lg">
            <div 
              className="relative h-52 w-full sm:h-72"
              style={{ backgroundColor: (current.type === 'image' ) ? current.backgroundColor || '#1e293b' : current.backgroundColor }}
            >
              {(current.type === 'image' ) ? (
                <img
                  src={current.url}
                  alt={current.title || '슬라이드'}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="relative h-full w-full">
                  {current.textElements?.map((element) => (
                    <div
                      key={element.id}
                      className="absolute whitespace-nowrap"
                      style={{
                        left: `${element.x}%`,
                        top: `${element.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${element.fontSize}px`,
                        color: element.color,
                        fontWeight: element.fontWeight,
                        fontFamily: element.fontFamily,
                      }}
                    >
                      {element.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 텍스트 오버레이 (이미지 타입이고 제목/부제목이 있을 때만 표시) */}
            {(current.type === 'image' || current.type === 'IMAGE') && (current.title || current.subtitle) && (
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-center bg-black/20 px-6 py-6 sm:px-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                  JEJA YOUTH
                </p>
                {current.title && (
                  <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                    {current.title}
                  </h1>
                )}
                {current.subtitle && (
                  <p className="mt-3 max-w-xl text-sm text-slate-200 sm:text-base">
                    {current.subtitle}
                  </p>
                )}
              </div>
            )}

            {/* 좌우 화살표 */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full p-2 text-white shadow-sm transition-all duration-300 hover:bg-black/20 md:opacity-0 md:group-hover:opacity-100"
                >
                  <span className="text-3xl drop-shadow-md">‹</span>
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full p-2 text-white shadow-sm transition-all duration-300 hover:bg-black/20 md:opacity-0 md:group-hover:opacity-100"
                >
                  <span className="text-3xl drop-shadow-md">›</span>
                </button>
              </>
            )}

            {/* 하단 인디케이터 */}
            {slides.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-2 w-2 rounded-full transition ${
                      index === activeIndex ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/80 shadow-lg">
            <div className="relative h-52 w-full sm:h-72" style={{ backgroundColor: '#1e293b' }}>
               <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                    JEJA YOUTH
                  </p>
                  <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                    제자교회 청년부에 오신 것을 환영합니다
                  </h1>
                  <p className="mt-3 max-w-xl text-sm text-slate-200 sm:text-base">
                    함께 예배하고 교제하는 기쁨이 있는 곳
                  </p>
               </div>
            </div>
          </section>
        )}

        {/* 출석 체크 섹션 (로그인 시 & 일정 있을 때만 표시됨) */}
        {isLoggedIn && <UserAttendanceSection />}

        {/* 팀 / 출석하기 / 내 정보 보기 영역 - 로그인 시에만 노출 (상단에 배치) */}
        {isLoggedIn && (
          <section className="grid gap-4 md:grid-cols-3">
            <div className="hidden md:block group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
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
            <div className="hidden md:flex group relative flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
              <h2 className="text-sm font-semibold text-slate-900">게시판</h2>
              <p className="mt-1 text-xs text-slate-500">
                다양한 게시판에서 소통하고 나누세요.
              </p>
              <div className="mt-3 flex-1 space-y-2 overflow-y-auto max-h-[150px] pr-1">
                {boards.map((board, index) => {
                  const style = BOARD_COLORS[index % BOARD_COLORS.length];
                  return (
                    <Link
                      key={board.id || board.boardId || index}
                      to={`/boards/${board.id || board.boardId}`}
                      className={`block w-full rounded-lg border px-3 py-2 text-left transition cursor-pointer ${style.color}`}
                    >
                      <span
                        className={`text-sm font-semibold ${style.textColor}`}
                      >
                        {board.name}
                      </span>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {board.description || "자유롭게 소통하는 공간입니다."}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div 
              onClick={() => navigate("/my-info")}
              className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/my-info");
                }}
                className="absolute right-3 top-3 text-[10px] font-semibold text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:text-blue-600"
              >
                상세 보기
              </button>
              <h2 className="text-sm font-semibold text-slate-900">
                내 정보
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                나의 기본 정보와 활동 내역입니다.
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">
                    이름
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {myInfo?.name || "-"}
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
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/my-reports");
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-blue-50 px-3 py-2 transition hover:bg-blue-100"
                >
                  <span className="text-xs font-medium text-slate-600">
                    작성가능 보고서
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {availableForms.length}개
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 청년부 예배 & 말씀 */}
        <WorshipSection />

        {/* 하단 여러 블록 영역 */}
        <section className="grid gap-4 lg:grid-cols-6">
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
                  key={notice.postId}
                  onClick={() => navigate(`/youth-notices/${notice.postId}`)}
                  className={`cursor-pointer rounded-lg border px-3 py-2 transition hover:border-blue-300 hover:shadow-sm ${
                    notice.notice
                      ? "border-red-200 bg-red-50/50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {notice.notice && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        중요
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {new Date(notice.createdAt).toLocaleDateString()}
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
            <div className="mt-3 grid grid-cols-2 gap-3">
              {latestAlbums.map((album) => (
                <div
                  key={album.albumId}
                  onClick={() => navigate(`/youth-album/${album.albumId}`)}
                  className="group/item overflow-hidden rounded-lg border border-slate-200 cursor-pointer transition hover:border-blue-300 hover:shadow-sm bg-slate-50"
                >
                  <div className="aspect-video w-full bg-slate-200">
                    {album.coverImageUrl ? (
                      <img
                        src={getFileUrl(album.coverImageUrl)}
                        alt={album.title}
                        className="h-full w-full object-cover transition duration-300 group-hover/item:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <span className="text-[10px]">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-sm font-bold text-slate-900">
                      {album.title}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                      {album.description || album.createdAt?.split('T')[0]}
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
            <div className="mt-3 space-y-4">
              {latestSchedules.length > 0 ? (
                <div className="space-y-2">
                  {latestSchedules.map((schedule) => {
                    const dateObj = new Date(schedule.startDate);
                    const dateStr = dateObj.toLocaleDateString();
                    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    const typeMap: Record<string, string> = {
                      'WORSHIP': '예배',
                      'EVENT': '행사',
                      'MEETING': '모임'
                    };
                    const typeLabel = typeMap[schedule.type] || schedule.type;

                    // 교인 전용 일정인지 확인 (배경색 구분)
                    const isMemberSchedule = schedule.sharingScope === 'LOGGED_IN_USERS';

                    return (
                      <div
                        key={schedule.scheduleId}
                        className={`w-full rounded-lg border px-3 py-2 text-left ${
                          isMemberSchedule 
                            ? 'border-amber-200 bg-amber-50' 
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                  schedule.type === "WORSHIP"
                                    ? "bg-blue-100 text-blue-700"
                                    : schedule.type === "EVENT"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {typeLabel}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-900">
                                {schedule.title}
                              </span>
                              {isMemberSchedule && (
                                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                                  교인전용
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                              <span>{dateStr}</span>
                              <span>•</span>
                              <span>{timeStr}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-xs text-slate-400 py-4">
                  예정된 일정이 없습니다.
                </div>
              )}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}

export default UserDashboardPage;
