import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Check, X, StickyNote } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { wordsApi } from '@client/src/api';
import type { WordNote } from '@shared/api.interface';

interface NotesTabProps {
  wordId: string;
  onNoteChange?: (hasNote: boolean) => void;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

const NotesTab: React.FC<NotesTabProps> = ({ wordId, onNoteChange }) => {
  const [notes, setNotes] = useState<WordNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const loadNotes = async (): Promise<void> => {
    if (!wordId) return;
    setLoading(true);
    try {
      const data = await wordsApi.getWordNotes(wordId);
      setNotes(data || []);
      onNoteChange?.(data && data.length > 0);
    } catch (err) {
      logger.error('加载单词笔记失败', err as Error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [wordId]);

  const handleCreate = async (): Promise<void> => {
    if (!newContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const note = await wordsApi.createWordNote(wordId, newContent.trim());
      setNotes((prev) => [note, ...prev]);
      setNewContent('');
      onNoteChange?.(true);
    } catch (err) {
      logger.error('创建笔记失败', err as Error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string): Promise<void> => {
    try {
      await wordsApi.deleteWordNote(noteId);
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== noteId);
        onNoteChange?.(next.length > 0);
        return next;
      });
    } catch (err) {
      logger.error('删除笔记失败', err as Error);
    }
  };

  const startEdit = (note: WordNote): void => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = (): void => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (noteId: string): Promise<void> => {
    if (!editContent.trim()) return;
    try {
      const updated = await wordsApi.updateWordNote(noteId, editContent.trim());
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      cancelEdit();
    } catch (err) {
      logger.error('更新笔记失败', err as Error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i: number) => (
          <div key={i} className="h-20 rounded-xl bg-purple-900/20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="记录你的记忆技巧、联想画面..."
          rows={3}
          className="flex-1 px-3 py-2 rounded-xl text-sm resize-none
            bg-slate-800/60 border border-purple-900/30
            text-slate-200 placeholder-slate-500
            focus:outline-none focus:border-violet-500/60
            transition-colors"
        />
        <button
          onClick={handleCreate}
          disabled={!newContent.trim() || submitting}
          className="self-end px-3 py-2 rounded-xl text-sm font-medium
            bg-gradient-to-r from-violet-600 to-indigo-600
            text-white shadow-lg shadow-violet-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:from-violet-500 hover:to-indigo-500
            transition-all active:scale-95"
        >
          <Plus size={18} />
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
          <div className="w-14 h-14 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
            <StickyNote size={24} className="opacity-40" />
          </div>
          <p className="text-sm">还没有笔记</p>
          <p className="text-xs text-slate-600 mt-1">记录你的记忆技巧吧</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1
          scrollbar-thin scrollbar-thumb-purple-700/50">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-xl bg-slate-800/50 border border-purple-900/30
                hover:border-violet-500/40 transition-all"
            >
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg text-sm resize-none
                      bg-slate-900/60 border border-violet-500/40
                      text-slate-200 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 rounded-lg text-slate-400
                        hover:bg-slate-700/50 hover:text-white transition-colors"
                      aria-label="取消"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      className="p-1.5 rounded-lg text-violet-400
                        hover:bg-violet-500/20 transition-colors"
                      aria-label="保存"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-purple-900/20">
                    <span className="text-[10px] text-slate-500">
                      {note.updatedAt && note.updatedAt !== note.createdAt
                        ? `更新于 ${formatDate(note.updatedAt)}`
                        : `创建于 ${formatDate(note.createdAt)}`}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(note)}
                        className="p-1.5 rounded-lg text-slate-500
                          hover:text-violet-400 hover:bg-violet-500/10
                          transition-colors"
                        aria-label="编辑"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-1.5 rounded-lg text-slate-500
                          hover:text-rose-400 hover:bg-rose-500/10
                          transition-colors"
                        aria-label="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesTab;
