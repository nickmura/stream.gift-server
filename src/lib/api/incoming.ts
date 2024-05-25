import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui.js/dist/cjs/client";

export async function fetchIncomingTxBlock(client: SuiClient, digest: string) {
    let tx_block = undefined
    let i = 0;
    while (i < 50 && !tx_block) {
      try {
        console.log('requesting...')
        let tx = await client.getTransactionBlock({ digest: digest, options: { showBalanceChanges: true, showEvents: true,  }});
        if (tx) {
          tx_block = tx
          console.log('success, found tx block')
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
    let r = tx_block.balanceChanges.findIndex(balance => balance.owner?.AddressOwner == recipient && Number(balance.amount) > 0) // checks whether or not the address (streamer) has received a balance change (donation)
    if (r < -1) return true;
    else return false

  } else { return false }
}

export async function getDonationData(tx_block:SuiTransactionBlockResponse) {
  const donation = {
    
  }

}