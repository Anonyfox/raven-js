import { html } from "@raven-js/beak/html";
import { computed, effect, signal } from "@raven-js/reflex";

export const Todos = () => {
	let todoIdCounter = 1;
	const todos = signal([]);
	const inputValue = signal("");

	const totalCount = computed(() => todos().length);
	const activeCount = computed(
		() => todos().filter((t) => !t.completed).length,
	);
	const completedCount = computed(
		() => todos().filter((t) => t.completed).length,
	);
	const isEmpty = computed(() => todos().length === 0);

	const addTodo = () => {
		const text = inputValue().trim();
		if (!text) return;
		todos.set([...todos(), { id: todoIdCounter++, text, completed: false }]);
	};

	const toggleTodo = (id) => {
		todos.set(
			todos().map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
		);
	};

	const deleteTodo = (id) => {
		todos.set(todos().filter((t) => t.id !== id));
	};

	let todosList = "";
	if (!isEmpty()) {
		todosList = html`${todos().map(
			(todo) => html`
            <li class="todo-item${todo.completed ? " completed" : ""}" data-id="${todo.id}">
                <input
                    type="checkbox"
                    class="todo-checkbox"
                    ${todo.completed ? "checked" : ""}
                    data-action="toggle"
                    data-id="${todo.id}"
                    onchange=${() => toggleTodo(todo.id)}
                />
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <button
                    class="todo-delete"
                    data-action="delete"
                    data-id="${todo.id}"
                    title="Delete todo"
                    onclick=${() => deleteTodo(todo.id)}
                >×</button>
            </li>
        `,
		)}`;
	} else {
		todosList = html`<li class="empty-placeholder" style="display: none;"></li>`;
	}

	const onSubmit = (e) => {
		e.preventDefault();
		alert(e);
		console.log(e);
		addTodo(e.target.todoInput.value);
	};

	return html`
		<div class="container">
      <h1>⚔️ Todos Battleground</h1>
      <p class="subtitle">Three operations. Zero excuses. Framework apocalypse.</p>

      <form class="add-form" id="add-form" onsubmit=${onSubmit}>
        <input
          type="text"
          class="add-input"
          id="todo-input"
          placeholder="Add a todo..."
          required
          autocomplete="off"
        />
        <button type="submit" class="add-btn">Add</button>
      </form>

      ${
				isEmpty()
					? html`<div class="empty-state show" id="empty-state">Add your first todo to begin the test...</div>`
					: html`<ul class="todos-list" id="todos-list">${todosList}</ul>`
			}

      <div class="stats" id="stats">
        <span id="total-count">${totalCount()}</span> total,
        <span id="active-count">${activeCount()}</span> active,
        <span id="completed-count">${completedCount()}</span> completed
      </div>

      <a href="/" class="back-link">← Back to Home</a>
    </div>
	`;
};
