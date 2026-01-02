import { App, Editor, MarkdownView, Modal, Notice, Plugin, Events, TFile } from 'obsidian';

import { ParseItemsToo } from "./main"
import { MyItem } from "./item";

export class Itemary extends Events
{
    #items: MyItem[] = []

    /*constructor()
    {
        super(this);
    }*/

    build( plugin: ParseItemsToo )
    {
        const files = plugin.app.vault.getMarkdownFiles();
        for( const file of files )
        {
            const frontMatter = plugin.app.metadataCache.getFileCache( file )?.frontmatter;
            if( !frontMatter ) continue;
            if( !hasCssClass( frontMatter, "json5e-item" ) ) continue;

            this.#items.push( extractItemsFromFrontmatter( file, frontMatter ) );
            this.#items = this.#items.filter(x => x != null);
        }

        for( const item of this.#items )
        {
            console.debug( item.name + ": " + item.detail );
        }

        this.trigger("changed"); //notifies all listeners
    }

    getItems(): readonly MyItem[]
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
    //try to get the item name from dndata-name, aliases or filename
    let name: String = "";
    if( typeof frontmatter["dndata-name"] === "string" )
    {
        name = frontmatter["dndata-name"];
        console.log("extract..." );
    }
    else if( Array.isArray(frontmatter?.["aliases"]) )
    {
        name = frontmatter["aliases"][0];
        console.log("extract..." + frontmatter["aliases"][0] );
    }
    else //maybe add a setting to skip (i.e. return null)
    {
        name = file.basename;
    }

    //extract link to file
    const sourcePath = file.path;
    const link = this.app.fileManager.generateMarkdownLink( file, sourcePath, "", name );

    //parse detail
    //remove links:
    let detailstring = frontmatter["dndata-detail"]
                            // remove " ([text](url))"
                            ?.replace(/\s*\(\[[^\]]*]\([^)]+\)\)/g, "")
                            // fix spaces before commas
                            .replace(/\s+,/g, ",")
                            // collapse double spaces and trim
                            .replace(/\s{2,}/g, " ")
                            .trim();

    //must return item
    return {
            name: name,
            link: link,
            detail: detailstring,
            imagePath: frontmatter["dndata-image"],
            cost: frontmatter["dndata-cost"],
            weight: frontmatter["dndata-weight"],
            damage: frontmatter["dndata-damage"],
            damage2: frontmatter["dndata-damage2"],
            ac: frontmatter["dndata-ac"],
            range: frontmatter["dndata-range"],
        };
}
