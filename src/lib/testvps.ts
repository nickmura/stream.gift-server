

import { connectDatabase } from '@/db/config';
import * as thetajs from '@thetalabs/theta-js'
import { ethers } from 'ethers';
import 'isomorphic-fetch'

export async function fetchIncomingTxDataTheta(tx_hash:string) {
    const provider = new thetajs.providers.HttpProvider();

    let tx_data
    let i = 0;


    while (i <= 50 && !tx_data) {
      try {
        
        const tx = await provider.getTransaction(tx_hash)
        if (tx) {
          return tx
          break;
        } else {
          tx_data = undefined 
          i++;
        }
      } catch (error) { //@ts-ignore
        console.log(error.message)
      }
    }
    if (tx_data) return tx_data
  } fetchIncomingTxDataTheta('0x22cbf9172dd563a2b135c5efc69339a9847007312fc9ac5a478c57a5fc52562a')

type BalanceChangesResponse = {
  TxHash: String,
  BalanceChanges: BalanceChange[]

}

type BalanceChange = {
  address: string,
  token_type: number,
  is_negative: boolean,
  delta: number // Amount in WEI
  tfuel: string // delta in denominated form
}
 function validateValues(tx_data:BalanceChangesResponse, streamer_address:string, sender_address:string){
    let balanceChanges = tx_data.BalanceChanges
    console.log(balanceChanges)
    let streamer = balanceChanges[balanceChanges.findIndex((balance:BalanceChange) => balance.address == streamer_address && !balance.is_negative )]
    
    let sender = balanceChanges[balanceChanges.findIndex((balance:BalanceChange) => balance.address == sender_address && balance.is_negative )]
    if (streamer.address = streamer_address) {
    streamer.tfuel = ethers.utils.formatEther(String(streamer.delta))
    sender.tfuel = ethers.utils.formatEther(String(sender.delta))
    
      return { streamer: streamer, sender: sender }
    } else {
      return false
    }
  }
  

  async function RunTest(reqStreamer:string, sender_address:string, reqMessage:string) {
    
    const tx = await fetchIncomingTxDataTheta('0x22cbf9172dd563a2b135c5efc69339a9847007312fc9ac5a478c57a5fc52562a') //@ts-ignore
    const streamer_address = getStreamerAddress(reqStreamer)
    const validate = validateValues(tx.blance_changes, streamer_address, `0x4ae87a25b78fe0b7d6a9a37aad75bc3f01c61094`)
    if (validate) {
      
      //TODO: RECORDING THE TRANSACTION
      let streamer = validate['streamer']
      let sender = validate['sender']

    }




  } RunTest('nickmura2', `0x4ae87a25b78fe0b7d6a9a37aad75bc3f01c61094`, `sdiojdsojigdjiodg`)

  const getStreamerAddress = (streamer:string) => {
    return '0x97b309f5f6c5ee3f1db263bc65bff8d33b34bd92'
  }

  async function recordDonation(streamer:BalanceChange, sender:BalanceChange) {
    const db = await connectDatabase();
    

  }