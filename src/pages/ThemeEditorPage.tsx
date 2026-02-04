import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { toast } from 'react-hot-toast';
import { uploadFiles, getFileUrl } from '../services/albumService';
import { themeService, type RollingPaperTheme } from '../services/themeService';
import { EffectLayer } from '../components/EffectLayer';

interface Area {
  x: number
  y: number
  width: number
  height: number
}

const ThemeEditorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const themeFromState = location.state?.theme as RollingPaperTheme | undefined;

  const getInitialConfig = (theme: RollingPaperTheme | undefined) => {
    if (!theme) return {};
    try {
      return typeof theme.themeConfig === 'string' ? JSON.parse(theme.themeConfig) : (theme.themeConfig as unknown) || {};
    } catch {
      return {};
    }
  };

  const initialConfig = getInitialConfig(themeFromState);

  const [editingThemeId] = useState<number | null>(() => themeFromState?.id || null);

  const [activeTab, setActiveTab] = useState<'BANNER' | 'BACKGROUND' | 'EFFECT'>('BACKGROUND');
  const [themeName, setThemeName] = useState(() => themeFromState?.name || '');
  
  // Banner State
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [finalBannerUrl, setFinalBannerUrl] = useState<string | null>(() => initialConfig.banner?.url || null);

  // Background State
  const [bgType, setBgType] = useState<'COLOR' | 'GRADIENT' | 'IMAGE'>(() => initialConfig.background?.type || 'COLOR');
  
  const getInitialBgColor = () => {
    return initialConfig.background?.type === 'COLOR' ? initialConfig.background.value : '#ffffff';
  };
  const [bgColor, setBgColor] = useState(getInitialBgColor);

  const [titleColor, setTitleColor] = useState(() => initialConfig.titleColor || '#ffffff'); // New State

  const getInitialGradient = () => {
    if (initialConfig.background?.type === 'GRADIENT') {
      const match = initialConfig.background.value.match(/linear-gradient\((\d+)deg,\s*([^,]+),\s*([^)]+)\)/);
      if (match) {
        return {
          angle: parseInt(match[1]),
          colors: [match[2].trim(), match[3].trim()]
        };
      }
    }
    return { angle: 120, colors: ['#a18cd1', '#fbc2eb'] };
  };
  const initialGradient = getInitialGradient();
  const [gradientColors, setGradientColors] = useState(initialGradient.colors);
  const [gradientAngle, setGradientAngle] = useState(initialGradient.angle);

  // Effect State
  const [effectType, setEffectType] = useState(() => initialConfig.effect?.type || 'NONE'); // NONE, SNOW, HEART, STAR, IMAGE, FIREWORKS
  const [effectConfig, setEffectConfig] = useState<{
    speed: number;
    count: number;
    minSize: number;
    maxSize: number;
    imageUrl?: string;
  }>(() => initialConfig.effect?.config || {
    speed: 1.0,
    count: 30,
    minSize: 2,
    maxSize: 8
  });

  const onCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setBannerImage(reader.result as string);
        setActiveTab('BANNER');
      };
      reader.readAsDataURL(file);
    }
  };

  const saveTheme = async () => {
    if (!themeName) return toast.error('테마 이름을 입력해주세요.');

    // Construct Config
    let backgroundValue = bgColor;
    if (bgType === 'GRADIENT') {
      backgroundValue = `linear-gradient(${gradientAngle}deg, ${gradientColors[0]}, ${gradientColors[1]})`;
    }

    // In a real app, we would crop the image server-side or canvas-side here. 
    // For now, we'll save the original URL and crop data if needed, or just the uploaded URL if simplified.
    // Assuming bannerImage is a dataUrl, we might want to upload it first if it's new.
    // Simplified: Just use the URL we have (if uploaded via service) or dataURL.
    
    // NOTE: Implementing actual crop saving requires canvas processing. 
    // For this MVP, we will skip server-side cropping and just save the view port or raw image.
    // If the user actually uploaded a file to 'bannerImage' (DataURL), we should ideally upload it.
    // But let's assume 'finalBannerUrl' is set after user confirms crop (logic to be added).
    
    const config = {
      type: 'CUSTOM',
      background: {
        type: bgType,
        value: backgroundValue
      },
      titleColor,
      banner: finalBannerUrl ? { url: finalBannerUrl } : null,
      effect: {
        type: effectType,
        config: effectConfig
      }
    };

    try {
      if (editingThemeId) {
        await themeService.updateTheme(editingThemeId, themeName, config);
        toast.success('테마가 수정되었습니다!');
      } else {
        await themeService.createTheme(themeName, config);
        toast.success('테마가 저장되었습니다!');
      }
      navigate('/manage/rolling-papers');
    } catch (error) {
      console.error(error);
      toast.error('테마 저장 실패');
    }
  };

  // Canvas for cropping (Client-side)
  const getCroppedImg = async () => {
    if (!bannerImage || !croppedAreaPixels) return;
    
    try {
      const image = new Image();
      image.src = bannerImage;
      await new Promise(resolve => { image.onload = resolve });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Convert to blob and upload
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "banner_crop.png", { type: "image/png" });
        const result = await uploadFiles([file], "banners");
        if (result && result.length > 0) {
            setFinalBannerUrl(getFileUrl(result[0].url));
            toast.success('배너가 적용되었습니다.');
            setBannerImage(null); // Close cropper
        }
      }, 'image/png');
    } catch (e) {
      console.error(e);
      toast.error('배너 처리 실패');
    }
  };

  // Preview Style Calculation
  const getPreviewStyle = () => {
    const style: React.CSSProperties = {
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    };

    if (bgType === 'COLOR') style.backgroundColor = bgColor;
    else if (bgType === 'GRADIENT') style.background = `linear-gradient(${gradientAngle}deg, ${gradientColors[0]}, ${gradientColors[1]})`;
    
    return style;
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-4 lg:px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 z-20">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-black p-1">
                <span className="text-xl">←</span>
            </button>
            <h1 className="text-xl font-bold">{editingThemeId ? '테마 수정' : '테마 만들기'}</h1>
            <div className="w-8 sm:hidden"></div> {/* Spacer for center alignment on mobile */}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <input 
                type="text" 
                placeholder="테마 이름 입력" 
                className="border rounded px-3 py-1.5 text-sm flex-1 sm:w-48"
                value={themeName}
                onChange={e => setThemeName(e.target.value)}
            />
            <button onClick={saveTheme} className="bg-black text-white px-4 py-1.5 rounded text-sm hover:bg-gray-800 whitespace-nowrap">
                {editingThemeId ? '수정' : '저장'}
            </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
        {/* Left: Preview */}
        <div className="flex-1 p-4 lg:p-8 flex items-center justify-center bg-gray-200 overflow-hidden min-h-0">
          <div 
            className="w-full max-w-[320px] lg:max-w-[360px] aspect-[9/16] bg-white rounded-xl shadow-2xl overflow-hidden relative flex-shrink-0 transition-all duration-300" 
            style={getPreviewStyle()}
          >
            {/* Effect Layer Preview */}
            <EffectLayer type={effectType} config={effectConfig} />

            {/* Content Mockup */}
            <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
                <div className="p-6 pt-10 text-center">
                    <h2 className="text-xl lg:text-2xl font-bold drop-shadow-md" style={{ color: titleColor }}>롤링페이퍼 제목</h2>
                </div>
                <div className="flex-1 overflow-hidden p-4 grid grid-cols-2 gap-4 content-start opacity-90">
                    <div className="bg-white p-3 rounded shadow h-24 lg:h-32"></div>
                    <div className="bg-yellow-100 p-3 rounded shadow h-24 lg:h-32"></div>
                    <div className="bg-blue-100 p-3 rounded shadow h-24 lg:h-32"></div>
                    <div className="bg-pink-100 p-3 rounded shadow h-24 lg:h-32"></div>
                </div>
            </div>

            {/* Banner Preview */}
            {finalBannerUrl && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] z-20">
                    <img src={finalBannerUrl} alt="Banner" className="w-full rounded shadow-lg" />
                </div>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l flex flex-col h-[40vh] lg:h-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:shadow-none z-10">
            {/* Tabs */}
            <div className="flex border-b shrink-0">
                {(['BANNER', 'BACKGROUND', 'EFFECT'] as const).map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        {tab === 'BANNER' ? '배너' : tab === 'BACKGROUND' ? '배경' : '효과'}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6 scrollbar-hide">
                {activeTab === 'BANNER' && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center">
                            <input 
                                type="file" 
                                id="banner-upload" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleBannerUpload}
                            />
                            <label htmlFor="banner-upload" className="cursor-pointer block">
                                <span className="text-4xl block mb-2">🖼️</span>
                                <span className="text-sm text-gray-600 font-medium">이미지 업로드</span>
                                <p className="text-xs text-gray-400 mt-1">PNG 권장 (투명 배경)</p>
                            </label>
                        </div>
                        
                        {bannerImage && (
                            <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
                                <div className="relative flex-1">
                                    <Cropper
                                        image={bannerImage}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={3 / 1} // Banner Aspect Ratio
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                    />
                                </div>
                                <div className="bg-white p-4 flex justify-between items-center">
                                    <div className="w-1/2 pr-4">
                                        <label className="text-xs font-bold text-gray-500">ZOOM</label>
                                        <input
                                            type="range"
                                            value={zoom}
                                            min={1}
                                            max={3}
                                            step={0.1}
                                            aria-labelledby="Zoom"
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setBannerImage(null)} className="px-4 py-2 text-gray-600">취소</button>
                                        <button onClick={getCroppedImg} className="px-6 py-2 bg-blue-600 text-white rounded">완료</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {finalBannerUrl && (
                            <div className="relative group">
                                <img src={finalBannerUrl} alt="Current Banner" className="w-full rounded border" />
                                <button 
                                    onClick={() => setFinalBannerUrl(null)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    삭제
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'BACKGROUND' && (
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-2 block">제목 색상</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {['#ffffff', '#000000', '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3'].map(c => (
                                    <button 
                                        key={c}
                                        className={`w-8 h-8 rounded-full border ${titleColor === c ? 'ring-2 ring-blue-500' : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setTitleColor(c)}
                                    />
                                ))}
                            </div>
                            <input type="color" value={titleColor} onChange={e => setTitleColor(e.target.value)} className="w-full h-10 cursor-pointer" />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-2 block">타입 선택</label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setBgType('COLOR')}
                                    className={`flex-1 py-2 text-sm border rounded ${bgType === 'COLOR' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-gray-600'}`}
                                >
                                    단색
                                </button>
                                <button 
                                    onClick={() => setBgType('GRADIENT')}
                                    className={`flex-1 py-2 text-sm border rounded ${bgType === 'GRADIENT' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-gray-600'}`}
                                >
                                    그라데이션
                                </button>
                            </div>
                        </div>

                        {bgType === 'COLOR' && (
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">색상 선택</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {['#ffffff', '#f8f9fa', '#fff9c4', '#ffcdd2', '#bbdefb', '#c8e6c9', '#e1bee7', '#212121'].map(c => (
                                        <button 
                                            key={c}
                                            className={`w-8 h-8 rounded-full border ${bgColor === c ? 'ring-2 ring-blue-500' : ''}`}
                                            style={{ backgroundColor: c }}
                                            onClick={() => setBgColor(c)}
                                        />
                                    ))}
                                </div>
                                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full h-10 cursor-pointer" />
                            </div>
                        )}

                        {bgType === 'GRADIENT' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-2 block">추천 그라데이션</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            ['#a18cd1', '#fbc2eb'],
                                            ['#ff9a9e', '#fecfef'],
                                            ['#f6d365', '#fda085'],
                                            ['#84fab0', '#8fd3f4'],
                                            ['#e0c3fc', '#8ec5fc'],
                                            ['#4facfe', '#00f2fe']
                                        ].map((colors, i) => (
                                            <button 
                                                key={i}
                                                className="h-10 rounded border hover:opacity-80 transition-opacity"
                                                style={{ background: `linear-gradient(120deg, ${colors[0]}, ${colors[1]})` }}
                                                onClick={() => setGradientColors(colors)}
                                            />
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-2 block">커스텀 색상</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={gradientColors[0]} onChange={e => setGradientColors([e.target.value, gradientColors[1]])} className="flex-1 h-10" />
                                        <input type="color" value={gradientColors[1]} onChange={e => setGradientColors([gradientColors[0], e.target.value])} className="flex-1 h-10" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-2 block">각도: {gradientAngle}°</label>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="360" 
                                        value={gradientAngle} 
                                        onChange={e => setGradientAngle(Number(e.target.value))} 
                                        className="w-full" 
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'EFFECT' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-2">
                            {['NONE', 'SNOW', 'HEART', 'STAR', 'IMAGE', 'FIREWORKS'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setEffectType(type)}
                                    className={`py-3 text-xs font-bold border rounded flex flex-col items-center justify-center gap-1 ${effectType === type ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <span className="text-lg">
                                        {type === 'NONE' ? '🚫' : type === 'SNOW' ? '❄️' : type === 'HEART' ? '❤️' : type === 'STAR' ? '⭐' : type === 'IMAGE' ? '🖼️' : '🎆'}
                                    </span>
                                    {type === 'NONE' ? '없음' : type === 'IMAGE' ? '이미지' : type}
                                </button>
                            ))}
                        </div>

                        {effectType === 'IMAGE' && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center">
                                <input 
                                    type="file" 
                                    id="effect-image-upload" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={async (e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            try {
                                                const result = await uploadFiles(Array.from(e.target.files), 'effects');
                                                if (result && result.length > 0) {
                                                    setEffectConfig(prev => ({ ...prev, imageUrl: getFileUrl(result[0].url) }));
                                                    toast.success('효과 이미지가 업로드되었습니다.');
                                                }
                                            } catch (error) {
                                                console.error(error);
                                                toast.error('이미지 업로드 실패');
                                            }
                                        }
                                    }}
                                />
                                <label htmlFor="effect-image-upload" className="cursor-pointer block">
                                    {effectConfig.imageUrl ? (
                                        <img src={effectConfig.imageUrl} alt="Effect" className="h-16 mx-auto mb-2 object-contain" />
                                    ) : (
                                        <span className="text-2xl block mb-2">📤</span>
                                    )}
                                    <span className="text-sm text-gray-600 font-medium">{effectConfig.imageUrl ? '이미지 변경' : '떨어질 이미지 업로드'}</span>
                                </label>
                            </div>
                        )}

                        {effectType !== 'NONE' && (
                            <div className="space-y-4 pt-4 border-t">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block flex justify-between">
                                        <span>SPEED</span>
                                        <span>{effectConfig.speed}x</span>
                                    </label>
                                    <input 
                                        type="range" 
                                        min="0.5" 
                                        max="3" 
                                        step="0.1" 
                                        value={effectConfig.speed} 
                                        onChange={e => setEffectConfig({...effectConfig, speed: Number(e.target.value)})}
                                        className="w-full accent-blue-600" 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block flex justify-between">
                                        <span>COUNT</span>
                                        <span>{effectConfig.count}</span>
                                    </label>
                                    <input 
                                        type="range" 
                                        min="10" 
                                        max="100" 
                                        step="10" 
                                        value={effectConfig.count} 
                                        onChange={e => setEffectConfig({...effectConfig, count: Number(e.target.value)})}
                                        className="w-full accent-blue-600" 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block flex justify-between">
                                        <span>SIZE RANGE</span>
                                        <span>{effectConfig.minSize}px ~ {effectConfig.maxSize}px</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="10" 
                                            value={effectConfig.minSize} 
                                            onChange={e => setEffectConfig({...effectConfig, minSize: Number(e.target.value)})}
                                            className="flex-1 accent-blue-600" 
                                        />
                                        <input 
                                            type="range" 
                                            min="5" 
                                            max="20" 
                                            value={effectConfig.maxSize} 
                                            onChange={e => setEffectConfig({...effectConfig, maxSize: Number(e.target.value)})}
                                            className="flex-1 accent-blue-600" 
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeEditorPage;
