const vscode = require('vscode');
const fm = require('./core/filemanager.js');
const tb = require('./core/builder.js');
const fs = require('fs');
const path = require('path');
const WF = '/$WORKSPACE_FOLDER';

let folder = null;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let buildCommand = vscode.commands.registerCommand('quickpage-tools.build', build);
	let clearCommand = vscode.commands.registerCommand('quickpage-tools.clear', clear);
	let selectCommand = vscode.commands.registerCommand('quickpage-tools.select', select);

	context.subscriptions.push(buildCommand);
	context.subscriptions.push(clearCommand);
	context.subscriptions.push(selectCommand);
}

async function build() {
	let isSelected = await makeSureFolderIsSelected();

	if (!isSelected) return;

	let result = readOrCreateConfig("_quickpage/config.json");

	if (result == null) return;

	let files = result.fileManager.lookForHtmlFiles('');
	let builder = new tb.TemplateBuilder();
	builder.processAndWriteDocuments(result.fileManager, 
		files, result.config.formatterOptions);
}

async function clear() {
	let isSelected = await makeSureFolderIsSelected();
	if (!isSelected) return;
	
	let fileManager = new fm.FileManager(folder.uri.path, '');
	let dirs = [WF].concat(fileManager.listDirs(null));
	let pickedValue = await vscode.window.showQuickPick(dirs);

	if (!pickedValue) return;

	if (pickedValue == WF) {
		pickedValue = "";
	}

	fileManager.clearDirectory(path.join(folder.uri.path, pickedValue));
}

async function select() {
	let pickedFolder = await vscode.window.showWorkspaceFolderPick();

	if (pickedFolder) {
		folder = pickedFolder;
	}
}

function readOrCreateConfig(filePath) {
	let folderPath = folder.uri.path;
	let fullPath = path.join(folderPath, filePath);

	let defaultConfig = {
		relWorkDir: "src",
		relOutputDir: "quickpage-output",
		formatterOptions: tb.defaultPrettierOptions
	};

	if (fs.existsSync(fullPath)) {

		let buffer = fs.readFileSync(fullPath);
		let config = JSON.parse(buffer.toString());

		return {
			fileManager: new fm.FileManager(
				path.join(folderPath, config.relWorkDir ?? defaultConfig.relWorkDir),
				path.join(folderPath, config.relOutputDir ?? defaultConfig.relOutputDir)),
			config: {
				relWorkDir: config.relWorkDir ?? defaultConfig.relWorkDir,
				relOutputDir: config.relOutputDir ?? defaultConfig.relOutputDir,
				formatterOptions: config.formatterOptions ?? defaultConfig.formatterOptions
			}
		};
	}
	
	let dir = path.dirname(fullPath);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir);

	fs.writeFileSync(fullPath, JSON.stringify(defaultConfig, null, 3));

	return {
		fileManager: new fm.FileManager(
			path.join(folderPath, defaultConfig.relWorkDir),
			path.join(folderPath, defaultConfig.relOutputDir)),
		config: defaultConfig
	};
}

async function makeSureFolderIsSelected() {
	if (folder && vscode.workspace.workspaceFolders.includes(folder)) return true;

	let workspaceFolders = vscode.workspace.workspaceFolders;

	if (!workspaceFolders || workspaceFolders.length == 0) {
		vscode.window.showErrorMessage("Open at least one folder to use QuickPage extension");
		return false;
	}

	if (workspaceFolders.length > 1) {
		let selectedFolder = await vscode.window.showWorkspaceFolderPick();

		if (selectedFolder) {
			folder = selectedFolder;
			return true;
		}

		return false;
	}

	folder = workspaceFolders[0];
	return true;
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}