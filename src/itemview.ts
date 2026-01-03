import { MarkdownView, ItemView, WorkspaceLeaf, SearchComponent, Menu, prepareFuzzySearch, setIcon } from "obsidian";
import { ParseItemsToo } from "./main"
import { Itemary } from "./itemary"
import { Item, ItemSuggestionModal } from "./item";

export const ITEM_VIEW = "parse-items-too-item-pane";

type SortKey = "name" | "rarity";
type SortDir = "asc" | "desc";

export class MyItemView extends ItemView
{
    private unsubscribe?: () => void;
    // Keep a handle to the results container
    private resultsEl!: HTMLElement;

    private lastQuery = "";
    private sort: { key: SortKey; dir: SortDir } = { key: "name", dir: "asc" };


    constructor(leaf: WorkspaceLeaf, public plugin: ParseItemsToo)
    {
        super(leaf);
        console.log("Parse Items too: constructing MyItemView...")
    }

    async onOpen()
    {
        const root = this.contentEl;
        root.empty();
        root.addClass( "parse-items-too-item-view" );

        const header = root.createDiv("parse-items-too-header")
            const search = new SearchComponent( header.createDiv("parse-items-too-search-bar") );
            search.setPlaceholder("search for items...");
            const filter = header.createDiv( { cls: "parse-items-too-filter" } );
            setIcon(filter,'sort-asc');
            filter.addEventListener( "click", (evt) => this.openSortMenu(evt) );


        this.resultsEl = root.createDiv({ cls: "parse-items-too-search-results" });

        search.onChange( (q) => this.render(q) );
        this.render("");

        const handler = () => this.render();
        // Auto-cleaned when the view unloads:
        this.registerEvent(this.plugin.myItemary.on("changed", handler));
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
            const dirMul = this.sort.dir === "asc" ? 1 : -1;
            results = this.plugin.myItemary.getItems()
                            .slice()    //clone not to modify source??
                            .sort((a, b) => compareByKey(a, b, this.sort.key) * dirMul)
                            .slice( 0, 200 )
                            .map(i => ({ i, m: null }));

            console.log("all");
        }
        else
        {
            console.log("subset");
            const score = prepareFuzzySearch( q );
            results = this.plugin.myItemary.getItems()
                              .map(i => ({ i, m: score(i.name) }))
                              .filter( x => x.m )
                              .sort( (a, b) => a.m!.score - b.m!.score )    //sort by score
                              .slice( 0, 50 );                              //maximum 50 items shown
        }
        //sort:

        //display:
        const container = this.resultsEl;
        container.empty();

        if( results.length == 0 ) return;

        const table = container.createEl("table", { cls: "parse-items-too-items-table" });
        const thead = table.createEl("thead");
        const tbody = table.createEl("tbody");
        const header = thead.createEl("tr");
        header.createEl( "th", "Name" );
        header.createEl( "th", "" );
        header.createEl( "th", "" );
        header.createEl( "th", "" );

        tbody.empty();

        for( const { i } of results )
        {
            const tr = tbody.createEl("tr", { cls: "parse-items-too-items-row", attr: { tabindex: "0" } });
            const td = tr.createEl( "td", { cls: "parse-items-too-tem-cell" } );
                td.createDiv( { text: i.name, cls: "parse-items-too-item-name" } );
                td.createDiv( { text: i.detail, cls: "parse-items-too-item-detail" } );

            const insertLink = tr.createEl( "td", { text: "", cls: "parse-items-too-item-cell-button" } );
            setIcon(insertLink,'link');
            const insertBox = tr.createEl( "td", { text: "", cls: "parse-items-too-item-cell-button" } );
            setIcon(insertBox,'gallery-vertical');
            const go = tr.createEl( "td", { text: "", cls: "parse-items-too-item-cell-button" } );
            setIcon(go,'external-link');

            td.addEventListener( "click", () => this.clickItem( i ));
            td.addEventListener( "contextmenu", () => this.clickItem( i ));
            //td.addEventListener( "keydown", (ev) => {
            //                    if (ev.key === "Enter") this.clickItem(i); });
            insertLink.addEventListener( "click", () => this.insertLink(i));
            insertBox.addEventListener( "click", () => this.insertBox(i));
            go.addEventListener( "click", () => this.goItem(i));


        }
    };



    private clickItem( i: MyItem )
    {
        console.log( "clicked on: " + i.name );
    }

    private goItem( i: MyItem )
    {
        console.log("go...");
        this.plugin.openInEditor( i.markdownlink );
    }

    private insertLink( i: MyItem )
    {
        console.log("insert link...");
        this.plugin.insertIntoEditor( i.markdownlink );
    }

    private insertBox( i: MyItem )
    {

        //const root = this.plugin.document.createElement("div");
        const root = document.createElement("div");
        const container = root.createDiv({ cls: "parse-items-too-editor-item-box" });
        const textblock = container.createDiv({ cls: "parse-items-too-editor-textblock" });

            textblock.createDiv( { text: i.name, cls: "parse-items-too-editor-item-name" } );
            textblock.createDiv( { text: i.detail + " " + i.infotext, cls: "parse-items-too-editor-item-text" } );
            //textblock.createDiv( { text: i.detail + " " + i.infotext, cls: "parse-items-too-editor-item-text" } );

        if( i.imagePath !== "" )
        {
            const imgblock = container.createDiv({ cls: "parse-items-too-editor-imgblock" });
            imgblock.createDiv( { cls: "parse-items-too-editor-imgbgblock" } )
                .createEl( "img", { attr: {src: i.imagePath, alt: i.name} } );
        }

        const fullHtml = root.innerHTML;
        this.plugin.insertIntoEditor( fullHtml );
    }

    private openSortMenu(evt: MouseEvent)
    {
        const m = new Menu( this.plugin );

        const addSortKey = (title: string, key: SortKey, icon: string) => {
                m.addItem((item) => {
                     item.setTitle(title).setIcon(icon);
                     // setChecked is available in recent Obsidian versions
                     (item as any).setChecked?.(this.sort.key === key);
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
        console.log("Parse Items too: close MyItemView...")
    }

    getDisplayText(): string {
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
