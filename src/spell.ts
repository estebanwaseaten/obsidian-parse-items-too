import { App, FuzzySuggestModal } from "obsidian";

export interface MySpell
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
    sadsad: number;
}


export class SpellSuggestionModal extends FuzzySuggestModal<MySpell>
{
    constructor( plugin: App, private spells: MySpell[], private onPick: (i: MySpell )=> void)
    {
        super(plugin);
        this.setPlaceholder("Pick an spell...")
    }
    getSpellText(spell: MySpell): string
    {
        return spell.name;
    }
    getSpells(): MySpell[]
    {
        return this.spells;
    }
    onChooseSpell( spell: MySpell ): void
    {
        this.onPick( spell );
    }
}
