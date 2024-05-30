import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "gcode-extension" is now active!');

	let disposable = vscode.commands.registerCommand('gcode-extension.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from gcode-extension!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
