import React, { useEffect, useRef, useState } from 'react';
import { EditorContent as TipTapEditorContent, Editor } from '@tiptap/react';
import { Loader2, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorContentProps {
  editor: Editor | null;
  isSaving: boolean;
}

const PAGE_WIDTH_PX = 816;
const PAGE_HEIGHT_PX = 1056;
const PAGE_PADDING_PX = 96;
const MIN_CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - PAGE_PADDING_PX * 2;

const getWordCount = (html: string): number => {
  const div = document.createElement('div');
  div.innerHTML = html;
  const text = div.textContent || div.innerText || '';
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
};

const getCharCount = (html: string): number => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').length;
};

const EditorContentComponent: React.FC<EditorContentProps> = ({ editor, isSaving }) => {
  const [zoom, setZoom] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const documentRef = useRef<HTMLDivElement | null>(null);

  const zoomPercent = Math.round(zoom * 100);

  const applyZoom = (next: number) => {
    const clamped = Math.max(0.5, Math.min(1.5, next));
    setZoom(clamped);
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const step = event.deltaY < 0 ? 0.05 : -0.05;
      applyZoom(zoom + step);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [zoom]);

  useEffect(() => {
    const root = documentRef.current;
    if (!root) return;

    const proseMirror = root.querySelector('.ProseMirror') as HTMLElement | null;
    if (!proseMirror) return;

    const updatePages = () => {
      const contentHeight = Math.max(MIN_CONTENT_HEIGHT_PX, proseMirror.scrollHeight);
      const totalHeight = contentHeight + PAGE_PADDING_PX * 2;
      setPageCount(Math.max(1, Math.ceil(totalHeight / PAGE_HEIGHT_PX)));
    };

    updatePages();

    const resizeObserver = new ResizeObserver(() => updatePages());
    resizeObserver.observe(proseMirror);

    return () => resizeObserver.disconnect();
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando editor...</span>
      </div>
    );
  }

  const contentHtml = editor.getHTML();
  const wordCount = getWordCount(contentHtml);
  const charCount = getCharCount(contentHtml);
  const scaledWidth = PAGE_WIDTH_PX * zoom;
  const scaledHeight = PAGE_HEIGHT_PX * pageCount * zoom;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="sticky top-0 z-20 border-b bg-card/95 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{wordCount} palavras</span>
          <span>•</span>
          <span>{charCount} caracteres</span>
          <div className="ml-auto flex flex-col items-end gap-1">
            <span className="flex items-center gap-1">
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  Salvo
                </>
              )}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => applyZoom(zoom - 0.1)}
                title="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 min-w-[56px] px-2 text-xs"
                onClick={() => setZoom(1)}
                title="Reset zoom"
              >
                {zoomPercent}%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => applyZoom(zoom + 0.1)}
                title="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto bg-muted/35 px-6 py-5">
        <div
          className="mx-auto"
          style={{
            width: `${scaledWidth}px`,
            minHeight: `${scaledHeight}px`,
          }}
        >
          <div
            ref={documentRef}
            className="relative"
            style={{
              width: `${PAGE_WIDTH_PX}px`,
              height: `${PAGE_HEIGHT_PX * pageCount}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            {Array.from({ length: pageCount }).map((_, index) => (
              <div
                key={index}
                className="absolute left-0 right-0 a4-page editor-page-shell"
                style={{
                  top: `${index * PAGE_HEIGHT_PX}px`,
                }}
              />
            ))}

            <div
              className="absolute left-0 top-0 z-10"
              style={{
                width: `${PAGE_WIDTH_PX - PAGE_PADDING_PX * 2}px`,
                minHeight: `${PAGE_HEIGHT_PX * pageCount - PAGE_PADDING_PX * 2}px`,
                padding: `${PAGE_PADDING_PX}px ${PAGE_PADDING_PX}px`,
                boxSizing: 'border-box',
              }}
            >
              <TipTapEditorContent editor={editor} className="page-content editor-paginated-content" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorContentComponent;
