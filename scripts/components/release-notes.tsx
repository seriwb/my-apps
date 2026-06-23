import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import type { ResolvedReleaseNote } from "../types";
import { formatYmd } from "../utils";

marked.use({
  gfm: true,
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser?.parseInline(tokens) ?? '';
      const level = Math.min(depth + 3, 6);
      return `<h${level}>${text}</h${level}>\n`;
    },
  },
});

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h4", "h5", "h6",
    "p", "br", "hr",
    "strong", "em", "del", "code", "pre",
    "blockquote",
    "ul", "ol", "li",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
    "input",
  ],
  allowedAttributes: {
    a: ["href", "title", "rel", "target"],
    img: ["src", "alt", "title", "width", "height"],
    code: ["class"],
    pre: ["class"],
    input: ["type", "checked", "disabled"],
    th: ["align"],
    td: ["align"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
};

function ReleaseNoteBody({ body }: { body: string }) {
  const html = sanitizeHtml(marked.parse(body, { async: false }) as string, SANITIZE_OPTIONS);
  return <div className="release-note-body" dangerouslySetInnerHTML={{ __html: html }} />;
}

interface ReleaseNoteItemProps {
  r: ResolvedReleaseNote;
  owner: string;
  repo: string;
}

function ReleaseNoteItem({ r, owner, repo }: ReleaseNoteItemProps) {
  const ghUrl = `https://github.com/${owner}/${repo}/releases/tag/${r.tag}`;
  return (
    <article className="release-note">
      <header className="release-note-header">
        <h3 className="release-note-title">
          v{r.version}
          <span className="release-note-date">{formatYmd(r.publishedAt)}</span>
        </h3>
        <a className="release-note-link" href={ghUrl} target="_blank" rel="noopener noreferrer">GitHubで見る</a>
      </header>
      {r.body.length > 0 && <ReleaseNoteBody body={r.body} />}
    </article>
  );
}

interface ReleaseNotesProps {
  owner: string;
  repo: string;
  releases: ResolvedReleaseNote[];
}

export function ReleaseNotes({ owner, repo, releases }: ReleaseNotesProps) {
  if (releases.length === 0) return null;
  const head = releases.slice(0, 10);
  const tail = releases.slice(10);
  return (
    <section className="app-section app-release-notes">
      <h2 className="section-title" data-en="CHANGELOG">更新履歴</h2>
      {head.map((r) => (
        <ReleaseNoteItem key={r.tag} r={r} owner={owner} repo={repo} />
      ))}
      {tail.length > 0 && (
        <details className="release-notes-archive">
          <summary>過去のリリース</summary>
          {tail.map((r) => (
            <ReleaseNoteItem key={r.tag} r={r} owner={owner} repo={repo} />
          ))}
        </details>
      )}
    </section>
  );
}
