/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { ViewPaneShowActions, ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IViewletViewOptions } from '../../../browser/parts/views/viewsViewlet.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { MyAppOpenCommandId } from '../common/myApp.js';

export class MyAppViewPane extends ViewPane {

	constructor(
		options: IViewletViewOptions,
		@ICommandService private readonly commandService: ICommandService,
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

		const label = document.createElement('p');
		label.textContent = 'Open the MyApp webview in the editor area.';
		label.style.color = 'var(--vscode-descriptionForeground)';
		label.style.fontSize = '13px';
		label.style.textAlign = 'center';
		container.appendChild(label);

		const button = document.createElement('button');
		button.classList.add('monaco-button');
		button.textContent = 'Open Webview';
		button.style.width = '100%';
		button.addEventListener('click', () => {
			this.commandService.executeCommand(MyAppOpenCommandId);
		});
		container.appendChild(button);
	}
}
