// import plugins, they will dynamically register themselves to SuiKit
import { SuiTxBlock, TransactionBlock } from '@scallop-io/sui-kit';
import { SuiKit } from '@scallop-io/sui-kit-plugins';
import * as process from "process";

let suiKit = new SuiKit({secretKey: process.env.SECRET_KEY});
// init Shinami gas sponsor before using it 
//@ts-ignore
suiKit.initShinamiGasSponsor(process.env.GAS_ACCESS_KEY);

/**
 * This is an example of using sponsored transaction plugin in nodejs.
 */
async function forNodejs() {
  // Create a transaction
  const tx = new SuiTxBlock();
  tx.transferObjects(['<obj_id>'], '<sender_address>');

  const gasBudget = 10 ** 9;
  // Sponsor the transaction, and send it 
  //@ts-ignore
  const res = await suiKit.signAndSendShinamiSponsoredTxn(tx, gasBudget);
  return res;
}

/**
 * This is an example of using sponsored transaction plugin in browser.
 */
export async function callSponsor(txb:TransactionBlock, userSignature:string) {
  // Create a transaction
  const tx = new SuiTxBlock();
  tx.transferObjects(['<obj_id>'], '<sender_address>');

  const gasBudget = 10 ** 9;
  // Sponsor the transaction
  const sender =  '<sender_address>';
  //@ts-ignore
  const sponsoredTx = await suiKit.requestShinamiSponsorship(tx, gasBudget, sender);
  // Get the user's signature from wallet
  const txBytes = sponsoredTx.txBytes;
  // Implement your own function to get user's signature from wallet
//   const userSignature = await getUserSignatureFromWallet(txBytes);
  // Send the signed sponsored transaction
  //@ts-ignore
  const res = await suiKit.sendShinamiSponsoredTxn(sponsoredTx, userSignature);
  
  return res;
}