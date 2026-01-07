import { EventRef, ItemView, WorkspaceLeaf, SearchComponent, Menu, prepareFuzzySearch, setIcon, Notice } from "obsidian";
import type { MenuItem } from "obsidian";
import type ParseItemsToo from "./main";     //only for default export
import { MySpell } from "./spell";       //general export
//import type { MyVariant, MySpell } from "./spell";       //general export

export const SPELL_VIEW = "parse-items-too-spell-pane";

type SortKey = "name" | "rarity";
type SortDir = "asc" | "desc";

export class MySpellView extends ItemView
{
    private unsubscribe?: () => void;
    // Keep a handle to the results container
    private resultsEl!: HTMLElement;
    private filterEl!: HTMLElement;

    private lastQuery = "";
    private sort: { key: SortKey; dir: SortDir } = { key: "name", dir: "asc" };

    private raritymap = {
            0: 'common',
            1: 'uncommon',
            2: 'rare',
            3: 'very rare',
            4: 'legendary',
            5: 'artifact',
    };


    constructor(leaf: WorkspaceLeaf, public readonly plugin: ParseItemsToo )
    {
        super(leaf);
        console.debug("Parse Items too: MySpellView.constructor() ");
    }

    async onOpen()
    {
        console.debug("Parse Items too: MySpellView.onOpen()");
        const root = this.contentEl;
        root.empty();
        root.addClass( "parse-items-too-spell-view" );

        const header = root.createDiv("parse-items-too-header")
            const search = new SearchComponent( header.createDiv("parse-items-too-search-bar") );
            search.setPlaceholder("Search for spells...");
            this.filterEl = header.createDiv( { cls: "parse-items-too-filter" } );
            setIcon(this.filterEl,'sort-asc');
            this.filterEl.addEventListener( "click", (evt) => this.openSortMenu(evt) );

        this.resultsEl = root.createDiv({ cls: "parse-items-too-search-results" });

        search.onChange( (q) => this.render(q) );

        // Auto-cleaned when the view unloads:
        const ref: EventRef = this.plugin.mySpellary.on( "changed", () => this.render() );
        this.registerEvent(ref); // OK: ref is EventRef
    }

    private requestRender = (() => {
        let queued = false;
        return () => {
            if( queued ) return;
            queued = true;
            requestAnimationFrame( () => { queued = false; this.render(); });
        };
    })();

    public render = (q: string) =>  //arrow function
    {

        //search:

        let results: MySpell[];

        if( !q || q === "" )
        {
            //console.debug("Parse Spells too: MySpellView.render()");
            const dirMul = this.sort.dir === "asc" ? 1 : -1;
            results = this.plugin.mySpellary.getSpells()
                            .slice()    //clone not to modify source??
                            .sort((a, b) => compareByKey(a, b, this.sort.key) * dirMul)
                            .slice( 0, 200 );
                            //.map(i => ({ i, m: null }));

            //console.debug("all");
        }
        else
        {
            //console.debug("Parse Spells too: MySpellView.render("+q+")");
            //console.debug("subset");
            const score = prepareFuzzySearch( q );
            results = this.plugin.mySpellary.getSpells()
                              .map(i => ({ i, m: score(i.name) }))  //add score to MySpell object
                              .filter( x => x.m )
                              .sort( (a, b) => a.m!.score - b.m!.score )    //sort by score
                              .map( x => x.i )                                  //map back to MySpell object
                              .slice( 0, 50 );                                //maximum 50 spells shown
            //console.debug('after map', results[0]);

        }
        //console.debug("Parse Spells too: MySpellView.render() results: " + results[0].name);
        //results = this.plugin.mySpellary.getSpells();
        //sort:

        //display:
        if( this.sort.dir === "asc")
            setIcon(this.filterEl,'sort-asc');
        else
            setIcon(this.filterEl,'sort-desc');

        const container = this.resultsEl;
        container.empty();

        if( results.length == 0 ) return;

        const table = container.createEl("table", { cls: "parse-items-too-spells-table" });
        const thead = table.createEl("thead");
        const tbody = table.createEl("tbody");
        const header = thead.createEl("tr");
        header.createEl( "th", "Name" );
        header.createEl( "th", "" );
        header.createEl( "th", "" );
        header.createEl( "th", "" );
        header.createEl( "th", "" );

        tbody.empty();

        for( const i of results )
        {
            const tr = tbody.createEl("tr", { cls: "parse-items-too-spell-row", attr: { tabindex: "0" } });
            const td = tr.createEl( "td", { cls: "parse-items-too-spell-cell" } );
                td.createDiv( { text: i.name, cls: "parse-items-too-spell-name" } );
                td.createDiv( { text: i.detail, cls: "parse-items-too-spell-detail" } );

            const insertLink = tr.createEl( "td", { text: "", cls: "parse-items-too-spell-cell-button" } );
            setIcon(insertLink,'link');
            const insertBox = tr.createEl( "td", { text: "", cls: "parse-items-too-spell-cell-button" } );
            setIcon(insertBox,'gallery-vertical');
            const go = tr.createEl( "td", { text: "", cls: "parse-items-too-spell-cell-button" } );
            setIcon(go,'external-link');

            td.addEventListener( "click", () => this.clickSpell( i ));
            td.addEventListener( "contextmenu", ( evt ) => this.rightclickSpell( i, evt ));
            //td.addEventListener( "keydown", (ev) => {
            //                    if (ev.key === "Enter") this.clickSpell(i); });
            insertLink.addEventListener( "click", () => this.clickLink( i ));
            insertLink.addEventListener( "contextmenu", ( evt ) => this.rightclickLink( i, evt ));

            insertBox.addEventListener( "click", () => this.clickBox( i ));

            go.addEventListener( "click", () => this.clickGo( i ));
            go.addEventListener( "contextmenu", ( evt ) => this.rightclickGo( i, evt ));
        }
    };


    private clickSpell( i: MySpell )
    {
        console.debug( "click on: " + i.name );
        console.debug( "markdown link: " + i.markdownlink )
        console.debug( "file path: " + i.filePath )
        if( i.imagePath )
            console.debug( "image path: " + i.imagePath );

        //console.debug( "variants: " + i.variants );
        //if( i.variants.length > 0 )
            //new Notice( i.variants );
    }

    private rightclickSpell( i: MySpell, evt: MouseEvent )
    {
        console.debug( "rightclick on: " + i.name );
    }

    private clickLink( i: MySpell )
    {
        console.debug("click link...");
        if( i.variants?.length > 0 )
            new Notice( "Right click vor variants..." );

        void this.plugin.insertIntoEditor( i.markdownlink );
    }

    private rightclickLink( i: MySpell, evt: MouseEvent )
    {
        console.debug("rightclick link...");
        this.makeVariantMenu( i, evt, (variant) => { void this.plugin.insertIntoEditor( variant.markdownlink ); } );
    }

    private makeVariantMenu( i: MySpell, evt: MouseEvent, clickMethod: (variant: MyVariant) => void  )
    {
        if( i.variants.length > 0 )
        {
            const m = new Menu( this.plugin );

            i.variants.forEach( variant => {
                m.addSpell((spell) => {
                     spell.setTitle(variant.name);
                     spell.onClick(() => { clickMethod( variant ); });
                });
            });

            m.showAtMouseEvent(evt);
        }
    }

    private clickGo( i: MySpell )
    {
        console.debug("click go...");
        if( i.variants?.length > 0 )
            new Notice( "Right click vor variants..." );
        void this.plugin.openInEditor( i.markdownlink );
    }

    private rightclickGo( i: MySpell, evt: MouseEvent )
    {
        console.debug("rightclick go...");
         this.makeVariantMenu( i, evt, (variant) => { void this.plugin.openInEditor( variant.markdownlink ); } );
    }



    private clickBox( i: MySpell )
    {   // cannot use createElement() or createDiv(), because it will throw an error because of the vault relative path in the <img> imgTag
        // the vault relative path is needed, though, so the paths dont break when synicing the vault to a different computer.
        // --> html block has to be created as a string:
        const pre = '<div class="parse-items-too-editor-spell-box"><div class="parse-items-too-editor-textblock"><div class="parse-items-too-editor-spell-name">' + i.name + '</div><div class="parse-items-too-editor-spell-text">' + i.detail + " " + i.infotext + '</div><a class="internal-link" href="'+i.filePath+'">go to source</a></div>';
        const post = '</div>';
        let imgTag: string = '';
        if( i.imagePath !== "" )
        { imgTag = '<div class="parse-items-too-editor-imgblock"><div class="parse-items-too-editor-imgbgblock"><img src="' + i.imagePath + '"></div></div>'; }
        void this.plugin.insertIntoEditor( pre + imgTag + post );
    }

    private openSortMenu(evt: MouseEvent)
    {
        const m = new Menu( this.plugin );

        const addSortKey = (title: string, key: SortKey, icon: string) => {
                m.addSpell( (spell: MenuSpell) => {
                     spell.setTitle(title).setIcon(icon);
                     // setChecked is available in recent Obsidian versions
                     spell.setChecked?.(this.sort.key === key);
                     spell.onClick(() => { this.sort.key = key; this.render(this.lastQuery); });
                });
            };

        addSortKey("Name", "name", "heading-glyph");
        addSortKey("Rarity", "rarity", "star");

        m.addSeparator();

        m.addSpell((spell) => {
                const next = this.sort.dir === "asc" ? "desc" : "asc";
                const icon = next === "asc" ? "arrow-up" : "arrow-down";
                const label = next === "asc" ? "Ascending" : "Descending";
                spell.setTitle(`Direction: ${label}`).setIcon(icon).onClick(() => {
                            this.sort.dir = next;
                            this.render(this.lastQuery);
                        });
                    });

        m.showAtMouseEvent(evt);
    }

    async onClose()
    {
        console.debug("Parse Items too: close MySpellView...")
    }

    getDisplayText(): string {
        // eslint-disable-next-line obsidianmd/ui/sentence-case
        return "D&D Spells";
    }
    getIcon(): string {
        return "scroll";
    }
    getViewType(): string {
        return SPELL_VIEW;
    }
}

// Helper
function compareByKey(a: MySpell, b: MySpell, key: SortKey): number {
    switch( key )
    {
        case "name": return a.name.localeCompare( b.name, undefined, { sensitivity: "base", numeric: true });
        case "rarity": return a.rarityInt < b.rarityInt ? -1 : 1;//return (a.rarityInt ?? "").localeCompare(b.rarityInt ?? "", undefined, { sensitivity: "base", numeric: true });
    }
}
