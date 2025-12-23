import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type MarkdownEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
};

const MarkdownEditor = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
  disabled = false,
  className,
}: MarkdownEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const getSelection = () => {
    const element = textareaRef.current;
    if (!element) {
      return { start: value.length, end: value.length };
    }
    return { start: element.selectionStart ?? 0, end: element.selectionEnd ?? 0 };
  };

  const updateValue = (nextValue: string, selectionStart: number, selectionEnd: number) => {
    onChange(nextValue);
    requestAnimationFrame(() => {
      const element = textareaRef.current;
      if (!element) return;
      element.focus();
      element.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const wrapSelection = (prefix: string, suffix: string, placeholderText: string) => {
    const { start, end } = getSelection();
    const selected = value.slice(start, end) || placeholderText;
    const nextValue =
      value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    const nextStart = start + prefix.length;
    const nextEnd = nextStart + selected.length;
    updateValue(nextValue, nextStart, nextEnd);
  };

  const prefixLines = (prefix: string) => {
    const { start, end } = getSelection();
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const rawLineEnd = value.indexOf("\n", end);
    const lineEnd = rawLineEnd === -1 ? value.length : rawLineEnd;
    const block = value.slice(lineStart, lineEnd);
    const lines = block.split("\n");
    const prefixed = lines
      .map((line) => (line ? `${prefix}${line}` : prefix.trim()))
      .join("\n");
    const nextValue = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
    const delta = prefixed.length - block.length;
    updateValue(nextValue, start + prefix.length, end + delta + prefix.length);
  };

  const insertParagraphBreak = () => {
    const { start, end } = getSelection();
    const nextValue = value.slice(0, start) + "\n\n" + value.slice(end);
    updateValue(nextValue, start + 2, start + 2);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => wrapSelection("**", "**", "bold text")}
          disabled={disabled}
        >
          Bold
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => prefixLines("## ")}
          disabled={disabled}
        >
          H2
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => prefixLines("### ")}
          disabled={disabled}
        >
          H3
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => wrapSelection("[", "](https://)", "link text")}
          disabled={disabled}
        >
          Link
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => prefixLines("- ")}
          disabled={disabled}
        >
          Bullets
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => prefixLines("1. ")}
          disabled={disabled}
        >
          Numbered
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => prefixLines("> ")}
          disabled={disabled}
        >
          Quote
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={insertParagraphBreak}
          disabled={disabled}
        >
          New paragraph
        </Button>
      </div>
      <Textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
};

export default MarkdownEditor;
