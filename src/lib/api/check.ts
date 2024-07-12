import { connectDatabase } from "../../db/config";
import { users } from "../../db/schema";
import { ethers} from 'ethers'
import { eq } from "drizzle-orm";
import { BalanceChange, BalanceChangesResponse, CollectionItem, TNSResponseThetaboard } from "../types";


const pageIndex = 2
const pageLength = 50 

export function validateValues(tx_data:BalanceChangesResponse, streamer_address:string, sender_address:string) {
    let balanceChanges = tx_data.BalanceChanges

    let streamer = balanceChanges[balanceChanges.findIndex((balance:BalanceChange) => balance.address == streamer_address && !balance.is_negative )]
    
    let sender = balanceChanges[balanceChanges.findIndex((balance:BalanceChange) => balance.address == sender_address && balance.is_negative )]
    if (streamer.address == streamer_address) {
    streamer.tfuel = ethers.utils.formatEther(String(streamer.delta))
    sender.tfuel = ethers.utils.formatEther(String(sender.delta))
    
      return { streamer: streamer, sender: sender }
    } else {
      return false
    }
  }

export const getStreamerAddress = async (streamer:string) => {
    const db = await connectDatabase()
    const user_from_db = await db.select().from(users).where(eq(users.preferred_username, streamer));
    console.log(user_from_db[0])
    return String(user_from_db[0].evm_streamer_address?.toLowerCase())
}

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



// export async function checkSUINS(address:string) { // Works only for main-net.
//     const api = `https://api.blockvision.org/v2/sui/account/nfts`
//     try {
//         console.log('test')
//         let res = await fetch(`${api}?account=${address}`, {
//             headers: {
//                 "x-api-key": process.env.BLOCKVISION_API_KEY ?? "",
//             }
//         });
//         if (!res.ok) console.log(res.status, res.statusText)
//         res = await res.json() // @ts-ignore
//         console.log(`checkSUINS (${address}):`, res?.result.data) //@ts-ignore
//         const nfts:CollectionItem[] = res?.result.data //@ts-ignore
//         const suins_index = nfts.findIndex(nft=> nft.collection == `0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0::suins_registration::SuinsRegistration`)

//         if (suins_index > -1) return nfts[suins_index]
//     } catch (error) { //@ts-ignore
//         console.log(error?.message)
//     }
// }

export async function checkTNS(address:string) {
    let TNSContract = `0x7daeee00fb89d5c46b8e8387fd9aac79d6910a06`
    let endpoint = `https://thetaboard.io/api/explorer/wallet-nft/${address}?pageNumber=1&search=&artist=&drop=&wallet${address}`
    let res = await fetch(endpoint) //@ts-ignore
    if (!res.ok) throw Error(res.error)
    let tnsResponse:TNSResponseThetaboard = await res.json()
    let tnsIndex = tnsResponse.NFTs.findIndex(nft => nft.contract_addr == TNSContract && nft.owner == address);
    if (tnsIndex > -1) { 
      let tns = tnsResponse.NFTs[tnsIndex].name;
      return tns;
    }
} 