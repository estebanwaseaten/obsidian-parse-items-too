import { ItemView, WorkspaceLeaf } from "obsidian";
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

    onLoad()
    {
        console.log("Parse Items too: loading MyItemView...")
        this.render();
    }

    async render()
    {
        console.log("Parse Items too: render() MyItemView...")
        this.statblockEl.createEl("em", { text: "Rendering Item..."  });
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
