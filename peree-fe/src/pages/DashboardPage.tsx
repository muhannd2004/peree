import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createDocument,
  deleteDocument,
  listDocuments,
  type DocumentResponse,
} from '../services/document.service';

type DocType = 'BOOK' | 'DOCUMENT';

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creatingDocument, setCreatingDocument] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentType, setNewDocumentType] = useState<DocType>('BOOK');

  useEffect(() => {
    void loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    setError('');
    try {
      const data = await listDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!newDocumentTitle.trim()) return;
    setCreatingDocument(true);
    setError('');
    try {
      const document = await createDocument({
        title: newDocumentTitle.trim(),
        type: newDocumentType,
        published: false,
      });
      setDocuments((current) => [document, ...current]);
      setNewDocumentTitle('');
      setNewDocumentType('BOOK');
      // Navigate straight to the new editor
      navigate(`/editor/${document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
    } finally {
      setCreatingDocument(false);
    }
  }

  const [documentToDelete, setDocumentToDelete] = useState<{id: number, title: string} | null>(null);

  async function handleDeleteConfirm() {
    if (!documentToDelete) return;
    try {
      await deleteDocument(documentToDelete.id);
      setDocuments(documents.filter((d) => d.id !== documentToDelete.id));
      setDocumentToDelete(null);
    } catch (err) {
      setError('Failed to delete document');
      setDocumentToDelete(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-primary text-warm-700 font-sans">
        <div className="animate-pulse">Loading workspace...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface-primary font-sans text-warm-900">
      <header className="flex items-center justify-between border-b border-warm-200 bg-white px-8 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-lg">
            P
          </div>
          <h1 className="text-xl font-bold tracking-tight text-warm-900">Peree Docs</h1>
        </div>
        <button
          onClick={logout}
          className="rounded-full px-5 py-2 text-sm font-semibold text-warm-700 transition-colors border border-warm-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 shadow-sm"
        >
          Sign out
        </button>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-12">
        {error && (
          <div className="mb-8 rounded-xl border border-danger-500/20 bg-danger-500/5 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-warm-200">
              <h2 className="text-lg font-bold text-warm-900 mb-4">Create New</h2>
              <form onSubmit={handleCreateDocument} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={newDocumentTitle}
                    onChange={(event) => setNewDocumentTitle(event.target.value)}
                    placeholder="Document title"
                    className="w-full rounded-xl border border-warm-200 bg-surface-primary px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={newDocumentType}
                    onChange={(event) => setNewDocumentType(event.target.value as DocType)}
                    className="flex-1 rounded-xl border border-warm-200 bg-surface-primary px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  >
                    <option value="BOOK">Book</option>
                    <option value="DOCUMENT">Document</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={creatingDocument || !newDocumentTitle.trim()}
                  className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 disabled:hover:bg-brand-500 shadow-sm transition-all"
                >
                  {creatingDocument ? 'Creating...' : '+ Create'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold text-warm-900 mb-6">Your Documents</h2>
            
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-warm-200">
                <div className="mb-4 text-warm-300">
                  <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-warm-700 mb-1">No documents yet</h3>
                <p className="text-sm text-warm-500 max-w-sm">
                  Create your first book or document using the panel on the left to start writing.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/editor/${doc.id}`)}
                    className="group relative flex flex-col bg-white rounded-2xl p-5 border border-warm-200 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           setDocumentToDelete({ id: doc.id, title: doc.title });
                         }}
                         className="p-2 text-warm-400 hover:text-danger-500 bg-white rounded-full shadow-sm hover:bg-danger-50"
                         title="Delete document"
                       >
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                       </button>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${doc.type === 'BOOK' ? 'bg-brand-100 text-brand-700' : 'bg-warm-100 text-warm-700'}`}>
                        {doc.type}
                      </span>
                      {doc.published ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-success-500/10 text-success-500">
                          Published
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-warm-100 text-warm-500">
                          Draft
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-warm-900 mb-2 truncate group-hover:text-brand-600 transition-colors">
                      {doc.title}
                    </h3>
                    
                    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-warm-500 border-t border-warm-100">
                      <span>{doc.chapters?.length || 0} chapters</span>
                      <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {documentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-auto border border-warm-200">
            <h3 className="text-xl font-bold text-warm-900 mb-2">Delete Document?</h3>
            <p className="text-sm text-warm-600 mb-6">
              Are you sure you want to delete <strong className="text-warm-800">"{documentToDelete.title}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDocumentToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-warm-600 hover:bg-warm-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
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
