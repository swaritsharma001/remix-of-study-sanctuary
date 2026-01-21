import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  StickyNote, 
  Plus, 
  Edit2, 
  Trash2, 
  Clock,
  Save,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useLectureNotes, LectureNote } from '@/hooks/useLectureNotes';
import { cn } from '@/lib/utils';

interface LectureNotesProps {
  lectureId: string;
  currentTime?: number;
  onSeekTo?: (time: number) => void;
}

const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const LectureNotes: React.FC<LectureNotesProps> = ({ lectureId, currentTime = 0, onSeekTo }) => {
  const { notes, loading, addNote, updateNote, deleteNote } = useLectureNotes(lectureId);
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    
    setSaving(true);
    const result = await addNote(newNoteContent.trim(), Math.floor(currentTime));
    if (result) {
      setNewNoteContent('');
      setIsAdding(false);
    }
    setSaving(false);
  };

  const handleStartEdit = (note: LectureNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    
    setSaving(true);
    const success = await updateNote(editingId, editContent.trim());
    if (success) {
      setEditingId(null);
      setEditContent('');
    }
    setSaving(false);
  };

  const handleDelete = async (noteId: string) => {
    await deleteNote(noteId);
  };

  const handleTimestampClick = (seconds: number) => {
    onSeekTo?.(seconds);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-yellow-500" />
          My Notes
          {notes.length > 0 && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
              {notes.length}
            </span>
          )}
        </CardTitle>
        {!isAdding && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAdding(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {/* Add note form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Clock className="h-3 w-3" />
                  <span>at {formatTimestamp(currentTime)}</span>
                </div>
                <Textarea
                  placeholder="Write your note here..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="min-h-[80px] resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-3">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setIsAdding(false);
                      setNewNoteContent('');
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!newNoteContent.trim() || saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <StickyNote className="h-12 w-12 mx-auto opacity-30 mb-2" />
            <p>No notes yet</p>
            <p className="text-sm">Add notes while watching to remember key points</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'rounded-lg border p-4 transition-colors',
                  editingId === note.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                )}
              >
                {editingId === note.id ? (
                  <div>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[80px] resize-none mb-3"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setEditContent('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={!editContent.trim() || saving}
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <button
                          onClick={() => handleTimestampClick(note.timestamp_seconds)}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-2"
                        >
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(note.timestamp_seconds)}
                        </button>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleStartEdit(note)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LectureNotes;
