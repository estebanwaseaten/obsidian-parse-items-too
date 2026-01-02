import { ItemView, WorkspaceLeaf, SearchComponent } from "obsidian";
import { ParseItemsToo } from "./main"
import { Itemary } from "./itemary"
import { Item, ItemSuggestionModal } from "./item";

export const ITEM_VIEW = "parse-items-too-item-pane";

export class MyItemView extends ItemView
{
    plugin: ParseItemsToo;

    constructor(leaf: WorkspaceLeaf, public plugin: ParseItemsToo)
    {
        this.plugin = plugin;
        console.log("Parse Items too: constructing MyItemView...")
        super(leaf);
        this.load();    //??
    }

    async onOpen()
    {
        console.log("Parse Items too: open MyItemView...")
        this.contentEl.empty();

        const search = new SearchComponent(this.contentEl.createDiv("item-view-search"))

        const suggester = new ItemSuggestionModal( this.plugin.app, this.plugin.myItemary.getItems(), (picked) => {new Notice(`You picked ${picked.name}`);});
        suggester.open();

        this.contentEl.createEl('h4', { text: 'Example view' });
        this.contentEl.createEl('div', { text: 'a div' });
        //this.render();
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
