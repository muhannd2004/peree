import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getDocument,
  updateDocument,
  createChapter,
  updateChapter,
  deleteChapter,
  type DocumentResponse,
  type ChapterResponse,
} from '../services/document.service';
import { parseMarkdownHeadings } from '../lib/headings';

const MARKDOWN_HINTS = [
  { label: 'Heading', syntax: '# H1 or ## H2' },
  { label: 'Bold', syntax: '**text**' },
  { label: 'Italic', syntax: '*text*' },
  { label: 'Link', syntax: '[text](url)' },
  { label: 'List', syntax: '- item 1' },
  { label: 'Code', syntax: '`code` or ```block```' },
];

export default function EditorPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<DocumentResponse | null>(null);
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingStatus, setSavingStatus] = useState<'Saved' | 'Saving...' | 'Unsaved changes'>('Saved');
  const [docSaveStatus, setDocSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showHints, setShowHints] = useState(false);

  // Sidebar States
  const [leftWidth, setLeftWidth] = useState(250);
  const [rightWidth, setRightWidth] = useState(250);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Active chapter state
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [chapterPublished, setChapterPublished] = useState(false);

  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (documentId) {
      loadDoc(Number(documentId));
    }
  }, [documentId]);

  async function loadDoc(id: number) {
    try {
      const data = await getDocument(id);
      setDoc(data);
      setChapters(data.chapters || []);
      if (data.chapters && data.chapters.length > 0) {
        selectChapter(data.chapters[0]);
      }
    } catch (err) {
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  }

  function selectChapter(chap: ChapterResponse) {
    setActiveChapterId(chap.id);
    setChapterTitle(chap.title);
    setChapterContent(chap.content);
    setChapterPublished(chap.published);
    setSavingStatus('Saved');
  }

  // Auto-save logic for chapter content
  useEffect(() => {
    if (!activeChapterId || savingStatus === 'Saved') return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    saveTimer.current = window.setTimeout(async () => {
      setSavingStatus('Saving...');
      try {
        const updated = await updateChapter(activeChapterId, {
          title: chapterTitle,
          content: chapterContent,
          published: chapterPublished,
        });
        setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setSavingStatus('Saved');
      } catch (err) {
        setSavingStatus('Unsaved changes'); // Keep unsaved if failed
        console.error(err);
      }
    }, 1500);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [chapterTitle, chapterContent, chapterPublished, activeChapterId]);

  const handleContentChange = (val: string) => {
    setChapterContent(val);
    setSavingStatus('Unsaved changes');
  };

  const handleTitleChange = (val: string) => {
    setChapterTitle(val);
    setSavingStatus('Unsaved changes');
  };

  const handlePublishChange = (val: boolean) => {
    setChapterPublished(val);
    setSavingStatus('Unsaved changes');
  };

  // Add Chapter
  const handleAddChapter = async () => {
    if (!doc) return;
    try {
      const newChap = await createChapter(doc.id, {
        title: 'New Chapter',
        content: '',
        published: false,
      });
      setChapters([...chapters, newChap]);
      selectChapter(newChap);
    } catch (err) {
      console.error(err);
    }
  };

  const [chapterToDelete, setChapterToDelete] = useState<{id: number, title: string} | null>(null);

  // Delete Chapter
  const handleDeleteChapterConfirm = async () => {
    if (!chapterToDelete) return;
    try {
      await deleteChapter(chapterToDelete.id);
      const remaining = chapters.filter((c) => c.id !== chapterToDelete.id);
      setChapters(remaining);
      if (activeChapterId === chapterToDelete.id) {
        if (remaining.length > 0) selectChapter(remaining[0]);
        else setActiveChapterId(null);
      }
      setChapterToDelete(null);
    } catch (err) {
      console.error(err);
      setChapterToDelete(null);
    }
  };

  // Document Setting Updates - optimistic: apply locally first, sync in background
  const handleDocUpdate = (updates: Partial<DocumentResponse>) => {
    if (!doc) return;
    // Apply change immediately so UI feels instant
    const optimistic = { ...doc, ...updates };
    setDoc(optimistic);
    setDocSaveStatus('saving');
    void updateDocument(doc.id, {
      title: optimistic.title,
      type: optimistic.type,
      published: optimistic.published,
    })
      .then((updated) => {
        setDoc(updated);
        setDocSaveStatus('saved');
        setTimeout(() => setDocSaveStatus('idle'), 1500);
      })
      .catch((err) => {
        // Revert on failure
        setDoc(doc);
        setDocSaveStatus('idle');
        console.error(err);
      });
  };

  // Resizers
  useEffect(() => {
    const handleLeftResize = (e: MouseEvent) => {
      if (e.clientX < 100) {
        setLeftCollapsed(true);
        setLeftWidth(250); // reset for when it re-expands
      } else {
        setLeftCollapsed(false);
        setLeftWidth(Math.min(e.clientX, 400));
      }
    };
    const handleRightResize = (e: MouseEvent) => {
      const rightW = window.innerWidth - e.clientX;
      if (rightW < 100) {
        setRightCollapsed(true);
        setRightWidth(250);
      } else {
        setRightCollapsed(false);
        setRightWidth(Math.min(rightW, 400));
      }
    };

    const stopResize = () => {
      document.removeEventListener('mousemove', handleLeftResize);
      document.removeEventListener('mousemove', handleRightResize);
      document.removeEventListener('mouseup', stopResize);
    };

    const initLeftResize = () => {
      document.addEventListener('mousemove', handleLeftResize);
      document.addEventListener('mouseup', stopResize);
    };

    const initRightResize = () => {
      document.addEventListener('mousemove', handleRightResize);
      document.addEventListener('mouseup', stopResize);
    };

    const leftHandle = document.getElementById('left-resizer');
    const rightHandle = document.getElementById('right-resizer');

    leftHandle?.addEventListener('mousedown', initLeftResize);
    rightHandle?.addEventListener('mousedown', initRightResize);

    return () => {
      leftHandle?.removeEventListener('mousedown', initLeftResize);
      rightHandle?.removeEventListener('mousedown', initRightResize);
      stopResize();
    };
  }, []);

  if (loading) return <div className="p-8 text-warm-700">Loading editor...</div>;
  if (error || !doc) return <div className="p-8 text-danger-500">{error}</div>;

  return (
    <div className="flex h-screen w-full bg-surface-primary overflow-hidden font-sans text-warm-900">
      
      {/* Left Sidebar - Chapters */}
      {!leftCollapsed && (
        <aside
          className="relative flex flex-col bg-surface-tertiary border-r border-warm-200 transition-all"
          style={{ width: leftWidth }}
        >
          <div className="p-4 border-b border-warm-200 flex justify-between items-center">
            <h2 className="font-semibold text-warm-900">Chapters</h2>
            <button
              onClick={handleAddChapter}
              className="text-xs text-brand-500 hover:text-brand-700 font-medium"
            >
              + New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chapters.map((chap) => {
              const active = chap.id === activeChapterId;
              const headings = active ? parseMarkdownHeadings(chapterContent) : parseMarkdownHeadings(chap.content);
              return (
                <div key={chap.id} className="mb-2">
                  <div className="flex items-center group min-w-0">
                    <button
                      onClick={() => selectChapter(chap)}
                      className={`flex-1 min-w-0 text-left px-3 py-2 text-sm font-medium rounded-md transition-colors truncate ${
                        active ? 'bg-white shadow-sm text-brand-700' : 'text-warm-700 hover:bg-warm-200'
                      }`}
                    >
                      {active ? chapterTitle || 'Untitled' : chap.title || 'Untitled'}
                    </button>
                    {active && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setChapterToDelete({ id: chap.id, title: chap.title });
                        }}
                        className="opacity-0 group-hover:opacity-100 shrink-0 p-2 text-warm-400 hover:text-danger-500 transition-opacity"
                        title="Delete chapter"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {/* Show headings if active */}
                  {active && headings.length > 0 && (
                    <div className="ml-4 mt-1 pl-2 border-l border-brand-200 space-y-1">
                      {headings.map((h, i) => (
                        <div
                          key={i}
                          className="text-xs text-warm-500 truncate cursor-pointer hover:text-brand-600"
                          style={{ paddingLeft: `${(h.level - 1) * 8}px` }}
                        >
                          {h.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Drag Handle */}
          <div
            id="left-resizer"
            className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-brand-300/30 active:bg-brand-300/50 z-10"
          />
        </aside>
      )}

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface-primary relative shadow-inner">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-warm-200 bg-white">
          <div className="flex items-center gap-3">
            {leftCollapsed && (
              <button
                onClick={() => setLeftCollapsed(false)}
                className="text-warm-500 hover:text-brand-600 font-medium text-sm p-1"
                title="Expand chapters"
              >
                ⇥
              </button>
            )}
            <button onClick={() => navigate('/')} className="text-warm-500 hover:text-brand-600 text-sm font-medium">
              ← Dashboard
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <span className={`text-xs px-2 py-1 rounded-full ${savingStatus === 'Saved' ? 'bg-success-400/20 text-success-500' : 'bg-brand-200/50 text-brand-700'}`}>
              {savingStatus}
            </span>
            {rightCollapsed && (
              <button
                onClick={() => setRightCollapsed(false)}
                className="text-warm-500 hover:text-brand-600 font-medium text-sm p-1"
                title="Expand settings"
              >
                ⇤ Settings
              </button>
            )}
          </div>
        </header>

        {/* Editor body */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-3xl mx-auto space-y-6">
            {!activeChapterId ? (
              <div className="text-center mt-20 text-warm-400">Select or create a chapter to begin writing.</div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Chapter Title"
                    className="text-4xl font-bold text-warm-900 bg-transparent border-none outline-none placeholder:text-warm-300 w-full"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-warm-500">CHAPTER STATUS</span>
                    <button
                      onClick={() => handlePublishChange(!chapterPublished)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        chapterPublished ? 'bg-success-500' : 'bg-warm-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          chapterPublished ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="relative group">
                  <textarea
                    value={chapterContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Start writing in Markdown..."
                    className="w-full h-[60vh] resize-none bg-transparent border-none outline-none text-warm-800 font-mono text-base leading-relaxed placeholder:text-warm-300"
                  />
                  
                  {/* Markdown hints floating button */}
                  <div className="absolute top-0 right-[-40px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setShowHints(!showHints)}
                      className="w-8 h-8 rounded-full bg-white shadow-md text-brand-600 flex items-center justify-center hover:bg-brand-50"
                      title="Markdown Hints"
                    >
                      ?
                    </button>
                    {showHints && (
                      <div className="absolute top-10 right-0 w-48 bg-white shadow-xl rounded-xl border border-warm-200 p-3 z-20 text-sm text-warm-700">
                        <div className="font-semibold text-warm-900 mb-2">Markdown Hints</div>
                        <ul className="space-y-2">
                          {MARKDOWN_HINTS.map((hint, i) => (
                            <li key={i} className="flex flex-col">
                              <span className="text-xs text-warm-500">{hint.label}</span>
                              <code className="text-xs font-mono bg-warm-100 px-1 py-0.5 rounded text-brand-700">{hint.syntax}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar - Document Settings */}
      {!rightCollapsed && (
        <aside
          className="relative flex flex-col bg-white border-l border-warm-200 transition-all shadow-xl z-20"
          style={{ width: rightWidth }}
        >
          {/* Drag Handle */}
          <div
            id="right-resizer"
            className="absolute top-0 left-0 w-2 h-full cursor-col-resize hover:bg-brand-300/30 active:bg-brand-300/50 z-10"
          />
          <div className="p-5 flex-1 overflow-y-auto space-y-6 pl-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-warm-900 tracking-tight text-lg">Document Settings</h3>
              <span
                className={`text-xs font-medium transition-opacity duration-300 ${
                  docSaveStatus === 'saving' ? 'opacity-100 text-warm-400' :
                  docSaveStatus === 'saved'  ? 'opacity-100 text-green-500' :
                  'opacity-0'
                }`}
              >
                {docSaveStatus === 'saving' ? 'Saving...' : 'Saved'}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-warm-500">Document Title</label>
              <input
                type="text"
                value={doc.title}
                onChange={(e) => handleDocUpdate({ title: e.target.value })}
                className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-warm-500">Document Type</label>
              <select
                value={doc.type}
                onChange={(e) => handleDocUpdate({ type: e.target.value as 'BOOK' | 'DOCUMENT' })}
                className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 bg-white"
              >
                <option value="DOCUMENT">Document</option>
                <option value="BOOK">Book</option>
              </select>
            </div>

            <div className="space-y-2 pt-4 border-t border-warm-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-warm-900">Public Access</div>
                  <div className="text-xs text-warm-500 mt-0.5">Allow anyone with link to read</div>
                </div>
                <button
                  onClick={() => handleDocUpdate({ published: !doc.published })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    doc.published ? 'bg-success-500' : 'bg-warm-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      doc.published ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-6">
               <div className="text-xs text-warm-400">Share Link:</div>
               <a 
                 href={`/${doc.ownerUserName}/${doc.slug}`}
                 target="_blank" rel="noopener noreferrer"
                 className="text-sm font-medium text-brand-600 hover:underline break-all"
               >
                 {window.location.origin}/{doc.ownerUserName}/{doc.slug}
               </a>
            </div>
          </div>
        </aside>
      )}

      {/* Delete Confirmation Modal */}
      {chapterToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-auto border border-warm-200">
            <h3 className="text-xl font-bold text-warm-900 mb-2">Delete Chapter?</h3>
            <p className="text-sm text-warm-600 mb-6">
              Are you sure you want to delete <strong className="text-warm-800">"{chapterToDelete.title || 'Untitled'}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setChapterToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-warm-600 hover:bg-warm-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChapterConfirm}
                className="px-4 py-2 text-sm font-bold text-white bg-danger-500 hover:bg-danger-600 rounded-xl shadow-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
