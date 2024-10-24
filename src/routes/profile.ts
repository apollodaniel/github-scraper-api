import { Router, Request, Response } from 'express';
import jsdom from 'jsdom';
import {
	FULL_NAME_SELECTOR,
	PROFILE_PICTURE_SELECTOR,
	USER_BIO_SELECTOR,
	USERNAME_SELECTOR,
} from '../constants';
import fs from 'fs';

interface Profile {
	name: string;
	username: string;
	description: string;
	profile_picture: string;
	extras: String[];
}

const router = Router();

router.get('/api/profile', async (req: Request, resp: Response) => {
	let q = req.query.q;
	if (!q) {
		return resp.sendStatus(400);
	}

	// get user profile info
	const profile = await get_profile_info(q.toString());

	console.log(profile);

	return resp.status(200).send(profile);
});

async function get_profile_info(user: String): Promise<Profile> {
	const response = await fetch(`https://github.com/${user}`);

	let body = await response.text();
	let dom = new jsdom.JSDOM(body);

	const name =
		dom.window.document
			.querySelector(FULL_NAME_SELECTOR)
			?.textContent?.replace('\n', '')
			.trim() || 'No name';

	const username =
		dom.window.document
			.querySelector(USERNAME_SELECTOR)
			?.textContent?.replace('\n', '')
			.trim() || user;

	const user_bio =
		dom.window.document
			.querySelector(USER_BIO_SELECTOR)
			?.textContent?.replace('\n', '')
			.trim() || 'No description';

	const profile_picture =
		dom.window.document
			.querySelector(PROFILE_PICTURE_SELECTOR)
			?.getAttribute('src') || '';

	return {
		name: name,
		username: username.toString(),
		description: user_bio,
		profile_picture: profile_picture.split('?')[0] || profile_picture,
		extras: [],
	};
}

export default router;
