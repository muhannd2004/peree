import api from '../lib/api';

// -- Response types matching the backend --

export type DocumentType = 'BOOK' | 'DOCUMENT';

export interface ChapterResponse {
  id: number;
  title: string;
  content: string;
  orderIndex: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentResponse {
  id: number;
  title: string;
  slug: string;
  type: DocumentType;
  published: boolean;
  ownerUserName: string;
  createdAt: string;
  updatedAt: string;
  chapters: ChapterResponse[] | null;
}

// -- Request payloads --

export interface CreateDocumentPayload {
  title: string;
  type: DocumentType;
  published: boolean;
}

export interface UpdateDocumentPayload {
  title: string;
  type: DocumentType;
  published: boolean;
}

export interface CreateChapterPayload {
  title: string;
  content: string;
  published: boolean;
}

export interface UpdateChapterPayload {
  title: string;
  content: string;
  published: boolean;
}

// -- Document endpoints --

export async function listDocuments(): Promise<DocumentResponse[]> {
  const { data } = await api.get<DocumentResponse[]>('/documents');
  return data;
}

export async function getDocument(id: number): Promise<DocumentResponse> {
  const { data } = await api.get<DocumentResponse>(`/documents/${id}`);
  return data;
}

export async function createDocument(
  payload: CreateDocumentPayload,
): Promise<DocumentResponse> {
  const { data } = await api.post<DocumentResponse>('/documents', payload);
  return data;
}

export async function updateDocument(
  id: number,
  payload: UpdateDocumentPayload,
): Promise<DocumentResponse> {
  const { data } = await api.put<DocumentResponse>(
    `/documents/${id}`,
    payload,
  );
  return data;
}

export async function deleteDocument(id: number): Promise<void> {
  await api.delete(`/documents/${id}`);
}

// -- Chapter endpoints --

export async function createChapter(
  docId: number,
  payload: CreateChapterPayload,
): Promise<ChapterResponse> {
  const { data } = await api.post<ChapterResponse>(
    `/documents/${docId}/chapters`,
    payload,
  );
  return data;
}

export async function updateChapter(
  chapterId: number,
  payload: UpdateChapterPayload,
): Promise<ChapterResponse> {
  const { data } = await api.put<ChapterResponse>(
    `/documents/chapters/${chapterId}`,
    payload,
  );
  return data;
}

export async function deleteChapter(chapterId: number): Promise<void> {
  await api.delete(`/documents/chapters/${chapterId}`);
}

export async function reorderChapters(
  docId: number,
  chapterIds: number[],
): Promise<ChapterResponse[]> {
  const { data } = await api.put<ChapterResponse[]>(
    `/documents/${docId}/chapters/reorder`,
    { chapterIds },
  );
  return data;
}

// -- Public endpoints (no auth) --

export async function getPublicDocument(
  userName: string,
  slug: string,
): Promise<DocumentResponse> {
  const { data } = await api.get<DocumentResponse>(
    `/public/${userName}/${slug}`,
  );
  return data;
}
