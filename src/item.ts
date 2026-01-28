import { App, FuzzySuggestModal } from "obsidian";

export interface MyVariant
{
    name: string,
    markdownlink: string,
}

export interface MyItem
{
    name: string;
    markdownlink: string;
    imagePath: string;
    filePath: string;
    detail: string;
    infotext: string;
    cost: string | number;
    weight: string | number;
    damage: string | number;
    damage2: string | number;
    ac: string | number;
    range: string | number;
    rarity: string;
    rarityInt: number;
    type: string;
    variants: MyVariant[];
    source: string;
}


export class ItemSuggestionModal extends FuzzySuggestModal<MyItem>
{
    constructor( plugin: App, private items: MyItem[], private onPick: (i: MyItem )=> void)
    {
        super(plugin);
        this.setPlaceholder("Pick an item...")
    }
    getItemText(item: MyItem): string
    {
        return item.name;
    }
    getItems(): MyItem[]
    {
        return this.items;
    }
    onChooseItem( item: MyItem ): void
    {
        this.onPick( item );
    }
}
