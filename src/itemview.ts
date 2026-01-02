import { MarkdownView, ItemView, WorkspaceLeaf, SearchComponent, prepareFuzzySearch, setIcon } from "obsidian";
import { ParseItemsToo } from "./main"
import { Itemary } from "./itemary"
import { Item, ItemSuggestionModal } from "./item";

export const ITEM_VIEW = "parse-items-too-item-pane";

export class MyItemView extends ItemView
{
    private unsubscribe?: () => void;
    // Keep a handle to the results container
    private resultsEl!: HTMLElement;

    constructor(leaf: WorkspaceLeaf, public plugin: ParseItemsToo)
    {
        super(leaf);
        console.log("Parse Items too: constructing MyItemView...")
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
            results = this.plugin.myItemary.getItems()
                            .slice()    //clone not to modify source??
                            .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true }))
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

    async onOpen()
    {
        const root = this.contentEl;
        root.empty();
        root.addClass( "parse-items-too-item-view" );

        const search = new SearchComponent( root.createDiv("parse-items-too-search-bar") )
        search.setPlaceholder("search for items...");

        //const container = root.createDiv({ cls: "search-results" });
        this.resultsEl = root.createDiv({ cls: "parse-items-too-search-results" });

        search.onChange( (q) => this.render(q) );
        this.render("");

        const handler = () => this.render();
        // Auto-cleaned when the view unloads:
        this.registerEvent(this.plugin.myItemary.on("changed", handler));
    }

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
