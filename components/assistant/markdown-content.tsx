"use client";

import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";

/**
 * Markdown element renderers styled with the app design tokens.
 * Keeps assistant chat bubbles compact and readable.
 */
const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => <p className="mb-2 text-sm font-bold text-ink">{children}</p>,
  h2: ({ children }) => <p className="mb-2 text-sm font-bold text-ink">{children}</p>,
  h3: ({ children }) => <p className="mb-1.5 text-sm font-semibold text-ink">{children}</p>,
  code: ({ children }) => (
    <code className="rounded bg-ground px-1 py-0.5 font-mono text-xs text-ink">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-ground p-3 text-xs last:mb-0">{children}</pre>
  ),
  hr: () => <hr className="my-2 border-glass-border" />,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-accent underline"
    >
      {children}
    </a>
  ),
};

interface MarkdownContentProps {
  content: string;
}

/**
 * Renders assistant message content as markdown (bold, lists, headings...)
 * using the app design tokens. User messages stay plain text.
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  return <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>;
}
