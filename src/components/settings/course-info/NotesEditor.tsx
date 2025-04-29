import { useState, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  TextQuote,
  Link as LinkIcon,
  Type,
  ImageIcon,
  Undo,
  Redo,
} from "lucide-react";

interface NotesEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function NotesEditor({ value, onChange, theme }: NotesEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  // Format handlers
  const handleFormat = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Handle content changes
  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Insert link
  const handleInsertLink = () => {
    if (linkUrl.trim() && linkText.trim()) {
      const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      document.execCommand("insertHTML", false, linkHtml);
      setShowLinkInput(false);
      setLinkUrl("");
      setLinkText("");
      handleContentChange();
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-md border border-gray-200">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat("bold")}
          className="h-8 w-8"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat("italic")}
          className="h-8 w-8"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat("underline")}
          className="h-8 w-8"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-8 w-px bg-gray-200" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat("formatBlock", "<h1>")}
          className="h-8 w-8"
        >
          <Type className="h-4 w-4" />
          <span className="sr-only">Heading 1</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat("formatBlock", "<h2>")}
          className="h-8 w-8"
        >
          <Type className="h-3 w-3" />
          <span className="sr-only">Heading 2</span>
        </Button>
        <div className="mx-1 h-8 w-px bg-gray-200" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat("insertUnorderedList")}
          className="h-8 w-8"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat("insertOrderedList")}
          className="h-8 w-8"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-8 w-px bg-gray-200" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat("justifyLeft")}
          className="h-8 w-8"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat("justifyCenter")}
          className="h-8 w-8"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-8 w-px bg-gray-200" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat("formatBlock", "<blockquote>")}
          className="h-8 w-8"
        >
          <TextQuote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowLinkInput(!showLinkInput)}
          className="h-8 w-8"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-8 w-px bg-gray-200" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat("undo")}
          className="h-8 w-8"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat("redo")}
          className="h-8 w-8"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Link Input Section */}
      {showLinkInput && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 p-2">
          <input
            type="text"
            placeholder="Link text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            className="min-w-[150px] flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <input
            type="url"
            placeholder="URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="min-w-[150px] flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <Button
            size="sm"
            onClick={handleInsertLink}
            className="text-xs"
            style={{ backgroundColor: theme?.primary, color: "#fff" }}
          >
            Insert
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLinkInput(false)}
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Content Editable Div */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        className="min-h-[250px] p-4 focus:outline-none"
        style={{ minHeight: "250px" }}
        suppressContentEditableWarning
      />
    </div>
  );
}
