/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { IHeaders } from '../../../../base/parts/request/common/request.js';
import { IRequestService, asText } from '../../../../platform/request/common/request.js';

export interface IMyAppRequestParams {
	url: string;
	method: string;
	headers: Record<string, string>;
	body: Record<string, unknown>;
}

export interface IMyAppRequestResult {
	status: number;
	headers: Record<string, string>;
	body: string;
}

export async function sendHttpRequest(
	requestService: IRequestService,
	params: IMyAppRequestParams,
	token: CancellationToken
): Promise<IMyAppRequestResult> {
	const requestHeaders: IHeaders = {};
	for (const [key, value] of Object.entries(params.headers)) {
		if (key.trim()) {
			requestHeaders[key.trim()] = value;
		}
	}

	const context = await requestService.request({
		type: params.method,
		url: params.url,
		headers: requestHeaders,
		data: Object.keys(params.body).length ? JSON.stringify(params.body) : undefined,
		callSite: 'myApp.sendHttpRequest',
	}, token);

	const body = await asText(context) ?? '';

	const resultHeaders: Record<string, string> = {};
	for (const [key, value] of Object.entries(context.res.headers)) {
		if (typeof value === 'string') {
			resultHeaders[key] = value;
		} else if (Array.isArray(value) && value.length > 0) {
			resultHeaders[key] = value[0];
		}
	}

	return {
		status: context.res.statusCode ?? 0,
		headers: resultHeaders,
		body,
	};
}


