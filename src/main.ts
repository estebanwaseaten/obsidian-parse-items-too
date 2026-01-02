import { App, Editor, MarkdownView, Modal, Notice, Plugin, Document } from 'obsidian';
import { DEFAULT_SETTINGS, ParseItemsTooSettings, ParseItemsTooSettingsTab } from "./settings";
import { ITEM_VIEW, MyItemView } from "./itemview";
import { Itemary } from "./itemary"
import { Item } from "./item";
//import { Item } from "./item"


// Remember to rename these classes and interfaces!

export default class ParseItemsToo extends Plugin {
	settings: ParseItemsTooSettings;

	myItemary: Itemary;

	//keep track of last leaf
	private lastMdLeaf: WorkspaceLeaf | null = null;

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
		//this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		this.registerView( ITEM_VIEW, ( leaf: WorkspaceLeaf ) => new MyItemView( leaf, this ) );

		this.myItemary = new Itemary();
		this.app.workspace.onLayoutReady( () => this.myItemary.build( this ) );

		//whenever the leaf changes, write to tracker this.lastMdLeaf:
		this.registerEvent(
      		this.app.workspace.on("active-leaf-change", (leaf) => {
        		const mv = this.app.workspace.getActiveViewOfType( MarkdownView );
        		if (mv) this.lastMdLeaf = mv.leaf;
      		}));

	}

	onunload()
	{
		console.log("unloading Parse Items too...");
		this.app.workspace
		   .getLeavesOfType(ITEM_VIEW)
		   .forEach((leaf) => leaf.detach());
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<ParseItemsTooSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async openItemsPane()
	{
		const { workspace } = this.app;

		let 	leaf: WorkspaceLeaf | null = null;
		let   	presentLeaf = workspace.getLeavesOfType(ITEM_VIEW).first();

		if( presentLeaf && presentLeaf.view instanceof MyItemView )
		{
			console.log( "itemPane already there" );
			leaf = presentLeaf;
		}
		else
		{
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({ type: ITEM_VIEW, active: true });
		}

		workspace.revealLeaf( leaf );

		//new Notice('You clicked the sword!' + this.settings.mySetting );
        //return leaf.view as MyItemView;
	}

	async openInEditor(linktext: string)
	{
		let inner = linktext.trim();
		if (inner.startsWith("!")) inner = inner.slice(1);
		if (inner.startsWith("[[") && inner.endsWith("]]")) inner = inner.slice(2, -2);
		const link = inner.split("|")[0].trim(); // e.g., "Note Name#Heading"

		//openFile(file: TFile, openState?: OpenViewState): Promise<void>;
		await this.app.workspace.openLinkText( link, "", false );

		const view = app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;

		// 3) Switch to Reading mode explicitly
		try
		{
			if( view.getMode?.() !== "preview" )
			{
				await view.setMode?.("preview");
			}
		} catch {
			// Fallback (older APIs): toggle only if currently in source
			if( view.getMode?.() === "source" )
			{
				await this.app.commands.executeCommandById("markdown:toggle-preview");
			}
		}

		//close properties - should wait for layout ready
		const currentLeaf = document.querySelector('.workspace-leaf.mod-active') //extracts html stuffs
		if (currentLeaf)
		{
			const propertiesAreFolded = currentLeaf.querySelector('.metadata-container is-collapsed')
			if (!propertiesAreFolded)
			{
				this.app.commands.executeCommandById('editor:toggle-fold-properties')
			}
		}
	}

	insertIntoEditor(text: string)
	{
	    // Prefer current active editor, else fall back to the last one we saw.
	    const mv = this.app.workspace.getActiveViewOfType( MarkdownView )
	           ?? (this.lastMdLeaf?.view as MarkdownView | undefined);
	    if (!mv) {
	      new Notice("No editor is active. Open a note and place the cursor.");
	      return;
	    }

	    // Re-focus the editor so the caret is visible
	    this.app.workspace.setActiveLeaf(mv.leaf, { focus: true });

	    const editor = mv.editor;
	    editor.replaceSelection( text ); // inserts at cursor if no selection
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
