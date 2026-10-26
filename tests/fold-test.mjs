// Throwaway verification for the session-kanban Host projection fold.
import { apply as applyPlugin, inject } from '../index.js';

let definition;
const ctx = {
  sessionProjections: {
    register(candidate) {
      definition = candidate;
    },
  },
};

applyPlugin(ctx);

if (!definition) throw new Error('projection unit was not registered');
if (definition.key !== 'sessionKanban') throw new Error(`unexpected key ${definition.key}`);
if (definition.stateVersion !== 1) throw new Error(`unexpected stateVersion ${definition.stateVersion}`);
if (inject.join(',') !== 'sessionProjections') throw new Error('unexpected inject');

// Identity schema contract: the registry only calls .parse.
if (definition.stateSchema.parse(definition.init()) === undefined) throw new Error('state schema rejected state');
if (definition.wire.viewSchema.parse({ ok: 1 }).ok !== 1) throw new Error('view schema rejected view');

let state = definition.init();

const same = definition.apply(state, { type: 'request/header', time: 0, data: {} });
if (same !== state) throw new Error('uninteresting event did not preserve the state reference');

state = definition.apply(state, { type: 'turn/start', time: 10, data: { turn: 3 } });
state = definition.apply(state, {
  type: 'user/message',
  time: 11,
  data: { message: { role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '做一个会话看板插件' }] } },
});
state = definition.apply(state, {
  type: 'user/message',
  time: 12,
  data: { message: { role: 'user', source: { kind: 'system-prompt' }, content: [{ type: 'text', text: 'injected' }] } },
});
state = definition.apply(state, {
  type: 'assistant/message',
  time: 13,
  data: { message: { role: 'assistant', content: [{ type: 'text', text: '好的，先列计划。' }, { type: 'tool-call', id: 't1', name: 'todo_write', arguments: '{}' }] } },
});
state = definition.apply(state, {
  type: 'todo/write',
  time: 14,
  data: { todos: [
    { content: '调研插件 API', status: 'completed' },
    { content: '实现看板面板', status: 'in_progress' },
    { content: '安装与验证', status: 'pending' },
  ] },
});

let view = definition.wire.view(state);
if (view.request !== '做一个会话看板插件') throw new Error(`request preview wrong: ${view.request}`);
if (view.reply !== '好的，先列计划。') throw new Error(`reply preview wrong: ${view.reply}`);
if (view.turn !== 3) throw new Error(`turn wrong: ${view.turn}`);
if (view.total !== 3 || view.done !== 1 || view.inProgress !== 1) throw new Error(`counts wrong: ${JSON.stringify(view)}`);
if (view.todos.length !== 3 || view.todos[1].status !== 'in_progress') throw new Error('todo list wrong');

// A new turn clears the previous turn's todo list, matching the shipped todos projection.
state = definition.apply(state, { type: 'turn/start', time: 20, data: { turn: 4 } });
view = definition.wire.view(state);
if (view.total !== 0 || view.todos.length !== 0) throw new Error('turn/start did not clear todos');
if (view.request !== '做一个会话看板插件') throw new Error('turn/start lost the latest request');

state = definition.apply(state, { type: 'turn/end', time: 21, data: { turn: 4, reason: { kind: 'completed' } } });
view = definition.wire.view(state);
if (view.endKind !== 'completed') throw new Error(`endKind wrong: ${view.endKind}`);

console.log('projection fold OK:', JSON.stringify(view));
