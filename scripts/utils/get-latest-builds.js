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
	// Sort by version in descending order
	const versionA = a.version.split(".").map(Number),
		versionB = b.version.split(".").map(Number);

	for (let i = 0; i < 3; i++) {
		if (versionA[i] > versionB[i]) {
			return -1; // Sort in descending order for version
		}
		if (versionA[i] < versionB[i]) {
			return 1; // Sort in descending order for version
		}
	}

	// If versions are equal, sort by id in descending order
	if (a.id > b.id) {
		return -1; // Sort in descending order for id
	} else if (a.id < b.id) {
		return 1; // Sort in descending order for id
	}

	return 0;
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
			.sort(sort)
			.reverse(); // So it's antecedent

		channelsWithBuilds[channel].base = fs.existsSync("translations/" + channel + "/.base"); // If exists, this channel will be the baseline version for all differences
	}

	return channelsWithBuilds;
}
