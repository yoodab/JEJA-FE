// import React from 'react'

interface ImagePreviewModalProps {
  imageUrl: string
  onClose: () => void
  altText?: string
}

export default function ImagePreviewModal({ imageUrl, onClose, altText = '미리보기' }: ImagePreviewModalProps) {
  return (
    <div 
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <img 
          src={imageUrl} 
          alt={altText} 
          className="max-h-[80vh] max-w-[80vw] rounded-2xl object-contain shadow-2xl border border-slate-200 bg-white"
        />
        <button 
          className="absolute -top-3 -right-3 rounded-full bg-white/90 p-2 shadow border border-slate-200 hover:bg-white transition-colors"
          onClick={onClose}
        >
          <svg className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
