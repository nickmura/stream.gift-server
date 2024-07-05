

import * as thetajs from '@thetalabs/theta-js'
import 'isomorphic-fetch'

export async function fetchIncomingTxDataTheta(tx_hash:string) {
    const provider = new thetajs.providers.HttpProvider();

    let tx_data
    let i = 0;


    while (i <= 50 && !tx_data) {
      try {
        
        const tx = await provider.getTransaction(tx_hash)
        console.log(tx)
        if (tx) {
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