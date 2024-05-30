import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('gcode-extension.editE', async () => {
		const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
						const selectedText = editor.document.getText(selection);

						const input = await vscode.window.showInputBox({
              prompt: "Eをどうやって変更しますか？",
              value: ""
            });

					// +N, -N, Nのいずれかの形式で入力する

						if (input !== undefined) {
                editor.edit(editBuilder => {
                    editBuilder.replace(selection, replaceLogic(selectedText, input));
                });
            }
        }
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}

type GcodeLine = {
	command: string | undefined,
	commandType: string | undefined,
	x?: number | undefined,
	y?: number | undefined,
	z?: number | undefined,
	e?: number | undefined,
	line: string,
	lineArray: string[],
};

function parseGcodeLines(text: string): GcodeLine[] {
	const lines = text.split("\n");
	const result: GcodeLine[] = [];
	lines.forEach(line => {
		const fields = line.trim().split(" ");
		const object: GcodeLine = {
			line: line,
			lineArray:fields,
			command: fields?.[0],
			commandType: fields?.[0]?.[0],
		};

		const findValue = (key: string) => {
			const field = fields.find(f => f[0] === key);
			if (field) {
				return parseFloat(field.slice(1));
			} else {
				return undefined;
			}
		}

		if (object.commandType === "G") {
			object.x = findValue("X");
			object.y = findValue("Y");
			object.z = findValue("Z");
			object.e = findValue("E");
		};

		result.push(object);
	});
	return result;
}

function replaceLogic(selectedText: string, input: string): string {
	const gcodes = parseGcodeLines(selectedText);
	let result = "";
	gcodes.forEach(gcode => {
		if (gcode.commandType === "G") {
			gcode.e = gcode.e ? gcode.e + parseFloat(input) : undefined;
			const index = gcode.lineArray?.findIndex(f => f[0] === "E");
			if (index !== undefined && index !== -1) {
				gcode.lineArray[index] = "E" + gcode.e;
			}
			result += gcode.lineArray.join(" ") + "\n";
		} else {
			result += gcode.line + "\n";
		}
	});
	return result;
}