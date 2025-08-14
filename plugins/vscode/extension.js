/**
 * @fileoverview RavenJS VS Code Extension
 * Provides syntax highlighting and IntelliSense for RavenJS tagged template literals
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

const vscode = require("vscode");

/**
 * Activate the RavenJS extension
 * @param {vscode.ExtensionContext} context - The extension context
 */
function activate(context) {
	console.log("RavenJS extension is now active!");

	// Register completion provider for RavenJS tagged templates
	const completionProvider = vscode.languages.registerCompletionItemProvider(
		["javascript", "typescript"],
		{
			// provideCompletionItems(document, position) {
			provideCompletionItems() {
				const completionItems = [];

				// RavenJS template function completions
				const templateFunctions = [
					{
						name: "html",
						detail: "RavenJS HTML template",
						documentation: "Create an HTML template with proper escaping",
					},
					{
						name: "safeHtml",
						detail: "RavenJS Safe HTML template",
						documentation:
							"Create an HTML template without escaping (use with caution)",
					},
					{
						name: "css",
						detail: "RavenJS CSS template",
						documentation: "Create a CSS template",
					},
					{
						name: "style",
						detail: "RavenJS Style template",
						documentation: "Create a style template (alias for css)",
					},
					{
						name: "md",
						detail: "RavenJS Markdown template",
						documentation: "Create a Markdown template",
					},
					{
						name: "js",
						detail: "RavenJS JavaScript template",
						documentation: "Create a JavaScript template",
					},
					{
						name: "script",
						detail: "RavenJS Script template",
						documentation: "Create a script template (alias for js)",
					},
					{
						name: "scriptDefer",
						detail: "RavenJS Deferred Script template",
						documentation: "Create a deferred script template",
					},
					{
						name: "scriptAsync",
						detail: "RavenJS Async Script template",
						documentation: "Create an async script template",
					},
					{
						name: "sql",
						detail: "RavenJS SQL template",
						documentation: "Create a SQL template",
					},
				];

				templateFunctions.forEach((func) => {
					const item = new vscode.CompletionItem(
						func.name,
						vscode.CompletionItemKind.Function,
					);
					item.detail = func.detail;
					item.documentation = new vscode.MarkdownString(func.documentation);
					item.insertText = new vscode.SnippetString(
						`${func.name}\`\n\t$1\n\``,
					);
					completionItems.push(item);
				});

				return completionItems;
			},
		},
		"`", // Trigger on backtick
	);

	context.subscriptions.push(completionProvider);

	// Register hover provider for RavenJS tagged templates
	const hoverProvider = vscode.languages.registerHoverProvider(
		["javascript", "typescript"],
		{
			provideHover(document, position) {
				const range = document.getWordRangeAtPosition(position);
				if (!range) return null;

				const word = document.getText(range);
				const line = document.lineAt(position.line).text;

				// Check if this is a RavenJS template function
				const templateFunctions = {
					html: "RavenJS HTML template - Creates HTML with proper escaping",
					safeHtml:
						"RavenJS Safe HTML template - Creates HTML without escaping (use with caution)",
					css: "RavenJS CSS template - Creates CSS styles",
					style: "RavenJS Style template - Alias for CSS template",
					md: "RavenJS Markdown template - Creates Markdown content",
					js: "RavenJS JavaScript template - Creates JavaScript code",
					script: "RavenJS Script template - Alias for JavaScript template",
					scriptDefer:
						"RavenJS Deferred Script template - Creates deferred JavaScript",
					scriptAsync:
						"RavenJS Async Script template - Creates async JavaScript",
					sql: "RavenJS SQL template - Creates SQL queries",
				};

				if (templateFunctions[word] && line.includes(`${word}\``)) {
					return new vscode.Hover(
						new vscode.MarkdownString(
							`**${word}**\n\n${templateFunctions[word]}`,
						),
					);
				}

				return null;
			},
		},
	);

	context.subscriptions.push(hoverProvider);
}

/**
 * Deactivate the extension
 */
function deactivate() {
	console.log("RavenJS extension is now deactivated!");
}

module.exports = {
	activate,
	deactivate,
};
