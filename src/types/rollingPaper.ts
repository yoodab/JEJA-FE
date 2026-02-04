export interface RollingPaper {
    id: number;
    title: string;
    theme: string; // "BLACK", "LIGHT", "CUSTOM"
    backgroundConfig: string;
    messages: RollingPaperMessage[];
    stickers: RollingPaperSticker[];
}

export interface RollingPaperMessage {
    id: number;
    content: string;
    authorName: string;
    isAnonymous: boolean;
    backgroundColor: string;
    backgroundImage?: string;
    fontFamily: string;
    fontColor: string;
    textAlign: string;
    posX: number;
    posY: number;
    rotation: number;
    zIndex: number;
}

export interface RollingPaperSticker {
    id: number;
    stickerUrl: string;
    posX: number;
    posY: number;
    scale: number;
    rotation: number;
    zIndex: number;
}

export interface RollingPaperCreateRequest {
    title: string;
    theme: string;
    backgroundConfig: string;
}

export interface MessageCreateRequest {
    content: string;
    authorName: string;
    isAnonymous: boolean;
    backgroundColor: string;
    backgroundImage?: string;
    fontFamily: string;
    fontColor: string;
    textAlign: string;
    posX: number;
    posY: number;
    rotation: number;
    zIndex: number;
}

export interface StickerCreateRequest {
    stickerUrl: string;
    posX: number;
    posY: number;
    scale: number;
    rotation: number;
    zIndex: number;
}
