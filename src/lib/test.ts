

import { connectDatabase } from '../db/config';
import { donations, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as thetajs from '@thetalabs/theta-js'
import { ethers } from 'ethers';
import 'isomorphic-fetch'
import dotenv from 'dotenv'

dotenv.config();

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
 function validateValues(tx_data:BalanceChangesResponse, streamer_address:string, sender_address:string) {
    console.log(streamer_address, sender_address)
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
  

  async function RunTest(tx_hash:string, reqStreamer:string, sender_address:string, reqMessage:string) {
    console.log(tx_hash, reqStreamer, sender_address, reqMessage)
    const tx = await fetchIncomingTxDataTheta(tx_hash) //@ts-ignore
    const streamer_address = await getStreamerAddress(reqStreamer)
    console.log(streamer_address)

    const validate = validateValues(tx.blance_changes, streamer_address, sender_address)
    if (validate) {
      //TODO: RECORDING THE TRANSACTION
      let streamer = validate['streamer']
      let sender = validate['sender']
      const donate = await recordDonation(tx_hash, streamer, sender, reqMessage)
      console.log(donate)

    }




  } 
  // RunTest('0x22cbf9172dd563a2b135c5efc69339a9847007312fc9ac5a478c57a5fc52562a', 'nickmura2', `0x4ae87a25b78fe0b7d6a9a37aad75bc3f01c61094`, `sdiojdsojigdjiodg`)

  const getStreamerAddress = async (streamer:string) => {
    const db = await connectDatabase()
    const user_from_db = await db.select().from(users).where(eq(users.preferred_username, streamer));
    console.log(user_from_db[0])
    return String(user_from_db[0].evm_streamer_address?.toLowerCase())
  }

  async function recordDonation(tx_hash: string, streamer:BalanceChange, sender:BalanceChange, message_b64:string) {
    try {
      const db = await connectDatabase();
      const insert = await db.insert(donations).values({tx_hash: tx_hash, sender: sender.address, sender_tns: null, recipient: streamer.address, amount: String(streamer.tfuel), message: message_b64 ?? null, completed: false}).returning()
      return insert
    } catch (error) {
      console.log(error)
    }
  }

  async function checkTNS(address:string) {
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
  async function callTNS() {
    let tns = await checkTNS('0x4ae87a25b78fe0b7d6a9a37aad75bc3f01c61094')
    console.log(tns)
  } callTNS()

type TNSResponseThetaboard = {
  totalCount: number,
  NFTs: TNSResponseNFTs[]
  
}

interface TNSResponseNFTs {
  contract_addr: `0x7daeee00fb89d5c46b8e8387fd9aac79d6910a06`,
  original_token_id: string,
  token_id: null,
  image: string,
  name: string, // most important
  description: string,
  properties: PropertiesObject
  attributes: null,
  owner: string

}

type PropertiesObject = {
  drop: null,
  assets: [],
  selling_info: null,
  offers: []
}