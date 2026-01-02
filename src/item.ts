import { App, FuzzySuggestModal, Plugin, TFile } from "obsidian";

export interface MyItem
{
    name: string;
    link: string;
    markdownlink: string;
    imagePath: string;
    detail: string;
    infotext: string;
    cost: string | number;
    weight: string | number;
    damage: string | number;
    damage2: string | number;
    ac: string | number;
    range: string | number;
    rarity: string;
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


/*    renderNote( noteEL: HTMLElement, result: FuzzyMatch<Monster> ): void {
        const { item, match } = result;
        renderMatches(noteEL, stringify(item.source), match.matches);
    }
    renderTitle(titleEl: HTMLElement, result: FuzzyMatch<Monster>): void {
        const { item, match } = result;
        renderMatches(titleEl, stringify(item.name), match.matches);
    }*/
}
