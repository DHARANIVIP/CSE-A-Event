// Safe, lightweight, zero-dependency Markdown parser and HTML serializer
// Prevents raw HTML injection (XSS-safe) and outputs clean structural HTML.

export function renderMarkdownToSafeHTML(md: string): string {
  if (!md) return "";

  // Strip dangerous script tags and raw HTML tags before parsing
  let text = md
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const lines = text.split(/\r?\n/);
  const out: string[] = [];

  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeBlockContent: string[] = [];

  let inList = false;
  let listType: "ul" | "ol" | null = null;

  let inTable = false;
  let tableHeaderParsed = false;

  const escapeHtml = (str: string): string => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const inlineFormat = (line: string): string => {
    let s = escapeHtml(line);
    // Bold + Italic
    s = s.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
    // Bold
    s = s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Italic
    s = s.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // Inline code
    s = s.replace(/`([^`]+)`/g, '<code class="font-mono text-crimson px-1.5 py-0.5 bg-cream/70 rounded border border-ink/20 text-sm">$1</code>');
    return s;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block toggle
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        out.push(
          `<pre class="bg-ink text-paper p-4 rounded-md overflow-x-auto my-3 font-mono text-sm border-2 border-ink"><code class="${escapeHtml(
            codeBlockLang
          )}">${escapeHtml(codeBlockContent.join("\n"))}</code></pre>`
        );
        inCodeBlock = false;
        codeBlockContent = [];
        codeBlockLang = "";
      } else {
        if (inList) {
          out.push(listType === "ul" ? "</ul>" : "</ol>");
          inList = false;
        }
        if (inTable) {
          out.push("</tbody></table></div>");
          inTable = false;
          tableHeaderParsed = false;
        }
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(rawLine);
      continue;
    }

    // End table if non-table row encountered
    if (inTable && !trimmed.startsWith("|")) {
      out.push("</tbody></table></div>");
      inTable = false;
      tableHeaderParsed = false;
    }

    // End list if blank line or non-list item
    if (inList && !trimmed.startsWith("- ") && !trimmed.startsWith("* ") && !/^\d+\.\s/.test(trimmed)) {
      out.push(listType === "ul" ? "</ul>" : "</ol>");
      inList = false;
      listType = null;
    }

    // Empty lines
    if (!trimmed) {
      continue;
    }

    // Table rows
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());

      // Check if divider row (|---|---|)
      if (cells.every((c) => /^[-:\s]+$/.test(c))) {
        tableHeaderParsed = true;
        continue;
      }

      if (!inTable) {
        inTable = true;
        out.push('<div class="overflow-x-auto my-4 border-2 border-ink rounded-lg shadow-hard-sm"><table class="w-full text-left font-mono text-sm border-collapse bg-paper">');
        out.push('<thead class="bg-crimson text-cream border-b-2 border-ink"><tr>');
        for (const cell of cells) {
          out.push(`<th class="p-3 font-bold border-r border-ink/40 last:border-r-0">${inlineFormat(cell)}</th>`);
        }
        out.push('</tr></thead><tbody>');
        continue;
      }

      out.push('<tr class="border-b border-ink/20 hover:bg-cream/40 transition-colors">');
      for (const cell of cells) {
        out.push(`<td class="p-3 border-r border-ink/20 last:border-r-0">${inlineFormat(cell)}</td>`);
      }
      out.push("</tr>");
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      out.push(`<h3 class="font-display text-xl sm:text-2xl text-crimson uppercase tracking-tight mt-6 mb-2">${inlineFormat(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      out.push(`<h2 class="font-display text-2xl sm:text-3xl text-crimson uppercase tracking-tight mt-8 mb-3 border-b-2 border-ink/15 pb-1">${inlineFormat(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      out.push(`<h1 class="font-display text-3xl sm:text-4xl text-crimson uppercase tracking-tight mt-6 mb-4">${inlineFormat(trimmed.slice(2))}</h1>`);
      continue;
    }

    // Horizontal rule
    if (trimmed === "---" || trimmed === "***") {
      out.push('<hr class="border-t-2 border-ink/30 my-6" />');
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      out.push(`<blockquote class="border-l-4 border-crimson pl-4 py-2 italic font-mono text-muted my-3 bg-cream/40 rounded-r">${inlineFormat(trimmed.slice(2))}</blockquote>`);
      continue;
    }

    // Unordered list
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList || listType !== "ul") {
        if (inList) out.push(listType === "ul" ? "</ul>" : "</ol>");
        out.push('<ul class="list-disc list-inside space-y-1 my-3 pl-2 font-mono text-ink">');
        inList = true;
        listType = "ul";
      }
      out.push(`<li>${inlineFormat(trimmed.slice(2))}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        if (inList) out.push(listType === "ul" ? "</ul>" : "</ol>");
        out.push('<ol class="list-decimal list-inside space-y-1.5 my-3 pl-2 font-mono text-ink">');
        inList = true;
        listType = "ol";
      }
      out.push(`<li>${inlineFormat(olMatch[2])}</li>`);
      continue;
    }

    // Standard paragraph
    out.push(`<p class="font-mono text-base text-ink leading-relaxed my-3">${inlineFormat(trimmed)}</p>`);
  }

  if (inCodeBlock) {
    out.push(
      `<pre class="bg-ink text-paper p-4 rounded-md overflow-x-auto my-3 font-mono text-sm border-2 border-ink"><code>${escapeHtml(
        codeBlockContent.join("\n")
      )}</code></pre>`
    );
  }
  if (inList) {
    out.push(listType === "ul" ? "</ul>" : "</ol>");
  }
  if (inTable) {
    out.push("</tbody></table></div>");
  }

  return out.join("\n");
}
