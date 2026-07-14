import { useState, useRef, useCallback } from "react";

/**
 * DisqusClone.jsx — nested comment thread with upvote, reply, collapse, and
 * a native rich-text composer (contentEditable + document.execCommand).
 *
 * All user-facing strings are passed in via the `labels` prop so the parent
 * Astro page can translate via i18n. See `src/pages/sites/site/[...slug].astro`.
 *
 * Mount with:  <DisqusClone client:only="react" labels={...} initialComments={...} />
 *
 * `client:only="react"` is REQUIRED — this component uses DOM-only APIs
 * (document.execCommand, DOMParser, contentEditable) that don't exist on the
 * server. SSR will throw; client-only is the only safe mount.
 */

const DEFAULT_LABELS = {
  countTitle: (n) => `${n} Komentar`,
  composerPlaceholder: "Bagikan pendapatmu…",
  send: "Kirim",
  replyPlaceholder: (author) => `Balas ke ${author}…`,
  reply: "Reply",
  upvote: "Upvote",
  report: "Report",
  share: "Share",
  hideReplies: "Sembunyikan balasan",
  showReplies: "Tampilkan balasan",
  showMore: "Show more",
  maker: "Maker",
  timeAgo: (ms) => {
    const diff = Math.floor(ms / 1000);
    if (diff < 60) return "baru saja";
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return `${Math.floor(diff / 86400)}h lalu`;
  },
};

const initialComments = [
  {
    id: "c1",
    author: "Rangga Wijaya",
    verified: true,
    productBadge: "Notiflow",
    isMaker: false,
    avatarColor: "bg-orange-400",
    body: "Sudah saya coba beberapa hari, benar-benar memangkas pekerjaan repetitif.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 17,
    votes: 12,
    upvoted: false,
    replies: [
      {
        id: "c1-r1",
        author: "Dewi Anjani",
        verified: false,
        productBadge: "Wegic",
        isMaker: true,
        avatarColor: "bg-teal-500",
        body:
          '<span class="text-[#FF6154] font-medium">@ranggawijaya</span> Terima kasih banyak — sangat berarti buat kami 🙌<br><br>Ini baru permulaan, workflow lainnya akan segera menyusul!',
        createdAt: Date.now() - 1000 * 60 * 60 * 16,
        votes: 4,
        upvoted: false,
        replies: [],
      },
    ],
  },
  {
    id: "c2",
    author: "Budi Santoso",
    verified: false,
    productBadge: null,
    isMaker: false,
    avatarColor: "bg-indigo-500",
    body: "Menurutku bagian caching-nya kurang detail, tapi overall bagus.",
    createdAt: Date.now() - 1000 * 60 * 60 * 20,
    votes: 3,
    upvoted: false,
    replies: [],
  },
];

function initials(name) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function mapTree(comments, id, fn) {
  return comments.map((c) => {
    if (c.id === id) return fn(c);
    if (c.replies.length) return { ...c, replies: mapTree(c.replies, id, fn) };
    return c;
  });
}

function addReply(comments, parentId, reply) {
  return mapTree(comments, parentId, (c) => ({ ...c, replies: [...c.replies, reply] }));
}

function toggleUpvote(comments, id) {
  return mapTree(comments, id, (c) => ({
    ...c,
    upvoted: !c.upvoted,
    votes: c.upvoted ? c.votes - 1 : c.votes + 1,
  }));
}

function countAll(comments) {
  return comments.reduce((acc, c) => acc + 1 + countAll(c.replies), 0);
}

function sanitizeBasicHtml(html) {
  const allowed = ["B", "STRONG", "I", "EM", "U", "BR", "SPAN"];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 1) {
        if (!allowed.includes(child.tagName)) {
          child.replaceWith(document.createTextNode(child.textContent));
          return;
        }
        [...child.attributes].forEach((attr) => child.removeAttribute(attr.name));
        walk(child);
      }
    });
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

const IconUpvote = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="2" y="2" width="12" height="12" rx="2.5" />
    <path d="M8 10.5V5.5M5.5 8 8 5.5 10.5 8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconFlag = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M3 2v12M3 3h8l-2 2.5L11 8H3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconShare = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path
      d="M8 10V2M5 4.5 8 1.5 11 4.5M3 8v5.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="8" cy="8" r="6.25" />
    <path d="M8 4.75V8l2.25 1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconDots = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="3.5" cy="8" r="1.4" />
    <circle cx="8" cy="8" r="1.4" />
    <circle cx="12.5" cy="8" r="1.4" />
  </svg>
);
const IconCheckVerified = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#22C55E">
    <path d="M8 0l1.7 1.2 2.1-.4.8 2 2 .8-.4 2.1L15.4 8l-1.2 1.7.4 2.1-2 .8-.8 2-2.1-.4L8 15.4l-1.7-1.2-2.1.4-.8-2-2-.8.4-2.1L0 8l1.2-1.7-.4-2.1 2-.8.8-2 2.1.4L8 0z" />
    <path d="M5.3 8.1 7 9.8l3.7-3.7" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconBox = () => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M8 1.5 14 5v6l-6 3.5L2 11V5l6-3.5Z" strokeLinejoin="round" />
    <path d="M2 5l6 3.5L14 5M8 8.5v5" strokeLinejoin="round" />
  </svg>
);
const IconMinus = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M2.5 6h7" strokeLinecap="round" />
  </svg>
);

function Avatar({ name, colorClass, size = 40 }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${colorClass}`}
      style={{ width: size, height: size }}
    >
      {initials(name)}
    </div>
  );
}

function ActionButton({ onClick, active, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 text-[13px] font-semibold transition ${
        active ? "text-[#FF6154]" : "text-gray-700 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
}

function ClampedBody({ html, showMoreLabel }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <div
        className={expanded ? "" : "line-clamp-3"}
        style={{ fontSize: "15.5px", lineHeight: 1.55, color: "#1C1C21" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-0.5 text-sm font-semibold text-[#FF6154] hover:underline"
        >
          {showMoreLabel}
        </button>
      )}
    </div>
  );
}

function ReplyElbow({ children, isLast }) {
  return (
    <div className="relative">
      <span className="absolute -left-5 top-0 h-5 w-5 rounded-bl-2xl border-b border-l border-gray-200" />
      {!isLast && <span className="absolute -left-5 top-5 bottom-0 w-px bg-gray-200" />}
      {children}
    </div>
  );
}

function Thread({ comment, onUpvote, onReply, labels, isNested = false }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [childrenOpen, setChildrenOpen] = useState(true);
  const hasReplies = comment.replies.length > 0;

  const submitReply = (html) => {
    onReply(comment.id, {
      id: `${comment.id}-${Date.now()}`,
      author: "Kamu",
      verified: false,
      productBadge: null,
      isMaker: false,
      avatarColor: "bg-rose-500",
      body: html,
      createdAt: Date.now(),
      votes: 0,
      upvoted: false,
      replies: [],
    });
    setShowReplyBox(false);
    setChildrenOpen(true);
  };

  return (
    <div>
      <div className="relative flex gap-3">
        {hasReplies && childrenOpen && (
          <span className="absolute left-5 top-10 bottom-0 w-px bg-gray-200" />
        )}
        <Avatar name={comment.author} colorClass={comment.avatarColor} size={40} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[15px] font-bold text-gray-900">{comment.author}</span>
            {comment.verified && <IconCheckVerified />}
            {comment.productBadge && (
              <span className="flex items-center gap-1 text-[15px] font-medium text-gray-600">
                <span className="text-sm">📦</span>
                {comment.productBadge}
              </span>
            )}
            {comment.isMaker && (
              <span className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white">
                <IconBox />
                {labels.maker}
              </span>
            )}
          </div>

          <div className="mt-1.5">
            <ClampedBody html={comment.body} showMoreLabel={labels.showMore} />
          </div>

          <div className="relative mt-2.5 flex items-center gap-5">
            {hasReplies && (
              <button
                type="button"
                aria-label={childrenOpen ? labels.hideReplies : labels.showReplies}
                onClick={() => setChildrenOpen((o) => !o)}
                className="absolute -left-[42px] flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-700"
              >
                <IconMinus />
              </button>
            )}

            <ActionButton onClick={() => onUpvote(comment.id)} active={comment.upvoted}>
              <IconUpvote /> {labels.upvote} {comment.votes > 0 && `(${comment.votes})`}
            </ActionButton>
            <ActionButton onClick={() => setShowReplyBox((s) => !s)}>
              <IconFlag /> {labels.report}
            </ActionButton>
            <ActionButton>
              <IconShare /> {labels.share}
            </ActionButton>
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500">
              <IconClock /> {labels.timeAgo(Date.now() - comment.createdAt)}
            </span>
            <button type="button" className="text-gray-400 hover:text-gray-600">
              <IconDots />
            </button>
          </div>

          {showReplyBox && (
            <div className="mt-3">
              <RichComposer
                onSubmit={submitReply}
                placeholder={labels.replyPlaceholder(comment.author)}
                submitLabel={labels.reply}
                compact
              />
            </div>
          )}
        </div>
      </div>

      {hasReplies && childrenOpen && (
        <div className={isNested ? "mt-2 flex flex-col gap-6" : "mt-2 flex flex-col gap-6 pl-10"}>
          {comment.replies.map((r, i) => (
            <ReplyElbow key={r.id} isLast={i === comment.replies.length - 1}>
              <Thread comment={r} onUpvote={onUpvote} onReply={onReply} labels={labels} isNested />
            </ReplyElbow>
          ))}
        </div>
      )}
    </div>
  );
}

function RichComposer({ onSubmit, placeholder, submitLabel = "Kirim komentar", compact = false }) {
  const editableRef = useRef(null);
  const [empty, setEmpty] = useState(true);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState({ bold: false, italic: false, underline: false });

  const refreshActive = useCallback(() => {
    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
  }, []);

  const exec = (cmd) => {
    editableRef.current?.focus();
    document.execCommand(cmd);
    refreshActive();
    handleInput();
  };

  const handleInput = () => setEmpty((editableRef.current?.innerText.trim() ?? "").length === 0);

  const handleSubmit = () => {
    if ((editableRef.current?.innerText.trim() ?? "").length === 0) return;
    onSubmit(sanitizeBasicHtml(editableRef.current.innerHTML));
    editableRef.current.innerHTML = "";
    setEmpty(true);
  };

  return (
    <div
      className={`flex-1 rounded-2xl border bg-white transition ${
        focused ? "border-gray-300 shadow-[0_0_0_3px_rgba(255,97,84,0.1)]" : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-0.5 border-b border-gray-100 px-2 py-1.5">
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} className={`h-7 w-7 rounded-md text-sm ${active.bold ? "bg-gray-200" : "text-gray-500 hover:bg-gray-100"}`}>
          <strong>B</strong>
        </button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} className={`h-7 w-7 rounded-md text-sm ${active.italic ? "bg-gray-200" : "text-gray-500 hover:bg-gray-100"}`}>
          <em>I</em>
        </button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} className={`h-7 w-7 rounded-md text-sm ${active.underline ? "bg-gray-200" : "text-gray-500 hover:bg-gray-100"}`}>
          <span className="underline">U</span>
        </button>
      </div>
      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onSelect={refreshActive}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        data-placeholder={placeholder}
        className={`empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] px-3.5 pt-2.5 pb-1 text-sm leading-relaxed text-[#1C1C21] outline-none ${compact ? "min-h-[32px]" : "min-h-[48px]"}`}
      />
      <div className="flex justify-end px-3 pb-2.5">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={empty}
          className="rounded-full bg-[#FF6154] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#e6543b] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

export default function DisqusClone(props) {
  const { labels: labelsProp, initialComments: seedComments } = props || {};
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [comments, setComments] = useState(seedComments ?? initialComments);

  const handleUpvote = (id) => setComments((prev) => toggleUpvote(prev, id));
  const handleReply = (parentId, reply) => setComments((prev) => addReply(prev, parentId, reply));
  const handleNewComment = (html) =>
    setComments((prev) => [
      {
        id: `c-${Date.now()}`,
        author: "Kamu",
        verified: false,
        productBadge: null,
        isMaker: false,
        avatarColor: "bg-rose-500",
        body: html,
        createdAt: Date.now(),
        votes: 0,
        upvoted: false,
        replies: [],
      },
      ...prev,
    ]);

  return (
    <section className="mx-auto max-w-2xl bg-white p-6">
      <h2 className="mb-5 text-lg font-bold text-[#1C1C21]">{labels.countTitle(countAll(comments))}</h2>

      <div className="mb-8 flex gap-3">
        <Avatar name="Kamu" colorClass="bg-rose-500" />
        <RichComposer onSubmit={handleNewComment} placeholder={labels.composerPlaceholder} submitLabel={labels.send} />
      </div>

      <div className="flex flex-col gap-9">
        {comments.map((c) => (
          <Thread key={c.id} comment={c} onUpvote={handleUpvote} onReply={handleReply} labels={labels} />
        ))}
      </div>
    </section>
  );
}