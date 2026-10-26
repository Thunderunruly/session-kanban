/**
 * Host half of the session-kanban bundle.
 *
 * Registers one client-visible session projection unit (`sessionKanban`) that folds the
 * committed event log into the compact "current work" facts the board renders:
 * the latest human request, the latest assistant reply, the current turn, the last
 * turn outcome, and the current todo list with its counts. The already-mounted
 * `@deepseek-ai/dsh-api-session-controller` forwards this key to the browser through
 * session list hints, the live control stream, and exact projection reads, so no
 * remote endpoint, web route, or build step is needed.
 *
 * The projection registry only calls `.parse` on the declared schemas; plain
 * identity parsers keep this package dependency-free.
 */
export const inject = ['sessionProjections'];

const MAX_TEXT = 240;
const MAX_TODO_CONTENT = 200;
const MAX_TODOS = 24;
const STATE_VERSION = 1;

const identitySchema = { parse: (value) => value };

/** Collapse whitespace and cap one preview string. */
function clip(value, max) {
  const text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Join the text blocks of one message's content. */
function messageText(message) {
  if (!message || !Array.isArray(message.content)) return '';
  const parts = [];
  for (const block of message.content) {
    if (block && block.type === 'text' && typeof block.text === 'string') parts.push(block.text);
  }
  return parts.join(' ');
}

/** Normalize one todo array; the log's todo/write event already holds the complete list. */
function normalizeTodos(raw) {
  const source = Array.isArray(raw) ? raw : [];
  const todos = [];
  let done = 0;
  let inProgress = 0;
  for (const item of source.slice(0, MAX_TODOS)) {
    if (!item) continue;
    const content = clip(item.content, MAX_TODO_CONTENT);
    if (!content) continue;
    const status = item.status === 'completed'
      ? 'completed'
      : item.status === 'in_progress' ? 'in_progress' : 'pending';
    if (status === 'completed') done += 1;
    if (status === 'in_progress') inProgress += 1;
    todos.push({ content, status });
  }
  return { todos, done, inProgress, total: source.length };
}

/** Initial fold state for one Session. */
function createState() {
  return {
    request: '',
    reply: '',
    at: 0,
    turn: 0,
    endKind: '',
    todos: [],
    done: 0,
    inProgress: 0,
    total: 0,
  };
}

/**
 * Fold one committed Session event. Uninteresting events return the same state
 * reference, which lets the registry skip view work and publication.
 */
function foldState(state, event) {
  switch (event.type) {
    case 'user/message': {
      const message = event.data && event.data.message;
      if (!message || !message.source || message.source.kind !== 'user') return state;
      const text = messageText(message);
      if (!text) return state;
      return { ...state, request: clip(text, MAX_TEXT), at: event.time };
    }
    case 'assistant/message': {
      const message = event.data && event.data.message;
      const text = message ? messageText(message) : '';
      if (!text) return state;
      return { ...state, reply: clip(text, MAX_TEXT), at: event.time };
    }
    case 'turn/start': {
      const turn = Number(event.data && event.data.turn);
      return {
        ...state,
        turn: Number.isFinite(turn) ? turn : state.turn,
        endKind: '',
        todos: [],
        done: 0,
        inProgress: 0,
        total: 0,
        at: event.time,
      };
    }
    case 'turn/end': {
      const reason = event.data && event.data.reason;
      const kind = reason && typeof reason.kind === 'string' ? reason.kind : '';
      return { ...state, endKind: kind, at: event.time };
    }
    case 'todo/write': {
      const normalized = normalizeTodos(event.data && event.data.todos);
      return {
        ...state,
        todos: normalized.todos,
        done: normalized.done,
        inProgress: normalized.inProgress,
        total: normalized.total,
        at: event.time,
      };
    }
    default:
      return state;
  }
}

/**
 * Register the client-visible projection unit on the mounting fiber.
 * @param ctx - registrant context carrying the session-projection registry.
 */
export function apply(ctx) {
  ctx.sessionProjections.register({
    key: 'sessionKanban',
    stateVersion: STATE_VERSION,
    stateSchema: identitySchema,
    init: () => createState(),
    apply: foldState,
    wire: {
      viewSchema: identitySchema,
      view: (state) => state,
    },
  });
}
