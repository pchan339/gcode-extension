import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left,0);
  button.text = "Gcode Check";
  button.command = "gcode-extension.check";
  button.show();

  let disposable1 = vscode.commands.registerCommand(
    "gcode-extension.editE",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        const input = await vscode.window.showInputBox({
          prompt: "Eをどうやって変更しますか？",
          value: "",
        });

        // +N, -N, Nのいずれかの形式で入力する

        if (input !== undefined) {
          editor.edit((editBuilder) => {
            editBuilder.replace(selection, replaceLogic(selectedText, input));
          });
        }
      }
    }
  );

  let disposable2 = vscode.commands.registerCommand(
    "gcode-extension.check",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const text = editor.document.getText();
        const result = checkFunc(text);
        if(result){
          vscode.window.showErrorMessage(result);
        }else{
          vscode.window.showInformationMessage("errorはありませんでした!");
        }
      }
    }
  );

  context.subscriptions.push(disposable1);
  context.subscriptions.push(disposable2);
  
}

export function deactivate() {}

type GcodeLine = {
  command: string | undefined;
  commandType: string | undefined;
  x?: number | undefined;
  y?: number | undefined;
  z?: number | undefined;
  e?: number | undefined;
  line: string;
  lineArray: string[];
  rowIndex: number;
};

function parseGcodeLines(text: string): GcodeLine[] {
  const lines = text.split("\n");
  const result: GcodeLine[] = [];
  lines.forEach((line, idx) => {
    const fields = line.trim().split(" ");
    const object: GcodeLine = {
      rowIndex: idx,
      line: line,
      lineArray: fields,
      command: fields?.[0],
      commandType: fields?.[0]?.[0],
    };

    const findValue = (key: string) => {
      const field = fields.find((f) => f[0] === key);
      if (field) {
        return parseFloat(field.slice(1));
      } else {
        return undefined;
      }
    };

    if (object.commandType === "G") {
      object.x = findValue("X");
      object.y = findValue("Y");
      object.z = findValue("Z");
      object.e = findValue("E");
    }

    result.push(object);
  });
  return result;
}

const calcInputNum = (input: string, target: number): number => {
  if (input[0] === "+" || input[0] === "-") {
    const sum = target + Number(input);
    const keta = target.toFixed(12).split(".")[1].replace(/0+$/, "").length;
    return Number(sum.toFixed(keta));
  } else {
    return Number(input);
  }
};

function replaceLogic(selectedText: string, input: string): string {
  const gcodes = parseGcodeLines(selectedText);
  let result: string[] = [];
  gcodes.forEach((gcode) => {
    if (gcode.commandType === "G") {
      gcode.e =
        gcode.e !== undefined ? calcInputNum(input, gcode.e) : undefined;
      const index = gcode.lineArray?.findIndex((f) => f[0] === "E");
      if (index !== undefined && index !== -1) {
        gcode.lineArray[index] = "E" + gcode.e;
      }
      result.push(gcode.lineArray.join(" "));
    } else {
      result.push(gcode.line);
    }
  });
  return result.join("\n");
}

function checkFunc(selectedText: string): string | false{
  const gcodes = parseGcodeLines(selectedText).filter(gcode => gcode.commandType === "G" && gcode.e !== undefined).slice(2);
  let lastE:number = 0;
  const errors:string[] = [];
  gcodes.forEach(gcode=>{
    if(gcode.e === 0) {
      return;
    };
    const sub = Math.floor(Math.abs(gcode.e as number -lastE));
    if(sub>6.5){
      errors.push(`line${gcode.rowIndex+1}: 差が${sub}です`);
    }
    lastE = gcode.e as number;
  });

  if(errors.length === 0){
    return false;
  }
  return errors.join("\n");
}