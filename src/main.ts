import { App, Editor, MarkdownView, Modal, Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, ParseItemsTooSettings, ParseItemsTooSettingsTab } from "./settings";
import { ITEM_VIEW, ItemView } from "./itemview";


// Remember to rename these classes and interfaces!

export default class ParseItemsToo extends Plugin {
	settings: ParseItemsTooSettings;

	async onload() {
		console.log("loading Parse Items too...");
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('sword', 'Items', async (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			this.openItemsPane();
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		//const statusBarItemEl = this.addStatusBarItem();
		//statusBarItemEl.setText('Status bar text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-modal-simple',
			name: 'Open modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});



		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab( new ParseItemsTooSettingsTab( this.app, this ) );

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		//this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		//	new Notice("Click");
		//});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

	}

	onunload() {
		console.log("unloading Parse Items too...");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<ParseItemsTooSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async openItemsPane()
	{
		let 	leaf: WorkspaceLeaf;
		const   alreadyThere = this.app.workspace.getLeavesOfType(ITEM_VIEW);

		if ( alreadyThere.length > 0 )
		{
			console.log( "itemPane already there" );
		}
		else
		{
			leaf = this.app.workspace.getRightLeaf(true);
			await leaf.setViewState({type: ITEM_VIEW});
		}

		this.app.workspace.revealLeaf( leaf );

		new Notice('You clicked the sword!' + this.settings.mySetting );

        return leaf.view as ItemView;
	}
}




class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
