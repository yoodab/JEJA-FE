import { useEffect, useRef, useState } from 'react'
import { Editor } from '@toast-ui/react-editor'
import toast from 'react-hot-toast'
import { useConfirm } from '../contexts/ConfirmContext'
import '@toast-ui/editor/dist/toastui-editor.css'
import colorSyntax from '@toast-ui/editor-plugin-color-syntax'
import 'tui-color-picker/dist/tui-color-picker.css'
import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: string
}

export default function RichTextEditor({ value, onChange, height = '400px' }: RichTextEditorProps) {
  const editorRef = useRef<Editor>(null)
  const { confirm } = useConfirm()
  const isUpdatingRef = useRef(false)
  // 리사이즈 중인지 추적하는 ref 추가 (컴포넌트 레벨)
  const isResizingRef = useRef(false)

  // 에디터 마운트 후 불필요한 텍스트 제거
  useEffect(() => {
    const editorInstance = editorRef.current?.getInstance()
    if (editorInstance) {
      // 에디터가 완전히 로드된 후 실행
      const cleanup = () => {
        const rootElement = editorRef.current?.getRootElement()
        if (rootElement) {
          // 모든 요소를 순회하며 특정 텍스트가 포함된 요소 찾기
          const allElements = rootElement.querySelectorAll('*')
          allElements.forEach((element) => {
            const text = element.textContent?.trim()
            // 툴바가 아닌 내용 영역에서만 제거
            if (
              text &&
              (text === 'Write' || text === 'Preview' || text === 'Markdown' || text === 'WYSIWYG') &&
              !element.closest('.toastui-editor-toolbar') &&
              !element.closest('.toastui-editor-defaultUI-toolbar')
            ) {
              element.remove()
            }
          })

          // 텍스트 노드 직접 검사
          const walker = document.createTreeWalker(
            rootElement,
            NodeFilter.SHOW_TEXT,
            null
          )
          
          const textNodesToRemove: Text[] = []
          let node
          while ((node = walker.nextNode())) {
            const text = node.textContent?.trim()
            if (text === 'Write' || text === 'Preview' || text === 'Markdown' || text === 'WYSIWYG') {
              const parent = node.parentElement
              if (parent && !parent.closest('.toastui-editor-toolbar') && !parent.closest('.toastui-editor-defaultUI-toolbar')) {
                textNodesToRemove.push(node as Text)
              }
            }
          }
          
          // 수집한 텍스트 노드들 제거
          textNodesToRemove.forEach((textNode) => {
            const parent = textNode.parentElement
            if (parent && parent.textContent?.trim() === textNode.textContent?.trim()) {
              parent.remove()
            } else {
              textNode.remove()
            }
          })
        }
      }

      // 여러 번 시도 (에디터가 점진적으로 로드될 수 있음)
      const timeouts = [
        setTimeout(cleanup, 100),
        setTimeout(cleanup, 300),
        setTimeout(cleanup, 500),
        setTimeout(cleanup, 1000),
      ]

      return () => {
        timeouts.forEach(clearTimeout)
      }
    }
  }, [])

  useEffect(() => {
    const editorInstance = editorRef.current?.getInstance()
    if (editorInstance && !isUpdatingRef.current) {
      const currentHtml = editorInstance.getHTML()
      // 값이 실제로 변경되었을 때만 업데이트
      if (currentHtml !== value) {
        isUpdatingRef.current = true
        editorInstance.setHTML(value || '')
        // 다음 렌더링 사이클에서 플래그 리셋
        setTimeout(() => {
          isUpdatingRef.current = false
        }, 0)
      }
    }
  }, [value])

  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null)

  // 이미지 선택 처리
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // 리사이즈 중이면 선택 해제 방지
      if (isResizingRef.current) return

      const target = e.target as HTMLElement
      // 에디터 내부의 이미지인지 확인
      const editorRoot = editorRef.current?.getRootElement()
      if (editorRoot && editorRoot.contains(target) && target.tagName === 'IMG') {
        setSelectedImg(target as HTMLImageElement)
      } else if (!target.closest('.image-resize-handle') && !target.closest('.image-delete-btn')) {
        // 핸들 클릭이 아니면 선택 해제
        setSelectedImg(null)
      }
    }
    
    // 스크롤 시 선택 해제 (핸들 위치 어긋남 방지)
    const handleScroll = () => {
      // 리사이즈 중일 때는 해제하지 않음 (드래그 중에 스크롤 될 수 있음)
      if (selectedImg && !isResizingRef.current) {
        setSelectedImg(null)
      }
    }

    document.addEventListener('mousedown', handleClick)
    // 에디터 스크롤 이벤트 캡처 (버블링되지 않을 수 있으므로 capture: true)
    const editorRoot = editorRef.current?.getRootElement()
    if (editorRoot) {
      editorRoot.addEventListener('scroll', handleScroll, true)
    }
    // 윈도우 스크롤도 감지
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      if (editorRoot) {
        editorRoot.removeEventListener('scroll', handleScroll, true)
      }
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [selectedImg])

  // 리사이즈 핸들 컴포넌트
  const ResizeHandle = ({ img, onUpdate }: { img: HTMLImageElement; onUpdate: () => void }) => {
    const [isDragging, setIsDragging] = useState(false)
    const startXRef = useRef(0)
    const startWidthRef = useRef(0)

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return
        
        const diffX = e.clientX - startXRef.current
        const newWidth = Math.max(50, startWidthRef.current + diffX) // 최소 50px
        
        img.style.width = `${newWidth}px`
        img.style.height = 'auto'
      }

      const handleMouseUp = () => {
        if (isDragging) {
          setIsDragging(false)
          isResizingRef.current = false // 전역 리사이즈 상태 해제
          onUpdate() // 변경 사항 저장 트리거
        }
      }

      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
      }

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }, [isDragging, img, onUpdate])

    const handleMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      setIsDragging(true)
      isResizingRef.current = true // 전역 리사이즈 상태 설정
      startXRef.current = e.clientX
      startWidthRef.current = img.offsetWidth
    }

    // 이미지 위치 계산
    const rect = img.getBoundingClientRect()
    // 에디터 위치 계산 (스크롤 등 보정)
    const editorRect = editorRef.current?.getRootElement().getBoundingClientRect()
    
    if (!editorRect) return null

    const handleDelete = async (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      
      const isConfirmed = await confirm({
        title: '이미지 삭제',
        message: '이미지를 삭제하시겠습니까?',
        type: 'danger',
        confirmText: '삭제',
        cancelText: '취소'
      })

      if (isConfirmed) {
        // 단순하고 확실한 방법: DOM 제거 후 상태 동기화
        img.remove()
        
        const editorInstance = editorRef.current?.getInstance()
        if (editorInstance) {
           // DOM 변경 후 현재 에디터 컨텐츠(HTML)를 가져와서 부모에게 알림
           // setHTML을 호출하면 커서 이동 등 부작용이 있으므로, 
           // 부모 state만 업데이트하여 저장 시 반영되도록 함.
           // Toast UI Editor는 내부적으로 DOM 변경을 감지하지 못할 수 있으므로
           // 필요하다면 강제로 이벤트를 발생시켜야 하지만, 
           // 여기서는 onChange를 통해 최종 데이터만 맞춤.
           
           // 에디터의 최신 HTML 가져오기 (DOM 변경 반영된 상태)
           const root = editorRef.current?.getRootElement()
           const contentArea = root?.querySelector('.ProseMirror') || root?.querySelector('.toastui-editor-contents')
           
           if (contentArea) {
             const newHtml = contentArea.innerHTML
             // 내부 상태 동기화를 위해 setHTML을 호출하되, 커서 문제 최소화
             // (삭제 직후라 커서 위치는 덜 중요함)
             isUpdatingRef.current = true
             editorInstance.setHTML(newHtml)
             onChange(newHtml)
             
             setTimeout(() => {
                isUpdatingRef.current = false
             }, 0)
           }
        }
        
        setSelectedImg(null)
      }
    }
    
    return (
      <>
        {/* 리사이즈 핸들 (우측 하단) */}
        <div
          className="image-resize-handle"
          style={{
            position: 'fixed',
            left: rect.right - 10,
            top: rect.bottom - 10,
            width: '20px',
            height: '20px',
            backgroundColor: '#3b82f6',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: 'nwse-resize',
            zIndex: 9999,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          onMouseDown={handleMouseDown}
        />
        {/* 삭제 버튼 (우측 상단) */}
        <button
          className="image-delete-btn"
          onClick={handleDelete}
          style={{
            position: 'fixed',
            left: rect.right - 10,
            top: rect.top - 10,
            width: '24px',
            height: '24px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: 'pointer',
            zIndex: 9999,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            padding: 0,
            lineHeight: 1
          }}
          title="이미지 삭제"
        >
          ×
        </button>
      </>
    )
  }

  const handleChange = () => {
    if (isUpdatingRef.current) return
    
    const editorInstance = editorRef.current?.getInstance()
    if (editorInstance) {
      const htmlContent = editorInstance.getHTML()
      onChange(htmlContent)
    }
  }

  return (
    <div className="toastui-editor-wrapper relative">
      <style>{`
        .toastui-editor-contents img,
        .ProseMirror img {
          max-width: 100%;
          cursor: pointer;
        }
        .ProseMirror img:hover {
          outline: 2px dashed #cbd5e1;
        }
      `}</style>
      <Editor
        ref={editorRef}
        initialValue=""
        previewStyle="vertical"
        height={height}
        initialEditType="wysiwyg"
        useCommandShortcut={true}
        usageStatistics={false}
        onChange={handleChange}
        onLoad={() => {
          // 에디터 로드 후 불필요한 텍스트 제거
          setTimeout(() => {
            const editorInstance = editorRef.current?.getInstance()
            if (editorInstance) {
              const html = editorInstance.getHTML()
              // Write, Preview, Markdown, WYSIWYG가 포함되어 있으면 제거
              if (html.includes('Write') || html.includes('Preview') || html.includes('Markdown') || html.includes('WYSIWYG')) {
                const cleanedHtml = html
                  .replace(/Write/g, '')
                  .replace(/Preview/g, '')
                  .replace(/Markdown/g, '')
                  .replace(/WYSIWYG/g, '')
                  .replace(/\s+/g, ' ')
                  .trim()
                if (cleanedHtml !== html) {
                  editorInstance.setHTML(cleanedHtml || '')
                }
              }
            }
          }, 200)
        }}
        plugins={[colorSyntax]}
        toolbarItems={[
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol'],
          ['table', 'image', 'link'],
          ['code', 'codeblock'],
        ]}
        hooks={{
          addImageBlobHook: (blob: Blob, callback: (arg0: string, arg1: string) => void) => {
            // 이미지를 base64로 변환하여 삽입
            const reader = new FileReader()
            reader.onload = () => {
              const imageUrl = reader.result as string
              callback(imageUrl, '이미지')
            }
            reader.onerror = () => {
              toast.error('이미지 업로드에 실패했습니다.')
            }
            reader.readAsDataURL(blob)
          },
        }}
      />
      {selectedImg && (
        <ResizeHandle 
          img={selectedImg} 
          onUpdate={() => {
            // DOM 변경 사항을 에디터 상태에 반영하기 위해 getHTML 호출 및 onChange 트리거
            const editorInstance = editorRef.current?.getInstance()
            if (editorInstance) {
              // DOM이 변경되었으므로 현재 HTML을 가져와서 부모에게 알림
              // 주의: ProseMirror 상태와 DOM이 다를 수 있지만, getHTML은 보통 DOM을 직렬화하거나 상태를 직렬화함.
              // Toast UI Editor는 Markdown 기반이므로, HTML 변경이 Markdown으로 변환되어 저장됨.
              // 강제로 이벤트를 발생시키거나 onChange를 호출
              const html = editorInstance.getHTML()
              onChange(html)
            }
          }} 
        />
      )}
    </div>
  )
}
