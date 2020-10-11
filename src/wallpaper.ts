const {promisify} = require('util');
const path = require('path');
const childProcess = require('child_process');

const execFile = promisify(childProcess.execFile);

const binary = path.resolve(path.join('dist', 'win-wallpaper.exe'));

export async function get() {
	const {stdout} = await execFile(binary, [], { windowsHide: true });
	return stdout.trim();
}

export async function set(imagePath: string) {
	if (typeof imagePath !== 'string') {
		throw new TypeError('Expected a string');
	}
	
	await execFile(binary, [path.resolve(imagePath)], { windowsHide: true });
}

export default {
	get,
	set
}