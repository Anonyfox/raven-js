/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { highlightShell } from "./shell.js";

describe("Shell/Bash Syntax Highlighter", () => {
	describe("Input Validation", () => {
		it("should throw TypeError for non-string input", () => {
			assert.throws(() => highlightShell(null), TypeError);
			assert.throws(() => highlightShell(undefined), TypeError);
			assert.throws(() => highlightShell(123), TypeError);
			assert.throws(() => highlightShell({}), TypeError);
		});

		it("should return empty string for empty input", () => {
			assert.strictEqual(highlightShell(""), "");
			assert.strictEqual(highlightShell("   "), "");
			assert.strictEqual(highlightShell("\n\t"), "");
		});
	});

	describe("Keywords and Control Structures", () => {
		it("should highlight if/then/else/fi statements", () => {
			const shell =
				"if [ $? -eq 0 ]; then echo 'success'; else echo 'failed'; fi";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-primary">if</span>'));
			assert.ok(result.includes('<span class="text-primary">then</span>'));
			assert.ok(result.includes('<span class="text-primary">else</span>'));
			assert.ok(result.includes('<span class="text-primary">fi</span>'));
		});

		it("should highlight for loops", () => {
			const shell = "for file in *.txt; do echo $file; done";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-primary">for</span>'));
			assert.ok(result.includes('<span class="text-primary">in</span>'));
			assert.ok(result.includes('<span class="text-primary">do</span>'));
			assert.ok(result.includes('<span class="text-primary">done</span>'));
		});

		it("should highlight while loops", () => {
			const shell = "while read line; do echo $line; done < file.txt";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-primary">while</span>'));
			assert.ok(result.includes('<span class="text-primary">do</span>'));
			assert.ok(result.includes('<span class="text-primary">done</span>'));
		});

		it("should highlight case statements", () => {
			const shell =
				"case $option in start) echo 'starting';; stop) echo 'stopping';; esac";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-primary">case</span>'));
			assert.ok(result.includes('<span class="text-primary">in</span>'));
			assert.ok(result.includes('<span class="text-primary">esac</span>'));
		});

		it("should highlight function definitions", () => {
			const shell = "function my_func() { echo 'hello'; return 0; }";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-primary">function</span>'));
			assert.ok(result.includes('<span class="text-primary">return</span>'));
		});

		it("should highlight variable declarations", () => {
			const shell =
				"declare -r readonly_var=10; local temp_var='test'; export PATH=$PATH:/usr/bin";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-primary">declare</span>'));
			assert.ok(result.includes('<span class="text-primary">local</span>'));
			assert.ok(result.includes('<span class="text-primary">export</span>'));
		});
	});

	describe("Built-in Commands", () => {
		it("should highlight core built-ins", () => {
			const shell =
				"echo 'hello'; cd /home; pwd; read input; printf '%s\\n' $input";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-info">echo</span>'));
			assert.ok(result.includes('<span class="text-info">cd</span>'));
			assert.ok(result.includes('<span class="text-info">pwd</span>'));
			assert.ok(result.includes('<span class="text-info">read</span>'));
			assert.ok(result.includes('<span class="text-info">printf</span>'));
		});

		it("should highlight file operations", () => {
			const shell =
				"ls -la; cp file1 file2; mv old new; rm temp; mkdir dir; touch file";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-info">ls</span>'));
			assert.ok(result.includes('<span class="text-info">cp</span>'));
			assert.ok(result.includes('<span class="text-info">mv</span>'));
			assert.ok(result.includes('<span class="text-info">rm</span>'));
			assert.ok(result.includes('<span class="text-info">mkdir</span>'));
			assert.ok(result.includes('<span class="text-info">touch</span>'));
		});

		it("should highlight text processing commands", () => {
			const shell = "cat file.txt | grep pattern | sort | uniq | wc -l";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-info">cat</span>'));
			assert.ok(result.includes('<span class="text-info">grep</span>'));
			assert.ok(result.includes('<span class="text-info">sort</span>'));
			assert.ok(result.includes('<span class="text-info">uniq</span>'));
			assert.ok(result.includes('<span class="text-info">wc</span>'));
		});

		it("should highlight process management commands", () => {
			const shell = "ps aux | grep process; kill -9 1234; sleep 5; wait";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-info">ps</span>'));
			assert.ok(result.includes('<span class="text-info">kill</span>'));
			assert.ok(result.includes('<span class="text-info">sleep</span>'));
			assert.ok(result.includes('<span class="text-info">wait</span>'));
		});

		it("should highlight network and archive commands", () => {
			const shell =
				"curl -O http://example.com/file.tar.gz; tar -xzf file.tar.gz; ssh user@host 'ls'";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-info">curl</span>'));
			assert.ok(result.includes('<span class="text-info">tar</span>'));
			assert.ok(result.includes('<span class="text-info">ssh</span>'));
		});
	});

	describe("Variable Expansions", () => {
		it("should highlight simple variable references", () => {
			const shell = "echo $HOME $USER $PATH";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-warning">$HOME</span>'));
			assert.ok(result.includes('<span class="text-warning">$USER</span>'));
			assert.ok(result.includes('<span class="text-warning">$PATH</span>'));
		});

		it("should highlight braced variable expansions", () => {
			const shell = "echo ${HOME}/bin ${USER:-default} ${#PATH}";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-warning">${HOME}</span>'));
			assert.ok(
				result.includes('<span class="text-warning">${USER:-default}</span>'),
			);
			assert.ok(result.includes('<span class="text-warning">${#PATH}</span>'));
		});

		it("should highlight command substitution", () => {
			const shell = "current_date=$(date); files=`ls -1`; echo $current_date";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-warning">$(date)</span>'));
			assert.ok(result.includes('<span class="text-success">`ls -1`</span>'));
		});

		it("should highlight positional parameters", () => {
			const shell = "echo $0 $1 $2 $@ $* $# $?";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-warning">$0</span>'));
			assert.ok(result.includes('<span class="text-warning">$1</span>'));
			assert.ok(result.includes('<span class="text-warning">$2</span>'));
			assert.ok(result.includes('<span class="text-warning">$@</span>'));
			assert.ok(result.includes('<span class="text-warning">$*</span>'));
			assert.ok(result.includes('<span class="text-warning">$#</span>'));
			assert.ok(result.includes('<span class="text-warning">$?</span>'));
		});

		it("should highlight special variables", () => {
			const shell = "echo $$ $! $- $_";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-warning">$$</span>'));
			assert.ok(result.includes('<span class="text-warning">$!</span>'));
			assert.ok(result.includes('<span class="text-warning">$-</span>'));
		});
	});

	describe("String Literals", () => {
		it("should highlight single-quoted strings (literal)", () => {
			const shell = "echo 'Hello World'; msg='This is a test'";
			const result = highlightShell(shell);
			assert.ok(
				result.includes(
					'<span class="text-success">&#39;Hello World&#39;</span>',
				),
			);
			assert.ok(
				result.includes(
					'<span class="text-success">&#39;This is a test&#39;</span>',
				),
			);
		});

		it("should highlight double-quoted strings (interpolated)", () => {
			const shell = 'echo "Hello $USER"; msg="Current directory: $(pwd)"';
			const result = highlightShell(shell);
			// Variables inside double quotes should be highlighted as variables
			assert.ok(result.includes('<span class="text-warning">$USER</span>'));
			assert.ok(result.includes('<span class="text-warning">$(pwd)</span>'));
			// Check for string parts
			assert.ok(result.includes('<span class="text-success">&quot;</span>'));
			assert.ok(result.includes('<span class="text-success">Hello </span>'));
		});

		it("should highlight backtick command substitution", () => {
			const shell = "files=`find . -name '*.txt'`; echo `date`";
			const result = highlightShell(shell);
			assert.ok(
				result.includes(
					'<span class="text-success">`find . -name &#39;*.txt&#39;`</span>',
				),
			);
			assert.ok(result.includes('<span class="text-success">`date`</span>'));
		});

		it("should handle escaped characters in strings", () => {
			const shell = 'echo "He said \\"Hello\\""; echo \'Single\\\'s quote\'';
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-success">'));
		});

		it("should handle strings with special characters", () => {
			const shell =
				"echo 'Path: /usr/bin:/bin'; echo \"Email: user@domain.com\"";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-success">'));
		});
	});

	describe("Numbers", () => {
		it("should highlight numeric literals", () => {
			const shell = "exit 0; sleep 5; kill -9 1234; chmod 755 script.sh";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-warning">0</span>'));
			assert.ok(result.includes('<span class="text-warning">5</span>'));
			assert.ok(result.includes('<span class="text-warning">9</span>'));
			assert.ok(result.includes('<span class="text-warning">1234</span>'));
			assert.ok(result.includes('<span class="text-warning">755</span>'));
		});

		it("should handle numbers in different contexts", () => {
			const shell = "for i in {1..10}; do echo $i; done";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-warning">1</span>'));
			assert.ok(result.includes('<span class="text-warning">10</span>'));
		});
	});

	describe("Comments", () => {
		it("should highlight single-line comments", () => {
			const shell = "# This is a comment\necho 'hello' # End of line comment";
			const result = highlightShell(shell);
			assert.ok(
				result.includes('<span class="text-muted"># This is a comment</span>'),
			);
			assert.ok(
				result.includes(
					'<span class="text-muted"># End of line comment</span>',
				),
			);
		});

		it("should not highlight shell code inside comments", () => {
			const shell =
				"# echo 'this should not be highlighted'\necho 'this should be'";
			const result = highlightShell(shell);
			const commentSpan = result.match(
				/<span class="text-muted">[^<]*<\/span>/,
			);
			assert.ok(commentSpan);
			assert.ok(
				!commentSpan[0].includes('<span class="text-info">echo</span>'),
			);
		});

		it("should handle comments with special characters", () => {
			const shell = "# TODO: Fix the $PATH variable handling & pipe operations";
			const result = highlightShell(shell);
			assert.ok(
				result.includes(
					'<span class="text-muted"># TODO: Fix the $PATH variable handling &amp; pipe operations</span>',
				),
			);
		});
	});

	describe("Operators and Redirections", () => {
		it("should highlight pipe operators", () => {
			const shell = "cat file.txt | grep pattern | sort | head -10";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-secondary">|</span>'));
		});

		it("should highlight redirection operators", () => {
			const shell =
				"echo 'hello' > output.txt; cat < input.txt >> log.txt; command 2> error.log";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-secondary">&gt;</span>'));
			assert.ok(result.includes('<span class="text-secondary">&lt;</span>'));
			assert.ok(
				result.includes('<span class="text-secondary">&gt;&gt;</span>'),
			);
			assert.ok(result.includes('<span class="text-secondary">2&gt;</span>'));
		});

		it("should highlight logical operators", () => {
			const shell = "command1 && command2 || command3; background_job &";
			const result = highlightShell(shell);
			assert.ok(
				result.includes('<span class="text-secondary">&amp;&amp;</span>'),
			);
			assert.ok(result.includes('<span class="text-secondary">||</span>'));
			assert.ok(result.includes('<span class="text-secondary">;</span>'));
			assert.ok(result.includes('<span class="text-secondary">&amp;</span>'));
		});

		it("should highlight complex redirections", () => {
			const shell =
				"command 2>&1 | tee output.log; exec 3< input.txt; echo 'test' >&3";
			const result = highlightShell(shell);
			assert.ok(
				result.includes('<span class="text-secondary">2&gt;&amp;1</span>'),
			);
			assert.ok(
				result.includes('<span class="text-secondary">&gt;&amp;3</span>'),
			);
		});

		it("should highlight test operators", () => {
			const shell =
				"[ $? -eq 0 ] && echo 'success'; [[ -f file.txt ]] || touch file.txt";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-secondary">[</span>'));
			assert.ok(result.includes('<span class="text-secondary">]</span>'));
		});
	});

	describe("Complex Shell Examples", () => {
		it("should handle complete shell script", () => {
			const shell = `#!/bin/bash
				# Backup script
				set -e

				BACKUP_DIR="/backup"
				SOURCE="/home/user"
				DATE=$(date +%Y%m%d)

				if [ ! -d "$BACKUP_DIR" ]; then
					mkdir -p "$BACKUP_DIR"
				fi

				tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" "$SOURCE"
				echo "Backup completed: backup_$DATE.tar.gz"`;
			const result = highlightShell(shell);

			// Keywords
			assert.ok(result.includes('<span class="text-primary">if</span>'));
			assert.ok(result.includes('<span class="text-primary">then</span>'));
			assert.ok(result.includes('<span class="text-primary">fi</span>'));
			assert.ok(result.includes('<span class="text-primary">set</span>'));

			// Built-ins
			assert.ok(result.includes('<span class="text-info">mkdir</span>'));
			assert.ok(result.includes('<span class="text-info">tar</span>'));
			assert.ok(result.includes('<span class="text-info">echo</span>'));

			// Variables
			assert.ok(
				result.includes('<span class="text-warning">$BACKUP_DIR</span>'),
			);
			assert.ok(
				result.includes('<span class="text-warning">$(date +%Y%m%d)</span>'),
			);

			// Strings - check for quote parts since string content is now tokenized
			assert.ok(result.includes('<span class="text-success">&quot;</span>'));
			assert.ok(result.includes('<span class="text-success">/backup</span>'));

			// Comments
			assert.ok(
				result.includes('<span class="text-muted"># Backup script</span>'),
			);
		});

		it("should handle function definitions with local variables", () => {
			const shell = `function process_files() {
				local dir="$1"
				local pattern="$2"

				for file in "$dir"/$pattern; do
					if [ -f "$file" ]; then
						echo "Processing: $file"
						wc -l "$file"
					fi
				done

				return $?
			}`;
			const result = highlightShell(shell);

			assert.ok(result.includes('<span class="text-primary">function</span>'));
			assert.ok(result.includes('<span class="text-primary">local</span>'));
			assert.ok(result.includes('<span class="text-primary">for</span>'));
			assert.ok(result.includes('<span class="text-primary">if</span>'));
			assert.ok(result.includes('<span class="text-primary">return</span>'));
			assert.ok(result.includes('<span class="text-info">wc</span>'));
		});

		it("should handle case statements with multiple patterns", () => {
			const shell = `case "$1" in
				start|run)
					echo "Starting service..."
					systemctl start myservice
					;;
				stop|halt)
					echo "Stopping service..."
					systemctl stop myservice
					;;
				restart)
					$0 stop
					sleep 2
					$0 start
					;;
				*)
					echo "Usage: $0 {start|stop|restart}"
					exit 1
					;;
			esac`;
			const result = highlightShell(shell);

			assert.ok(result.includes('<span class="text-primary">case</span>'));
			assert.ok(result.includes('<span class="text-primary">in</span>'));
			assert.ok(result.includes('<span class="text-primary">esac</span>'));
			assert.ok(result.includes('<span class="text-info">echo</span>'));
			assert.ok(result.includes('<span class="text-info">sleep</span>'));
		});

		it("should handle complex pipelines with process substitution", () => {
			const shell = `diff <(sort file1.txt) <(sort file2.txt) |
				tee differences.log |
				grep '^>' |
				wc -l > unique_count.txt`;
			const result = highlightShell(shell);

			assert.ok(result.includes('<span class="text-info">diff</span>'));
			assert.ok(result.includes('<span class="text-info">sort</span>'));
			assert.ok(result.includes('<span class="text-info">tee</span>'));
			assert.ok(result.includes('<span class="text-info">grep</span>'));
			assert.ok(result.includes('<span class="text-info">wc</span>'));
			assert.ok(result.includes('<span class="text-secondary">|</span>'));
		});

		it("should handle array operations and parameter expansion", () => {
			const shell =
				"files=(*.txt *.log)\n" +
				'echo "Found ${' +
				'#files[@]} files"\n' +
				"\n" +
				'for file in "${files[@]}"; do\n' +
				'	basename="${file%.*}"\n' +
				'	extension="${file##*.}"\n' +
				'	echo "File: $basename, Ext: $extension"\n' +
				"done";
			const result = highlightShell(shell);

			assert.ok(result.includes('<span class="text-primary">for</span>'));
			assert.ok(result.includes('<span class="text-primary">in</span>'));
			assert.ok(result.includes('<span class="text-primary">do</span>'));
			assert.ok(result.includes('<span class="text-primary">done</span>'));
			assert.ok(
				result.includes('<span class="text-warning">${' + "#files[@]}</span>"),
			);
			// Variable inside double quotes should be highlighted as variable, not as single token
			assert.ok(
				result.includes('<span class="text-warning">${files[@]}</span>'),
			);
		});
	});

	describe("Edge Cases", () => {
		it("should handle malformed shell code gracefully", () => {
			const shell = "if [ then; do done; case esac";
			const result = highlightShell(shell);
			assert.ok(typeof result === "string");
			assert.ok(result.length > 0);
		});

		it("should preserve whitespace", () => {
			const shell = "  echo   'hello'   &&   ls  ";
			const result = highlightShell(shell);
			// Should maintain spacing structure
			assert.ok(result.startsWith("  "));
			assert.ok(result.endsWith("  "));
		});

		it("should handle nested quotes", () => {
			const shell = `echo 'He said "Hello World"'; echo "She's here"`;
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-success">'));
		});

		it("should handle shebang lines", () => {
			const shell = "#!/bin/bash\n#!/usr/bin/env python3\necho 'test'";
			const result = highlightShell(shell);
			// Shebang should be treated as a command at start
			assert.ok(result.includes("#!/bin/bash"));
		});

		it("should handle here documents", () => {
			const shell = `cat << EOF
This is a here document
with multiple lines
EOF`;
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-info">cat</span>'));
			assert.ok(
				result.includes('<span class="text-secondary">&lt;&lt;</span>'),
			);
		});

		it("should handle empty commands and trailing operators", () => {
			const shell = "; && || | echo 'test'";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-secondary">;</span>'));
			assert.ok(
				result.includes('<span class="text-secondary">&amp;&amp;</span>'),
			);
			assert.ok(result.includes('<span class="text-secondary">||</span>'));
			assert.ok(result.includes('<span class="text-secondary">|</span>'));
		});

		it("should handle command substitution in complex contexts", () => {
			const shell =
				"if [ $(echo $?) -eq $(command -v test > /dev/null; echo $?) ]; then echo 'match'; fi";
			const result = highlightShell(shell);
			assert.ok(
				result.includes('<span class="text-warning">$(echo $?)</span>'),
			);
			assert.ok(
				result.includes(
					'<span class="text-warning">$(command -v test &gt; /dev/null; echo $?)</span>',
				),
			);
		});

		it("should handle mixed variable expansion styles", () => {
			const shell = "echo $HOME ${USER} $(whoami) `id -u` $0 $$ $?";
			const result = highlightShell(shell);
			assert.ok(result.includes('<span class="text-warning">$HOME</span>'));
			assert.ok(result.includes('<span class="text-warning">${USER}</span>'));
			assert.ok(result.includes('<span class="text-warning">$(whoami)</span>'));
			assert.ok(result.includes('<span class="text-success">`id -u`</span>'));
			assert.ok(result.includes('<span class="text-warning">$0</span>'));
			assert.ok(result.includes('<span class="text-warning">$$</span>'));
			assert.ok(result.includes('<span class="text-warning">$?</span>'));
		});
	});
});
