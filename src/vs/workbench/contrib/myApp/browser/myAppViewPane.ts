/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../base/browser/dom.js';
import { Button } from '../../../../base/browser/ui/button/button.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { localize } from '../../../../nls.js';
import { IRequestService } from '../../../../platform/request/common/request.js';
import { IMyAppRequestParams, sendHttpRequest } from '../common/myAppRequest.js';
import aes from '../common/aes.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { defaultButtonStyles } from '../../../../platform/theme/browser/defaultStyles.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { ViewPaneShowActions, ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IViewletViewOptions } from '../../../browser/parts/views/viewsViewlet.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { MyAppOpenCommandId, MyAppOpenSqlResCommandId } from '../common/myApp.js';

export class MyAppViewPane extends ViewPane {

	constructor(
		options: IViewletViewOptions,
		@ICommandService private readonly commandService: ICommandService,
		@IRequestService private readonly requestService: IRequestService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IOpenerService openerService: IOpenerService,
		@IHoverService hoverService: IHoverService,
		@IThemeService themeService: IThemeService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
	) {
		super({ ...options, showActions: ViewPaneShowActions.Default }, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);

		container.style.padding = '12px';
		container.style.display = 'flex';
		container.style.flexDirection = 'column';
		container.style.alignItems = 'center';
		container.style.gap = '12px';
		container.style.overflowY = 'auto';

		const label = dom.append(container, dom.$('p'));
		label.textContent = localize('myApp.openWebviewLabel', 'Open the MyApp webview in the editor area.');
		label.style.color = 'var(--vscode-descriptionForeground)';
		label.style.fontSize = '13px';
		label.style.textAlign = 'center';

		const buttonLabel = localize('myApp.openWebview', 'Open Webview');
		const button = this._register(new Button(container, { ...defaultButtonStyles, title: buttonLabel }));
		button.label = buttonLabel;
		button.element.style.width = '100%';
		this._register(button.onDidClick(() => {
			this.commandService.executeCommand(MyAppOpenCommandId);
		}));

		const sqlButtonLabel = localize('myApp.openSqlRes', 'Open SQL Query Result');
		const sqlButton = this._register(new Button(container, { ...defaultButtonStyles, title: sqlButtonLabel }));
		sqlButton.label = sqlButtonLabel;
		sqlButton.element.style.width = '100%';
		this._register(sqlButton.onDidClick(() => {
			this.commandService.executeCommand(MyAppOpenSqlResCommandId);
		}));

		const form = dom.append(container, dom.$('div'));
		form.style.width = '100%';
		form.style.display = 'flex';
		form.style.flexDirection = 'column';
		form.style.gap = '8px';
		form.style.padding = '12px';
		form.style.border = '1px solid var(--vscode-panel-border)';
		form.style.borderRadius = '4px';
		form.style.boxSizing = 'border-box';

		const applyLabelStyle = (el: HTMLElement) => {
			el.style.fontSize = '12px';
			el.style.fontWeight = 'bold';
			el.style.color = 'var(--vscode-foreground)';
		};

		const applyInputStyle = (el: HTMLInputElement | HTMLTextAreaElement) => {
			el.style.background = 'var(--vscode-input-background)';
			el.style.color = 'var(--vscode-input-foreground)';
			el.style.border = '1px solid var(--vscode-input-border, transparent)';
			el.style.padding = '4px 8px';
			el.style.borderRadius = '2px';
			el.style.width = '100%';
			el.style.boxSizing = 'border-box';
			el.style.outline = 'none';
		};

		// URL
		const urlLabel = dom.append(form, dom.$('label'));
		urlLabel.textContent = localize('myApp.form.url', 'URL');
		applyLabelStyle(urlLabel);

		const urlInput = dom.$<HTMLInputElement>('input');
		urlInput.type = 'text';
		urlInput.placeholder = 'https://...';
		applyInputStyle(urlInput);
		dom.append(form, urlInput);

		// Method
		const methodLabel = dom.append(form, dom.$('label'));
		methodLabel.textContent = localize('myApp.form.method', 'Method');
		applyLabelStyle(methodLabel);

		const methodSelect = dom.$<HTMLSelectElement>('select');
		methodSelect.style.background = 'var(--vscode-dropdown-background)';
		methodSelect.style.color = 'var(--vscode-dropdown-foreground)';
		methodSelect.style.border = '1px solid var(--vscode-dropdown-border)';
		methodSelect.style.padding = '4px 8px';
		methodSelect.style.borderRadius = '2px';
		methodSelect.style.width = '100%';
		methodSelect.style.boxSizing = 'border-box';
		for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
			const option = dom.$<HTMLOptionElement>('option');
			option.value = method;
			option.textContent = method;
			dom.append(methodSelect, option);
		}
		dom.append(form, methodSelect);

		// Headers
		const headersLabel = dom.append(form, dom.$('label'));
		headersLabel.textContent = localize('myApp.form.headers', 'Headers');
		applyLabelStyle(headersLabel);

		const headersContainer = dom.append(form, dom.$('div'));
		headersContainer.style.display = 'flex';
		headersContainer.style.flexDirection = 'column';
		headersContainer.style.gap = '4px';

		const addHeaderRow = () => {
			const row = dom.append(headersContainer, dom.$('div'));
			row.style.display = 'grid';
			row.style.gridTemplateColumns = '1fr 1fr auto';
			row.style.gap = '4px';
			row.style.alignItems = 'center';

			const keyInput = dom.$<HTMLInputElement>('input');
			keyInput.placeholder = localize('myApp.form.headerKey', 'Key');
			applyInputStyle(keyInput);
			dom.append(row, keyInput);

			const valInput = dom.$<HTMLInputElement>('input');
			valInput.placeholder = localize('myApp.form.headerValue', 'Value');
			applyInputStyle(valInput);
			dom.append(row, valInput);

			const removeBtn = dom.append(row, dom.$('button'));
			removeBtn.textContent = '×';
			removeBtn.title = localize('myApp.form.removeHeader', 'Remove header');
			removeBtn.style.background = 'none';
			removeBtn.style.border = 'none';
			removeBtn.style.color = 'var(--vscode-errorForeground)';
			removeBtn.style.cursor = 'pointer';
			removeBtn.style.padding = '0 4px';
			removeBtn.style.fontSize = '16px';
			removeBtn.style.lineHeight = '1';
			removeBtn.addEventListener('click', () => headersContainer.removeChild(row));
		};

		addHeaderRow();

		const addHeaderLabel = localize('myApp.form.addHeader', 'Add Header');
		const addHeaderButton = this._register(new Button(form, { ...defaultButtonStyles, secondary: true, title: addHeaderLabel }));
		addHeaderButton.label = addHeaderLabel;
		addHeaderButton.element.style.alignSelf = 'flex-start';
		this._register(addHeaderButton.onDidClick(() => addHeaderRow()));

		// Request Body
		const bodyLabel = dom.append(form, dom.$('label'));
		bodyLabel.textContent = localize('myApp.form.body', 'Request Body (JSON)');
		applyLabelStyle(bodyLabel);

		const bodyTextarea = dom.$<HTMLTextAreaElement>('textarea');
		bodyTextarea.placeholder = '{ "key": "value" }';
		bodyTextarea.rows = 5;
		applyInputStyle(bodyTextarea);
		bodyTextarea.style.resize = 'vertical';
		bodyTextarea.style.fontFamily = 'var(--vscode-editor-font-family, monospace)';
		bodyTextarea.style.fontSize = '12px';
		dom.append(form, bodyTextarea);

		// Send
		const sendLabel = localize('myApp.form.send', 'Send');
		const sendButton = this._register(new Button(form, { ...defaultButtonStyles, title: sendLabel }));
		sendButton.label = sendLabel;
		sendButton.element.style.width = '100%';

		const responseArea = dom.append(form, dom.$('pre'));
		responseArea.style.display = 'none';
		responseArea.style.background = 'var(--vscode-textBlockQuote-background)';
		responseArea.style.border = '1px solid var(--vscode-textBlockQuote-border)';
		responseArea.style.padding = '8px';
		responseArea.style.borderRadius = '2px';
		responseArea.style.fontSize = '12px';
		responseArea.style.fontFamily = 'var(--vscode-editor-font-family, monospace)';
		responseArea.style.whiteSpace = 'pre-wrap';
		responseArea.style.wordBreak = 'break-all';
		responseArea.style.overflowY = 'auto';
		responseArea.style.maxHeight = '200px';

		this._register(sendButton.onDidClick(async () => {
			const url = urlInput.value.trim();
			if (!url) {
				return;
			}

			const headers: Record<string, string> = {};
			for (const row of Array.from(headersContainer.children)) {
				const inputs = row.querySelectorAll<HTMLInputElement>('input');
				if (inputs.length >= 2) {
					const key = inputs[0].value.trim();
					if (key) {
						headers[key] = inputs[1].value;
					}
				}
			}

			let bodyObj: Record<string, unknown> = {};
			const rawBody = bodyTextarea.value.trim();
			if (rawBody) {
				try { bodyObj = JSON.parse(rawBody); } catch { bodyObj = { data: rawBody }; }
			}

			const params: IMyAppRequestParams = {
				url,
				method: methodSelect.value,
				headers,
				body: bodyObj,
			};

			sendButton.enabled = false;
			sendButton.label = localize('myApp.form.sending', 'Sending...');
			responseArea.style.display = 'block';
			responseArea.textContent = localize('myApp.form.waiting', 'Waiting for response...');

			try {
				const encryptedParams: IMyAppRequestParams = {
					...params,
					body: Object.keys(params.body).length
						? { data: aes.encrypt(JSON.stringify(params.body)) }
						: {},
				};
				const result = await sendHttpRequest(this.requestService, encryptedParams, CancellationToken.None);
				responseArea.textContent = `HTTP ${result.status}\n\n${result.body}`;
			} catch (err) {
				responseArea.textContent = `Error: ${err instanceof Error ? err.message : String(err)}`;
			} finally {
				sendButton.enabled = true;
				sendButton.label = sendLabel;
			}
		}));
	}
}

