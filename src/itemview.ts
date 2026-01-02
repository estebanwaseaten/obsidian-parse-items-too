import { ItemView, WorkspaceLeaf } from "obsidian";
import { ParseItemsToo } from "./main"

export const ITEM_VIEW = "parse-items-too-creature-pane";

export class ItemView extends ItemView
{
    constructor(leaf: WorkspaceLeaf, public plugin: ParseItemsToo)
    {
        console.log("Parse Items too: constructing ItemView...")
        super(leaf);
        this.load();    //??
    }

    onLoad()
    {
        console.log("Parse Items too: loading ItemView...")
    }
}
