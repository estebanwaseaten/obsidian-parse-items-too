import {App, PluginSettingTab, Setting } from "obsidian";

import ParseItemsToo from "./main";

export interface ParseItemsTooSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: ParseItemsTooSettings = {
	mySetting: 'default'
}

export class ParseItemsTooSettingsTab extends PluginSettingTab {
	plugin: ParseItemsToo;

	constructor(app: App, plugin: ParseItemsToo) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Settings #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
