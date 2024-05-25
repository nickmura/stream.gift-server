
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from 'cors';

import { getFullnodeUrl, SuiClient, SuiHTTPTransport } from "@mysten/sui.js/client";
import { WebSocket } from "ws";
import { RetrieveAccountActivity } from "./lib/api/accountActivity";
import { fetchIncomingTxBlock, validateValues, insertDonationData } from "./lib/api/incoming";
import { connectDatabase } from "./db/config";
import { donations } from "./db/schema";
import { eq, sql } from "drizzle-orm";

// Package is on Testnet.
const client = new SuiClient({
    // The typescript definitions may not match perfectly, casting to never avoids these minor incompatibilities

      url: getFullnodeUrl('devnet'),
      // The typescript definitions may not match perfectly, casting to never avoids these minor incompatibilities


});


const app: Express = express();
const port = process.env.PORT || 4000;
app.use(cors())

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

//TODO POLLING ENDPOINT (CHECKS FOR EVENTS ON AN INTERVAL)i856218806ba';
let Package = ''
let JSONPackage = {"Package":`${Package}`}
//const MoveEventType = '<PACKAGE_ID>::<MODULE_NAME>::<METHOD_NAME>';
const MoveEventType = `${Package}::transfer_to_sender::tip`;


setInterval(async () => {
  // await RetrieveAccountActivity()

  // let tx = await client.getTransactionBlock({ digest: `3Hr4imSk4GDV1PhoNSLNMfMkrU5PbTaw4SRm7hX4T9cZ`, options: { showBalanceChanges: true, showEvents: true,  }})
  // console.log(tx)
}, 6000)

// async function events() {
//   console.log(await client.getAllBalances({owner: '0x0b14ea45f57e13df1c40425e1d2089649837e72c9920eb25f657c88c14c3e5df'}))
  
//   // let unsubscribe = await client.subscribeEvent({
//   //   filter: {MoveEventType},
//   //   onMessage: (event) => {
//   //     console.log('subscribeEvent', JSON.stringify(event, null, 2));
//   //   },
//   // });

//   try { 
//     let unsubscribe = await client.subscribeTransaction({
//       filter: { FromAddress: `0x0b14ea45f57e13df1c40425e1d2089649837e72c9920eb25f657c88c14c3e5df` },
//       onMessage(event) {
//         console.log(event)
//       },
//     })
//   } catch (error) {
//     console.log(error)

//   }
// } events()


app.get('/incoming_donation', async (req, res) => {
  let streamer = req.query?.streamer // where this is an id or an address
  let digest = req.query?.digest

  console.log(streamer)
  let tx_block = await fetchIncomingTxBlock(client, String(digest)) 
  if (tx_block) {
    let donation = validateValues(tx_block, String(streamer))
    console.log('Donation', donation)
    //TODO Make Donation Go TO DB
    if (donation) await insertDonationData(donation)
  } else {
    res.json({status: 'invalid'})
  }



})

app.get('/check_new_donations', async (req, res) => {
    let streamer_address = req.query?.streamer_address
    let db = await connectDatabase()
    let select = await db.select().from(donations).where(sql`recipient = ${streamer_address} AND completed = false `);
    console.log(select)

  })


