import { connectDatabase } from "../../db/config";
import { donations } from "../../db/schema";
import { Donation } from "@lib/types";
import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui.js/dist/cjs/client";

export async function fetchIncomingTxBlock(client: SuiClient, digest: string) {
    let tx_block = undefined
    let i = 0;
    while (i < 50 && !tx_block) {
      try {
        console.log('requesting...')
        let tx = await client.getTransactionBlock({ digest: digest, options: { showBalanceChanges: true, showEvents: true,  }});
        if (tx) {
          console.log('success, found tx block')
          tx_block = tx
          return tx_block
        } else {
          i++
        }
  
      } catch (error) { //@ts-ignore
        console.log(error.message)
        return undefined
      }
    }
    if (tx_block) {
      console.log(tx_block)
      return tx_block
    }
}

export const validateValues = (tx_block:SuiTransactionBlockResponse, recipient:string) => {
    
  if (tx_block.balanceChanges) if (tx_block.balanceChanges.length > 0) {
    console.log(tx_block.balanceChanges[0].owner)
    let r = tx_block.balanceChanges.findIndex(balance => balance.owner?.AddressOwner == recipient ) // checks whether or not the address (streamer) has received a balance change (donation)
    let s = tx_block.balanceChanges.findIndex(balance => balance.owner?.AddressOwner != recipient) // checks whether or not the address (streamer) has received a balance change (donation)
    console.log(r, s)
    if (r > -1 && s > -1) {
      const donation = {
        digest: tx_block.digest,
        sender: tx_block.balanceChanges[s].owner.AddressOwner,
        recipient: tx_block.balanceChanges[r].owner.AddressOwner,
        amount: Number(tx_block.balanceChanges[r].amount) / 1000000000
      }
      return donation
    }
    else return false

  } else { return false }
}

export async function insertDonationData(donation:Donation) {
  const db = await connectDatabase();
  const insert = await db.insert(donations).values({digest: donation.digest, sender: donation.sender, recipient: donation.recipient, amount: String(donation.amount)}).returning()
  console.log('insert', insert)


}