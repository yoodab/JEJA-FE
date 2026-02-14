import React, { useEffect, useState } from 'react';
import { rollingPaperService } from '../services/rollingPaperService';
import { themeService } from '../services/themeService';
import { useConfirm } from '../contexts/ConfirmContext';
import type { RollingPaperTheme } from '../services/themeService';
import type { RollingPaper } from '../types/rollingPaper';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const RollingPaperManagePage = () => {
  const { confirm } = useConfirm();
  const [papers, setPapers] = useState<RollingPaper[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Menu State
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Search and Pagination State
  const [searchTitle, setSearchTitle] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Create/Edit Form State
  const [editingPaperId, setEditingPaperId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [creationTab, setCreationTab] = useState<'BASIC' | 'CUSTOM'>('BASIC');
  
  // Basic Theme State
  const [basicTheme, setBasicTheme] = useState('BLACK');

  // Custom Theme State
  const [savedThemes, setSavedThemes] = useState<RollingPaperTheme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);

  const loadPapers = async (page = 0, title = searchTitle) => {
    try {
      const data = await rollingPaperService.getAllRollingPapers(title, page);
      setPapers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setCurrentPage(page);
    } catch (error) {
      console.error(error);
      toast.error('롤링페이퍼 목록을 불러오는데 실패했습니다.');
    }
  };

  const loadThemes = async () => {
    try {
      const data = await themeService.getAllThemes();
      setSavedThemes(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const init = async () => {
      loadPapers();
      loadThemes();
    }
    init();
    
    // Close menu when clicking outside
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const openCreateModal = () => {
    setEditingPaperId(null);
    setTitle('');
    setCreationTab('BASIC');
    setBasicTheme('BLACK');
    setSelectedThemeId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (paper: RollingPaper) => {
    setEditingPaperId(paper.id);
    setTitle(paper.title);
    
    if (paper.theme === 'CUSTOM') {
      setCreationTab('CUSTOM');
      // Try to match existing theme if possible, otherwise it might be hard to select the exact one 
      // if it was modified. But usually we just want to let them pick a new one or keep current.
      // For now, we won't pre-select a theme ID because the paper stores the CONFIG, not the Theme ID.
      // So they will have to re-select a theme if they want to change it in Custom mode.
      setSelectedThemeId(null); 
    } else {
      setCreationTab('BASIC');
      setBasicTheme(paper.theme);
    }
    
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!title) return toast.error('제목을 입력해주세요.');

    try {
      let theme = basicTheme;
      let backgroundConfig: string | null = null;

      if (creationTab === 'CUSTOM') {
        if (selectedThemeId) {
            const selectedTheme = savedThemes.find(t => t.id === selectedThemeId);
            if (selectedTheme) {
                theme = 'CUSTOM';
                backgroundConfig = selectedTheme.themeConfig;
            }
        } else if (editingPaperId) {
             // If editing and no new theme selected, check if we can keep the original
             const originalPaper = papers.find(p => p.id === editingPaperId);
             if (originalPaper && originalPaper.theme === 'CUSTOM') {
                 // Keep original config
                 theme = 'CUSTOM';
                 backgroundConfig = originalPaper.backgroundConfig;
             } else {
                 return toast.error('테마를 선택해주세요.');
             }
        } else {
            return toast.error('테마를 선택해주세요.');
        }
      }

      if (editingPaperId) {
        await rollingPaperService.updateRollingPaper(editingPaperId, {
          title,
          theme,
          backgroundConfig: backgroundConfig ? JSON.parse(backgroundConfig) : undefined
        });
        toast.success('롤링페이퍼가 수정되었습니다.');
      } else {
        await rollingPaperService.createRollingPaper({
          title,
          theme,
          backgroundConfig: backgroundConfig || ''
        });
        toast.success('롤링페이퍼가 생성되었습니다.');
      }
      
      setIsModalOpen(false);
      loadPapers(currentPage, searchTitle);
      setTitle('');
      setSelectedThemeId(null);
      setEditingPaperId(null);
    } catch (error) {
      console.error(error);
      toast.error(editingPaperId ? '수정 실패' : '생성 실패');
    }
  };

  const handleDeleteRollingPaper = async (id: number) => {
    const isConfirmed = await confirm({
      title: '롤링페이퍼 삭제',
      message: '정말 이 롤링페이퍼를 삭제하시겠습니까? 복구할 수 없습니다.',
      type: 'danger',
      confirmText: '삭제',
      cancelText: '취소'
    });
    
    if (!isConfirmed) return;

    try {
      await rollingPaperService.deleteRollingPaper(id);
      toast.success('롤링페이퍼가 삭제되었습니다.');
      loadPapers(currentPage, searchTitle);
    } catch (error) {
      console.error(error);
      toast.error('삭제 실패');
    }
  };

  const handleDeleteTheme = async (e: React.MouseEvent, themeId: number) => {
    e.stopPropagation();
    
    const isConfirmed = await confirm({
      title: '테마 삭제',
      message: '정말 이 테마를 삭제하시겠습니까?',
      type: 'danger',
      confirmText: '삭제',
      cancelText: '취소'
    });
    
    if (!isConfirmed) return;
    
    try {
      await themeService.deleteTheme(themeId);
      toast.success('테마가 삭제되었습니다.');
      loadThemes();
      if (selectedThemeId === themeId) setSelectedThemeId(null);
    } catch (error) {
      console.error(error);
      toast.error('테마 삭제 실패');
    }
  };

  const handleEditTheme = (e: React.MouseEvent, theme: RollingPaperTheme) => {
    e.stopPropagation();
    navigate('/manage/rolling-papers/theme-editor', { state: { theme } });
  };

  const copyLink = (id: number) => {
    const url = `${window.location.origin}/rolling-papers/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('링크가 복사되었습니다!');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="flex-grow mx-auto w-full max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              ← 
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-xl">
                💌
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">롤링페이퍼 관리</p>
                <p className="text-xs text-slate-500">롤링페이퍼 생성 및 관리</p>
              </div>
            </div>
          </div>
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
          >
            + 생성
          </button>
        </header>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex w-full sm:max-w-md gap-2">
            <div className="relative flex-grow">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="롤링페이퍼 제목으로 검색..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadPapers(0, searchTitle)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={() => loadPapers(0, searchTitle)}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
            >
              검색
            </button>
          </div>
          <div className="text-sm text-slate-500 font-medium">
            총 <span className="text-blue-600">{totalElements}</span>개의 롤링페이퍼
          </div>
        </div>

        {papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-slate-500 font-medium">검색 결과가 없거나 등록된 롤링페이퍼가 없습니다.</p>
            {searchTitle && (
              <button 
                onClick={() => { setSearchTitle(''); loadPapers(0, ''); }}
                className="mt-4 text-blue-600 hover:underline text-sm font-semibold"
              >
                검색어 초기화
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {papers.map((paper) => (
            <div key={paper.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 border border-slate-200 relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-2 h-full ${paper.theme === 'BLACK' ? 'bg-gray-800' : paper.theme === 'LIGHT' ? 'bg-gray-200' : 'bg-blue-400'}`}></div>
              <div className="pl-4">
                  <div className="flex justify-between items-start mb-2 relative">
                      <h3 className="text-xl font-bold text-gray-800 line-clamp-1">{paper.title}</h3>
                      <div className="relative">
                          <button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === paper.id ? null : paper.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                          >
                              <span className="text-xl font-bold leading-none">⋮</span>
                          </button>
                          
                          {activeMenuId === paper.id && (
                              <div className="absolute right-0 top-8 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-10 py-1 overflow-hidden">
                                  <button
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          openEditModal(paper);
                                          setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                      <span>✏️</span> 수정
                                  </button>
                                  <button
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteRollingPaper(paper.id);
                                          setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                      <span>🗑️</span> 삭제
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-4 flex items-center gap-2">
                      <span className="font-medium">{paper.theme}</span>
                      {paper.theme === 'CUSTOM' && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Custom</span>}
                  </p>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                  <button 
                      onClick={() => window.open(`/rolling-papers/${paper.id}`, '_blank')}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 text-sm"
                  >
                      바로가기 ↗
                  </button>
                  <button 
                      onClick={() => copyLink(paper.id)}
                      className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                      링크 복사
                  </button>
                  </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-8">
            <button
              onClick={() => loadPapers(currentPage - 1)}
              disabled={currentPage === 0}
              className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              ←
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => loadPapers(i)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                    currentPage === i
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => loadPapers(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">
                {editingPaperId ? '롤링페이퍼 수정' : '새 롤링페이퍼 만들기'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <label className="block text-slate-700 font-bold mb-2">제목</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="롤링페이퍼 제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="mb-4">
                  <div className="flex border-b border-slate-200 mb-6">
                      <button 
                        className={`px-4 py-2 font-medium transition-colors ${creationTab === 'BASIC' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setCreationTab('BASIC')}
                      >
                          기본 테마
                      </button>
                      <button 
                        className={`px-4 py-2 font-medium transition-colors ${creationTab === 'CUSTOM' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setCreationTab('CUSTOM')}
                      >
                          커스텀 테마
                      </button>
                  </div>

                  {creationTab === 'BASIC' ? (
                      <div className="grid grid-cols-2 gap-4">
                          <div 
                              className={`border-2 rounded-xl p-4 cursor-pointer hover:bg-slate-50 transition-all ${basicTheme === 'BLACK' ? 'border-slate-800 bg-slate-50 ring-1 ring-slate-800' : 'border-slate-200'}`}
                              onClick={() => setBasicTheme('BLACK')}
                          >
                              <div className="h-24 bg-slate-900 rounded-lg mb-3 shadow-inner"></div>
                              <p className="font-bold text-center text-slate-900">Dark Theme</p>
                          </div>
                          <div 
                              className={`border-2 rounded-xl p-4 cursor-pointer hover:bg-slate-50 transition-all ${basicTheme === 'LIGHT' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200'}`}
                              onClick={() => setBasicTheme('LIGHT')}
                          >
                              <div className="h-24 bg-white border border-slate-200 rounded-lg mb-3 shadow-inner"></div>
                              <p className="font-bold text-center text-slate-900">Light Theme</p>
                          </div>
                      </div>
                  ) : (
                      <div>
                          <div className="flex justify-between items-center mb-4">
                              <p className="text-sm text-slate-600">저장된 테마 목록</p>
                              <button 
                                  onClick={() => navigate('/manage/rolling-papers/theme-editor')}
                                  className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-1 transition-colors"
                              >
                                  <span>✨</span> 새 테마 만들기
                              </button>
                          </div>
                          
                          {savedThemes.length === 0 ? (
                              <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                  <p className="text-slate-500 mb-2">저장된 테마가 없습니다.</p>
                                  <button 
                                      onClick={() => navigate('/manage/rolling-papers/theme-editor')}
                                      className="text-blue-600 font-bold hover:underline"
                                  >
                                      첫 번째 테마를 만들어보세요!
                                  </button>
                              </div>
                          ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1 custom-scrollbar">
                                  {savedThemes.map(theme => (
                                      <div 
                                          key={theme.id}
                                          className={`group relative border-2 rounded-xl cursor-pointer p-2 transition-all ${selectedThemeId === theme.id ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                                          onClick={() => setSelectedThemeId(theme.id)}
                                      >
                                          <div className="aspect-video bg-slate-100 rounded-lg mb-2 overflow-hidden relative shadow-inner">
                                              {/* Simple Preview based on config */}
                                              {(() => {
                                                  try {
                                                      const c = JSON.parse(theme.themeConfig);
                                                      const style: React.CSSProperties = { width: '100%', height: '100%' };
                                                      if (c.background?.type === 'COLOR') style.backgroundColor = c.background.value;
                                                      else if (c.background?.type === 'GRADIENT') style.background = c.background.value;
                                                      else if (c.background?.type === 'IMAGE') {
                                                          style.backgroundImage = `url(${c.background.value})`;
                                                          style.backgroundSize = 'cover';
                                                      }
                                                      return <div style={style}>
                                                          {c.effect?.type !== 'NONE' && <div className="absolute top-1 right-1 text-xs drop-shadow-md">✨</div>}
                                                      </div>;
                                                  } catch { return <div className="bg-slate-200 w-full h-full flex items-center justify-center text-xs text-slate-400">Preview Error</div> }
                                              })()}
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <p className="text-xs font-bold text-slate-700 truncate flex-1">{theme.name}</p>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => handleEditTheme(e, theme)}
                                                    className="p-1 hover:bg-slate-200 rounded text-slate-500"
                                                    title="테마 수정"
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDeleteTheme(e, theme.id)}
                                                    className="p-1 hover:bg-red-100 rounded text-red-500"
                                                    title="테마 삭제"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  )}
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
              >
                취소
              </button>
              <button 
                onClick={handleSave}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-sm transition-colors"
              >
                {editingPaperId ? '수정 완료' : '생성하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RollingPaperManagePage;
