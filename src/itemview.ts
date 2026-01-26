import { EventRef, ItemView, WorkspaceLeaf, SearchComponent, Menu, prepareFuzzySearch, setIcon, Notice } from "obsidian";
import type { MenuItem } from "obsidian";
import type ParseItemsToo from "./main";     //only for default export
import { MyVariant, MyItem } from "./item";       //general export
import { getIconSVG } from "./common";
//import type { MyVariant, MyItem } from "./item";       //general export

export const ITEM_VIEW = "parse-items-too-item-pane";

type SortKey = "name" | "rarity";
type SortDir = "asc" | "desc";

export class MyItemView extends ItemView
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


    constructor(leaf: WorkspaceLeaf, public readonly plugin: ParseItemsToo)
    {
        super(leaf);
        console.debug("Parse Items too: MyItemView.constructor() ");
    }

    async onOpen()
    {
        console.debug("Parse Items too: MyItemView.onOpen()");
        const root = this.contentEl;
        root.empty();
        root.addClass( "parse-items-too-item-view" );

        const header = root.createDiv("parse-items-too-header")
            const search = new SearchComponent( header.createDiv("parse-items-too-search-bar") );
            search.setPlaceholder("Search for items...");
            this.filterEl = header.createDiv( { cls: "parse-items-too-filter" } );
            setIcon(this.filterEl,'sort-asc');
            this.filterEl.addEventListener( "click", (evt) => this.openSortMenu(evt) );

        this.resultsEl = root.createDiv({ cls: "parse-items-too-search-results" });

        search.onChange( (q) => this.render(q) );

        // Auto-cleaned when the view unloads:
        const ref: EventRef = this.plugin.myItemary.on( "changed", () => this.render() );
        this.registerEvent(ref); // OK: ref is EventRef

        //have to render if itemary is ready - or better: as soon as itemary is read
        // - if itemary is not ready yet, it should trigger a render soon
        if( this.plugin.myItemary.isReady ) this.render("");
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

        let results: MyItem[];

        if( !q || q === "" )
        {
            //console.debug("Parse Items too: MyItemView.render()");
            const dirMul = this.sort.dir === "asc" ? 1 : -1;
            results = this.plugin.myItemary.getItems()
                            .slice()    //clone not to modify source??
                            .sort((a, b) => compareByKey(a, b, this.sort.key) * dirMul)
                            .slice( 0, 200 );
                            //.map(i => ({ i, m: null }));

            //console.debug("all");
        }
        else
        {
            //console.debug("Parse Items too: MyItemView.render("+q+")");
            //console.debug("subset");
            const score = prepareFuzzySearch( q );
            results = this.plugin.myItemary.getItems()
                              .map(i => ({ i, m: score(i.name) }))  //add score to MyItem object
                              .filter( x => x.m )
                              .sort( (a, b) => a.m!.score - b.m!.score )    //sort by score
                              .map( x => x.i )                                  //map back to MyItem object
                              .slice( 0, 50 );                                //maximum 50 items shown
            //console.debug('after map', results[0]);

        }
        //console.debug("Parse Items too: MyItemView.render() results: " + results[0].name);
        //results = this.plugin.myItemary.getItems();
        //sort:

        //display:
        if( this.sort.dir === "asc")
            setIcon(this.filterEl,'sort-asc');
        else
            setIcon(this.filterEl,'sort-desc');

        const container = this.resultsEl;
        container.empty();

        if( results.length == 0 ) return;

        const table = container.createEl("table", { cls: "parse-items-too-item-table" });
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
            const tr = tbody.createEl("tr", { cls: "parse-items-too-item-row", attr: { tabindex: "0" } });
            const td = tr.createEl( "td", { cls: "parse-items-too-item-cell" } );
                td.createDiv( { text: i.name, cls: "parse-items-too-item-name" } );
                td.createDiv( { text: i.detail, cls: "parse-items-too-item-detail" } );

            const insertLink = tr.createEl( "td", { text: "", cls: "parse-items-too-item-cell-button" } );
            setIcon(insertLink,'link');
            const insertBox = tr.createEl( "td", { text: "", cls: "parse-items-too-item-cell-button" } );
            setIcon(insertBox,'gallery-vertical');
            const go = tr.createEl( "td", { text: "", cls: "parse-items-too-item-cell-button" } );
            setIcon(go,'external-link');

            td.addEventListener( "click", () => this.clickItem( i ));
            td.addEventListener( "contextmenu", ( evt ) => this.rightclickItem( i, evt ));
            //td.addEventListener( "keydown", (ev) => {
            //                    if (ev.key === "Enter") this.clickItem(i); });
            insertLink.addEventListener( "click", () => this.clickLink( i ));
            insertLink.addEventListener( "contextmenu", ( evt ) => this.rightclickLink( i, evt ));

            insertBox.addEventListener( "click", () => this.clickBox( i ));

            go.addEventListener( "click", () => this.clickGo( i ));
            go.addEventListener( "contextmenu", ( evt ) => this.rightclickGo( i, evt ));
        }
    };


    private clickItem( i: MyItem )
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

    private rightclickItem( i: MyItem, evt: MouseEvent )
    {
        console.debug( "rightclick on: " + i.name );
    }

    private clickLink( i: MyItem )
    {
        console.debug("click link...");
        if( i.variants?.length > 0 )
            new Notice( "Right click vor variants..." );

        void this.plugin.insertIntoEditor( i.markdownlink + '{icon=' + i.type + '}' );
    }

    private rightclickLink( i: MyItem, evt: MouseEvent )
    {
        console.debug("rightclick link...");
        this.makeVariantMenu( i, evt, (variant) => { void this.plugin.insertIntoEditor( variant.markdownlink ); } );
    }

    private makeVariantMenu( i: MyItem, evt: MouseEvent, clickMethod: (variant: MyVariant) => void  )
    {
        if( i.variants.length > 0 )
        {
            const m = new Menu( this.plugin );

            i.variants.forEach( variant => {
                m.addItem((item) => {
                     item.setTitle(variant.name);
                     item.onClick(() => { clickMethod( variant ); });
                });
            });

            m.showAtMouseEvent(evt);
        }
    }

    private clickGo( i: MyItem )
    {
        console.debug("click go...");
        if( i.variants?.length > 0 )
            new Notice( "Right click vor variants..." );
        void this.plugin.openInEditor( i.markdownlink );
    }

    private rightclickGo( i: MyItem, evt: MouseEvent )
    {
        console.debug("rightclick go...");
         this.makeVariantMenu( i, evt, (variant) => { void this.plugin.openInEditor( variant.markdownlink ); } );
    }

    private clickBox( i: MyItem )
    {   // cannot use createElement() or createDiv(), because it will throw an error because of the vault relative path in the <img> imgTag
        // the vault relative path is needed, though, so the paths dont break when synicing the vault to a different computer.
        // --> html block has to be created as a string:
        let svgString: string = '';
        if( i.type === 'item' )
        {
            svgString = getIconSVG( 'circle-star' );
        }
        else if ( i.type === 'weapon' )
        {
            svgString = getIconSVG( 'sword' );
        }
        else if ( i.type === 'armor' )
        {
            svgString = getIconSVG( 'shield-half' );
        }

        const pre = '<div class="parse-items-too-editor-item-box"><div class="parse-items-too-editor-textblock"><div class="parse-items-too-editor-item-header"><div class="parse-items-too-editor-item-icon">'+ svgString +'</div><div class="parse-items-too-editor-item-name">' + i.name + '</div></div><div class="parse-items-too-editor-item-text">' + i.detail + " " + i.infotext + '</div><a class="internal-link" href="'+i.filePath+'">go to source</a></div>';
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
                m.addItem( (item: MenuItem) => {
                     item.setTitle(title).setIcon(icon);
                     // setChecked is available in recent Obsidian versions
                     item.setChecked?.(this.sort.key === key);
                     item.onClick(() => { this.sort.key = key; this.render(this.lastQuery); });
                });
            };

        addSortKey("Name", "name", "heading-glyph");
        addSortKey("Rarity", "rarity", "star");

        m.addSeparator();

        m.addItem((item) => {
                const next = this.sort.dir === "asc" ? "desc" : "asc";
                const icon = next === "asc" ? "arrow-up" : "arrow-down";
                const label = next === "asc" ? "Ascending" : "Descending";
                item.setTitle(`Direction: ${label}`).setIcon(icon).onClick(() => {
                            this.sort.dir = next;
                            this.render(this.lastQuery);
                        });
                    });

        m.showAtMouseEvent(evt);
    }

    async onClose()
    {
        console.debug("Parse Items too: close MyItemView...")
    }

    getDisplayText(): string {
        // eslint-disable-next-line obsidianmd/ui/sentence-case
        return "D&D Items";
    }
    getIcon(): string {
        return "sword";
    }
    getViewType(): string {
        return ITEM_VIEW;
    }
}

// Helper
function compareByKey(a: MyItem, b: MyItem, key: SortKey): number {
    switch( key )
    {
        case "name": return a.name.localeCompare( b.name, undefined, { sensitivity: "base", numeric: true });
        case "rarity": return a.rarityInt < b.rarityInt ? -1 : 1;//return (a.rarityInt ?? "").localeCompare(b.rarityInt ?? "", undefined, { sensitivity: "base", numeric: true });
    }
}
