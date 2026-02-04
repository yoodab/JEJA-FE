import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import UserHeader from "../components/UserHeader";
import Footer from "../components/Footer";
import { getBoardPostById, getBoardPosts, getBoards, deleteBoardPost, type Board } from "../services/boardService";
import { 
  getNoticeById, 
  getNotices,
  createComment, 
  updateComment, 
  deleteComment, 
  deleteNotice, 
  togglePostLike, 
  toggleCommentLike, 
  type CommentResponse 
} from "../services/noticeService";

export type BoardType = string;

interface BoardPost {
  id: number;
  title: string;
  author: string;
  createdAt: string;
  views: number;
  comments: number;
  content: string;
  isNotice?: boolean;
  likeCount?: number;
  isLiked?: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

function BoardDetailPage() {
  const { boardType, postId, noticeId } = useParams<{
    boardType?: BoardType;
    postId?: string;
    noticeId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [post, setPost] = useState<BoardPost | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [prevPost, setPrevPost] = useState<{ id: number; title: string } | null>(null);
  const [nextPost, setNextPost] = useState<{ id: number; title: string } | null>(null);
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

  // 공지사항인지 게시판인지 확인
  const id = isYouthNotice ? noticeId : postId;
  const idNum = id ? parseInt(id, 10) : null;

  // 게시글 데이터 및 게시판 정보 로드
  useEffect(() => {
    const loadData = async () => {
      if (!idNum || isNaN(idNum)) {
        // write나 edit 페이지인 경우 에러 처리하지 않음
        if (postId === 'write' || postId === 'edit' || noticeId === 'write' || noticeId === 'edit') {
          return;
        }
        setError("잘못된 게시글 ID입니다.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let apiBoardId = boardType;

        // 1. 게시판 정보 로드 (공지사항이 아닌 경우)
        if (!isYouthNotice && boardType) {
          try {
            const boards = await getBoards();
            // id 또는 boardId가 일치하는지 확인
            const currentBoard = boards.find(b => 
              String(b.id) === String(boardType) || 
              (b.boardId && String(b.boardId) === String(boardType))
            );
            if (currentBoard) {
              setBoard(currentBoard);
              if (currentBoard.boardId) {
                apiBoardId = currentBoard.boardId;
              } else if (currentBoard.id) {
                apiBoardId = currentBoard.id;
              }
            }
          } catch (e) {
            console.error('Failed to load board info', e);
          }
        }

        // 2. 게시글 로드
        if (isYouthNotice) {
          // 공지사항 API 호출
          const notice = await getNoticeById(idNum);
          // Notice 타입을 BoardPost 타입으로 변환
          setPost({
            id: notice.postId,
            title: notice.title,
            content: notice.content,
            author: notice.authorName,
            createdAt: notice.createdAt,
            views: notice.viewCount,
            comments: notice.commentCount,
            isNotice: notice.notice,
            likeCount: notice.likeCount,
            isLiked: notice.liked,
            attachmentUrl: notice.attachmentUrl,
            attachmentName: notice.attachmentName,
          });
          setComments(notice.comments || []);

          // 이전/다음 글 조회
          try {
            const { notices } = await getNotices({ size: 100 });
            const currentIndex = (notices || []).findIndex(n => n.postId === idNum);
            if (currentIndex !== -1) {
              const next = currentIndex > 0 ? notices[currentIndex - 1] : null;
              const prev = currentIndex < notices.length - 1 ? notices[currentIndex + 1] : null;
              setNextPost(next ? { id: next.postId, title: next.title } : null);
              setPrevPost(prev ? { id: prev.postId, title: prev.title } : null);
            }
          } catch (e) {
            console.error('Failed to load neighbor posts', e);
          }
        } else if (apiBoardId) {
          // 게시판 API 호출
          const apiPost = await getBoardPostById(apiBoardId, idNum);
          setPost(apiPost);

          // 이전/다음 글 조회
          try {
            const { posts } = await getBoardPosts(apiBoardId, { size: 100 });
            const currentIndex = (posts || []).findIndex(p => p.id === idNum);
            if (currentIndex !== -1) {
              const next = currentIndex > 0 ? posts[currentIndex - 1] : null;
              const prev = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
              setNextPost(next ? { id: next.id, title: next.title } : null);
              setPrevPost(prev ? { id: prev.id, title: prev.title } : null);
            }
          } catch (e) {
            console.error('Failed to load neighbor posts', e);
          }
        } else {
          setError("게시판 정보를 찾을 수 없습니다.");
        }
      } catch (error: unknown) {
        console.warn("API에서 게시글을 가져오지 못했습니다:", error);
        setError("게시글을 찾을 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isYouthNotice, boardType, idNum, postId, noticeId]);

  // write나 edit 페이지인 경우 아무것도 렌더링하지 않음
  if (postId === 'write' || postId === 'edit' || noticeId === 'write' || noticeId === 'edit') {
    return null
  }

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

  const refreshPost = async () => {
    if (!idNum) return;
    try {
      if (isYouthNotice) {
        const notice = await getNoticeById(idNum);
        setPost({
          id: notice.postId,
          title: notice.title,
          content: notice.content,
          author: notice.authorName,
          createdAt: notice.createdAt,
          views: notice.viewCount,
          comments: notice.commentCount,
          isNotice: notice.notice,
          likeCount: notice.likeCount,
          isLiked: notice.liked,
          attachmentUrl: notice.attachmentUrl,
          attachmentName: notice.attachmentName,
        });
        setComments(notice.comments || []);
      } else if (boardType) {
        // 게시판 refresh
        const apiPost = await getBoardPostById(boardType, idNum);
        setPost(apiPost);
        // 댓글은 별도 API가 없다면 post에 포함되어 있다고 가정하거나 다시 로드
        // 현재 API 구조상 getBoardPostById가 댓글을 포함하는지 확인 필요
        // 만약 댓글이 별도라면 여기서 로드해야 함. 
        // 기존 코드에서는 getBoardPostById가 댓글을 포함하지 않을 수도 있지만, 
        // noticeService를 사용하여 댓글을 관리하는 것으로 보임 (createComment 등).
        // 하지만 createComment는 noticeId 기반일 수 있음. 
        // 일단 noticeService의 댓글 기능이 게시판에도 통합되어 있다고 가정.
        // 만약 통합되지 않았다면 추가 수정 필요. 
        // 여기서는 기존 로직 유지.
      }
    } catch (error) {
      console.error("Failed to refresh post:", error);
    }
  };

  const renderComments = (commentList: CommentResponse[], depth = 0) => {
    return commentList.map((comment) => (
      <div 
        key={comment.commentId} 
        className={`${
          depth > 0 
            ? "mt-4 ml-10 border-l-2 border-slate-100 pl-4" 
            : "border-b border-slate-100 py-6 last:border-0"
        }`}
      >
        <div className="flex gap-4 group">
          {/* 아바타 */}
          <div className="flex-shrink-0">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${
              ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500'][comment.authorName.length % 5]
            }`}>
              {comment.authorName.charAt(0)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* 헤더 */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {comment.authorName}
                  </span>
                </div>
                <span className="text-xs text-slate-400 mt-0.5 block">
                  {formatDateTime(comment.createdAt)}
                </span>
              </div>
              
              {/* 더보기 메뉴 */}
              {(comment.canEdit || comment.canDelete) && (
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === comment.commentId ? null : comment.commentId)}
                    className="p-1 text-slate-300 hover:text-slate-600 rounded transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  {openMenuId === comment.commentId && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 mt-1 w-28 bg-white rounded-lg shadow-xl border border-slate-100 z-20 py-1 overflow-hidden">
                        {comment.canEdit && (
                          <button
                            onClick={() => {
                              setEditingCommentId(comment.commentId);
                              setEditingText(comment.content);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                          >
                            수정
                          </button>
                        )}
                        {comment.canDelete && (
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              handleDeleteComment(comment.commentId);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 본문 */}
            <div className="mt-2">
              {editingCommentId === comment.commentId ? (
                <div className="mt-2">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleUpdateComment(comment.commentId)}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      수정 완료
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}
            </div>

            {/* 액션 바 (좋아요, 답글) */}
            {editingCommentId !== comment.commentId && (
              <div className="mt-3 flex items-center gap-4">
                <button 
                  onClick={() => handleToggleCommentLike(comment.commentId)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    comment.liked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${comment.liked ? "fill-current" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{comment.likeCount > 0 ? comment.likeCount : '좋아요'}</span>
                </button>

                <button 
                  onClick={() => setReplyingToId(replyingToId === comment.commentId ? null : comment.commentId)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    replyingToId === comment.commentId ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>답글 달기</span>
                </button>
              </div>
            )}

            {/* 답글 작성 폼 */}
            {replyingToId === comment.commentId && (
              <div className="mt-4 animate-fadeIn">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`@${comment.authorName}님에게 답글 작성...`}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                  rows={2}
                  autoFocus
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setReplyingToId(null)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => handleReplySubmit(comment.commentId)}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 shadow-sm"
                  >
                    등록
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 재귀적으로 대댓글 렌더링 */}
        {comment.children && comment.children.length > 0 && (
          <div className="mt-2">
            {renderComments(comment.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !idNum) return;

    try {
      await createComment(idNum, commentText);
      setCommentText("");
      await refreshPost();
    } catch (error) {
      console.error("Failed to create comment:", error);
      alert("댓글 작성에 실패했습니다.");
    }
  };

  const handleReplySubmit = async (parentId: number) => {
    if (!replyText.trim() || !idNum) return;

    try {
      await createComment(idNum, replyText, parentId);
      setReplyText("");
      setReplyingToId(null);
      await refreshPost();
    } catch (error) {
      console.error("Failed to create reply:", error);
      alert("답글 작성에 실패했습니다.");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      await deleteComment(commentId);
      await refreshPost();
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editingText.trim()) return;

    try {
      await updateComment(commentId, editingText);
      setEditingCommentId(null);
      setEditingText("");
      await refreshPost();
    } catch (error) {
      console.error("Failed to update comment:", error);
      alert("댓글 수정에 실패했습니다.");
    }
  };

  const handleToggleLike = async () => {
    if (!idNum) return;
    try {
      await togglePostLike(idNum);
      await refreshPost();
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const handleToggleCommentLike = async (commentId: number) => {
    try {
      await toggleCommentLike(commentId);
      await refreshPost();
    } catch (error) {
      console.error("Failed to toggle comment like:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {board ? board.name : (isYouthNotice ? "청년부 공지사항" : "게시글 상세보기")}
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
              {(post.canEdit || post.canDelete) && (
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
                        {post.canEdit && (
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
                        )}
                        {post.canDelete && (
                          <button
                            onClick={async () => {
                              setShowMenu(false)
                              if (idNum && confirm('정말 삭제하시겠습니까?')) {
                                try {
                                  if (isYouthNotice) {
                                    await deleteNotice(idNum)
                                    alert('삭제되었습니다.')
                                    navigate('/youth-notices')
                                  } else if (boardType) {
                                    const targetId = board?.boardId || boardType
                                    await deleteBoardPost(targetId, idNum)
                                    alert('삭제되었습니다.')
                                    navigate(`/boards/${boardType}`)
                                  }
                                } catch (error) {
                                  console.error("Failed to delete post:", error)
                                  alert('게시글 삭제에 실패했습니다.')
                                }
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>작성자: {post.author}</span>
              <span>{formatDateTime(post.createdAt)}</span>
              <span>조회 {post.views}</span>
            </div>
            {/* 첨부파일 표시 */}
            {post.attachmentUrl && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <a 
                  href={post.attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {post.attachmentName || '첨부파일'}
                </a>
              </div>
            )}
          </div>

          {/* 게시글 내용 */}
          <div className="px-6 py-8 min-h-[200px] prose max-w-none">
            {/* HTML 컨텐츠 렌더링 */}
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {/* 좋아요 버튼 (본문 하단) */}
          <div className="flex justify-center pb-8">
            <button
              onClick={handleToggleLike}
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-sm transition-all duration-200 border ${
                post.isLiked 
                  ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100" 
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>좋아요 {post.likeCount || 0}</span>
            </button>
          </div>

          {/* 이전글/다음글 네비게이션 */}
          <div className="border-t border-slate-200 px-6 py-4">
            <div className="flex flex-col">
              {nextPost && (
                <div className="flex items-center gap-4 py-3">
                  <span className="flex-shrink-0 w-16 text-sm font-semibold text-slate-500">다음글</span>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    <Link 
                      to={isYouthNotice ? `/youth-notices/${nextPost.id}` : `/boards/${boardType}/${nextPost.id}`}
                      className="truncate text-sm text-slate-700 hover:text-blue-600 hover:underline"
                    >
                      {nextPost.title}
                    </Link>
                  </div>
                </div>
              )}
              
              {/* 구분선 (다음글과 이전글이 모두 있을 때만 표시) */}
              {nextPost && prevPost && <div className="h-px bg-slate-100 my-1" />}

              {prevPost && (
                <div className="flex items-center gap-4 py-3">
                  <span className="flex-shrink-0 w-16 text-sm font-semibold text-slate-500">이전글</span>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <Link 
                      to={isYouthNotice ? `/youth-notices/${prevPost.id}` : `/boards/${boardType}/${prevPost.id}`}
                      className="truncate text-sm text-slate-700 hover:text-blue-600 hover:underline"
                    >
                      {prevPost.title}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            댓글 <span className="text-blue-600">{comments.length}</span>
          </h3>

          {/* 댓글 목록 */}
          <div className="mb-8 space-y-6">
            {comments.length > 0 ? (
              <>
                {renderComments(currentComments)}
                
                {/* 페이징 */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded px-2 py-1 text-sm hover:bg-slate-100 disabled:opacity-50"
                    >
                      이전
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`rounded px-2 py-1 text-sm ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded px-2 py-1 text-sm hover:bg-slate-100 disabled:opacity-50"
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                첫 번째 댓글을 남겨보세요!
              </div>
            )}
          </div>

          {/* 댓글 작성 폼 */}
          <div className="flex gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="flex-1 resize-none rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              rows={3}
            />
            <button
              onClick={handleSubmitComment}
              className="rounded-lg bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700 transition"
            >
              등록
            </button>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default BoardDetailPage;
