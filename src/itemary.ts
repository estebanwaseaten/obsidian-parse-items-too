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
            this.#items.push( this.extractItemsFromFile( file, frontMatter ) )
        }
    }

    get items(): readonly MyItem[]
    {
        return this.#items;
    }

    extractItemsFromFile( file: TFile, frontmatter: any ): MyItem[]
    {


        const raw = frontmatter?.items;

        console.log("extract..." + raw.name);

        //must return item
        return null;
    }
}
