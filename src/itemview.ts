import { ItemView, WorkspaceLeaf, SearchComponent, prepareFuzzySearch } from "obsidian";
import { ParseItemsToo } from "./main"
import { Itemary } from "./itemary"
import { Item, ItemSuggestionModal } from "./item";

export const ITEM_VIEW = "parse-items-too-item-pane";

export class MyItemView extends ItemView
{
    //plugin: ParseItemsToo;

    constructor(leaf: WorkspaceLeaf, public plugin: ParseItemsToo)
    {
        super(leaf);

        //this.plugin = plugin;
        console.log("Parse Items too: constructing MyItemView...")
        this.load();    //??
    }

    async onOpen()
    {
        const root = this.contentEl;
        root.empty();
        root.addClass( "my-item-view" );

        const search = new SearchComponent( root.createDiv("search-bar") )
        search.setPlaceholder("search for items...");

        const container = root.createDiv({ cls: "search-results" });

        const render = (q: string) => {
            //search:
            if( !q ) return;
            const score = prepareFuzzySearch( q );
            const results = this.plugin.myItemary.getItems()
                              .map(i => ({ i, m: score(i.name) }))
                              .filter( x => x.m )
                              .sort( (a, b) => a.m!.score - b.m!.score )    //sort by score
                              .slice( 0, 50 );                              //maximum 50 items shown
            //display:
            container.empty();
            const table = container.createEl("table", { cls: "my-items-table" });
            const thead = table.createEl("thead");
            const tbody = table.createEl("tbody");
            const header = thead.createEl("tr");
            header.createEl( "th", "Name" );
            header.createEl( "th", "" );
            header.createEl( "th", "" );

            tbody.empty();

            for( const { i } of results )
            {
                const tr = tbody.createEl("tr", { cls: "my-items-row", attr: { tabindex: "0" } });
                const td = tr.createEl( "td", { cls: "item-cell" } );
                    td.createDiv( { text: i.name, cls: "item-name" } );
                    td.createDiv( { text: i.detail, cls: "item-detail" } );

                tr.createEl( "td", { text: "a", cls: "item-cell-button" } );
                tr.createEl( "td", { text: "b", cls: "item-cell-button" } );

                tr.addEventListener( "click", () => this.clickItem( i ));
                tr.addEventListener( "contextmenu", () => this.clickItem( i ));
                tr.addEventListener( "keydown", (ev) => {
                                    if (ev.key === "Enter") this.clickItem(i);
                                });
            }
        };

        search.onChange( render );
        render("");
    }

    clickItem( i: MyItem )
    {
        console.log( "clicked on: " + i.name );
    }

    async onClose()
    {
        console.log("Parse Items too: close MyItemView...")
    }

    render()    //called by me...
    {
        console.log("Parse Items too: render() MyItemView...")
        this.createEl("em", { text: "Rendering Item..."  });
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
