import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { rollingPaperService } from '../services/rollingPaperService';
import type { RollingPaper, RollingPaperMessage } from '../types/rollingPaper';
import { toast } from 'react-hot-toast';
import { uploadFiles, getFileUrl } from '../services/albumService';
import Draggable from 'react-draggable';
import { EffectLayer } from '../components/EffectLayer';
import Cropper from 'react-easy-crop';

// Helper for cropping
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}

const RollingPaperDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [paper, setPaper] = useState<RollingPaper | null>(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  
  // Crop & Tip Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<unknown>(null);

  // Message Detail View
  const [selectedMessage, setSelectedMessage] = useState<RollingPaperMessage | null>(null);

  // Write Form State
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Style defaults
  const [bgColor, setBgColor] = useState('#fff9c4'); 
  const [bgImage, setBgImage] = useState<string>(''); // New state for background image
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [fontColor, setFontColor] = useState('#000000');
  const [textAlign, setTextAlign] = useState('left');

  // Sticker State
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const stickerRef = useRef<HTMLDivElement>(null);

  // Pending Sticker (for positioning)
  const [pendingStickerUrl, setPendingStickerUrl] = useState<string | null>(null);
  const [stickerPos, setStickerPos] = useState({ x: 0, y: 0 });
  const [stickerScale, setStickerScale] = useState(1);
  const [stickerRotation, setStickerRotation] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'PAPER' | 'LIST'>('PAPER');
  const [stickerTab, setStickerTab] = useState<'STICKER' | 'EMOJI'>('STICKER');

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollY = container.scrollTop;
      
      // 1. 최상단(스크롤 위치 10 이하)에서는 항상 메뉴가 보여야 함
      if (currentScrollY <= 10) {
        if (!isVisible) setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // 2. 5px 이상 스크롤했을 때만 방향 판단 (미세 떨림 방지)
      const diff = currentScrollY - lastScrollY.current;
      if (Math.abs(diff) < 5) return;

      if (diff > 0) {
        // 아래로 스크롤 중 -> 숨김 (이미 숨겨져 있으면 무시)
        if (isVisible) setIsVisible(false);
      } else {
        // 위로 스크롤 중 -> 보임 (이미 보이고 있으면 무시)
        if (!isVisible) setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [paper, isVisible]); // isVisible 상태 변화에 따라 리스너의 클로저 갱신 필요 시 추가

  // Emoji helper
  const getEmojiUrl = (emoji: string) => {
    const codePoint = emoji.codePointAt(0)?.toString(16);
    return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${codePoint}.png`;
  };

  const emojiList = [
    '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙',
    '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥',
    '😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐',
    '😕','😟','🙁','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩',
    '😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹',
    '😻','😼','😽','🙀','😿','😾','🙈','🙉','🙊','💋','💌','💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔',
    '❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💯','💢','💥','💫','💦','💨','🕳️','💣','💬','👁️‍🗨️','🗨️','🗯️',
    '👋','🤚','🖐️','✋','🖖','👌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊',
    '🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🦷','🦴',
    '👀','👁️','👅','👄','👶','🧒','👦','👧','🧑','👱','👨','🧔','👨‍🦰','👨‍🦱','👨‍🦳','👨‍🦲','👩','👱‍♀️','👩‍🦰','👩‍🦱',
    '👵','👴','👲','👳','👳‍♀️','🧕','👮','👮‍♀️','👷','👷‍♀️','💂','💂‍♀️','🕵️','🕵️‍♀️','👩‍⚕️','👨‍⚕️','👩‍🌾','👨‍🌾','👩‍🍳','👨‍🍳',
    '👩‍🎓','👨‍🎓','👩‍🎤','👨‍🎤','👩‍🏫','👨‍🏫','👩‍🏭','👨‍🏭','👩‍💻','👨‍💻','👩‍💼','👨‍💼','👩‍🔧','👨‍🔧','👩‍🔬','👨‍🔬','👩‍🎨','👨‍🎨',
    '👩‍🚒','👨‍🚒','👩‍✈️','👨‍✈️','👩‍🚀','👨‍🚀','👩‍⚖️','👨‍⚖️','👰','🤵','👸','🤴','🦸','🦸‍♀️','🦸‍♂️','🦹','🦹‍♀️','🦹‍♂️','🤶','🎅',
    '🧙','🧙‍♀️','🧙‍♂️','🧝','🧝‍♀️','🧝‍♂️','🧛','🧛‍♀️','🧛‍♂️','🧟','🧟‍♀️','🧟‍♂️','🧞','🧞‍♀️','🧞‍♂️','🧜','🧜‍♀️','🧜‍♂️','🧚','🧚‍♀️','🧚‍♂️',
    '👼','🤰','🤱','🙇','🙇‍♀️','🙇‍♂️','💁','💁‍♀️','💁‍♂️','🙅','🙅‍♀️','🙅‍♂️','🙆','🙆‍♀️','🙆‍♂️','🙋','🙋‍♀️','🙋‍♂️','🧏','🧏‍♀️','🧏‍♂️',
    '🤦','🤦‍♀️','🤦‍♂️','🤷','🤷‍♀️','🤷‍♂️','🙎','🙎‍♀️','🙎‍♂️','🙍','🙍‍♀️','🙍‍♂️','💇','💇‍♀️','💇‍♂️','💆','💆‍♀️','💆‍♂️','🧖','🧖‍♀️','🧖‍♂️',
    '💅','🤳','💃','🕺','👯','👯‍♀️','👯‍♂️','🕴️','👩‍🦽','👨‍🦽','👩‍🦼','👨‍🦼','🚶','🚶‍♀️','🚶‍♂️','👩‍🦯','👨‍🦯','🧎','🧎‍♀️','🧎‍♂️',
    '🏃','🏃‍♀️','🏃‍♂️','🧍','🧍‍♀️','🧍‍♂️','👭','👫','👬','👩‍❤️‍👩','💑','👨‍❤️‍👨','👩‍❤️‍💋‍👩','💏','👨‍❤️‍💋‍👨','👪','👨‍👩‍👦','👨‍👩‍👧','👨‍👩‍👧‍👦',
    '💐','🌹','🥀','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎',
    '🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕','🍵','🍶','🍾','🍷','🍸','🍹','🍺','🍻','🥂','🥃',
    '🍽️','🍴','🥄','🔪','🏺','🎃','🎄','🎆','🎇','🧨','✨','🎈','🎉','🎊','🎋','🎍','🎎','🎏','🎐','🎑','🧧','🎀',
    '🎁','🎗️','🎟️','🎫','🎖️','🏆','🏅','🥇','🥈','🥉','⚽','⚾','🥎','🏀','🏐','🏈','🏉','🎾','🥏','🎳','🏏','🏑',
    '🏒','🥍','🏓','🏸','🥊','🥋','🥅','⛳','⛸️','🎣','🤿','🎽','🎿','🛷','🥌','🎯','🪀','🪁','🎱','🔮','🧿','🎮',
    '🕹️','🎰','🎲','🧩','🧸','♠️','♥️','♦️','♣️','♟️','🃏','🀄','🎴','🎭','🖼️','🎨','🧵','🧶','🎼','🎵','🎶','🎹',
    '🥁','🎷','🎺','🎸','🪕','🎻','🎲','♟️','🎯','🎳','🎮','🎰','🧩'
  ];

  // Default stickers
  const defaultStickers = [
    { name: 'Heart', url: 'https://cdn-icons-png.flaticon.com/128/833/833472.png' },
    { name: 'Star', url: 'https://cdn-icons-png.flaticon.com/128/1828/1828884.png' },
    { name: 'Smile', url: 'https://cdn-icons-png.flaticon.com/128/742/742751.png' },
    { name: 'Party', url: 'https://cdn-icons-png.flaticon.com/128/2462/2462719.png' },
    { name: 'Cake', url: 'https://cdn-icons-png.flaticon.com/128/2682/2682458.png' },
    { name: 'Clap', url: 'https://cdn-icons-png.flaticon.com/128/3159/3159066.png' },
    { name: 'ThumbsUp', url: 'https://cdn-icons-png.flaticon.com/128/3128/3128313.png' },
    { name: 'Fire', url: 'https://cdn-icons-png.flaticon.com/128/785/785116.png' },
    { name: 'Gift', url: 'https://cdn-icons-png.flaticon.com/128/3500/3500833.png' },
    { name: 'Crown', url: 'https://cdn-icons-png.flaticon.com/128/891/891032.png' },
    { name: 'Music', url: 'https://cdn-icons-png.flaticon.com/128/3075/3075908.png' },
    { name: 'Flower', url: 'https://cdn-icons-png.flaticon.com/128/2917/2917995.png' },
    { name: 'Sun', url: 'https://cdn-icons-png.flaticon.com/128/869/869869.png' },
    { name: 'Rainbow', url: 'https://cdn-icons-png.flaticon.com/128/265/265732.png' },
    { name: 'Pizza', url: 'https://cdn-icons-png.flaticon.com/128/3595/3595458.png' },
    { name: 'Bear', url: 'https://cdn-icons-png.flaticon.com/128/2353/2353678.png' },
    { name: 'Cat', url: 'https://cdn-icons-png.flaticon.com/128/616/616430.png' },
    { name: 'Dog', url: 'https://cdn-icons-png.flaticon.com/128/616/616554.png' },
  ];

  const fonts = [
    { name: '기본', value: 'sans-serif' },
    { name: '명조', value: 'serif' },
    { name: '손글씨', value: 'cursive' },
    { name: '고딕', value: 'monospace' },
  ];

  useEffect(() => {
    if (id) loadPaper(Number(id));
  }, [id]);

  // Scroll to selected message when switching to LIST view
  useEffect(() => {
    if (viewMode === 'LIST' && selectedMessage) {
        setTimeout(() => {
            const element = document.getElementById(`msg-${selectedMessage.id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
  }, [viewMode, selectedMessage]);

  const loadPaper = async (paperId: number) => {
    try {
      const data = await rollingPaperService.getRollingPaper(paperId);
      setPaper(data);
    } catch {
      toast.error('롤링페이퍼를 불러오는데 실패했습니다.');
    }
  };

  const handleSubmitMessage = async () => {
    if (!content) return toast.error('내용을 입력해주세요.');
    if (!id) return;

    try {
      const randomX = Math.random() * 60 + 10; // 10-70%
      const randomY = Math.random() * 60 + 10; // 10-70%
      const randomRotation = (Math.random() * 10) - 5; 

      await rollingPaperService.addMessage(Number(id), {
        content,
        authorName: isAnonymous ? '익명' : authorName,
        isAnonymous,
        backgroundColor: bgColor,
        fontFamily,
        fontColor,
        textAlign,
        posX: randomX,
        posY: randomY,
        rotation: randomRotation,
        zIndex: 1
      });
      
      toast.success('메시지가 남겨졌습니다!');
      setIsWriteModalOpen(false);
      resetWriteForm();
      loadPaper(Number(id));
    } catch {
      toast.error('저장 실패');
    }
  };

  const resetWriteForm = () => {
    setContent('');
    setAuthorName('');
    setIsAnonymous(false);
    setBgColor('#fff9c4');
    setBgImage('');
    setFontFamily('sans-serif');
    setFontColor('#000000');
    setTextAlign('left');
  };

  const handleStickerSelect = (url: string) => {
    setPendingStickerUrl(url);
    setIsStickerModalOpen(false);
    setStickerScale(1); // Reset scale
    setStickerRotation(0); // Reset rotation
    
    // Initial position: Center of the CURRENT VIEWPORT (accounting for scroll)
    if (scrollContainerRef.current) {
        const { clientWidth, clientHeight, scrollTop } = scrollContainerRef.current;
        setStickerPos({ 
            x: clientWidth / 2 - 50, 
            y: scrollTop + (clientHeight / 2) - 50 
        });
    } else if (boardRef.current) {
        const { width, height } = boardRef.current.getBoundingClientRect();
        setStickerPos({ x: width / 2 - 50, y: height / 2 - 50 });
    } else {
        setStickerPos({ x: 100, y: 100 });
    }
  };

  const confirmStickerPlacement = async () => {
    if (!id || !pendingStickerUrl || !boardRef.current) return;
    
    try {
        const { width, height } = boardRef.current.getBoundingClientRect();
        // Convert px to %
        // We need to account for scroll? Since it's fixed/absolute, let's use offset relative to board
        // Draggable uses translate transform, but we want absolute position
        // Ideally, we get the final position from Draggable's onStop, but we are tracking state.
        
        // Actually Draggable uses x/y relative to start. 
        // Let's assume stickerPos is the absolute offset in the container.
        
        const posX = (stickerPos.x / width) * 100;
        const posY = (stickerPos.y / height) * 100;

        await rollingPaperService.addSticker(Number(id), {
            stickerUrl: pendingStickerUrl,
            posX,
            posY,
            scale: stickerScale,
            rotation: stickerRotation,
            zIndex: 10
        });
        toast.success('스티커를 붙였습니다!');
        setPendingStickerUrl(null);
        loadPaper(Number(id));
    } catch {
        toast.error('스티커 부착 실패');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setIsCropModalOpen(true);
      // Reset crop state
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    
    // Clear input so same file can be selected again
    e.target.value = '';
  };

  const onCropComplete = (_croppedArea: unknown, croppedAreaPixels: unknown) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    try {
      setUploading(true);
      const croppedBlob = await getCroppedImg(
        selectedImage,
        croppedAreaPixels as { x: number; y: number; width: number; height: number }
      );
      if (!croppedBlob) throw new Error('Failed to crop image');

      const file = new File([croppedBlob], "sticker.png", { type: "image/png" });
      
      const result = await uploadFiles([file], 'stickers');
      if (result && result.length > 0) {
        const fullUrl = getFileUrl(result[0].url);
        handleStickerSelect(fullUrl);
        setIsCropModalOpen(false);
        // Close sticker modal too if it's open (it usually is)
        // setIsStickerModalOpen(false); // handleStickerSelect already does this
      }
    } catch (error) {
      console.error(error);
      toast.error('스티커 생성 실패');
    } finally {
      setUploading(false);
    }
  };

  const handleMessageBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
        const result = await uploadFiles(Array.from(files), 'rolling-paper-bg');
        if (result && result.length > 0) {
            setBgImage(getFileUrl(result[0].url));
        }
    } catch (error) {
        console.error(error);
        toast.error('이미지 업로드 실패');
    } finally {
        setUploading(false);
    }
  };

  if (!paper) return <div className="p-10 text-center">Loading...</div>;

  let bgStyle: React.CSSProperties = { backgroundColor: '#f8f9fa', color: 'black' };
  let effectType = '';
  let bannerUrl: string | null = null;
  let titleColor = paper.theme === 'LIGHT' ? '#000000' : '#ffffff';

  if (paper.theme === 'BLACK') bgStyle = { backgroundColor: '#1a1a1a', color: 'white' };
  else if (paper.theme === 'LIGHT') bgStyle = { backgroundColor: '#f8f9fa', color: 'black' };
  else if (paper.theme === 'CUSTOM' && paper.backgroundConfig) {
      try {
          const config = JSON.parse(paper.backgroundConfig);
          
          // Handle Title Color
          if (config.titleColor) titleColor = config.titleColor;
          
          // Handle Background (support both new nested structure and old flat structure)
          const bgConfig = config.background || config;
          
          if (bgConfig.type === 'IMAGE') bgStyle = { backgroundImage: `url(${bgConfig.value})`, backgroundSize: 'cover', color: 'white' };
          else if (bgConfig.type === 'GRADIENT') bgStyle = { background: bgConfig.value, color: 'white' };
          else if (bgConfig.type === 'COLOR') bgStyle = { backgroundColor: bgConfig.value, color: 'black' };
          
          // Handle Effect
          if (config.effect) {
             if (typeof config.effect === 'string') {
                 effectType = config.effect;
             } else {
                 effectType = config.effect.type || 'NONE';
             }
          }

          // Handle Banner
          if (config.banner && config.banner.url) {
              bannerUrl = getFileUrl(config.banner.url);
          }
      } catch {
          console.error("Failed to parse theme config");
      }
  }

  // Extract effect config if available
  let effectConfig = {};
  if (paper.theme === 'CUSTOM' && paper.backgroundConfig) {
      try {
          const config = JSON.parse(paper.backgroundConfig);
          if (config.effect && typeof config.effect !== 'string') {
              effectConfig = config.effect.config || {};
          }
      } catch {
        void 0
      }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* Container with background theme applied */}
      <div 
        className="w-full max-w-[600px] h-[100dvh] shadow-2xl flex flex-col relative overflow-hidden transition-all"
        style={bgStyle}
      >
        {/* Global Effect Layer (Full Screen) */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <EffectLayer type={effectType} config={effectConfig} />
        </div>

        {/* 1. Header (Absolute inside relative shell) */}
        <header 
          style={{
            transform: `translateY(${isVisible ? '0' : '-100%'})`,
            opacity: isVisible ? 1 : 0,
            transition: 'transform 0.4s ease-in-out, opacity 0.4s ease-in-out'
          }}
          className="absolute top-0 left-0 right-0 z-50 w-full px-6 py-4 backdrop-blur-md bg-white/40 border-b border-black/5 flex justify-center items-center"
        >
          <h1 className="text-2xl font-bold truncate" style={{ color: titleColor }}>
            {paper.title}
          </h1>
        </header>

        {/* Scrollable Content Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 w-full overflow-y-auto overflow-x-hidden custom-scrollbar relative"
        >
          {/* Header Spacer - Pushes messages and stickers down by header size */}
          <div className="pt-20 min-h-[120%] flex flex-col">
            {/* Section 3: Messages Content: Starts right after banner */}
            <div ref={boardRef} className="relative w-full flex-1">
              {viewMode === 'PAPER' ? (
                    /* PAPER MODE: Grid Layout */
                    <div className="relative z-10 w-full p-4 md:p-8 pb-[320px] grid grid-cols-3 gap-2 md:gap-8 content-start">
                  {paper.messages.map((msg) => {
                  // Generate stable random rotation based on ID or index
                  const rotation = ((msg.id * 15) % 30) - 5; // -5 to 5 degrees
                  const marginTop = ((msg.id * 7) % 10); // 0 to 20px offset
                  
                  return (
                      <div
                          key={msg.id}
                          onClick={() => {
                              setSelectedMessage(msg);
                              setViewMode('LIST');
                          }}
                          className="relative shadow-lg rounded transition-transform hover:scale-110 hover:z-30 cursor-pointer flex flex-col overflow-hidden aspect-square transform hover:rotate-0 duration-300"
                          style={{
                              backgroundColor: msg.backgroundColor,
                              backgroundImage: msg.backgroundImage ? `url(${msg.backgroundImage})` : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              color: msg.fontColor,
                              fontFamily: msg.fontFamily,
                              textAlign: msg.textAlign as React.CSSProperties['textAlign'],
                              zIndex: 1, 
                              transform: `rotate(${rotation}deg) translateY(${marginTop}px)`,
                          }}
                      >
                          <div className="flex-1 overflow-hidden relative p-4 pointer-events-none">
                              <p className="whitespace-pre-wrap font-medium text-sm leading-relaxed line-clamp-6 select-none">
                                  {msg.content}
                              </p>
                              {/* Gradient overlay */}
                              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/10 to-transparent"></div>
                          </div>
                          <p className="text-right text-xs opacity-70 p-4 pt-0 font-bold pointer-events-none">- {msg.authorName}</p>
                      </div>
                  );
              })}

              {/* Stickers */}
              {paper.stickers.map((sticker) => (
                <img
                  key={sticker.id}
                  src={sticker.stickerUrl}
                  alt="sticker"
                  className="absolute pointer-events-none drop-shadow-md"
                  style={{
                    left: `${sticker.posX}%`,
                    top: `${sticker.posY}%`,
                    transform: `rotate(${sticker.rotation}deg) scale(${sticker.scale || 1})`,
                    zIndex: sticker.zIndex,
                    width: '100px',
                    height: 'auto'
                  }}
                />
              ))}

              {/* Pending Sticker (Draggable) */}
              {pendingStickerUrl && (
                  <>
                  <Draggable
                      nodeRef={stickerRef}
                      position={stickerPos}
                      onDrag={(_e, data) => setStickerPos({ x: data.x, y: data.y })}
                      bounds="parent"
                  >
                      <div ref={stickerRef} className="absolute z-50 cursor-move group">
                          <div style={{ transform: `rotate(${stickerRotation}deg) scale(${stickerScale})`, transition: 'transform 0.1s' }}>
                              <img 
                                  src={pendingStickerUrl} 
                                  alt="pending" 
                                  className="w-24 h-auto drop-shadow-xl"
                                  draggable={false}
                              />
                          </div>
                          <div className="absolute inset-0 border-2 border-dashed border-blue-500 rounded opacity-50 pointer-events-none" style={{ transform: `rotate(${stickerRotation}deg) scale(${stickerScale})` }}></div>
                      </div>
                  </Draggable>

                  {/* Controls for Pending Sticker */}
                  <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[60] flex flex-col items-center gap-3 bg-white p-4 rounded-xl shadow-2xl animate-bounce-in w-max mx-auto">
                      <div className="flex items-center gap-4 w-full justify-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-gray-500">크기</span>
                            <input 
                                type="range" 
                                min="0.5" 
                                max="2.5" 
                                step="0.1" 
                                value={stickerScale} 
                                onChange={(e) => setStickerScale(parseFloat(e.target.value))}
                                className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                          </div>
                          <div className="w-px h-8 bg-gray-200"></div>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-gray-500">회전</span>
                            <input 
                                type="range" 
                                min="-180" 
                                max="180" 
                                step="5" 
                                value={stickerRotation} 
                                onChange={(e) => setStickerRotation(parseFloat(e.target.value))}
                                className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                          </div>
                      </div>
                      <div className="flex gap-2 w-full">
                          <button 
                              onClick={confirmStickerPlacement}
                              className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold shadow-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                              <span>✔</span> 붙이기
                          </button>
                          <button 
                              onClick={() => setPendingStickerUrl(null)}
                              className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold shadow-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                              <span>✕</span> 취소
                          </button>
                      </div>
                  </div>
                  </>
              )}
              </div>
          ) : (
                  /* LIST MODE: Vertical Stack */
                  <div className="relative z-10 w-full min-h-full p-4 pb-[320px] max-w-xl mx-auto space-y-6">
                     {/* Back to Paper Button */}
                   <div className="flex justify-end mb-4 sticky top-20 z-20">
                      <button 
                      onClick={() => {
                          setViewMode('PAPER');
                          setSelectedMessage(null);
                      }}
                      className="bg-white text-black shadow-lg px-4 py-2 rounded-full font-bold text-sm border hover:bg-gray-50 flex items-center gap-2"
                  >
                          🖼️ 페이퍼로 돌아가기
                      </button>
                   </div>
  
                   {paper.messages.map((msg) => (
                      <div
                          key={msg.id}
                          id={`msg-${msg.id}`}
                          className={`rounded-xl shadow-lg transition-all border border-gray-100 flex flex-col h-80 overflow-hidden bg-white ${selectedMessage?.id === msg.id ? 'ring-4 ring-blue-500 shadow-2xl scale-[1.02] z-10' : 'hover:shadow-xl'}`}
                          style={{
                              // List view uses message's style for the card content itself?
                              // Actually previous code applied styles to the card wrapper.
                              // Let's keep it consistent.
                              backgroundColor: msg.backgroundColor,
                              backgroundImage: msg.backgroundImage ? `url(${msg.backgroundImage})` : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              color: msg.fontColor,
                              fontFamily: msg.fontFamily,
                          }}
                      >
                          <div className="p-4 border-b border-black/5 bg-black/5 flex justify-between items-center shrink-0">
                              <span className="font-bold text-sm">From. {msg.authorName}</span>
                              <div className="flex gap-1">
                                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                              </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                              <p 
                                  className="whitespace-pre-wrap text-base leading-relaxed"
                                  style={{ textAlign: msg.textAlign as React.CSSProperties['textAlign'] }}
                              >
                                  {msg.content}
                              </p>
                          </div>
                      </div>
                   ))}
              </div>
          )}
          </div>
        </div>

        {/* 2. Banner Section (Absolute inside relative shell) */}
        <div 
          style={{
            transform: `translateY(${isVisible ? '0' : '100%'})`,
            opacity: isVisible ? 1 : 0,
            transition: 'transform 0.4s ease-in-out, opacity 0.4s ease-in-out'
          }}
          className="absolute bottom-0 left-0 right-0 z-40 w-full h-[280px] overflow-hidden flex items-center justify-center bg-black/5"
        >
           {/* Background Banner Image */}
           {bannerUrl && (
              <img 
                src={bannerUrl} 
                alt="Banner Background" 
                className="absolute inset-0 w-full h-full object-cover opacity-100" 
              />
           )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      {!pendingStickerUrl && (
        <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
            <button
            onClick={() => setIsStickerModalOpen(true)}
            className="w-14 h-14 bg-yellow-400 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-yellow-500 transition-colors transform hover:scale-110"
            title="스티커 붙이기"
            >
            <span className="text-2xl">⭐</span>
            </button>
            <button
            onClick={() => setIsWriteModalOpen(true)}
            className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors transform hover:scale-110"
            title="메시지 남기기"
            >
            <span className="text-2xl">✏️</span>
            </button>
        </div>
      )}

{/* Message Detail Modal Removed */}

      {/* Write Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-black">메시지 남기기</h3>
              <button onClick={() => setIsWriteModalOpen(false)} className="text-gray-500 hover:text-black">✕</button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Preview Area */}
              <div 
                className="w-full h-48 shadow-inner p-4 mb-4 rounded transition-all border relative overflow-hidden"
                style={{ 
                    backgroundColor: bgColor,
                    backgroundImage: bgImage ? `url(${bgImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
              >
                 <textarea
                   className="w-full h-full bg-transparent resize-none outline-none placeholder-gray-500/50 relative z-10"
                   style={{ fontFamily, color: fontColor, textAlign: textAlign as React.CSSProperties['textAlign'] }}
                   placeholder="마음을 전하세요..."
                   value={content}
                   onChange={(e) => setContent(e.target.value)}
                 />
                 {bgImage && (
                    <button 
                        onClick={() => setBgImage('')}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs z-20 hover:bg-black/70"
                        title="배경 이미지 삭제"
                    >
                        ✕
                    </button>
                 )}
              </div>

              {/* Styling Controls */}
              <div className="space-y-4">
                  {/* Colors & Image */}
                  <div>
                      <label className="text-xs text-gray-500 mb-1 block">배경 스타일</label>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <label className="cursor-pointer w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50 shrink-0">
                            <span className="text-xs">📷</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleMessageBgUpload} />
                        </label>
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        {['#fff9c4', '#ffcdd2', '#bbdefb', '#c8e6c9', '#e1bee7', '#ffffff', '#212121'].map(c => (
                          <button
                            key={c}
                            onClick={() => { setBgColor(c); setBgImage(''); }}
                            className={`w-8 h-8 rounded-full border shrink-0 ${bgColor === c && !bgImage ? 'ring-2 ring-blue-500' : 'border-gray-300'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        <label className="cursor-pointer w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50 shrink-0 overflow-hidden" title="직접 색상 선택">
                            <input 
                                type="color" 
                                className="w-[150%] h-[150%] -m-[25%] cursor-pointer p-0 border-0"
                                value={bgColor}
                                onChange={(e) => { setBgColor(e.target.value); setBgImage(''); }}
                            />
                        </label>
                      </div>
                  </div>

                  <div className="flex gap-4">
                      <div className="flex-1">
                          <label className="text-xs text-gray-500 mb-1 block">글꼴</label>
                          <select 
                            value={fontFamily} 
                            onChange={(e) => setFontFamily(e.target.value)}
                            className="w-full border rounded p-1 text-sm text-black"
                          >
                            {fonts.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                          </select>
                      </div>
                      <div className="flex-1">
                          <label className="text-xs text-gray-500 mb-1 block">정렬</label>
                          <div className="flex border rounded overflow-hidden">
                              {['left', 'center', 'right'].map(align => (
                                  <button
                                    key={align}
                                    onClick={() => setTextAlign(align)}
                                    className={`flex-1 p-1 text-sm ${textAlign === align ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'} text-black`}
                                  >
                                      {align === 'left' ? 'L' : align === 'center' ? 'C' : 'R'}
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div className="w-10">
                          <label className="text-xs text-gray-500 mb-1 block">색상</label>
                          <input 
                            type="color" 
                            value={fontColor}
                            onChange={(e) => setFontColor(e.target.value)}
                            className="w-full h-8 p-0 border-0 rounded overflow-hidden"
                          />
                      </div>
                  </div>

                  <hr />

                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="작성자 이름"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="border rounded p-2 text-black w-full"
                      disabled={isAnonymous}
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      익명으로 남기기
                    </label>
                  </div>
              </div>
            </div>

            <div className="p-4 border-t bg-white flex justify-end">
              <button
                onClick={handleSubmitMessage}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium w-full sm:w-auto"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticker Modal */}
      {isStickerModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[600px]">
             <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
               <h3 className="text-lg font-bold text-black">꾸미기</h3>
               <button onClick={() => setIsStickerModalOpen(false)} className="text-gray-500 hover:text-black">✕</button>
             </div>

             {/* Tabs */}
             <div className="flex border-b shrink-0 bg-white">
                <button 
                    onClick={() => setStickerTab('STICKER')}
                    className={`flex-1 py-3 font-medium text-sm transition-colors border-b-2 ${stickerTab === 'STICKER' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                >
                    스티커
                </button>
                <button 
                    onClick={() => setStickerTab('EMOJI')}
                    className={`flex-1 py-3 font-medium text-sm transition-colors border-b-2 ${stickerTab === 'EMOJI' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                >
                    이모티콘
                </button>
             </div>
             
             <div className="p-4 overflow-y-auto flex-1 bg-gray-50/30 custom-scrollbar">
                 {stickerTab === 'STICKER' ? (
                     <>
                        {/* Upload Section */}
                        <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-6 text-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors bg-white shadow-sm"
                        onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/png, image/jpeg, image/gif"
                            onChange={handleFileUpload}
                            />
                            {uploading ? (
                                <p className="text-blue-500 font-medium">업로드 중...</p>
                            ) : (
                                <>
                                    <p className="text-2xl mb-1">📤</p>
                                    <p className="text-sm font-medium text-gray-700">나만의 스티커 업로드</p>
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                        <p className="text-xs text-gray-400">배경이 투명한 PNG를 추천해요!</p>
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsTipModalOpen(true);
                                            }}
                                            className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                                        >
                                            💡 배경 제거 방법
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        <h4 className="text-sm font-semibold text-gray-500 mb-3 ml-1">기본 스티커</h4>
                        <div className="grid grid-cols-4 gap-3">
                            {defaultStickers.map((sticker, idx) => (
                                <div 
                                key={idx}
                                onClick={() => handleStickerSelect(sticker.url)}
                                className="aspect-square bg-white border border-gray-100 rounded-xl flex items-center justify-center cursor-pointer hover:bg-blue-50 hover:scale-105 hover:shadow-md transition-all p-2 shadow-sm"
                                title={sticker.name}
                                >
                                    <img src={sticker.url} alt={sticker.name} className="w-full h-full object-contain drop-shadow-sm" />
                                </div>
                            ))}
                        </div>
                     </>
                 ) : (
                    <>
                        <h4 className="text-sm font-semibold text-gray-500 mb-3 ml-1">이모티콘 선택</h4>
                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                            {emojiList.map((emoji, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleStickerSelect(getEmojiUrl(emoji))}
                                    className="aspect-square flex items-center justify-center text-2xl hover:bg-white hover:shadow-md hover:scale-110 rounded-lg transition-all cursor-pointer bg-white/50"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </>
                 )}
             </div>
           </div>
        </div>
      )}

      {/* Crop Modal */}
      {isCropModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-lg text-black">스티커 추가</h3>
               <button onClick={() => setIsCropModalOpen(false)} className="text-gray-500 hover:text-black">✕</button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              <div className="text-center text-sm text-gray-600">
                 <p className="font-bold mb-1">정사각형 이미지를 업로드 해주세요.</p>
                 <p>배경이 투명한 PNG 파일을 추천합니다.</p>
                 
                 <button 
                    onClick={() => setIsTipModalOpen(true)}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-semibold text-gray-700 transition-colors"
                 >
                    <span>🖥️</span> 컴퓨터에서 배경화면 제거 팁
                 </button>
              </div>

              {/* Cropper Container */}
              <div className="relative w-full h-64 bg-gray-800 rounded-lg overflow-hidden">
                 {selectedImage && (
                    <Cropper
                      image={selectedImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                    />
                 )}
                 {/* Change Image Button Overlay */}
                 <label className="absolute top-2 right-2 bg-white/90 hover:bg-white text-black text-xs font-bold px-3 py-1.5 rounded cursor-pointer shadow-sm z-10 transition-colors">
                    이미지 변경
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                 </label>
              </div>

              {/* Zoom Slider */}
              <div className="px-4">
                 <input
                   type="range"
                   value={zoom}
                   min={1}
                   max={3}
                   step={0.1}
                   aria-labelledby="Zoom"
                   onChange={(e) => setZoom(Number(e.target.value))}
                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                 />
              </div>
              
              <div className="text-center text-xs text-gray-500">
                 <p>이미지를 업로드 후 원하는 영역을 맞춰주세요.</p>
                 <p className="font-bold text-gray-700">가이드라인 밖의 영역은 표시되지 않습니다.</p>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
               <button 
                  onClick={() => setIsCropModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-bold transition-colors"
               >
                  취소
               </button>
               <button 
                  onClick={handleCropSave}
                  disabled={uploading}
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded font-bold transition-colors flex items-center gap-2"
               >
                  {uploading ? '처리중...' : '완료'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Tip Modal */}
      {isTipModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
               <button 
                  onClick={() => setIsTipModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-black"
               >
                  ✕
               </button>
               
               <h3 className="text-xl font-bold text-center mb-6">컴퓨터에서 배경화면 제거하기</h3>
               
               <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                  <p>1. <a href="https://www.remove.bg/ko" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">remove.bg 웹사이트 🔗</a>에 접속합니다.</p>
                  <p>2. 'Upload Image' 버튼을 클릭하여 이미지를 선택합니다.</p>
                  <p>3. 자동으로 배경이 제거되면 'Download'를 클릭합니다.</p>
                  <p>4. PNG 형식으로 저장된 이미지를 사용하세요.</p>
               </div>
               
               <div className="mt-8 flex justify-end">
                  <button 
                     onClick={() => setIsTipModalOpen(false)}
                     className="px-6 py-2 bg-gray-900 text-white rounded font-bold hover:bg-black transition-colors"
                  >
                     확인
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  </div>
);
};

export default RollingPaperDetailPage;
