import fs from "node:fs";

function removeFileExtension(path) {
	return path
		.split(".")
		.slice(0, -1) // Remove file extension element
		.join(".");
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function convertFilename(filename, channel) {
	// eslint-disable-next-line no-unused-vars
	const [_game, release, version, change] = removeFileExtension(filename).split("-");

	return {
		release,
		version,
		change,
		name:
			`Star Citizen ${capitalizeFirstLetter(release)} ` +
			`${capitalizeFirstLetter(version)} ` +
			`${channel.toUpperCase()}.${change}`,
		stem: removeFileExtension(filename) + "-" + channel.replaceAll("-", "_"),
		filename: filename,
	};
}

export function sort(a, b) {
	const versionComparison = b.version.localeCompare(a.version);

	if (versionComparison === 0) {
		return b.change - a.change;
	}

	return versionComparison;
}

export default async function getLatestBuilds() {
	const channels = fs.readdirSync("translations").filter(
		(folder) => !fs.existsSync("translations/" + folder + "/.noinclude"), // Remove channels that have the .noinclude file
	);

	const channelsWithBuilds = {};

	for (const channel of channels) {
		channelsWithBuilds[channel] = fs
			.readdirSync("translations/" + channel)
			.filter((filename) => !filename.startsWith(".") && filename.endsWith(".ini"))
			.map((filename) => convertFilename(filename, channel))
			.sort(sort);

		channelsWithBuilds[channel].base = fs.existsSync("translations/" + channel + "/.base"); // If exists, this channel will be the baseline version for all differences
	}

	return channelsWithBuilds;
}
