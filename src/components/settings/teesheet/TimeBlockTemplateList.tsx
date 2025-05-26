"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Plus, GripVertical, Edit, Trash } from "lucide-react";
import type { TimeBlockTemplate } from "~/app/types/TeeSheetTypes";
import { TimeBlockTemplateEditor } from "./TimeBlockTemplateEditor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { formatTimeStringTo12Hour } from "~/lib/utils";

interface TimeBlockTemplateListProps {
  templates: TimeBlockTemplate[];
  configId: number;
  onCreateTemplate: (
    template: Omit<
      TimeBlockTemplate,
      "id" | "clerkOrgId" | "createdAt" | "updatedAt"
    >,
  ) => Promise<void>;
  onUpdateTemplate: (
    templateId: number,
    template: Partial<
      Omit<TimeBlockTemplate, "id" | "clerkOrgId" | "createdAt" | "updatedAt">
    >,
  ) => Promise<void>;
  onDeleteTemplate: (templateId: number) => Promise<void>;
  onReorderTemplates: (templateIds: number[]) => Promise<void>;
}

export function TimeBlockTemplateList({
  templates,
  configId,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onReorderTemplates,
}: TimeBlockTemplateListProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TimeBlockTemplate>();
  const [templateToDelete, setTemplateToDelete] = useState<TimeBlockTemplate>();
  const [isDragging, setIsDragging] = useState(false);

  const handleCreateTemplate = () => {
    setSelectedTemplate(undefined);
    setIsEditorOpen(true);
  };

  const handleEditTemplate = (template: TimeBlockTemplate) => {
    setSelectedTemplate(template);
    setIsEditorOpen(true);
  };

  const handleSaveTemplate = async (
    template: Omit<
      TimeBlockTemplate,
      "id" | "clerkOrgId" | "createdAt" | "updatedAt"
    >,
  ) => {
    if (selectedTemplate) {
      await onUpdateTemplate(selectedTemplate.id, template);
    } else {
      await onCreateTemplate(template);
    }
    setIsEditorOpen(false);
    setSelectedTemplate(undefined);
  };

  const handleDeleteClick = (template: TimeBlockTemplate) => {
    setTemplateToDelete(template);
  };

  const handleDeleteConfirm = async () => {
    if (templateToDelete) {
      await onDeleteTemplate(templateToDelete.id);
      setTemplateToDelete(undefined);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, template: TimeBlockTemplate) => {
    e.dataTransfer.setData("text/plain", template.id.toString());
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetTemplate: TimeBlockTemplate,
  ) => {
    e.preventDefault();
    const draggedId = parseInt(e.dataTransfer.getData("text/plain"));
    const draggedTemplate = templates.find((t) => t.id === draggedId);

    if (!draggedTemplate || draggedTemplate.id === targetTemplate.id) return;

    const oldIndex = templates.findIndex((t) => t.id === draggedId);
    const newIndex = templates.findIndex((t) => t.id === targetTemplate.id);

    const newTemplates = [...templates];
    newTemplates.splice(oldIndex, 1);
    newTemplates.splice(newIndex, 0, draggedTemplate);

    await onReorderTemplates(newTemplates.map((t) => t.id));
    setIsDragging(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Time Block Templates</h3>
        <Button onClick={handleCreateTemplate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Template
        </Button>
      </div>

      <div className="space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            draggable
            onDragStart={(e) => handleDragStart(e, template)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, template)}
            className={`flex items-center justify-between rounded-lg border bg-white p-4 ${
              isDragging ? "cursor-move" : ""
            }`}
          >
            <div className="flex items-center space-x-4">
              <GripVertical className="h-4 w-4 cursor-move text-gray-400" />
              <div>
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-gray-500">
                  {formatTimeStringTo12Hour(template.startTime)} -{" "}
                  {formatTimeStringTo12Hour(template.endTime)}
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditTemplate(template)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(template)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No templates yet. Click "Add Template" to create one.
          </div>
        )}
      </div>

      <TimeBlockTemplateEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedTemplate(undefined);
        }}
        onSave={handleSaveTemplate}
        template={selectedTemplate}
        configId={configId}
      />

      <AlertDialog
        open={!!templateToDelete}
        onOpenChange={(open) => !open && setTemplateToDelete(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
