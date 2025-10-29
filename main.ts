import { App, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

interface AutoTagNotesSettings {
	authorName: string;
	authorEmail: string;
}

const DEFAULT_SETTINGS: AutoTagNotesSettings = {
	authorName: '',
	authorEmail: ''
}

export default class AutoTagNotesPlugin extends Plugin {
	settings: AutoTagNotesSettings;
	private processingFiles: Set<string> = new Set();
	private hasShownAuthorWarning: boolean = false;

	async onload() {
		await this.loadSettings();

		// Register event handlers for file creation and modification
		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.handleFileCreate(file);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.handleFileModify(file);
				}
			})
		);

		// Add command to manually update frontmatter
		this.addCommand({
			id: 'update-frontmatter',
			name: 'Update frontmatter metadata',
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					this.updateFrontmatter(activeFile, false);
				}
			}
		});

		// Add settings tab
		this.addSettingTab(new AutoTagNotesSettingTab(this.app, this));
	}

	async handleFileCreate(file: TFile) {
		// Wait a bit to ensure file is fully created
		await this.sleep(100);
		await this.updateFrontmatter(file, true);
	}

	async handleFileModify(file: TFile) {
		// Avoid infinite loops by checking if we're already processing this file
		if (this.processingFiles.has(file.path)) {
			return;
		}

		await this.updateFrontmatter(file, false);
	}

	async updateFrontmatter(file: TFile, isNewFile: boolean) {
		// Check if author name is set
		if (!this.settings.authorName || this.settings.authorName.trim() === '') {
			// Show warning notice only once per session
			if (!this.hasShownAuthorWarning) {
				new Notice('Auto Tag Notes: Please set your author name in plugin settings to enable automatic frontmatter updates.');
				this.hasShownAuthorWarning = true;
			}
			return;
		}

		// Prevent infinite loops
		if (this.processingFiles.has(file.path)) {
			return;
		}

		this.processingFiles.add(file.path);

		try {
			const content = await this.app.vault.read(file);
			const now = this.formatDate(new Date());

			// Format author string
			const authorString = this.getAuthorString();

			// Parse frontmatter
			const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
			const match = content.match(frontmatterRegex);

			let newContent: string;

			if (match) {
				// Frontmatter exists, update it
				const frontmatterContent = match[1];
				const lines = frontmatterContent.split('\n');

				let hasAuthor = false;
				let hasCreated = false;
				let hasUpdated = false;
				let hasLastEditedBy = false;

				const updatedLines = lines.map(line => {
					if (line.startsWith('Author:')) {
						hasAuthor = true;
						return line; // Don't modify original author
					} else if (line.startsWith('Created at:')) {
						hasCreated = true;
						return line; // Don't modify creation date
					} else if (line.startsWith('Last updated at:')) {
						hasUpdated = true;
						return `Last updated at: '${now}'`;
					} else if (line.startsWith('Last edited by:')) {
						hasLastEditedBy = true;
						return `Last edited by: ${authorString}`;
					}
					return line;
				});

				// Add missing fields
				if (!hasAuthor) {
					updatedLines.unshift(`Author: ${authorString}`);
				}
				if (!hasCreated) {
					updatedLines.splice(hasAuthor ? 1 : 1, 0, `Created at: '${now}'`);
				}
				if (!hasUpdated) {
					updatedLines.push(`Last updated at: '${now}'`);
				}
				if (!hasLastEditedBy) {
					updatedLines.push(`Last edited by: ${authorString}`);
				}

				const newFrontmatter = updatedLines.join('\n');
				newContent = content.replace(frontmatterRegex, `---\n${newFrontmatter}\n---`);
			} else {
				// No frontmatter, create it
				const frontmatter = `---\nAuthor: ${authorString}\nCreated at: '${now}'\nLast updated at: '${now}'\nLast edited by: ${authorString}\n---\n\n`;
				newContent = frontmatter + content;
			}

			// Only update if content has changed
			if (newContent !== content) {
				await this.app.vault.modify(file, newContent);
			}
		} catch (error) {
			console.error('Error updating frontmatter:', error);
		} finally {
			// Remove from processing set after a short delay
			setTimeout(() => {
				this.processingFiles.delete(file.path);
			}, 1000);
		}
	}

	getAuthorString(): string {
		const name = this.settings.authorName.trim();
		const email = this.settings.authorEmail.trim();

		if (name && email) {
			return `${name} <${email}>`;
		} else if (name) {
			return name;
		} else {
			return '';
		}
	}

	formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');

		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	}

	sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	onunload() {
		this.processingFiles.clear();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Reset warning flag when settings are saved
		this.hasShownAuthorWarning = false;
	}
}

class AutoTagNotesSettingTab extends PluginSettingTab {
	plugin: AutoTagNotesPlugin;

	constructor(app: App, plugin: AutoTagNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Auto Tag Notes Settings'});

		new Setting(containerEl)
			.setName('Author Name')
			.setDesc('Your name to be added to note frontmatter')
			.addText(text => text
				.setPlaceholder('Enter your name')
				.setValue(this.plugin.settings.authorName)
				.onChange(async (value) => {
					this.plugin.settings.authorName = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Author Email')
			.setDesc('Your email to be added to note frontmatter')
			.addText(text => text
				.setPlaceholder('Enter your email')
				.setValue(this.plugin.settings.authorEmail)
				.onChange(async (value) => {
					this.plugin.settings.authorEmail = value;
					await this.plugin.saveSettings();
				}));
	}
}
