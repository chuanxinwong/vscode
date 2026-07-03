/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Codicon } from '../../../../base/common/codicons.js';
import { VSBuffer } from '../../../../base/common/buffer.js';
import { URI } from '../../../../base/common/uri.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { CommandsRegistry } from '../../../../platform/commands/common/commands.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { ViewContainerLocation, IViewContainersRegistry, IViewsRegistry, Extensions as ViewExtensions } from '../../../common/views.js';
import { ViewPaneContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import { IWebviewWorkbenchService } from '../../webviewPanel/browser/webviewWorkbenchService.js';
import { ACTIVE_GROUP } from '../../../services/editor/common/editorService.js';
import { MyAppViewPane } from './myAppViewPane.js';
import { MyAppViewId, MyAppViewContainerId, MyAppOpenCommandId } from '../common/myApp.js';
import { localize2 } from '../../../../nls.js';

// HTML content for the editor webview
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy"
		content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline';">
	<title>MyApp</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body { font-family: var(--vscode-font-family); color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background); padding: 24px;
			line-height: 1.5; display: flex; flex-direction: column;
			align-items: center; justify-content: center; height: 100vh; gap: 12px; }
		h1 { font-size: 24px; font-weight: 600; margin-bottom: 4px; }
		p { color: var(--vscode-descriptionForeground); font-size: 14px; }
		button { padding: 8px 20px; border: none; border-radius: 2px;
			background-color: var(--vscode-button-background); color: var(--vscode-button-foreground);
			cursor: pointer; font-family: inherit; font-size: 14px; margin: 4px; }
		button:hover { background-color: var(--vscode-button-hoverBackground); }
		#output { margin-top: 12px; padding: 12px; background-color: var(--vscode-textCodeBlock-background);
			border-radius: 4px; font-size: 13px; max-width: 400px; word-break: break-all; }
	</style>
</head>
<body>
	<h1>MyApp Webview</h1>
	<p>Click a button below:</p>
	<div>
		<button id="btn-send">Send Message</button>
		<button id="btn-write-log">Write Log to D:\\log.log</button>
	</div>
	<div id="output"></div>
	<script>
		const vscode = acquireVsCodeApi();
		const outputEl = document.getElementById("output");
		document.getElementById("btn-send").addEventListener("click", () => {
			vscode.postMessage({ type: "hello", text: "Hello from MyApp!" });
			outputEl.textContent = "Message sent!";
		});
		document.getElementById("btn-write-log").addEventListener("click", () => {
			vscode.postMessage({ type: "writeLog" });
			outputEl.textContent = "Log write requested...";
		});
		window.addEventListener("message", (event) => {
			const m = event.data;
			if (m.type === "response") outputEl.textContent = "VS Code says: " + m.text;
			else if (m.type === "logWritten") outputEl.textContent = "Log written: " + m.text;
		});
	</script>
</body>
</html>`;

CommandsRegistry.registerCommand(MyAppOpenCommandId, (accessor) => {
	const webviewWorkbenchService = accessor.get(IWebviewWorkbenchService);
	const fileService = accessor.get(IFileService);

	const webviewInput = webviewWorkbenchService.openWebview(
		{
			title: localize2('myApp.editor.title', "My App").value,
			options: { enableFindWidget: true },
			contentOptions: { allowScripts: true },
			extension: undefined,
		},
		'myApp.editor',
		localize2('myApp.editor.title', "My App").value,
		undefined,
		{ group: ACTIVE_GROUP, preserveFocus: false },
	);

	webviewInput.webview.setHtml(htmlContent);
	webviewInput.webview.onMessage((e) => {
		console.log('[MyApp Editor] received:', e.message);
		if (e.message?.type === 'writeLog') {
			appendLog(fileService);
			webviewInput.webview.postMessage({ type: 'logWritten', text: 'Timestamp written to D:\\log.log' });
		}
	});
});

async function appendLog(fileService: IFileService): Promise<void> {
	const logUri = URI.file('D:/log.log');
	const timestamp = new Date().toISOString();
	const line = '[' + timestamp + '] MyApp log entry\n';

	let content = '';
	try {
		const existing = await fileService.readFile(logUri);
		content = existing.value.toString() + line;
	} catch {
		content = line;
	}
	await fileService.writeFile(logUri, VSBuffer.fromString(content));
}

class MyAppContribution {

	static readonly ID = 'myApp';

	constructor() {
		Registry.as<IViewContainersRegistry>(ViewExtensions.ViewContainersRegistry).registerViewContainer({
			id: MyAppViewContainerId,
			title: localize2('myApp.viewContainer.label', "My App"),
			icon: Codicon.home,
			ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [MyAppViewContainerId, { mergeViewWithContainerWhenSingleView: true }]),
		}, ViewContainerLocation.Sidebar);

		const viewContainer = Registry.as<IViewContainersRegistry>(ViewExtensions.ViewContainersRegistry).get(MyAppViewContainerId);
		if (viewContainer) {
			Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry).registerViews([{
				id: MyAppViewId,
				name: localize2('myApp.view.label', "My App"),
				ctorDescriptor: new SyncDescriptor(MyAppViewPane),
				canToggleVisibility: true,
				canMoveView: true,
			}], viewContainer);
		}
	}
}

registerWorkbenchContribution2(MyAppContribution.ID, MyAppContribution, WorkbenchPhase.AfterRestored);
