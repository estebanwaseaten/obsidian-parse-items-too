import { ItemView, WorkspaceLeaf, SearchComponent } from "obsidian";
import { ParseItemsToo } from "./main"

export const ITEM_VIEW = "parse-items-too-item-pane";

export class MyItemView extends ItemView
{
    constructor(leaf: WorkspaceLeaf, public plugin: ParseItemsToo)
    {
        console.log("Parse Items too: constructing MyItemView...")
        super(leaf);
        this.load();    //??
    }

    async onOpen()
    {
        console.log("Parse Items too: open MyItemView...")
        this.contentEl.empty();

        const search = new SearchComponent(this.contentEl.createDiv("item-view-search"))

        this.contentEl.createEl('h4', { text: 'Example view' });
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
