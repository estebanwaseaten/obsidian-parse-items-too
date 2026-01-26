import { EventRef, ItemView, WorkspaceLeaf, SearchComponent, Menu, prepareFuzzySearch, setIcon, getIcon } from "obsidian";
import type { MenuItem } from "obsidian";
import type ParseItemsToo from "./main";     //only for default export
import { MySpell } from "./spell";       //general export
import { getIconSVG } from "./common";
//import type { MyVariant, MySpell } from "./spell";       //general export

export const SPELL_VIEW = "parse-items-too-spell-pane";

type SortKey = "name" | "level";
type SortDir = "asc" | "desc";

export class MySpellView extends ItemView
{
    private unsubscribe?: () => void;
    // Keep a handle to the results container
    private resultsEl!: HTMLElement;
    private sortEl!: HTMLElement;
    private filterLevelEl!: HTMLElement;
    private filterClassEl!: HTMLElement;

    private lastQuery: string = "";
    private levelQuery: number = -1;
    private classQuery: string = "";    //all

    private sort: { key: SortKey; dir: SortDir } = { key: "name", dir: "asc" };

    private levelString: string[] = ["Cantrip", "Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 7", "Level 8", "Level 9 "];
    //private classString: string[] = ["Barbarian", "Cleric", "Druid", "Fighter", "Monk"];
    private classArray: string[] = [];


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
        search.setPlaceholder("Search for spells.....");



        this.filterClassEl = header.createDiv( { cls: "parse-items-too-filter" } );
        setIcon( this.filterClassEl, 'shield-question-mark');
        this.filterClassEl.addEventListener( "click", (evt) => this.openFilterClassMenu( evt ) );

        this.filterLevelEl = header.createDiv( { cls: "parse-items-too-filter" } );
        setIcon( this.filterLevelEl, 'book-plus');
        this.filterLevelEl.addEventListener( "click", (evt) => this.openFilterLevelMenu( evt ) );

        this.sortEl = header.createDiv( { cls: "parse-items-too-filter" } );
        setIcon( this.sortEl,'sort-asc' );
        this.sortEl.addEventListener( "click", (evt) => this.openSortMenu( evt ) );



        this.resultsEl = root.createDiv({ cls: "parse-items-too-search-results" });

        search.onChange( (q) => this.render(q) );

        // Auto-cleaned when the view unloads:
        const ref: EventRef = this.plugin.mySpellary.on( "changed", () => this.render() );
        this.registerEvent(ref); // OK: ref is EventRef

        //have to render as soon as Spellary is ready:
        // - if spellary is not ready yet, it should trigger a render soon
        if( this.plugin.mySpellary.isReady ) this.render("");
    }

    private requestRender = (() => {
        let queued = false;
        return () => {
            if( queued ) return;
            queued = true;
            requestAnimationFrame( () => { queued = false; this.render(); });
        };
    })();

    public render = (q: string ) =>  //arrow function
    {
        //search:
        let results: MySpell[];
        results = this.plugin.mySpellary.getSpells();                  //should we ONLY get this when spellary is updated?
        this.classArray = this.plugin.mySpellary.getClasses();         //should we ONLY get this when spellary is updated?

        if( this.levelQuery >= 0 )
        {
            //console.log('got number: ' + this.levelQuery);
            results = results
                        .filter( spell => spell.levelInt === this.levelQuery );
        }

        if( this.classQuery !== "" )
        {
            //console.log('got number: ' + this.levelQuery);
            results = results
                        .filter( spell => spell.classArray.includes(this.classQuery) );
        }

        const dirMul = this.sort.dir === "asc" ? 1 : -1;
        if( !q || q === "" )
        {
            //console.debug("Parse Spells too: MySpellView.render()");
            //console.debug("all");
            results = results.slice()    //clone not to modify source??
                            .sort((a, b) => compareByKey(a, b, this.sort.key) * dirMul)
                            .slice( 0, 200 );
                            //.map(i => ({ i, m: null }));
        }
        else
        {   //text search --> sorting is off - best match comes first
            //console.debug("Parse Spells too: MySpellView.render("+q+")");
            //console.debug("subset");
            const score = prepareFuzzySearch( q );
            results = results.map(i => ({ i, m: score(i.name) }))  //add score to MySpell object
                              .filter( x => x.m )
                              .sort( (a, b) => b.m!.score - a.m!.score )    //sort by score - ignore the sorting menu
                              .map( x => x.i )                                  //map back to MySpell object
                              .slice( 0, 50 );                                //maximum 50 spells shown
            //console.debug('after map', results[0]);
        }
        //console.debug("Parse Spells too: MySpellView.render() results: " + results[0].name);
        //results = this.plugin.mySpellary.getSpells();
        //sort:

        //display:
        if( this.sort.dir === "asc")
            setIcon( this.sortEl,'sort-asc');
        else
            setIcon( this.sortEl,'sort-desc');

        //setIcon( this.filterLevelEl, 'sliders-horizontal '); //why again?

        const container = this.resultsEl;
        container.empty();

        if( results.length == 0 ) return;

        const table = container.createEl("table", { cls: "parse-items-too-spell-table" });
        //const thead = table.createEl("thead");
        const tbody = table.createEl("tbody");
        //const header = thead.createEl("tr");
        //header.createEl( "th", "" );
        //header.createEl( "th", "" );
        //header.createEl( "th", "" );
    //    header.createEl( "th", "" );
    //    header.createEl( "th", "" );

        tbody.empty();

        for( const i of results )
        {
            /*let  detail: string = "";
            detail += (i.level === "" ? "" : i.level + ', ');
            detail += (i.castingtime === "" ? "" : i.castingtime + ', ');
            detail += (i.components === "" ? "" : i.components + ', ');
            detail += (i.ritual ? " (ritual)" : "");*/

            const detail = i.detail;

            const tr = tbody.createEl("tr", { cls: "parse-items-too-spell-row", attr: { tabindex: "0" } });
            const td = tr.createEl( "td", { cls: "parse-items-too-spell-cell" } );
            const name = td.createDiv( { cls: "parse-items-too-spell" } );
                td.createDiv( { text: detail, cls: "parse-items-too-spell-detail" } );
            name.createEl( "span", { text: i.name, cls: "parse-items-too-spell-name" } );
            if( i.school !== "" ) name.createEl( "span", { text: " (" + i.school + ")", cls: "parse-items-too-spell-detail" } );

            const insertLink = tr.createEl( "td", { text: "", cls: "parse-items-too-spell-cell-button" } );
            setIcon( insertLink,'link');
            const insertBox = tr.createEl( "td", { text: "", cls: "parse-items-too-spell-cell-button" } );
            setIcon(insertBox,'gallery-vertical');
            const go = tr.createEl( "td", { text: "", cls: "parse-items-too-spell-cell-button" } );
            setIcon( go,'external-link');

            td.addEventListener( "click", () => this.clickSpell( i ));
            td.addEventListener( "contextmenu", ( evt ) => this.rightclickSpell( i, evt ));
            //td.addEventListener( "keydown", (ev) => {
            //                    if (ev.key === "Enter") this.clickSpell(i); });

            insertLink.addEventListener( "click", () => this.clickLink( i ));
            insertLink.addEventListener( "contextmenu", ( evt ) => this.rightclickLink( i, evt ));

            insertBox.addEventListener( "click", () => this.clickBox( i ));
            //insertBox.addEventListener( "contextmenu", ( evt ) => this.rightclickBox( i, evt ));

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
    }

    private rightclickSpell( i: MySpell, evt: MouseEvent )
    {
        console.debug( "rightclick on: " + i.name );
    }

    private clickLink( i: MySpell )
    {
        console.debug("click link...");
        void this.plugin.insertIntoEditor( i.markdownlink + '{icon=spell}' );
    }

    private rightclickLink( i: MySpell, evt: MouseEvent )
    {
        console.debug("rightclick link...");
    }

    private clickBox( i: MySpell )
    {   // cannot use createElement() or createDiv(), because it will throw an error because of the vault relative path in the <img> imgTag
        // the vault relative path is needed, though, so the paths dont break when synicing the vault to a different computer.
        // --> html block has to be created as a string:
        //const spellSVG = "x";

        const svgString = getIconSVG( 'scroll' );

        const header = '<div class="parse-items-too-editor-spell-header"><div class="parse-items-too-editor-spell-icon">' + svgString + '</div><div class="parse-items-too-editor-spell-name">' + i.name + '</div><div class="parse-items-too-editor-spell-school"> (' + i.school + ')</div></div>';

        const pre = '<div class="parse-items-too-editor-spell-box"><div class="parse-items-too-editor-textblock">' + header + '<div class="parse-items-too-editor-spell-text">' + i.detail + '</div><div class="parse-items-too-editor-spell-text">' + i.infotext + '</div><a class="internal-link" href="'+i.filePath+'">go to source</a></div>';
        const post = '</div>';
        let imgTag: string = '';
        if( i.imagePath !== "" )
        { imgTag = '<div class="parse-items-too-editor-imgblock"><div class="parse-items-too-editor-imgbgblock"><img src="' + i.imagePath + '"></div></div>'; }
        void this.plugin.insertIntoEditor( pre + imgTag + post );
    }


    private clickGo( i: MySpell )
    {
        console.debug("click go...");
        void this.plugin.openInEditor( i.markdownlink );
    }

    private rightclickGo( i: MySpell, evt: MouseEvent )
    {
        console.debug("rightclick go...");
    }




    private openFilterLevelMenu( evt: MouseEvent )
    {
        const m = new Menu( this.plugin );

        for (let index = 0; index < this.levelString.length; index++)
        {
            m.addItem( ( menuItem ) => {
                menuItem.setTitle( this.levelString[index] )
                     .onClick(() => { this.levelQuery = (this.levelQuery === index) ? -1 : index; this.render( this.lastQuery); })
                     .setChecked?.( this.levelQuery === index ); });
        }

        m.showAtMouseEvent(evt);
    }

    private openFilterClassMenu( evt: MouseEvent )
    {
        const m = new Menu( this.plugin );

        for( const characterClass of this.classArray )
        {
            m.addItem( ( menuItem ) => {
                menuItem.setTitle( characterClass )
                     .onClick(() => { this.classQuery = (this.classQuery === characterClass) ? "" : characterClass; this.render( this.lastQuery ); })
                     .setChecked?.( this.classQuery === characterClass ); });
        }

        m.showAtMouseEvent(evt);
    }

    private openSortMenu(evt: MouseEvent)
    {
        const m = new Menu( this.plugin );

        const addSortKey = (title: string, key: SortKey, icon: string) => {
                m.addItem( (spell: MenuItem) => {
                     spell.setTitle(title).setIcon( icon );
                     // setChecked is available in recent Obsidian versions
                     spell.setChecked?.(this.sort.key === key);
                     spell.onClick(() => { this.sort.key = key; this.render( this.lastQuery ); });
                });
            };

        addSortKey("Name", "name", "heading-glyph");
        addSortKey("Level", "level", "star");

        m.addSeparator();

        m.addItem((spell) => {
                const next = this.sort.dir === "asc" ? "desc" : "asc";
                const icon = next === "asc" ? "arrow-up" : "arrow-down";
                const label = next === "asc" ? "Ascending" : "Descending";
                spell.setTitle(`Direction: ${label}`).setIcon( icon ).onClick(() => {
                            this.sort.dir = next;
                            this.render( this.lastQuery );
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
        case "level": return a.levelInt < b.levelInt ? -1 : 1;//return (a.rarityInt ?? "").localeCompare(b.rarityInt ?? "", undefined, { sensitivity: "base", numeric: true });
    }
}
