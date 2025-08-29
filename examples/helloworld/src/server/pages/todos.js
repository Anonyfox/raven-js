import { html, style } from "@raven-js/beak";
import { Todos } from "../../shared/todos.js";

// Minimal todos battleground - pure framework competence test
export const TodosPage = async () => {
	console.log(process.env.PUBLIC_ORIGIN);

	const todos = await Todos();

	return html`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todos Battleground - RavenJS Example</title>
    ${styles}
  </head>
  <body>
    <div id="todos-app">
      ${todos}
    </div>

    <!-- Load the todos app using reflex -->
    <script type="module" src="/client/todos.js"></script>
  </body>
  </html>
`;
};

const styles = style`
* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  max-width: 600px;
  width: 100%;
  margin: 2rem;
}

h1 {
  color: #2d3748;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
  text-align: center;
}

.subtitle {
  color: #4a5568;
  font-size: 1rem;
  margin-bottom: 2rem;
  text-align: center;
  font-style: italic;
}

.add-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.add-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.add-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s ease;
  white-space: nowrap;
}

.add-btn:hover {
  transform: translateY(-1px);
}

.add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.todos-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  margin-bottom: 0.5rem;
  background: #f7fafc;
  border-radius: 0.5rem;
  border-left: 4px solid #667eea;
  transition: all 0.2s ease;
}

.todo-item:hover {
  background: #edf2f7;
  transform: translateX(2px);
}

.todo-item.completed {
  opacity: 0.7;
  border-left-color: #48bb78;
}

.todo-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  accent-color: #48bb78;
}

.todo-text {
  flex: 1;
  font-size: 1rem;
  color: #2d3748;
  transition: all 0.2s ease;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #718096;
}

.todo-delete {
  background: #e53e3e;
  color: white;
  border: none;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.todo-delete:hover {
  background: #c53030;
  transform: scale(1.1);
}

.stats {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
  text-align: center;
  color: #718096;
  font-size: 0.9rem;
}

.back-link {
  display: inline-block;
  margin-top: 1rem;
  color: #718096;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #667eea;
}

.empty-state {
  text-align: center;
  color: #718096;
  font-style: italic;
  padding: 2rem;
  display: none;
}

.empty-state.show {
  display: block;
}
`;
