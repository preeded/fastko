import * as vscode from 'vscode';
import axios from 'axios';

function trim(s: string) {
	let [start, end] = ['', ''];
	while (s.startsWith(' ') || s.startsWith('\t')) {
		start += s[0];
		s = s.slice(1);
	}
	while (s.endsWith(' ') || s.endsWith('\t')) {
		end = s[s.length - 1] + end;
		s = s.slice(0, -1);
	}
	return [s, start, end];
}

function processJSON(s: string) {
	const re = /\s*".+?": ".+?",?/g;
	const re2 = /: ".+"/;
	const found = s.match(re);
	let result: [string, string][] = [];
	if (found !== null) {
		for (const i of found) {
			const m = i.match(re2);
			result.push([i, m![0].slice(3, -1)]);
		}
	} else {
		return null;
	}
	return result;
}

function processJSONString(s: string): [string, string][] | null {
	const re = /[\s,]*".+?"/g;
	const re2 = /".+"/;
	const found = s.match(re);
	let result: [string, string][] = [];
	if (found !== null) {
		for (let i of found) {
			const m = i.match(re2);
			result.push([i, m![0].slice(1, -1)]);
		}
	} else {
		return null;
	}
	return result;
}

function preprocessTags(s: string): [string, Array<string> | null, number] {
	const re = /<.*?>+/g;
	const found = s.match(re);
	let count = 0;
	if (found !== null) {
		for (const i of found) {
			s = s.replace(i, String.fromCharCode(('A'.charCodeAt(0) + count++)));
		}
	}
	return [s, found, count];
}


async function rawTranslate(s: string, id: string, secret: string, src: string, t: string) {
	// Preprocess
	const [str, start, end] = trim(s);
	s = str;

	// Pick up tags
	const [str2, found, count] = preprocessTags(s);
	s = str2;

	// API request
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const resp = await axios.post("https://openapi.naver.com/v1/papago/n2mt", new URLSearchParams({ source: src, target: t, text: s }), { headers: { 'Accept-Encoding': 'identity', "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret }, responseType: "json" }).catch((error) => { console.log(error); }); //https://github.com/axios/axios/issues/5298 must set 'Accept-Encoding': 'identity'
	if (resp === undefined) {
		return;
	}
	let data = resp.data["message"]["result"]["translatedText"];

	// Restore tags
	for (let i = 0; i < count; i++) {
		data = data.replace(String.fromCharCode(('A'.charCodeAt(0) + i)), found![i]);
	}

	// Restore spaces
	data = start + data + end;

	return data;
}


async function translate(s: string, id: string, secret: string, src: string, t: string) {
	const d = processJSON(s);
	if (d === null) {
		const a = processJSONString(s);
		if (a === null) {
			return await rawTranslate(s, id, secret, src, t);
		}
		let result: string[] = [];
		for (const i of a) {
			let translated = await rawTranslate(i[1], id, secret, src, t);
			translated = i[0].replace(i[1], translated);
			result.push(translated);
		}
		return result.join('');
	}
	else {
		let result: string[] = [];
		for (const i of d) {
			let translated = await rawTranslate(i[1].slice(1, -1), id, secret, src, t);
			translated = i[0].replace(i[1], translated);
			result.push(translated);
		}
		return result.join(",\n");
	}
}
async function translateCommand(reverse: boolean = false) {
	const editor = vscode.window.activeTextEditor;
	const s = editor?.selection;
	const config = vscode.workspace.getConfiguration("fastko.client");
	const id = config["id"];
	const secret = config["secret"];
	const lang = vscode.workspace.getConfiguration("fastko.lang");
	const source = lang[reverse ? "target" : "source"];
	const target = lang[!reverse ? "target" : "source"];
	const text = !s?.isEmpty ? editor?.document.getText(s) : editor?.document.lineAt(editor.selection.active.line).text;
	if (text === undefined) { return; }
	const translated = await translate(text, id, secret, source, target);
	editor?.edit(e => { e.replace(!s?.isEmpty ? s! : editor?.document.lineAt(editor.selection.active.line).range, translated); });
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
