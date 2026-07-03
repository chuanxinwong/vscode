const vscode = acquireVsCodeApi();
const outputEl = document.getElementById('output');

document.getElementById('btn-send').addEventListener('click', () => {
	vscode.postMessage({ type: 'hello', text: 'Hello from MyApp!' });
	outputEl.textContent = 'Message sent!';
});

document.getElementById('btn-write-log').addEventListener('click', () => {
	vscode.postMessage({ type: 'writeLog' });
	outputEl.textContent = 'Log write requested...';
});

window.addEventListener('message', (event) => {
	const m = event.data;
	if (m.type === 'response') {
		outputEl.textContent = 'VS Code says: ' + m.text;
	} else if (m.type === 'logWritten') {
		outputEl.textContent = 'Log written: ' + m.text;
	}
});
