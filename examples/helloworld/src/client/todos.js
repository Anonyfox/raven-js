/**
 * Todos Battleground - Pure client-side reflex implementation
 * Three operations. Zero excuses. Framework apocalypse.
 */

import { computed, signal } from "@raven-js/reflex";
import { mount } from "@raven-js/reflex/dom";

// Reactive state - the murder's intelligence
let todoIdCounter = 1;
const todos = signal([]);
const inputValue = signal("");

// Computed signals - algorithmic precision over patches
const totalCount = computed(() => todos().length);
const activeCount = computed(() => todos().filter((t) => !t.completed).length);
const completedCount = computed(
	() => todos().filter((t) => t.completed).length,
);
const isEmpty = computed(() => todos().length === 0);

// Operations that expose framework incompetence
const addTodo = () => {
	const text = inputValue().trim();
	if (!text) return;

	todos.set([
		...todos(),
		{
			id: todoIdCounter++,
			text,
			completed: false,
		},
	]);

	inputValue.set(""); // Clear input and auto-focus test
};

const toggleTodo = (id) => {
	todos.set(
		todos().map((todo) =>
			todo.id === id ? { ...todo, completed: !todo.completed } : todo,
		),
	);
};

const deleteTodo = (id) => {
	todos.set(todos().filter((todo) => todo.id !== id));
};

// Surgical DOM template - zero framework theater
const TodosApp = () => {
	const todosList = todos()
		.map(
			(todo) => `
            <li class="todo-item${todo.completed ? " completed" : ""}" data-id="${todo.id}">
                <input
                    type="checkbox"
                    class="todo-checkbox"
                    ${todo.completed ? "checked" : ""}
                    data-action="toggle"
                    data-id="${todo.id}"
                />
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <button
                    class="todo-delete"
                    data-action="delete"
                    data-id="${todo.id}"
                    title="Delete todo"
                >×</button>
            </li>
        `,
		)
		.join("");

	return (
		todosList || '<li class="empty-placeholder" style="display: none;"></li>'
	);
};

// Input container template for controlled input behavior
const InputApp = () => {
	return `<input
        type="text"
        class="add-input"
        placeholder="Add a todo..."
        value="${escapeHtml(inputValue())}"
        autocomplete="off"
    />`;
};

// Stats template
const StatsApp = () => {
	return `
        <span id="total-count">${totalCount()}</span> total,
        <span id="active-count">${activeCount()}</span> active,
        <span id="completed-count">${completedCount()}</span> completed
    `;
};

// Platform-native HTML escaping - no dependency hell
function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

// Event delegation - clean, efficient, no memory leaks
function setupEventDelegation() {
	const todosList = document.getElementById("todos-list");
	const addForm = document.getElementById("add-form");
	const todoInput = document.getElementById("todo-input");
	const emptyState = document.getElementById("empty-state");

	// Handle todo list interactions
	todosList.addEventListener("click", (e) => {
		const action = e.target.dataset.action;
		const id = Number(e.target.dataset.id);

		if (action === "toggle") {
			toggleTodo(id);
		} else if (action === "delete") {
			deleteTodo(id);
		}
	});

	// Handle form submission
	addForm.addEventListener("submit", (e) => {
		e.preventDefault();
		addTodo();
		todoInput.focus(); // Focus management test
	});

	// Handle input changes for controlled input
	todoInput.addEventListener("input", (e) => {
		inputValue.set(e.target.value);
	});

	// Sync input value with signal
	computed(() => {
		if (todoInput.value !== inputValue()) {
			todoInput.value = inputValue();
		}
	});

	// Handle Enter key
	todoInput.addEventListener("keypress", (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addTodo();
		}
	});

	// Empty state visibility management
	computed(() => {
		if (isEmpty()) {
			emptyState.classList.add("show");
			todosList.style.display = "none";
		} else {
			emptyState.classList.remove("show");
			todosList.style.display = "block";
		}
	});

	// Auto-focus input on load
	todoInput.focus();
}

// Initialize the battleground
document.addEventListener("DOMContentLoaded", () => {
	// Mount reactive components
	mount(TodosApp, "#todos-list");
	mount(StatsApp, "#stats");

	// Handle input manually (avoid conflict with existing input element)
	const todoInput = document.getElementById("todo-input");

	// Setup event handling
	setupEventDelegation();

	console.log("🦅 Todos Battleground initialized");
	console.log("⚔️ Three operations. Zero excuses. Framework apocalypse.");
});
