import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearAuth,
  isLoggedIn as checkLoggedIn,
  isManager as checkIsManager,
} from "../utils/auth";
import { getClubs, getMyClubs } from "../services/clubService";
import { getBoards, type Board } from "../services/boardService";
import type { Club } from "../types/club";
import { ClubType } from "../types/club";

type UserHeaderProps = {
  isLoggedIn?: boolean;
  userRole?: string | null;
  onLogout?: () => void;
};

function UserHeader({
  isLoggedIn: propLoggedIn,
  onLogout,
}: UserHeaderProps) {
  const navigate = useNavigate();
  const [localLoggedIn, setLocalLoggedIn] = useState(false);
  const [isBoardMenuOpen, setIsBoardMenuOpen] = useState(false);
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);
  const [isMyInfoMenuOpen, setIsMyInfoMenuOpen] = useState(false);
  const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);
  const [teams, setTeams] = useState<Club[]>([]);
  const [myTeams, setMyTeams] = useState<Club[]>([]);
  const [isOtherTeamsExpanded, setIsOtherTeamsExpanded] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);

  // 소속 팀과 소속되지 않은 팀 분류
  const myTeamList = teams.filter(t => myTeams.some(mt => String(mt.id) === String(t.id)));
  const otherTeamList = teams.filter(t => !myTeams.some(mt => String(mt.id) === String(t.id)));

  const teamMenuTimer = useRef<NodeJS.Timeout | null>(null);
  const boardMenuTimer = useRef<NodeJS.Timeout | null>(null);

  const openTeamMenu = () => {
    if (teamMenuTimer.current) {
      clearTimeout(teamMenuTimer.current);
      teamMenuTimer.current = null;
    }
    // 게시판 메뉴가 열려있다면 즉시 닫기
    if (isBoardMenuOpen) {
      if (boardMenuTimer.current) {
        clearTimeout(boardMenuTimer.current);
        boardMenuTimer.current = null;
      }
      setIsBoardMenuOpen(false);
    }
    setIsTeamMenuOpen(true);
  };

  const closeTeamMenu = () => {
    teamMenuTimer.current = setTimeout(() => {
      setIsTeamMenuOpen(false);
    }, 300);
  };

  const openBoardMenu = () => {
    if (boardMenuTimer.current) {
      clearTimeout(boardMenuTimer.current);
      boardMenuTimer.current = null;
    }
    // 팀 메뉴가 열려있다면 즉시 닫기
    if (isTeamMenuOpen) {
      if (teamMenuTimer.current) {
        clearTimeout(teamMenuTimer.current);
        teamMenuTimer.current = null;
      }
      setIsTeamMenuOpen(false);
    }
    setIsBoardMenuOpen(true);
  };

  const closeBoardMenu = () => {
    boardMenuTimer.current = setTimeout(() => {
      setIsBoardMenuOpen(false);
    }, 300);
  };

  // 내부 상태 초기화 및 storage 변경 감지
  useEffect(() => {
    const sync = () => {
      setLocalLoggedIn(checkLoggedIn());
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // 팀 목록 불러오기
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const [allClubs, myClubs] = await Promise.all([
          getClubs(),
          getMyClubs()
        ]);
        if (import.meta.env.DEV) {
          console.log('All Clubs:', allClubs);
          console.log('My Clubs:', myClubs);
        }
        setTeams(allClubs);
          setMyTeams(myClubs);
      } catch (error) {
        console.error("팀 목록 로드 실패:", error);
      }
    };

    const fetchBoards = async () => {
      try {
        const data = await getBoards();
        setBoards(data);
      } catch (error) {
        console.error("게시판 목록 로드 실패:", error);
      }
    };

    if (propLoggedIn || localLoggedIn) {
      fetchTeams();
      fetchBoards();
    }
  }, [propLoggedIn, localLoggedIn]);

  // 상위에서 전달된 상태가 있으면 우선 사용
  const isLoggedIn = propLoggedIn ?? localLoggedIn;
  
  // 관리자 권한 확인 (localStorage의 모든 권한을 체크하는 checkIsManager 사용)
  const isManager = checkIsManager();

  // 디버깅을 위한 로그 추가
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('UserHeader isManager 권한 상태:', isManager);
    }
  }, [isManager]);

  const handleLoginLogout = () => {
    if (isLoggedIn) {
      if (onLogout) {
        onLogout();
      } else {
        clearAuth();
        setLocalLoggedIn(false);
      }
    } else {
      navigate("/login");
    }
  };

  return (
    <>
      <header className="relative rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm z-50">
        <div className="flex flex-row items-center justify-between gap-2 md:gap-0">
          <div className="flex flex-none items-center gap-3">
            <button
              onClick={() => navigate("/user-dashboard")}
              className="rounded-full bg-blue-600 px-5 py-2 text-base font-semibold uppercase tracking-wide text-white hover:bg-blue-700 transition cursor-pointer"
            >
              JEJA
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 overflow-x-auto md:overflow-visible items-center justify-center gap-2 text-sm font-semibold text-slate-700 scrollbar-hide flex-nowrap md:w-auto md:justify-center">
            <button
              onClick={() => navigate("/youth-notices")}
              className="flex-none rounded-full px-3 py-1 hover:bg-slate-100 whitespace-nowrap"
            >
              공지사항
            </button>
            <button
              onClick={() => navigate("/youth-album")}
              className="flex-none rounded-full px-3 py-1 hover:bg-slate-100 whitespace-nowrap"
            >
              앨범
            </button>
            <button
              onClick={() => navigate("/schedules")}
              className="flex-none rounded-full px-3 py-1 hover:bg-slate-100 whitespace-nowrap"
            >
              일정
            </button>

            {/* Desktop Only Menu Items (Hidden on Mobile) */}
            {isLoggedIn && (
              <>
                <div
                  className="relative flex-none hidden md:block"
                  onMouseEnter={openTeamMenu}
                  onMouseLeave={closeTeamMenu}
                >
                  <button 
                    className="rounded-full px-3 py-1 hover:bg-slate-100 whitespace-nowrap"
                    onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
                  >
                    팀
                  </button>
                  {isTeamMenuOpen && (
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-1 min-w-[160px] rounded-lg border border-slate-200 bg-white shadow-lg z-50"
                      onMouseEnter={openTeamMenu}
                      onMouseLeave={closeTeamMenu}
                    >
                      {teams.map((team) => (
                        <button
                          key={team.id}
                          onClick={() => {
                            navigate(`/club/${team.id}`);
                            setIsTeamMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 last:rounded-b-lg transition"
                        >
                          {team.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  className="relative flex-none hidden md:block"
                  onMouseEnter={openBoardMenu}
                  onMouseLeave={closeBoardMenu}
                >
                  <button 
                    className="rounded-full px-3 py-1 hover:bg-slate-100 whitespace-nowrap"
                    onClick={() => setIsBoardMenuOpen(!isBoardMenuOpen)}
                  >
                    게시판
                  </button>
                  {isBoardMenuOpen && (
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-1 min-w-[160px] rounded-lg border border-slate-200 bg-white shadow-lg z-50"
                      onMouseEnter={openBoardMenu}
                      onMouseLeave={closeBoardMenu}
                    >
                      {boards.map((board, index) => (
                        <button
                          key={board.id || board.boardId || index}
                          onClick={() => {
                            const boardId = board.id || board.boardId;
                            if (boardId) {
                              navigate(`/boards/${boardId}`);
                              setIsBoardMenuOpen(false);
                            } else {
                              console.error("Board ID is missing", board);
                            }
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg transition"
                        >
                          {board.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate("/my-info")}
                  className="flex-none rounded-full px-3 py-1 hover:bg-slate-100 whitespace-nowrap hidden md:block"
                >
                  내 정보
                </button>
              </>
            )}
            {isManager && (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex-none rounded-full px-3 py-1 hover:bg-slate-100 text-blue-600 whitespace-nowrap hidden md:block"
                >
                  청년부 관리
                </button>
                <button
                  onClick={() => navigate("/homepage-manage")}
                  className="flex-none rounded-full px-3 py-1 hover:bg-slate-100 text-fuchsia-700 whitespace-nowrap hidden md:block"
                >
                  홈페이지 관리
                </button>
              </>
            )}
          </nav>

          {/* Login/Logout Button - Desktop Only */}
          <div className="flex flex-none items-center gap-2">
            <button
              type="button"
              onClick={handleLoginLogout}
              className="hidden md:block rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 whitespace-nowrap"
            >
              {isLoggedIn ? "로그아웃" : "로그인"}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Floating Login Button (Only when not logged in) */}
      {!isLoggedIn && (
        <button
          onClick={() => navigate("/login")}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-800 hover:scale-105 active:scale-95 md:hidden"
          aria-label="로그인"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
        </button>
      )}

      {/* Mobile Bottom Floating Bar */}
      {isLoggedIn && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-4 py-2 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex justify-around items-center text-xs font-medium text-slate-600">
            {/* Team Menu */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsTeamMenuOpen(!isTeamMenuOpen);
                  setIsBoardMenuOpen(false); // Close other menu
                  setIsMyInfoMenuOpen(false); // Close other menu
                }}
                className={`flex flex-col items-center gap-1 p-2 ${isTeamMenuOpen ? 'text-blue-600' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span>팀</span>
              </button>
              {isTeamMenuOpen && (
                <div className="fixed left-0 right-0 bottom-[60px] bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-50 border-t border-slate-100 animate-slide-up max-h-[70vh] overflow-y-auto">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <span className="font-bold text-lg text-slate-900">팀 목록</span>
                    <button onClick={() => setIsTeamMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                  
                  <div className="flex flex-col">
                    {/* 내 팀 목록 */}
                    {myTeamList.map((team) => (
                      <div key={team.id} className="border-b border-slate-50">
                        <div 
                          className="flex items-center justify-between w-full px-4 py-3 bg-blue-50/30"
                          onClick={() => {
                            navigate(`/club/${team.id}`);
                            setIsTeamMenuOpen(false);
                          }}
                        >
                          <span className="text-base font-bold text-blue-600">
                            {team.name} <span className="text-[10px] ml-1 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full uppercase">My</span>
                          </span>
                        </div>

                        <div className="px-4 pb-3 flex flex-col gap-1 bg-blue-50/30">
                          <div className="flex flex-wrap gap-2 mt-1">
                            {team.type === ClubType.NEW_BELIEVER && (
                              <>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/manage/newcomers`);
                                    setIsTeamMenuOpen(false);
                                  }}
                                  className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg shadow-sm font-semibold"
                                >
                                  새신자관리
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/manage/meal-tickets`);
                                    setIsTeamMenuOpen(false);
                                  }}
                                  className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg shadow-sm font-semibold"
                                >
                                  식권관리
                                </button>
                              </>
                            )}
                            {team.type === ClubType.CONTENT && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/manage/group-formation`);
                                  setIsTeamMenuOpen(false);
                                }}
                                className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg shadow-sm font-semibold"
                              >
                                조편성
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* 다른 팀 목록 (접이식) */}
                    {otherTeamList.length > 0 && (
                      <div className="border-b border-slate-50 last:border-0">
                        <div 
                          className="flex items-center justify-between w-full px-4 py-4 transition"
                          onClick={() => setIsOtherTeamsExpanded(!isOtherTeamsExpanded)}
                        >
                          <span className="text-base text-slate-700 font-medium">다른 팀 보기</span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="20" height="20" 
                            viewBox="0 0 24 24" fill="none" 
                            stroke="currentColor" strokeWidth="2" 
                            strokeLinecap="round" strokeLinejoin="round"
                            className={`text-slate-400 transition-transform duration-200 ${isOtherTeamsExpanded ? 'rotate-180' : ''}`}
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>

                        {isOtherTeamsExpanded && (
                          <div className="bg-slate-50/50 px-2 pb-2">
                            {otherTeamList.map((team) => (
                              <button
                                key={team.id}
                                onClick={() => {
                                  navigate(`/club/${team.id}`);
                                  setIsTeamMenuOpen(false);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-100 transition rounded-lg flex items-center justify-between"
                              >
                                <span>{team.name}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M5 12h14"></path><polyline points="12 5 19 12 12 19"></polyline></svg>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Board Menu */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsBoardMenuOpen(!isBoardMenuOpen);
                  setIsTeamMenuOpen(false); // Close other menu
                  setIsMyInfoMenuOpen(false); // Close other menu
                }}
                className={`flex flex-col items-center gap-1 p-2 ${isBoardMenuOpen ? 'text-blue-600' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                <span>게시판</span>
              </button>
              {isBoardMenuOpen && (
                <div className="fixed left-0 right-0 bottom-[60px] bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-50 border-t border-slate-100 animate-slide-up">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white">
                    <span className="font-bold text-lg text-slate-900">게시판 목록</span>
                    <button onClick={() => setIsBoardMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                  {boards.map((board, index) => (
                    <button
                      key={board.id || board.boardId || index}
                      onClick={() => {
                        const boardId = board.id || board.boardId;
                        if (boardId) {
                          navigate(`/boards/${boardId}`);
                          setIsBoardMenuOpen(false);
                        }
                      }}
                      className="w-full px-4 py-3 text-left text-base text-slate-700 hover:bg-slate-50 transition border-b border-slate-50 last:border-0"
                    >
                      {board.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* My Info */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsMyInfoMenuOpen(!isMyInfoMenuOpen);
                  setIsTeamMenuOpen(false); // Close other menu
                  setIsBoardMenuOpen(false); // Close other menu
                }}
                className={`flex flex-col items-center gap-1 p-2 ${isMyInfoMenuOpen ? 'text-blue-600' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>내 정보</span>
              </button>
              {isMyInfoMenuOpen && (
                <div className="fixed left-0 right-0 bottom-[60px] bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-50 border-t border-slate-100 animate-slide-up">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <span className="font-bold text-lg text-slate-900">내 정보</span>
                    <button onClick={() => setIsMyInfoMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      navigate("/my-info");
                      setIsMyInfoMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-base text-slate-700 hover:bg-slate-50 transition border-b border-slate-50 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    내 정보 보기
                  </button>
                  <button
                    onClick={() => {
                      handleLoginLogout();
                      setIsMyInfoMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-base text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    로그아웃
                  </button>
                </div>
              )}
            </div>

            {/* Manager Only: Youth Management */}
            {isManager && (
              <div className="relative">
                <button 
                  onClick={() => {
                    setIsManageMenuOpen(!isManageMenuOpen);
                    setIsTeamMenuOpen(false);
                    setIsBoardMenuOpen(false);
                    setIsMyInfoMenuOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1 p-2 ${isManageMenuOpen ? 'text-blue-600' : 'text-blue-600'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                  <span>관리</span>
                </button>
                {isManageMenuOpen && (
                  <div className="fixed left-0 right-0 bottom-[60px] bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-50 border-t border-slate-100 animate-slide-up">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                      <span className="font-bold text-lg text-slate-900">관리 메뉴</span>
                      <button onClick={() => setIsManageMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        navigate("/dashboard");
                        setIsManageMenuOpen(false);
                      }}
                      className="w-full px-4 py-4 text-left text-base text-slate-700 hover:bg-slate-50 transition border-b border-slate-50 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                      </div>
                      청년부 관리
                    </button>
                    <button
                      onClick={() => {
                        navigate("/homepage-manage");
                        setIsManageMenuOpen(false);
                      }}
                      className="w-full px-4 py-4 text-left text-base text-slate-700 hover:bg-slate-50 transition flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-fuchsia-100 flex items-center justify-center text-fuchsia-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                      </div>
                      홈페이지 관리
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default UserHeader;
