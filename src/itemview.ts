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
        console.log("Parse Items too: open MyItemView...")
        this.contentEl.empty();

        const search = new SearchComponent(this.contentEl.createDiv("item-view-search"))
        search.setPlaceholder("search for items...");

        const container = this.contentEl.createDiv({ cls: "item-search" });

        const render = (q: string) => {
            console.log("render(): " + q);
            //search:
            if( !q ) return;
            const score = prepareFuzzySearch(q);
            const results = this.plugin.myItemary.getItems()
                              .map(i => ({ i, m: score(i.name) }))
                              .filter( x => x.m )
                              .sort( (a, b) => a.m!.score - b.m!.score )    //sort by score
                              .slice( 0, 50 );                              //maximum 50 items shown

            //display:
            const table = container.createEl("table", { cls: "my-items-table" });
            const thead = table.createEl("thead");
            const tbody = table.createEl("tbody");
            const header = thead.createEl("tr");
            header.createEl( "th", "Name" );

            tbody.empty();

            for( const { i } of results )
            {
                const tr = tbody.createEl("tr", { cls: "my-items-row" });
                tr.createEl( "td", {text: i.name })

                tr.addEventListener( "click", () => doSomething?.( i ));
                tr.addEventListener("keydown", (ev) => {
                                    if (ev.key === "Enter") doSomething?.(i);
                                });
                tr.tabIndex = 0;
            }
        };

        search.onChange( render );

        //const suggester = new ItemSuggestionModal( this.plugin.app, this.plugin.myItemary.getItems(), (picked) => {new Notice(`You picked ${picked.name}`);});
        //suggester.open();

    //    this.contentEl.createEl('h4', { text: 'Example view' });
    //    this.contentEl.createEl('div', { text: 'a div' });
        //this.render();
        render("");
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
