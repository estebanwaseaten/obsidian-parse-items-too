import { App, Editor, MarkdownView, Modal, Notice, Plugin } from 'obsidian';

import { ParseItemsToo } from "./main"
import { MyItem } from "./item";

export class Itemary
{
    #items: MyItem[] = []

    constructor()
    {

    }

    build( plugin: ParseItemsToo )
    {
        const files = plugin.app.vault.getMarkdownFiles();
        for( const file of files )
        {
            const frontMatter = plugin.app.metadataCache.getFileCache( file )?.frontmatter;
            if( !frontMatter ) continue;
            this.#items.push( this.extractItemsFromFrontmatter( file, frontMatter ) )
        }
    }

    get items(): readonly MyItem[]
    {
        return this.#items;
    }

    extractItemsFromFrontmatter( file: TFile, frontmatter: any ): MyItem[]
    {


        const raw = frontmatter?.items;

        console.log("extract..." + raw );

        //must return item
        return null;
    }

    extractOneItem(): MyItem | null
    {
    return {
            name: "test",
            filePath: "path",
            details: "details",
            cost: 1,
            weight: 1,
            damage: 2,
            damage2: 3,
            ac: "+2",
            range: 20,
        };
    }
}
