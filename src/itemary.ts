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
            if( !hasCssClass( frontMatter, "json5e-item" ) ) continue;

            this.#items.push( extractItemsFromFrontmatter( file, frontMatter ) )
        }
    }

    get items(): readonly MyItem[]
    {
        return this.#items;
    }
}

function hasCssClass(frontMatter: any, cssClass: string): boolean
{
    const raw = frontMatter?.cssclasses ?? frontMatter?.cssclass;
    if( !raw ) return false;

    let temp;
    if( Array.isArray( raw ) )
    {
        temp = raw.map( String );
    }
    else
    {
        temp = String(raw).split(/[,\s]+/).filter(Boolean);
    }
    return temp.includes( cssClass );
}

function extractItemsFromFrontmatter( file: TFile, frontmatter: any ): MyItem
{
    console.log("extract...");
    //console.log("extract..." + frontmatter["dndata-name"] );

    //must return item
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
