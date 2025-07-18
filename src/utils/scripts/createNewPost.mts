#!/usr/bin/env bun

import { confirm, input } from "@inquirer/prompts";
import kleur from "kleur";
import { $, echo } from "zx";
import { formatDate } from "../formatDate";

// Check if the path already exists.
const isExistingPath = async (path: string) => {
	try {
		await $`test -e ./src/content/posts/${path}.mdx`;
		return true;
	} catch (_) {
		return false;
	}
};

// Check if the path is valid. (e.g., no special characters, not empty)
const isValidPath = (path: string) => {
	const regex = /^[a-zA-Z0-9-_]+$/;
	return regex.test(path);
};

// see: https://github.com/SBoudrias/Inquirer.js/tree/main/packages/input#theming
const theme = {
	prefix: {
		idle: kleur.gray("-"),
		done: kleur.green("✓"),
	},
};

try {
	echo(kleur.gray("| Create new post"));

	const path = await input({
		message: `${kleur.gray("(1/4)")} What is the path of the post? :`,
		required: true,
		validate: async (path) => {
			if (await isExistingPath(path)) {
				return (
					kleur.red("error: ") +
					kleur.reset(`src/content/posts/${path} is already existing.`)
				);
			}
			if (!isValidPath(path)) {
				return (
					kleur.red("error: ") +
					kleur.reset(
						`src/content/posts/${path} is not valid. Only alphanumeric characters, - and _ are allowed.`,
					)
				);
			}
			return true;
		},
		theme,
	});

	const title = await input({
		message: `${kleur.gray("(2/4)")} What is the title of the post? :`,
		required: true,
		theme,
	});

	const shouldDisplay = await confirm({
		message: `${kleur.gray("(3/4)")} Would you like to display posts in the post list? :`,
		default: true,
		theme,
	});

	const shouldHasImageDirectory = await confirm({
		message: `${kleur.gray("(4/4)")} Would you like to create an images directory for this post? :`,
		default: false,
		theme,
	});

	const frontmatter = [
		"---",
		`title: ${title}`,
		`publishedDate: ${formatDate(new Date(), "-")}`,
		shouldDisplay ? "---" : "hide: true\n---",
	].join("\n");

	await $`echo -e ${frontmatter} > src/content/posts/${path}.mdx`;

	echo(`${kleur.green("✓")} Create mdx file to src/content/posts/${path}.mdx:`);
	echo(await $`cat src/content/posts/${path}.mdx`);

	if (shouldHasImageDirectory) {
		await $`mkdir media/posts/${path}`;
		echo(`${kleur.green("✓")} Create images directory to media/posts/${path}`);
	}
} catch (error) {
	// handling ctrl+c
	if (error instanceof Error && error.name === "ExitPromptError") {
		echo(`\n${kleur.red("x")} Operation cancelled.`);
	} else {
		throw error;
	}
}
