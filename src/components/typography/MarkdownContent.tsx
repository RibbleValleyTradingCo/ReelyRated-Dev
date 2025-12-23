import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

const MarkdownContent = ({ content, className }: MarkdownContentProps) => {
  return (
    <div className={cn("space-y-4 text-slate-700 leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-semibold text-slate-900" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold text-slate-900" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-slate-700 whitespace-pre-line" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 underline underline-offset-4 hover:text-blue-800"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc space-y-1 pl-5 text-slate-700" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal space-y-1 pl-5 text-slate-700" {...props} />
          ),
          li: ({ node, ...props }) => <li {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-2 border-slate-300 pl-4 text-slate-600 italic"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
