import { CollectionItem } from "../types";


const pageIndex = 2
const pageLength = 50 


export async function checkMobileDonation(address:string, timestamp: number) { // Works only for main-net.
    const account:any = checkAccountActivity(address)
    try {
        
    } catch (error) {
        console.log(error)
    }
    // return res?.result.data
}

export async function checkAccountActivity(address:string) { // Works only for main-net.
    const api = `https://api.blockvision.org/v2/sui/account/activities`
    try {
        console.log('test')
        let res = await fetch(`${api}?address=${address}`, {
            headers: {
                "x-api-key": process.env.BLOCKVISION_API_KEY ?? "",
            }
        });
        if (!res.ok) console.log(res.status, res.statusText)
        res = await res.json()
        console.log(`checkAccountActivity (${address}):`, res) //@ts-ignore
        return res.data

    } catch (error) { //@ts-ignore
        console.log(error?.message)
    }
    
    // return res?.result.data
}
async function RecordDataCache(res:any) {

    if (res.length > 0) {
        console.log(res[0].coinChanges[0].amount)
        console.log(res, res.length)
    }

}



export async function checkSUINS(address:string) { // Works only for main-net.
    const api = `https://api.blockvision.org/v2/sui/account/nfts`
    try {
        console.log('test')
        let res = await fetch(`${api}?account=${address}`, {
            headers: {
                "x-api-key": process.env.BLOCKVISION_API_KEY ?? "",
            }
        });
        if (!res.ok) console.log(res.status, res.statusText)
        res = await res.json() // @ts-ignore
        console.log(`checkSUINS (${address}):`, res?.result.data) //@ts-ignore
        const nfts:CollectionItem[] = res?.result.data //@ts-ignore
        const suins_index = nfts.findIndex(nft=> nft.collection == `0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0::suins_registration::SuinsRegistration`)

        if (suins_index > -1) return nfts[suins_index]
    } catch (error) { //@ts-ignore
        console.log(error?.message)
    }

}