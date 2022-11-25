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
	const re3 = /^(?:[\s,]*".+?")+$/;
	const found = s.match(re);
	const check = re3.test(s);
	console.log(check);
	let result: [string, string][] = [];
	if (found !== null && check) {
		for (let i of found) {
			const m = i.match(re2);
			result.push([i, m![0].slice(1, -1)]);
		}
	} else {
		return null;
	}
	return result;
}

function processConcatVar(s: string): [string, string[], number] | null {
	const re = /" \+ .+? \+ "/;
	const found = s.match(re);
	if (found === null) {
		return null;
	}
	let count = 0;
	for (const i of found) {
		s = s.replace(re, String.fromCharCode(('A'.charCodeAt(0) + count++)));
	}
	return [s.slice(1, -1), found, count];
}

function preprocessTags(s: string): [string, Array<string>, number, number] | null {
	const re = /<.*?>+/g;
	const found = s.match(re);
	let count = 0;
	if (found === null) {
		return null;
	}
	const re2 = / [A-Z]/g;
	let f = s.match(re2);
	if (f === null) {
		if (s[0] === 'A' && s[1] === ' ') {
			f = [' A'];
		}
	}
	console.log(f);
	const base = f === null ? 'A'.charCodeAt(0) : f.at(-1)?.charCodeAt(1)! + 1;
	for (const i of found) {
		s = s.replace(i, String.fromCharCode((base + count++)));
	}
	return [s, found, count, base];
}


async function rawTranslate(s: string, id: string, secret: string, src: string, t: string) {
	// Preprocess
	const [str, start, end] = trim(s);
	s = str;


	// Pick up tags
	const a = preprocessTags(s);
	if (a !== null) {
		s = a[0];
	}

	console.log(s);
	// API request
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const resp = await axios.post("https://openapi.naver.com/v1/papago/n2mt", new URLSearchParams({ source: src, target: t, text: s }), { headers: { 'Accept-Encoding': 'identity', "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret }, responseType: "json" }).catch((error) => { console.log(error); }); //https://github.com/axios/axios/issues/5298 must set 'Accept-Encoding': 'identity'
	if (resp === undefined) {
		return;
	}
	let data = resp.data["message"]["result"]["translatedText"];

	// Restore tags
	if (a !== null) {
		console.log(a);
		for (let i = 0; i < a[2]; i++) {
			data = data.replace(String.fromCharCode(a[3] + i), a[1][i]);
		}
	}

	// Restore spaces
	data = start + data + end;

	console.log(data);

	return data;
}


async function translate(s: string, id: string, secret: string, src: string, t: string) {
	const d = processJSON(s);
	if (d === null) {
		console.log("not json");
		const b = processConcatVar(s);
		if (b === null) {
			console.log("not concatvar");
			const a = processJSONString(s);
			if (a === null) {
				return await rawTranslate(s, id, secret, src, t);
			}
			console.log("not rawTranslate");
			let result: string[] = [];
			for (const i of a!) {
				let translated = await rawTranslate(i[1], id, secret, src, t);
				translated = i[0].replace(i[1], translated);
				result.push(translated);
			}
			return result.join('');
		}
		let translated = await rawTranslate(b[0], id, secret, src, t);
		for (let i = 0; i < b[2]; i++) {
			translated = translated.replace(String.fromCharCode(('A'.charCodeAt(0) + i)), b[1][i].slice(4, -4));
		}
		return translated;
	}
	else {
		let result: string[] = [];
		for (const i of d) {
			let translated = await rawTranslate(i[1], id, secret, src, t);
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
