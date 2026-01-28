import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearAuth,
  getUserRole,
  isLoggedIn as checkLoggedIn,
  isManager as checkIsManager,
  MANAGER_ROLES,
} from "../utils/auth";
import { getClubs } from "../services/clubService";
import type { Club } from "../types/club";

type UserHeaderProps = {
  isLoggedIn?: boolean;
  userRole?: string | null;
  onLogout?: () => void;
};

// 게시판 정보
const boardTypes = [
  {
    id: "free",
    name: "자유게시판",
  },
  {
    id: "prayer",
    name: "기도제목게시판",
  },
  {
    id: "question",
    name: "목사님께질문",
  },
  {
    id: "meal",
    name: "밥친구 신청",
  },
];

function UserHeader({
  isLoggedIn: propLoggedIn,
  userRole: propUserRole,
  onLogout,
}: UserHeaderProps) {
  const navigate = useNavigate();
  const [localLoggedIn, setLocalLoggedIn] = useState(false);
  const [localRole, setLocalRole] = useState<string | null>(null);
  const [isBoardMenuOpen, setIsBoardMenuOpen] = useState(false);
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);
  const [teams, setTeams] = useState<Club[]>([]);

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
      setLocalRole(getUserRole());
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // 팀 목록 불러오기
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await getClubs();
        setTeams(data);
      } catch (error) {
        console.error("팀 목록 로드 실패:", error);
      }
    };

    if (propLoggedIn || localLoggedIn) {
      fetchTeams();
    }
  }, [propLoggedIn, localLoggedIn]);

  // 상위에서 전달된 상태가 있으면 우선 사용
  const isLoggedIn = propLoggedIn ?? localLoggedIn;
  const userRole = propUserRole ?? localRole;
  // 관리자 권한 확인 (userRole이 있으면 해당 역할로, 없으면 저장된 역할로 확인)
  const isManager = userRole
    ? MANAGER_ROLES.includes(userRole as (typeof MANAGER_ROLES)[number])
    : checkIsManager();

  const handleLoginLogout = () => {
    if (isLoggedIn) {
      if (onLogout) {
        onLogout();
      } else {
        clearAuth();
        setLocalLoggedIn(false);
        setLocalRole(null);
      }
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/user-dashboard")}
          className="rounded-full bg-blue-600 px-5 py-2 text-base font-semibold uppercase tracking-wide text-white hover:bg-blue-700 transition cursor-pointer"
        >
          JEJA
        </button>
      </div>

      <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
        <button
          onClick={() => navigate("/youth-notices")}
          className="rounded-full px-3 py-1 hover:bg-slate-100"
        >
          공지사항
        </button>
        <button
          onClick={() => navigate("/youth-album")}
          className="rounded-full px-3 py-1 hover:bg-slate-100"
        >
          앨범
        </button>
        <button
          onClick={() => navigate("/schedules")}
          className="rounded-full px-3 py-1 hover:bg-slate-100"
        >
          일정
        </button>
        {isLoggedIn && (
          <>
            <div
              className="relative"
              onMouseEnter={openTeamMenu}
              onMouseLeave={closeTeamMenu}
            >
              <button className="rounded-full px-3 py-1 hover:bg-slate-100">
                팀
              </button>
              {isTeamMenuOpen && (
                <div 
                  className="absolute left-0 top-full mt-1 min-w-[160px] rounded-lg border border-slate-200 bg-white shadow-lg z-50"
                  onMouseEnter={openTeamMenu}
                  onMouseLeave={closeTeamMenu}
                >
                  <button
                    onClick={() => {
                      navigate("/club");
                      setIsTeamMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50 rounded-t-lg transition border-b border-slate-200"
                  >
                    팀 목록
                  </button>
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
              className="relative"
              onMouseEnter={openBoardMenu}
              onMouseLeave={closeBoardMenu}
            >
              <button className="rounded-full px-3 py-1 hover:bg-slate-100">
                게시판
              </button>
              {isBoardMenuOpen && (
                <div 
                  className="absolute left-0 top-full mt-1 min-w-[160px] rounded-lg border border-slate-200 bg-white shadow-lg z-50"
                  onMouseEnter={openBoardMenu}
                  onMouseLeave={closeBoardMenu}
                >
                  {boardTypes.map((board) => (
                    <button
                      key={board.id}
                      onClick={() => {
                        navigate(`/boards/${board.id}`);
                        setIsBoardMenuOpen(false);
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
              className="rounded-full px-3 py-1 hover:bg-slate-100"
            >
              내 정보
            </button>
          </>
        )}
        {isManager && (
          <>
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-full px-3 py-1 hover:bg-slate-100 text-blue-600"
            >
              청년부 관리
            </button>
            <button
              onClick={() => navigate("/homepage-manage")}
              className="rounded-full px-3 py-1 hover:bg-slate-100 text-fuchsia-700"
            >
              홈페이지 관리
            </button>
          </>
        )}
      </nav>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleLoginLogout}
          className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          {isLoggedIn ? "로그아웃" : "로그인"}
        </button>
      </div>
    </header>
  );
}

export default UserHeader;
