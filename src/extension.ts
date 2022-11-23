import * as vscode from 'vscode';
import axios from 'axios';

async function translate(s: string, id: string, secret: string, src: string, t: string) {
	const re = /<.*?>+/g;
	const found = s.match(re);
	let count = 0;
	if (found !== null) {
		for (const i of found) {
			s = s.replace(i, String.fromCharCode(('A'.charCodeAt(0) + count++)));
		}
	}
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const resp = await axios.post("https://openapi.naver.com/v1/papago/n2mt", new URLSearchParams({ source: src, target: t, text: s }), { headers: { 'Accept-Encoding': 'identity', "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret }, responseType: "json" }).catch((error) => { console.log(error); }); //https://github.com/axios/axios/issues/5298 must set 'Accept-Encoding': 'identity'
	if (resp === undefined) {
		return;
	}
	let data = resp.data["message"]["result"]["translatedText"];

	for (let i = 0; i < count; i++) {
		data = data.replace(String.fromCharCode(('A'.charCodeAt(0) + i)), found![i]);
	}

	return data;
}
async function translateCommand(reverse: boolean = false) {
	const editor = vscode.window.activeTextEditor;
	const s = editor?.selection;
	if (s === undefined) {
		vscode.window.showInformationMessage("No selected text!");
		return;
	}
	const config = vscode.workspace.getConfiguration("fastko.client");
	const id = config["id"];
	const secret = config["secret"];
	const lang = vscode.workspace.getConfiguration("fastko.lang");
	const source = lang[reverse ? "target" : "source"];
	const target = lang[!reverse ? "target" : "source"];
	const text = editor?.document.getText(s);
	if (text === undefined) { return; }
	const translated = await translate(text, id, secret, source, target);
	editor?.edit(e => { e.replace(s, translated); });
}

async function translateCommandR() {
	await translateCommand(true);
}

export async function activate(context: vscode.ExtensionContext) {

	console.log('fastko');
	let cmd1 = vscode.commands.registerCommand('fastko.translate', async () => { await translateCommand(); });
	let cmd2 = vscode.commands.registerCommand('fastko.translateR', async () => { await translateCommandR(); });
	context.subscriptions.push(cmd1, cmd2);
}

export function deactivate() { }
