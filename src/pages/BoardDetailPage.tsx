import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import UserHeader from "../components/UserHeader";
import Footer from "../components/Footer";
import { getBoardPostById } from "../services/boardService";
import { getNoticeById } from "../services/noticeService";

export type BoardType = "free" | "prayer" | "question" | "meal" | string;

interface BoardPost {
  id: number;
  title: string;
  author: string;
  createdAt: string;
  views: number;
  comments: number;
  content: string;
  isNotice?: boolean;
}

interface Comment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  isAuthor?: boolean;
  userId?: string; // 댓글 작성자 ID (실제로는 로그인한 사용자와 비교)
  replies?: Comment[]; // 대댓글
  parentId?: number; // 부모 댓글 ID (대댓글인 경우)
}

// 현재 로그인한 사용자 (임시로 "나"로 설정, 실제로는 인증 정보에서 가져옴)
const currentUserId = "나";

// 게시판 정보
interface BoardInfo {
  id: BoardType;
  name: string;
  description: string;
  color: string;
}

const boardInfo: Record<BoardType, BoardInfo> = {
  free: {
    id: "free",
    name: "자유게시판",
    description: "자유롭게 소통하고 나누는 공간입니다.",
    color: "bg-blue-100 text-blue-700",
  },
  prayer: {
    id: "prayer",
    name: "기도제목게시판",
    description: "함께 기도할 제목을 나누는 공간입니다.",
    color: "bg-purple-100 text-purple-700",
  },
  question: {
    id: "question",
    name: "목사님께질문",
    description: "목사님께 궁금한 것을 질문하는 공간입니다.",
    color: "bg-emerald-100 text-emerald-700",
  },
  meal: {
    id: "meal",
    name: "밥친구 신청",
    description: "함께 식사할 친구를 찾는 공간입니다.",
    color: "bg-amber-100 text-amber-700",
  },
};

// 임시 게시글 상세 데이터
const mockPostDetails: Record<BoardType, Record<number, BoardPost>> = {
  free: {
    1: {
      id: 1,
      title: "[공지] 게시판 이용 안내",
      author: "관리자",
      createdAt: "2024-12-20",
      views: 150,
      comments: 5,
      content: `안녕하세요. 청년부 게시판을 이용해 주셔서 감사합니다.

게시판 이용 시 다음 사항을 지켜주세요:
1. 서로를 존중하는 마음으로 글을 작성해주세요.
2. 욕설이나 비방은 삼가주세요.
3. 광고성 게시글은 금지입니다.

건전한 소통 공간이 되도록 함께 노력해주세요.`,
      isNotice: true,
    },
    2: {
      id: 2,
      title: "오늘 예배 너무 좋았어요!",
      author: "김청년",
      createdAt: "2024-12-19",
      views: 45,
      comments: 8,
      content: `오늘 주일예배 정말 감동적이었어요. 찬양도 좋고 말씀도 너무 은혜로웠습니다.

특히 오늘 말씀이 제 마음에 깊이 와닿았어요. 다음 주도 기대됩니다!`,
    },
    3: {
      id: 3,
      title: "이번 주 순모임 어디서 하나요?",
      author: "이청년",
      createdAt: "2024-12-18",
      views: 32,
      comments: 3,
      content: `이번 주 순모임 장소를 모르겠어요. 혹시 아시는 분 계신가요?`,
    },
  },
  prayer: {
    1: {
      id: 1,
      title: "[공지] 기도제목 올리는 방법",
      author: "관리자",
      createdAt: "2024-12-20",
      views: 120,
      comments: 2,
      content: `기도제목 게시판에 기도 제목을 올려주시면 함께 기도해드리겠습니다.`,
      isNotice: true,
    },
    2: {
      id: 2,
      title: "가족의 건강을 위해 기도 부탁드려요",
      author: "박청년",
      createdAt: "2024-12-19",
      views: 67,
      comments: 12,
      content: `어머니께서 요즘 건강이 좋지 않으셔서 걱정입니다. 함께 기도해주시면 감사하겠습니다.`,
    },
    3: {
      id: 3,
      title: "시험 잘 보게 해주세요",
      author: "최청년",
      createdAt: "2024-12-18",
      views: 54,
      comments: 9,
      content: `다음 주 중요한 시험이 있어요. 시험 준비와 함께 시험 당일도 잘 보게 해주세요.`,
    },
  },
  question: {
    1: {
      id: 1,
      title: "[공지] 질문 작성 시 주의사항",
      author: "관리자",
      createdAt: "2024-12-20",
      views: 200,
      comments: 1,
      content: `목사님께 질문을 올릴 때는 정중한 말투로 작성해주시고, 개인적인 질문은 개인적으로 연락해주시기 바랍니다.`,
      isNotice: true,
    },
    2: {
      id: 2,
      title: "성경 읽는 순서에 대해 질문드려요",
      author: "정청년",
      createdAt: "2024-12-19",
      views: 89,
      comments: 4,
      content: `성경을 처음 읽기 시작했는데, 어떤 순서로 읽는 것이 좋을까요? 추천해주시면 감사하겠습니다.`,
    },
    3: {
      id: 3,
      title: "기도 생활에 대해 궁금합니다",
      author: "강청년",
      createdAt: "2024-12-17",
      views: 76,
      comments: 6,
      content: `기도를 어떻게 해야 할지 모르겠어요. 기도 생활을 잘 하려면 어떻게 해야 할까요?`,
    },
  },
  meal: {
    1: {
      id: 1,
      title: "[공지] 밥친구 신청 안내",
      author: "관리자",
      createdAt: "2024-12-20",
      views: 100,
      comments: 0,
      content: `함께 식사할 친구를 찾는 공간입니다. 시간과 장소를 명확히 적어주시면 좋습니다.`,
      isNotice: true,
    },
    2: {
      id: 2,
      title: "이번 주 일요일 점심 같이 드실 분?",
      author: "윤청년",
      createdAt: "2024-12-19",
      views: 43,
      comments: 7,
      content: `이번 주 일요일 예배 후 점심 같이 드실 분 구해요! 근처 식당에서 먹을 예정입니다.`,
    },
    3: {
      id: 3,
      title: "저녁 식사 같이 하실 분 구해요",
      author: "임청년",
      createdAt: "2024-12-18",
      views: 38,
      comments: 5,
      content: `이번 주 수요일 저녁에 식사 같이 하실 분 있나요?`,
    },
  },
};

// 임시 게시글 목록 데이터 (다음/이전 게시글 찾기용)
const mockPosts: Record<BoardType, BoardPost[]> = {
  free: [
    {
      id: 1,
      title: "[공지] 게시판 이용 안내",
      author: "관리자",
      createdAt: "2024-12-20",
      views: 150,
      comments: 5,
      content: "",
      isNotice: true,
    },
    {
      id: 2,
      title: "오늘 예배 너무 좋았어요!",
      author: "김청년",
      createdAt: "2024-12-19",
      views: 45,
      comments: 8,
      content: "",
    },
    {
      id: 3,
      title: "이번 주 순모임 어디서 하나요?",
      author: "이청년",
      createdAt: "2024-12-18",
      views: 32,
      comments: 3,
      content: "",
    },
  ],
  prayer: [
    {
      id: 1,
      title: "[공지] 기도제목 올리는 방법",
      author: "관리자",
      createdAt: "2024-12-20",
      views: 120,
      comments: 2,
      content: "",
      isNotice: true,
    },
    {
      id: 2,
      title: "가족의 건강을 위해 기도 부탁드려요",
      author: "박청년",
      createdAt: "2024-12-19",
      views: 67,
      comments: 12,
      content: "",
    },
    {
      id: 3,
      title: "시험 잘 보게 해주세요",
      author: "최청년",
      createdAt: "2024-12-18",
      views: 54,
      comments: 9,
      content: "",
    },
  ],
  question: [
    {
      id: 1,
      title: "[공지] 질문 작성 시 주의사항",
      author: "관리자",
      createdAt: "2024-12-20",
      views: 200,
      comments: 1,
      content: "",
      isNotice: true,
    },
    {
      id: 2,
      title: "성경 읽는 순서에 대해 질문드려요",
      author: "정청년",
      createdAt: "2024-12-19",
      views: 89,
      comments: 4,
      content: "",
    },
    {
      id: 3,
      title: "기도 생활에 대해 궁금합니다",
      author: "강청년",
      createdAt: "2024-12-17",
      views: 76,
      comments: 6,
      content: "",
    },
  ],
  meal: [
    {
      id: 1,
      title: "[공지] 밥친구 신청 안내",
      author: "관리자",
      createdAt: "2024-12-20",
      views: 100,
      comments: 0,
      content: "",
      isNotice: true,
    },
    {
      id: 2,
      title: "이번 주 일요일 점심 같이 드실 분?",
      author: "윤청년",
      createdAt: "2024-12-19",
      views: 43,
      comments: 7,
      content: "",
    },
    {
      id: 3,
      title: "저녁 식사 같이 하실 분 구해요",
      author: "임청년",
      createdAt: "2024-12-18",
      views: 38,
      comments: 5,
      content: "",
    },
  ],
};

// 임시 댓글 데이터 (더 많은 댓글 추가)
const mockComments: Record<BoardType, Record<number, Comment[]>> = {
  free: {
    1: [
      {
        id: 1,
        author: "김청년",
        content: "네, 잘 알겠습니다!",
        createdAt: "2024-12-20",
        userId: "김청년",
      },
      {
        id: 2,
        author: "이청년",
        content: "감사합니다.",
        createdAt: "2024-12-20",
        userId: "이청년",
      },
      {
        id: 3,
        author: "나",
        content: "좋은 정보 감사합니다!",
        createdAt: "2024-12-20",
        userId: "나",
      },
      {
        id: 4,
        author: "박청년",
        content: "많은 도움이 되었어요.",
        createdAt: "2024-12-20",
        userId: "박청년",
      },
      {
        id: 5,
        author: "나",
        content: "다음에도 잘 부탁드립니다.",
        createdAt: "2024-12-20",
        userId: "나",
      },
      {
        id: 6,
        author: "최청년",
        content: "알겠습니다!",
        createdAt: "2024-12-20",
        userId: "최청년",
      },
      {
        id: 7,
        author: "정청년",
        content: "감사합니다.",
        createdAt: "2024-12-20",
        userId: "정청년",
      },
      {
        id: 8,
        author: "강청년",
        content: "좋은 정보네요!",
        createdAt: "2024-12-20",
        userId: "강청년",
      },
    ],
    2: [
      {
        id: 1,
        author: "박청년",
        content: "저도 오늘 예배 정말 좋았어요!",
        createdAt: "2024-12-19",
      },
      {
        id: 2,
        author: "최청년",
        content: "다음 주도 기대됩니다!",
        createdAt: "2024-12-19",
      },
    ],
    3: [
      {
        id: 1,
        author: "정청년",
        content: "2층 소강당에서 합니다!",
        createdAt: "2024-12-18",
      },
    ],
  },
  prayer: {
    1: [],
    2: [
      {
        id: 1,
        author: "김청년",
        content: "함께 기도하겠습니다.",
        createdAt: "2024-12-19",
      },
    ],
    3: [
      {
        id: 1,
        author: "박청년",
        content: "시험 잘 보시길 기도하겠습니다.",
        createdAt: "2024-12-18",
      },
    ],
  },
  question: {
    1: [],
    2: [
      {
        id: 1,
        author: "관리자",
        content: "성경 읽는 순서는 마태복음부터 시작하시는 것을 추천드립니다.",
        createdAt: "2024-12-19",
      },
    ],
    3: [
      {
        id: 1,
        author: "관리자",
        content:
          "기도는 마음으로 하나님께 말씀드리는 것입니다. 자유롭게 하시면 됩니다.",
        createdAt: "2024-12-17",
      },
    ],
  },
  meal: {
    1: [],
    2: [
      {
        id: 1,
        author: "김청년",
        content: "저도 참여하고 싶어요!",
        createdAt: "2024-12-19",
      },
    ],
    3: [
      {
        id: 1,
        author: "박청년",
        content: "저도 같이 하고 싶습니다!",
        createdAt: "2024-12-18",
      },
    ],
  },
};

function BoardDetailPage() {
  const { boardType, postId, noticeId } = useParams<{
    boardType?: BoardType;
    postId?: string;
    noticeId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [post, setPost] = useState<BoardPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const commentsPerPage = 5;
  const isYouthNotice = location.pathname.includes('/youth-notices');

  // write나 edit 페이지인 경우 적절한 페이지로 리다이렉트
  useEffect(() => {
    if (postId === 'write' || postId === 'edit') {
      if (postId === 'write') {
        navigate(`/boards/${boardType}/write`, { replace: true })
      } else if (postId === 'edit') {
        // edit의 경우 원래 게시글로 돌아가거나 목록으로
        navigate(`/boards/${boardType}`, { replace: true })
      }
      return
    }
    if (noticeId === 'write' || noticeId === 'edit') {
      if (noticeId === 'write') {
        navigate('/youth-notices/write', { replace: true })
      } else {
        navigate('/youth-notices', { replace: true })
      }
      return
    }
  }, [postId, noticeId, boardType, navigate])

  // write나 edit 페이지인 경우 아무것도 렌더링하지 않음
  if (postId === 'write' || postId === 'edit' || noticeId === 'write' || noticeId === 'edit') {
    return null
  }

  // 공지사항인지 게시판인지 확인
  const id = isYouthNotice ? noticeId : postId;
  const idNum = id ? parseInt(id, 10) : null;

  if ((!boardType && !isYouthNotice) || !id) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <UserHeader />
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-600">
              게시글을 찾을 수 없습니다.
            </p>
            <button
              onClick={() => navigate("/user-dashboard")}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              메인으로 돌아가기
            </button>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  const board = boardType ? boardInfo[boardType] : null;

  // 게시글 데이터 로드
  useEffect(() => {
    const loadPost = async () => {
      if (!idNum || isNaN(idNum)) {
        setError("잘못된 게시글 ID입니다.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (isYouthNotice) {
          // 공지사항 API 호출
          const notice = await getNoticeById(idNum);
          // Notice 타입을 BoardPost 타입으로 변환
          setPost({
            id: notice.id,
            title: notice.title,
            content: notice.content,
            author: notice.createdBy,
            createdAt: notice.createdAt,
            views: 0, // 공지사항 API에 views가 없을 수 있음
            comments: 0, // 공지사항 API에 comments가 없을 수 있음
            isNotice: notice.isImportant,
          });
        } else if (boardType) {
          // 게시판 API 호출
          const apiPost = await getBoardPostById(boardType, idNum);
          setPost(apiPost);
        } else {
          setError("게시판 정보를 찾을 수 없습니다.");
        }
      } catch (error: any) {
        // API 실패 시 mock 데이터로 폴백 (게시판만)
        console.warn("API에서 게시글을 가져오지 못했습니다. mock 데이터를 사용합니다:", error);
        if (!isYouthNotice && boardType) {
          const mockPost = mockPostDetails[boardType]?.[idNum];
          if (mockPost) {
            setPost(mockPost);
          } else {
            setError("게시글을 찾을 수 없습니다.");
          }
        } else {
          setError("게시글을 찾을 수 없습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [isYouthNotice, boardType, idNum]);

  // 다음/이전 게시글 찾기 (mock 데이터 사용 - 나중에 API로 교체 가능)
  const posts = boardType ? mockPosts[boardType] || [] : [];
  const currentIndex = idNum ? posts.findIndex((p) => p.id === idNum) : -1;
  const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

  // 댓글 초기화
  useEffect(() => {
    if (boardType && idNum) {
      const initialComments = mockComments[boardType]?.[idNum] || [];
      setComments(initialComments);
    }
  }, [boardType, idNum]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <UserHeader />
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-600">로딩 중...</p>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <UserHeader />
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-600">
              {error || "게시글을 찾을 수 없습니다."}
            </p>
            <button
              onClick={() => {
                if (isYouthNotice) {
                  navigate('/youth-notices')
                } else if (boardType) {
                  navigate(`/boards/${boardType}`)
                } else {
                  navigate('/user-dashboard')
                }
              }}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              목록으로 돌아가기
            </button>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `오늘 ${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    }
    if (diffDays === 1) return "어제";
    if (diffDays < 7) return `${diffDays}일 전`;
    return formatDate(dateStr);
  };

  // 페이징 계산
  const totalPages = Math.ceil(comments.length / commentsPerPage);
  const startIndex = (currentPage - 1) * commentsPerPage;
  const endIndex = startIndex + commentsPerPage;
  const currentComments = comments.slice(startIndex, endIndex);

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: comments.length + 1,
      author: currentUserId,
      content: commentText,
      createdAt: new Date().toISOString().split("T")[0],
      userId: currentUserId,
    };

    setComments([...comments, newComment]);
    setCommentText("");
    // 마지막 페이지로 이동
    const newTotalPages = Math.ceil((comments.length + 1) / commentsPerPage);
    setCurrentPage(newTotalPages);
  };

  const handleEditComment = (commentId: number) => {
    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      setEditingCommentId(commentId);
      setEditingText(comment.content);
      setOpenMenuId(null);
    }
  };

  const handleSaveEdit = (commentId: number) => {
    if (!editingText.trim()) return;

    setComments(
      comments.map((c) =>
        c.id === commentId ? { ...c, content: editingText } : c
      )
    );
    setEditingCommentId(null);
    setEditingText("");
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText("");
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      setComments(comments.filter((c) => c.id !== commentId));
      setOpenMenuId(null);
      // 현재 페이지에 댓글이 없으면 이전 페이지로
      const remainingComments = comments.filter((c) => c.id !== commentId);
      const newTotalPages = Math.ceil(remainingComments.length / commentsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    }
  };

  const handleReply = (commentId: number) => {
    setReplyingToId(commentId);
    setOpenMenuId(null);
  };

  const handleSubmitReply = (parentId: number) => {
    if (!replyText.trim()) return;

    const newReply: Comment = {
      id: comments.length + 1,
      author: currentUserId,
      content: replyText,
      createdAt: new Date().toISOString().split("T")[0],
      userId: currentUserId,
      parentId: parentId,
    };

    // 대댓글을 부모 댓글의 replies 배열에 추가
    setComments(
      comments.map((c) =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies || []), newReply] }
          : c
      )
    );
    setReplyText("");
    setReplyingToId(null);
  };

  const handleCancelReply = () => {
    setReplyingToId(null);
    setReplyText("");
  };

  const isMyComment = (comment: Comment) => {
    return comment.userId === currentUserId;
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {board ? board.name : "게시글 상세보기"}
            </h1>
          </div>
          <button
            onClick={() => {
              if (isYouthNotice) {
                navigate('/youth-notices')
              } else if (boardType) {
                navigate(`/boards/${boardType}`)
              }
            }}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            ← 목록으로
          </button>
        </div>

        {/* 게시글 상세 정보 */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* 게시글 헤더 */}
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {post.isNotice && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                    공지
                  </span>
                )}
                <h2 className="text-xl font-bold text-slate-900">{post.title}</h2>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded hover:bg-slate-200 transition"
                  aria-label="메뉴"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          if (isYouthNotice && idNum) {
                            navigate(`/youth-notices/${idNum}/edit`)
                          } else if (boardType && idNum) {
                            navigate(`/boards/${boardType}/${idNum}/edit`)
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          if (confirm('정말 삭제하시겠습니까?')) {
                            // TODO: 삭제 API 호출
                            alert('삭제되었습니다.')
                            if (isYouthNotice) {
                              navigate('/youth-notices')
                            } else if (boardType) {
                              navigate(`/boards/${boardType}`)
                            }
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>작성자: {post.author}</span>
              <span>작성일: {formatDate(post.createdAt)}</span>
              <span>조회: {post.views}</span>
              <span>댓글: {post.comments}</span>
            </div>
          </div>

          {/* 게시글 내용 */}
          <div className="px-6 py-8">
            <div
              className="prose prose-sm max-w-none text-slate-700 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4 [&_p]:mb-4 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-6"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>

        {/* 댓글 영역 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            댓글 ({comments.length})
          </h3>

          {/* 댓글 목록 */}
          <div className="mb-6 space-y-4">
            {comments.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                댓글이 없습니다. 첫 댓글을 작성해보세요!
              </div>
            ) : (
              currentComments.map((comment) => (
                <div key={comment.id} className="border-b border-slate-100 pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-semibold text-slate-900">
                        {comment.author}
                      </span>
                      {comment.isAuthor && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          작성자
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {formatDateTime(comment.createdAt)}
                      </span>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)}
                          className="p-1 rounded hover:bg-slate-200 transition"
                          aria-label="댓글 메뉴"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-slate-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>
                        {openMenuId === comment.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
                              {isMyComment(comment) ? (
                                <>
                                  <button
                                    onClick={() => handleEditComment(comment.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                                  >
                                    삭제
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleReply(comment.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                                >
                                  대댓글
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className="rounded-lg px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleSaveEdit(comment.id)}
                          className="rounded-lg px-3 py-1 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-700 whitespace-pre-line">
                      {comment.content}
                    </p>
                  )}
                  
                  {/* 대댓글 작성 폼 */}
                  {replyingToId === comment.id && (
                    <div className="mt-3 ml-4 pl-4 border-l-2 border-slate-200 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="대댓글을 입력하세요..."
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelReply}
                          className="rounded-lg px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={!replyText.trim()}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                            replyText.trim()
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          작성
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 대댓글 목록 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 ml-4 pl-4 border-l-2 border-slate-200 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="relative">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-xs font-semibold text-slate-900">
                                {reply.author}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">
                                {formatDateTime(reply.createdAt)}
                              </span>
                              {isMyComment(reply) && (
                                <div className="relative">
                                  <button
                                    onClick={() => setOpenMenuId(openMenuId === reply.id ? null : reply.id)}
                                    className="p-1 rounded hover:bg-slate-200 transition"
                                    aria-label="대댓글 메뉴"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3 w-3 text-slate-600"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                      />
                                    </svg>
                                  </button>
                                  {openMenuId === reply.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setOpenMenuId(null)}
                                      />
                                      <div className="absolute right-0 mt-2 w-24 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
                                        <button
                                          onClick={() => {
                                            handleEditComment(reply.id);
                                            // 대댓글 수정을 위해 특별 처리 필요
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-t-lg"
                                        >
                                          수정
                                        </button>
                                        <button
                                          onClick={() => {
                                            // 대댓글 삭제
                                            setComments(
                                              comments.map((c) =>
                                                c.id === comment.id
                                                  ? {
                                                      ...c,
                                                      replies: c.replies?.filter((r) => r.id !== reply.id),
                                                    }
                                                  : c
                                              )
                                            );
                                            setOpenMenuId(null);
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-b-lg"
                                        >
                                          삭제
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {editingCommentId === reply.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-slate-300 px-3 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={handleCancelEdit}
                                  className="rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                  취소
                                </button>
                                <button
                                  onClick={() => {
                                    setComments(
                                      comments.map((c) =>
                                        c.id === comment.id
                                          ? {
                                              ...c,
                                              replies: c.replies?.map((r) =>
                                                r.id === reply.id ? { ...r, content: editingText } : r
                                              ),
                                            }
                                          : c
                                      )
                                    );
                                    setEditingCommentId(null);
                                    setEditingText("");
                                  }}
                                  className="rounded-lg px-2 py-1 text-[10px] font-semibold bg-blue-600 text-white hover:bg-blue-700"
                                >
                                  저장
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-700 whitespace-pre-line">
                              {reply.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 댓글 페이징 */}
          {comments.length > commentsPerPage && (
            <div className="flex justify-center items-center gap-2 mb-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                  currentPage === 1
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                이전
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                  currentPage === totalPages
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                다음
              </button>
            </div>
          )}

          {/* 댓글 작성 */}
          <div className="border-t border-slate-200 pt-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요..."
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  commentText.trim()
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                댓글 작성
              </button>
            </div>
          </div>
        </div>

        {/* 다음/이전 게시글 */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-200">
            {prevPost ? (
              <Link
                to={`/boards/${boardType}/${prevPost.id}`}
                className="block px-6 py-4 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 text-sm font-semibold text-slate-500">
                    이전글
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {prevPost.isNotice && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          공지
                        </span>
                      )}
                      <span className="text-sm font-medium text-slate-900 truncate">
                        {prevPost.title}
                      </span>
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-slate-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </div>
              </Link>
            ) : (
              <div className="px-6 py-4 text-sm text-slate-400">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 text-sm font-semibold">이전글</div>
                  <div className="flex-1">이전 게시글이 없습니다.</div>
                </div>
              </div>
            )}
            {nextPost ? (
              <Link
                to={`/boards/${boardType}/${nextPost.id}`}
                className="block px-6 py-4 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 text-sm font-semibold text-slate-500">
                    다음글
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {nextPost.isNotice && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          공지
                        </span>
                      )}
                      <span className="text-sm font-medium text-slate-900 truncate">
                        {nextPost.title}
                      </span>
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-slate-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ) : (
              <div className="px-6 py-4 text-sm text-slate-400">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 text-sm font-semibold">다음글</div>
                  <div className="flex-1">다음 게시글이 없습니다.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-start">
          <button
            onClick={() => {
              if (isYouthNotice) {
                navigate('/youth-notices')
              } else if (boardType) {
                navigate(`/boards/${boardType}`)
              }
            }}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            목록으로
          </button>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default BoardDetailPage;
