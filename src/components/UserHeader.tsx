import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearAuth,
  getUserRole,
  isLoggedIn as checkLoggedIn,
  isManager as checkIsManager,
  MANAGER_ROLES,
} from "../utils/auth";

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

// 팀 정보 (실제로는 API에서 가져올 데이터)
const teamTypes = [
  {
    id: 1,
    name: "예배팀",
  },
  {
    id: 2,
    name: "찬양팀",
  },
  {
    id: 3,
    name: "새신자팀",
  },
  {
    id: 4,
    name: "방송팀",
  },
  {
    id: 5,
    name: "컨텐츠팀",
  },
  {
    id: 6,
    name: "디자인팀",
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
              onMouseEnter={() => setIsTeamMenuOpen(true)}
              onMouseLeave={() => setIsTeamMenuOpen(false)}
            >
              <button className="rounded-full px-3 py-1 hover:bg-slate-100">
                팀
              </button>
              {isTeamMenuOpen && (
                <div className="absolute left-0 top-full mt-1 min-w-[160px] rounded-lg border border-slate-200 bg-white shadow-lg z-50">
                  <button
                    onClick={() => {
                      navigate("/club");
                      setIsTeamMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50 rounded-t-lg transition border-b border-slate-200"
                  >
                    팀 목록
                  </button>
                  {teamTypes.map((team) => (
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
              onMouseEnter={() => setIsBoardMenuOpen(true)}
              onMouseLeave={() => setIsBoardMenuOpen(false)}
            >
              <button className="rounded-full px-3 py-1 hover:bg-slate-100">
                게시판
              </button>
              {isBoardMenuOpen && (
                <div className="absolute left-0 top-full mt-1 min-w-[160px] rounded-lg border border-slate-200 bg-white shadow-lg z-50">
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
