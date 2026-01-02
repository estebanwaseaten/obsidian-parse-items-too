import { ParseItemsToo } from "./main"
import { MyItem } from "./item";

export class Itemary
{
    #items: MyItem[] = []

    constructor( plugin: ParseItemsToo )
    {

        files = plugin.app.vault.getMarkdownFiles();
        for( const file of files )
        {
            const frontMatter = plugin.app.metadataCache.getFileCache( file )?.frontmatter;
            if( !fm ) continue;
            items.push( extractItemsFromFile( f, fm ) )
        }

    }

    extractItemsFromFile( file: TFile, frontmatter: any ): MyItem[]
    {
        console.log("extract...");
    }
}
