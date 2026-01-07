import { MarkdownView, Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, ParseItemsTooSettings, ParseItemsTooSettingsTab } from "./settings";

import { ITEM_VIEW, MyItemView } from "./itemview";
import { Itemary } from "./itemary"
import { SPELL_VIEW, MySpellView } from "./spellview";
import { Spellary } from "./spellary"
//import { Item } from "./item"


// Remember to rename these classes and interfaces!

export default class ParseItemsToo extends Plugin {

	settings: ParseItemsTooSettings;
	public myItemary!: Itemary;
	public mySpellary!: Spellary;

	private lastMdLeaf: WorkspaceLeaf | null = null;	//keep track of last leaf, so we can try to insert links or blocks

	async onload() {

		console.debug("loading Parse Items too...");
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		// eslint-disable-next-line obsidianmd/ui/sentence-case
		this.addRibbonIcon('sword', 'D&D items', (evt: MouseEvent) => {
			 void this.openItemsPane();
		});
        this.addRibbonIcon('scroll', 'D&D spells', (evt: MouseEvent) => {
			 void this.openSpellsPane();
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		//const statusBarItemEl = this.addStatusBarItem();
		//statusBarItemEl.setText('Status bar text');

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab( new ParseItemsTooSettingsTab( this.app, this ) );


		this.registerView( ITEM_VIEW, ( leaf: WorkspaceLeaf ) => new MyItemView( leaf, this ) );
        this.registerView( SPELL_VIEW, ( leaf: WorkspaceLeaf ) => new MySpellView( leaf, this ) );

		this.myItemary = new Itemary( this.app );
		this.app.workspace.onLayoutReady( () => this.myItemary.build( this.app ) );

        this.mySpellary = new Spellary( this.app );
        this.app.workspace.onLayoutReady( () => this.mySpellary.build( this.app ) );


		//whenever the lea f changes, write to tracker this.lastMdLeaf:
		this.registerEvent(
      		this.app.workspace.on("active-leaf-change", (leaf) => {
        		const mv = this.app.workspace.getActiveViewOfType( MarkdownView );
        		if (mv) this.lastMdLeaf = mv.leaf;
      		}));

	}

	onunload()
	{
		console.debug("unloading Parse Items too...");
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
			console.debug( "itemPane already there" );
			leaf = presentLeaf;
		}
		else
		{
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({ type: ITEM_VIEW, active: true });
		}
		await workspace.revealLeaf( leaf );
	}

    async openSpellsPane()
    {
        const { workspace } = this.app;

        let 	leaf: WorkspaceLeaf | null = null;
        let   	presentLeaf = workspace.getLeavesOfType( SPELL_VIEW ).first();

        if( presentLeaf && presentLeaf.view instanceof MySpellView )
        {
            console.debug( "spellPane already there" );
            leaf = presentLeaf;
        }
        else
        {
            leaf = workspace.getRightLeaf( false );
            await leaf.setViewState({ type: SPELL_VIEW, active: true });
        }
        await workspace.revealLeaf( leaf );
    }

	async openInEditor( linktext: string )
	{
		console.debug( "openInEditor: " + linktext );

		let inner = linktext.trim();
		if (inner.startsWith("!")) inner = inner.slice(1);
		if (inner.startsWith("[[") && inner.endsWith("]]")) inner = inner.slice(2, -2);
		const link = inner.split("|")[0].trim(); // e.g., "Note Name#Heading"

		const i = link.search(/[#^]/);
		const path = (i === -1) ? link : link.slice(0, i);

		const file = this.app.metadataCache.getFirstLinkpathDest(path, "" );
		if( file )
		{
  			await this.app.workspace.openLinkText(link, "", false);
			const leaf = this.app.workspace.getLeaf(false);
			await leaf.openFile(file);
			await leaf.setViewState({
						type: "markdown",
						state: { file: file.path, mode: "preview" }
					});
		}
	}



	async insertIntoEditor(text: string)
	{
	    // Prefer current active editor, else fall back to the last one we saw.
	    const mv = this.app.workspace.getActiveViewOfType( MarkdownView )
	           ?? (this.lastMdLeaf?.view as MarkdownView | undefined);
	    if( !mv )
		{
			new Notice("No editor is active. Open a note (and place the cursor) ...");
			return;
	    }

		let switchBack = false;

		const myleaf = mv.leaf;
		const vs = myleaf.getViewState();
		if( vs.state?.mode !== "source" )
		{
			//new Notice("Please switch Editor to Edit Mode.");
			await myleaf.setViewState({ ...vs, state: { ...vs.state, mode: "source" } });
			//await nextFrame();
			//await nextFrame();
			switchBack = true;
		}
		const editor = mv.editor;
		if( !editor )
		{
			new Notice("No editor is active. Open a note (and place the cursor) ...");
			return;
		}

		editor.focus();
	    editor.replaceSelection( '\n' + text + '\n\n' ); // inserts at cursor if no selection

		if( switchBack )
		{
			await myleaf.setViewState({ ...vs, state: { ...vs.state, mode: "preview" } });
			//await nextFrame();
			//await nextFrame();
		}
	}
}
