import { useEffect, useRef } from 'react'
import { Editor } from '@toast-ui/react-editor'
import '@toast-ui/editor/dist/toastui-editor.css'
import colorSyntax from '@toast-ui/editor-plugin-color-syntax'
import 'tui-color-picker/dist/tui-color-picker.css'
import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<Editor>(null)
  const isUpdatingRef = useRef(false)

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

  const handleChange = () => {
    if (isUpdatingRef.current) return
    
    const editorInstance = editorRef.current?.getInstance()
    if (editorInstance) {
      const htmlContent = editorInstance.getHTML()
      onChange(htmlContent)
    }
  }

  return (
    <div className="toastui-editor-wrapper">
      <Editor
        ref={editorRef}
        initialValue=""
        previewStyle="vertical"
        height="400px"
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
          ['ul', 'ol', 'task'],
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
              alert('이미지 업로드에 실패했습니다.')
            }
            reader.readAsDataURL(blob)
          },
        }}
      />
    </div>
  )
}
