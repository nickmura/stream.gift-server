import { connectDatabase } from "../../db/config";
import { donations } from "../../db/schema";
import { BalanceChange, Donation } from "../types";



import * as thetajs from '@thetalabs/theta-js'
import 'isomorphic-fetch'




export async function fetchIncomingTxDataTheta(tx_hash:string) {
  const provider = new thetajs.providers.HttpProvider();
  
  let check_already_processed = false //TODO: change this to a select in donations where tx_hash == tx_hash (should return 0)
  if (check_already_processed) return false
  let tx_data
  let i = 0;
  console.log('fetching tx...')
  while (i <= 50 && !tx_data) {
    try {
      
      const tx = await provider.getTransaction(tx_hash)
      if (tx) {
        return tx
      } else {
        tx_data = undefined 
        i++;
      }
    } catch (error) { //@ts-ignore
      console.log(error.message)
    }
  }
  if (tx_data) return tx_data
} 

// export async function fetchIncomingTxBlockSui(client: SuiClient, digest: string) {

//   let tx_block = undefined
//   let i = 0;
//   while (i <= 50 && !tx_block) {
//     try {
//       console.log('requesting...', digest)
//       let tx = await client.getTransactionBlock({ digest: digest, options: { showBalanceChanges: true, showEvents: true,  }});
//       if (tx) {
//         console.log('success, found tx block, ', tx)
//         tx_block = tx
//         break;
//       } else {
//         tx_block = undefined 
//         i++;
//       }
//     } catch (error) { //@ts-ignore
//       console.log(error.message)
//     }
//   }
//   if (tx_block) return tx_block
// }
// export const validateValuesSui = async (client: SuiClient, tx_block:SuiTransactionBlockResponse, sender:string, recipient:string, message:string|undefined) => {
    
//   if (tx_block.balanceChanges) if (tx_block.balanceChanges.length > 0) {
//     console.log('sender, address',tx_block.balanceChanges[0].owner)
//     let r = tx_block.balanceChanges.findIndex(balance => balance.owner?.AddressOwner == recipient ) // checks whether or not the address (streamer) has received a balance change (donation)
//     let s = tx_block.balanceChanges.findIndex(balance => balance.owner?.AddressOwner == sender ) // checks whether or not the address (streamer) has received a balance change (donation)
//     console.log(r, s)

//     if (r > -1 && s > -1) {
//       const senderSUINS = await checkSUINS(String(sender))
      
//       console.log(tx_block.balanceChanges[s].owner, tx_block.balanceChanges[s].owner.AddressOwner)
      
//       const donation = {
//         digest: tx_block.digest,
//         sender: tx_block.balanceChanges[s].owner.AddressOwner,
//         sender_suins: senderSUINS?.name ?? undefined,
//         recipient: tx_block.balanceChanges[r].owner.AddressOwner,
//         amount: Number(tx_block.balanceChanges[r].amount) / 1000000000, // MIST per SUI
//         message: message, // TODO: set this
//       }
//       return donation
//     }
//     else return false

//   } else { return false }
// }

export async function recordDonation(tx_hash: string, streamer:BalanceChange, sender:BalanceChange, message_b64:string) {
  try {
    const db = await connectDatabase();
    const insert = await db.insert(donations).values({
      tx_hash: tx_hash, 
      sender: sender.address, 
      sender_tns: null, 
      recipient: streamer.address, 
      amount: String(streamer.tfuel), 
      message: message_b64 ?? null, 
      completed: false
    }).returning();
    
    return insert
  } catch (error) {
    console.log(error)
  }
}

export async function insertDonationData(donation:Donation) {
  const db = await connectDatabase();
  const insert = await db.insert(donations).values({digest: donation.digest, sender: donation.sender, sender_suins: donation.sender_suins, recipient: donation.recipient, amount: String(donation.amount), message: donation.message ?? null, completed: false}).returning()
  console.log('insert', insert)
  return insert
}