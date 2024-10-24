import { Request, Response, Router } from 'express';
import jsdom from 'jsdom';
import {
	REPOSITORY_COUNT_SELECTOR,
	REPOSITORY_DESCRIPTION_SELECTOR,
	REPOSITORY_MAINLANGUAGE_SELECTOR,
	REPOSITORY_TITTLE_SELECTOR,
	REPOSITORY_URL_SELECTOR,
	REPOSITORY_WRAPPER_SELECTOR,
} from '../constants';

import fs from 'fs';

const router = Router();

// document.querySelector('#repositories-tab > span.Counter').getAttribute("title") -> page count

interface Repository {
	name: String;
	description: String;
	url: String;
	main_language: String;
}

router.get('/api/repositories', async (req: Request, resp: Response) => {
	const q = req.query.q;
	if (!q) {
		return resp.sendStatus(400); // bad request
	}

	// get repositories
	const repos = await get_repositories(q.toString());
	console.log(`Found ${repos.length} repositories for ${q}`);
	return resp.status(200).send(repos);
});

async function get_repositories(user: String): Promise<Repository[]> {
	const response = await fetch(`https://github.com/${user}?tab=repositories`);
	const content = await response.text();

	const dom = new jsdom.JSDOM(content);
	const repo_count = parseInt(
		dom.window.document
			.querySelector(REPOSITORY_COUNT_SELECTOR)
			?.getAttribute('title') || '0',
	);

	// get first page repositories and page count
	let repositories = parse_repositories(dom);
	const page_count = Math.ceil(repo_count / repositories.length);
	console.log(
		`${page_count} pages, ${repo_count} repos, with ${repositories.length} each`,
	);

	let repo_pages_url: String[] = [];
	for (let i = 2; i <= page_count; i++) {
		repo_pages_url.push(
			`https://github.com/${user}?page=${i}&tab=repositories`,
		);
	}

	let result = await Promise.all(
		repo_pages_url.map(async (url) => {
			const _response = await fetch(url.toString());
			const _content = await _response.text();
			const _dom = new jsdom.JSDOM(_content);
			return parse_repositories(_dom);
		}),
	);

	return repositories.concat(result.flat());
}

function parse_repositories(page: jsdom.JSDOM): Repository[] {
	let repositorie_wrappers: Repository[] = Array.from(
		page.window.document.querySelectorAll(REPOSITORY_WRAPPER_SELECTOR),
	).map((repository) => {
		const name =
			repository
				.querySelector(REPOSITORY_TITTLE_SELECTOR)
				?.textContent?.replace('\n', '')
				.trim() || 'No name';
		const url = `https://github.com${repository.querySelector(REPOSITORY_URL_SELECTOR)?.getAttribute('href')?.replace('\n', '').trim() || ''}`;
		const main_language =
			repository
				.querySelector(REPOSITORY_MAINLANGUAGE_SELECTOR)
				?.textContent?.replace('\n', '')
				.trim() || '';
		const description =
			repository
				.querySelector(REPOSITORY_DESCRIPTION_SELECTOR)
				?.textContent?.replace('\n', '')
				.trim() || '';

		return {
			name: name,
			url: url,
			main_language: main_language,
			description: description,
		};
	});

	return repositorie_wrappers;
}

export default router;
