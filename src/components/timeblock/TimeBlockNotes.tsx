import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Check, Edit, PlusCircle, Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "~/components/ui/delete-confirmation-dialog";

// TimeBlock Note Editor component
interface TimeBlockNoteEditorProps {
  timeBlockId: number;
  initialNote?: string;
  onSaveNotes: (timeBlockId: number, notes: string) => Promise<boolean>;
  onCancel?: () => void;
}

export function TimeBlockNoteEditor({
  timeBlockId,
  initialNote = "",
  onSaveNotes,
  onCancel,
}: TimeBlockNoteEditorProps) {
  const [newNote, setNewNote] = useState(initialNote);

  const handleSaveNote = async () => {
    if (newNote.trim()) {
      await onSaveNotes(timeBlockId, newNote);
    }
  };

  return (
    <div className="px-4 py-2">
      {/* Editor container */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex flex-col space-y-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note for this tee time..."
            className="min-h-[60px] text-xs"
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel ? onCancel : () => setNewNote("")}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveNote}
              className="h-7 text-xs"
              disabled={!newNote.trim()}
            >
              <Check className="mr-1 h-3 w-3" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// TimeBlock Note Display component
interface TimeBlockNoteProps {
  notes: string;
  onEditClick: () => void;
  timeBlockId: number;
  onSaveNotes: (timeBlockId: number, notes: string) => Promise<boolean>;
}

export function TimeBlockNote({
  notes,
  onEditClick,
  timeBlockId,
  onSaveNotes,
}: TimeBlockNoteProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  if (!notes || notes.trim() === "") return null;

  const handleDelete = async () => {
    await onSaveNotes(timeBlockId, "");
    setShowDeleteConfirmation(false);
  };

  return (
    <>
      <div className="px-4 py-2">
        {/* Note container */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="group rounded-md bg-white p-3 shadow-sm transition-colors hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1 border-l-4 border-org-primary pl-2 text-sm text-gray-700">
                {notes}
              </div>
              <div className="ml-3 flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick();
                  }}
                  className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirm={handleDelete}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
      />
    </>
  );
}

// Note Add Indicator
interface TimeBlockNoteAddIndicatorProps {
  onClick: () => void;
}

export function TimeBlockNoteAddIndicator({
  onClick,
}: TimeBlockNoteAddIndicatorProps) {
  return (
    <div
      className="group flex h-2 cursor-pointer items-center justify-center"
      onClick={onClick}
    >
      <div className="relative h-0.5 w-full bg-transparent group-hover:bg-gray-200">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-white p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <PlusCircle className="h-4 w-4 text-blue-600" />
        </div>
      </div>
    </div>
  );
}
