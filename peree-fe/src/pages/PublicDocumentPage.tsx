import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { parseMarkdownHeadings } from '../lib/headings';
import { getPublicDocument, listDocuments, getDocument, type DocumentResponse } from '../services/document.service';
import { useAuth } from '../context/AuthContext';

// Reusable TOC content used in both sidebar and mobile drawer
function TocContent({
  documentData,
  chapterToc,
  currentChapterId,
  isOwner,
  onNavigate,
}: {
  documentData: DocumentResponse;
  chapterToc: { chapterId: number; chapterTitle: string; isPublished: boolean; headings: { id: string; text: string; level: number }[] }[];
  currentChapterId: number | null;
  isOwner: boolean;
  onNavigate: (chapterId: number, headingId?: string) => void;
}) {
  return (
    <>
      <div className="border-b border-warm-200 p-6 bg-white shrink-0 relative">
        {isOwner && !documentData.published && (
          <span className="absolute top-4 right-4 text-[10px] uppercase tracking-wider font-bold bg-warm-100 text-warm-500 px-2 py-1 rounded-md">
            Unpublished Doc
          </span>
        )}
        <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-1">{documentData.type}</p>
        <h1 className="text-xl font-bold text-warm-900 leading-tight pr-12">{documentData.title}</h1>
        <p className="mt-2 text-sm text-warm-500">By @{documentData.ownerUserName}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-warm-400">Contents</h2>
        <div className="space-y-4">
          {chapterToc.map((chapter) => {
            const isActiveChapter = chapter.chapterId === currentChapterId;
            return (
              <div key={chapter.chapterId}>
                <button
                  onClick={() => onNavigate(chapter.chapterId)}
                  className={`w-full flex items-center justify-between text-left text-sm font-semibold transition-colors ${
                    isActiveChapter ? 'text-brand-700' : 'text-warm-700 hover:text-brand-600'
                  }`}
                >
                  <span className="truncate pr-2">{chapter.chapterTitle}</span>
                  {isOwner && !chapter.isPublished && (
                    <span className="shrink-0 text-[9px] uppercase font-bold tracking-wider text-warm-400 bg-warm-100 px-1.5 py-0.5 rounded">
                      Draft
                    </span>
                  )}
                </button>
                {chapter.headings.length > 0 && (
                  <div className="mt-2 ml-2 pl-2 border-l border-warm-200 space-y-1.5">
                    {chapter.headings.map((heading) => {
                      const targetId = `preview-${chapter.chapterId}-${heading.id}`;
                      return (
                        <button
                          key={targetId}
                          onClick={() => onNavigate(chapter.chapterId, targetId)}
                          className="block w-full text-left text-sm text-warm-500 hover:text-brand-600 truncate py-0.5"
                          style={{ paddingLeft: `${(heading.level - 1) * 8}px` }}
                        >
                          {heading.text}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function PublicDocumentPage() {
  const { userName = '', slug = '' } = useParams();
  const { isAuthenticated, token } = useAuth();

  const [documentData, setDocumentData] = useState<DocumentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [currentChapterId, setCurrentChapterId] = useState<number | null>(null);
  // Mobile drawer open state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isOwner = useMemo(() => {
    if (!isAuthenticated || !token) return false;
    try {
      const payloadStr = atob(token.split('.')[1]);
      const payload = JSON.parse(payloadStr);
      return payload.user_name === userName;
    } catch (e) {
      return false;
    }
  }, [isAuthenticated, token, userName]);

  useEffect(() => {
    void loadDocument();
  }, [userName, slug, isOwner]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (event.clientX < 100) {
        setSidebarCollapsed(true);
        setSidebarWidth(300);
      } else {
        setSidebarCollapsed(false);
        setSidebarWidth(Math.min(520, event.clientX));
      }
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    const resizeHandler = (event: MouseEvent) => {
      event.preventDefault();
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    const handle = document.getElementById('public-sidebar-resizer');
    handle?.addEventListener('mousedown', resizeHandler);
    return () => handle?.removeEventListener('mousedown', resizeHandler);
  }, []);

  async function loadDocument() {
    setLoading(true);
    setError('');
    try {
      let data: DocumentResponse | null = null;
      if (isOwner) {
        try {
          const allDocs = await listDocuments();
          const targetDoc = allDocs.find((d) => d.slug === slug);
          if (targetDoc) data = await getDocument(targetDoc.id);
        } catch (e) {
          console.warn('Failed to load as owner, falling back to public endpoint', e);
        }
      }
      if (!data) data = await getPublicDocument(userName, slug);
      setDocumentData(data);
      if (data.chapters && data.chapters.length > 0) setCurrentChapterId(data.chapters[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document not available');
    } finally {
      setLoading(false);
    }
  }

  const chapterToc = useMemo(
    () =>
      (documentData?.chapters ?? []).map((chapter) => ({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        isPublished: chapter.published,
        headings: parseMarkdownHeadings(chapter.content || ''),
      })),
    [documentData],
  );

  const currentChapter = useMemo(
    () => (documentData?.chapters ?? []).find((c) => c.id === currentChapterId),
    [documentData, currentChapterId],
  );

  const navigateToChapter = (chapterId: number, targetHeadingId?: string) => {
    setCurrentChapterId(chapterId);
    setMobileDrawerOpen(false); // close mobile drawer on navigation
    if (targetHeadingId) {
      setTimeout(() => {
        document.getElementById(targetHeadingId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-primary text-warm-700 font-sans">
        <div className="animate-pulse text-lg">Loading document...</div>
      </div>
    );
  }

  if (error || !documentData) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-primary text-warm-700 font-sans">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Not Found</h2>
          <p>{error || 'Document not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-surface-primary font-sans overflow-hidden text-warm-900">

      {/* Mobile top bar - only visible on small screens */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-warm-200 shrink-0 z-30">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500">{documentData.type}</p>
          <h1 className="text-base font-bold text-warm-900 leading-tight truncate max-w-[220px]">{documentData.title}</h1>
        </div>
        <button
          onClick={() => setMobileDrawerOpen((o) => !o)}
          className="p-2 rounded-lg border border-warm-200 text-warm-600 hover:bg-warm-100 transition-colors"
          aria-label="Toggle table of contents"
        >
          {mobileDrawerOpen ? (
            /* X icon */
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            /* Menu icon */
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer - slides down over content */}
      {mobileDrawerOpen && (
        <div className="md:hidden absolute top-[57px] left-0 right-0 z-40 bg-white border-b border-warm-200 shadow-xl max-h-[70vh] overflow-y-auto flex flex-col">
          <TocContent
            documentData={documentData}
            chapterToc={chapterToc}
            currentChapterId={currentChapterId}
            isOwner={isOwner}
            onNavigate={navigateToChapter}
          />
        </div>
      )}

      {/* Desktop sidebar - hidden on mobile */}
      {!sidebarCollapsed && (
        <aside
          className="hidden md:relative md:flex flex-col bg-surface-tertiary border-r border-warm-200 shadow-sm z-20"
          style={{ width: `${sidebarWidth}px` }}
        >
          <TocContent
            documentData={documentData}
            chapterToc={chapterToc}
            currentChapterId={currentChapterId}
            isOwner={isOwner}
            onNavigate={navigateToChapter}
          />
          <button
            id="public-sidebar-resizer"
            className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-brand-300/30 active:bg-brand-300/50"
            aria-label="Resize sidebar"
            type="button"
          />
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative bg-surface-primary scroll-smooth">
        {/* Desktop: show button to re-open collapsed sidebar */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden md:flex fixed top-6 left-6 z-50 rounded-full bg-white shadow-md p-2 text-warm-500 hover:text-brand-600 hover:bg-brand-50 border border-warm-200"
            aria-label="Show sidebar"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        <article className="max-w-5xl px-5 py-10 md:px-8 md:py-16 lg:px-12 lg:py-24 pr-5 md:pr-16 lg:pr-24">
          {currentChapter ? (
            <section className="markdown-body">
              <div className="mb-12 pb-6 border-b-2 border-brand-200 relative flex flex-wrap items-baseline gap-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-warm-900">
                  {currentChapter.title}
                </h1>
                {isOwner && !currentChapter.published && (
                  <span className="inline-block text-xs font-bold uppercase tracking-wider bg-warm-200 text-warm-600 px-3 py-1 rounded-full whitespace-nowrap">
                    Not Published
                  </span>
                )}
              </div>

              <div className="pl-2 md:pl-4 lg:pl-8 text-base md:text-lg lg:text-xl text-warm-800 leading-relaxed space-y-6 font-serif">
                {(() => {
                  const headings = parseMarkdownHeadings(currentChapter.content || '');
                  let headingIndex = 0;
                  return (currentChapter.content || '').split('\n').map((line, index) => {
                    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
                    if (!headingMatch) {
                      if (!line.trim()) return <div key={index} className="h-4" />;
                      let parsedLine = line
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/`(.*?)`/g, '<code class="bg-warm-100 text-brand-700 px-1 py-0.5 rounded text-sm font-sans font-mono">$1</code>');
                      if (parsedLine.startsWith('- ')) {
                        return <li key={index} className="ml-8 list-disc pl-2 mb-2" dangerouslySetInnerHTML={{ __html: parsedLine.substring(2) }} />;
                      }
                      return <p key={index} dangerouslySetInnerHTML={{ __html: parsedLine }} className="mb-4" />;
                    }
                    const level = headingMatch[1].length;
                    const text = headingMatch[2].trim();
                    const heading = headings[headingIndex++];
                    const id = `preview-${currentChapter.id}-${heading?.id ?? `${index}`}`;
                    if (level === 1) return <h1 key={id} id={id} className="text-3xl font-bold font-sans tracking-tight text-warm-900 mt-14 mb-6">{text}</h1>;
                    if (level === 2) return <h2 key={id} id={id} className="text-2xl font-bold font-sans tracking-tight text-warm-900 mt-10 mb-4">{text}</h2>;
                    if (level === 3) return <h3 key={id} id={id} className="text-xl font-semibold font-sans text-warm-900 mt-8 mb-3">{text}</h3>;
                    return <h4 key={id} id={id} className="text-lg font-semibold font-sans text-warm-900 mt-6 mb-2">{text}</h4>;
                  });
                })()}
              </div>
            </section>
          ) : (
            <div className="text-center text-warm-500 italic py-20 text-xl font-serif">
              No content published yet.
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
