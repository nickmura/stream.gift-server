
import express, { Express, Request, Response } from "express";
import fs from 'fs'
import https from 'node:https'

import { urlencoded } from "body-parser";
import { jwtDecode } from "jwt-decode";
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from "dotenv";
import cors from 'cors';

import { insertDonationData, fetchIncomingTxDataTheta, recordDonation } from "./lib/api/incoming";
import { connectDatabase } from "./db/config";
import { donations, users } from "./db/schema";
import { eq, sql, and } from "drizzle-orm";
import { checkAccountActivity, checkMobileDonation, checkTNS, getStreamerAddress, validateValues } from "./lib/api/check";
import { BalanceChangesResponse, SignedAddress } from "./lib/types";

dotenv.config();
const LOCAL = process.env.LOCAL  ?? false



let pk = !LOCAL ? fs.readFileSync(String(process.env.SSH_PK_DIRECTORY)) : ''
let cert = !LOCAL ? fs.readFileSync(String(process.env.SSH_CERT_DIRECTORY)) : ''

let cred = { cert: cert, key: pk }

const app: Express = express();

let server;
if (LOCAL) server = require('http').createServer(app); // local
else server = require('https').createServer(cred, app);

const port = process.env.PORT || 4000;

app.use(cors())
app.use(express.json());
app.use(urlencoded({ extended: false }));

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

//TODO POLLING ENDPOINT (CHECKS FOR EVENTS ON AN INTERVAL)i856218806ba';
let Package = ''
let JSONPackage = {"Package":`${Package}`}
//const MoveEventType = '<PACKAGE_ID>::<MODULE_NAME>::<METHOD_NAME>';
const MoveEventType = `${Package}::transfer_to_sender::tip`;

// Listener
server.listen(LOCAL ? port : 443, () => {
  if (LOCAL) console.log(`[server]: Server is running at http://localhost:${port}`);
  else console.log(`[server]: Server is running at https://api.stream.gift`);
});
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
  let network = req.query?.network
  
  let digest = req.query?.digest
  let tx_hash = req.query?.tx_hash
  let sender = req.query?.sender
  let message = req.query?.message
  let signature = req.query?.signature
  console.log('test')
 
    if (network == 'theta') {

        let tx = await fetchIncomingTxDataTheta(String(tx_hash))
        let tx_data:BalanceChangesResponse = tx.blance_changes
        let streamer_address = await getStreamerAddress(String(streamer))
        console.log('streamer address found')
        if (tx && streamer_address) {
          const validate = validateValues(tx_data, streamer_address, String(sender))
          if (validate) {
            console.log('validated tx values... now recording...')

            let streamer = validate['streamer']
            let sender = validate['sender']
            const donate = await recordDonation(String(tx_hash), streamer, sender, String(message ?? ''))
            if (donate) if (donate.length) console.log('success', donate); res.json({status: '400', statusText: 'success', tx_hash})
          } else {
            
          }
        

        
    } else {
    //   let tx_block = await fetchIncomingTxBlock(devnet_client, String(digest)) 
    //   if (tx_block) {
    //     console.log('no message submitted')
    //     // let donation = await validateValuesSui(mainnet_client, tx_block, String(sender),  String(streamer), undefined)
    //     let donation
    //     console.log('Donation', donation) //@ts-ignore
    //     if (donation) await insertDonationData(donation)
    //       return res.json({status: 'success', tx: digest})
    //   } else {
    //     res.json({status: 'invalid'})
    //   }
    // } else {
    //   console.log('message submitted...')
    //   let tx_block = await fetchIncomingTxBlock(devnet_client, String(digest)) 
    //   if (tx_block) {
    //     let donation = await validateValuesSui(devnet_client, tx_block, String(sender), String(streamer), String(message) ?? undefined) // to get SUINS
    //     console.log('Donation', donation) //@ts-ignore
    //     if (donation) await insertDonationData(donation)
    //       return res.json({status: 'success', tx: digest})
    //   } else {
    //     res.json({status: 'invalid'})
    //   }
    }

  }
})




app.get('/check_tns', async (req, res) => {
  const address = req.query?.address
  const tns = await checkTNS(String(address));
  if (tns) res.json({status: true, name: tns, address: address})
  else res.json({status: false})
})


app.get('/check_new_donations', async (req, res) => {
  let username = req.query?.username?.toString() || "";
  
  let db = await connectDatabase();
  let raw_streamer_address = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.preferred_username, username),
  });

  let streamer_address: string = raw_streamer_address?.streamer_address || raw_streamer_address?.evm_streamer_address || '';
  if (!streamer_address) return res.status(400).send({ error_message: "Streamer cannot be found" });

  let select = await db.select().from(donations).where(and(sql`recipient = ${streamer_address}`, eq(donations.completed, !true)));

  if (select) {
    let update = await db.update(donations).set({completed: true}).where(and(sql`recipient = ${streamer_address}`, eq(donations.completed, !true))).returning();
    return res.send(update)
  }

  return res.status(400).send({});
})

app.get('/check_new_qr', async (req, res) => {
  let message_b64 = req.query?.message
  let address = String(req.query?.address)
  let timestamp = new Date().getUTCMilliseconds()
  let account = await checkMobileDonation(address, timestamp)

  //TODO: check latest block
  // query blockvision api 
  // if a transaction is newer 
  let network 

  return res.status(400).send({});
})


app.get('/recent-donations', async (req, res) => {
  let db = await connectDatabase();

  let limit = 7;
  const last_n_donations = await db
    .select({
      sender: donations.sender,
      sender_suins: donations.sender_suins,
      recipient: donations.recipient,
      amount: donations.amount,
      message: donations.message,
      completed: donations.completed,
    })
    .from(donations)
    .where(sql`completed = ${true}`)
    .limit(limit);

  return res.send({ donations: last_n_donations })
});

/* AUTH ENDPOINTS */
app.post("/login-streamer", async (req, res) => {
  let id_token = req.body?.token || null;

  if (!process.env.JWT_SECRET) return res.status(400).json({
    success: false
  });

  if (!id_token) return res.status(400).json({
    success: false
  });

  const user: any = jwtDecode(id_token);

  if (!user?.preferred_username || !user?.nonce) return res.status(400).json({
    success: false
  })

  const db = await connectDatabase();

  // Check if user exists in DB
  const user_from_db = await db.query.users.findMany({
    where: (users, { eq }) => eq(users.preferred_username, user.preferred_username),
  });

  let secret;

  if (!user_from_db?.length) {
    // Register
    secret = uuidv4();
    await db.insert(users).values({ preferred_username: user.preferred_username, nonce: user.nonce, secret }).returning();
  }
  else {
    // Login
    secret = user_from_db[0].secret;
  }

  // Sign a JWT token
  const token = jwt.sign({ secret }, process.env.JWT_SECRET);

  // Send it to client
  return res.send({ token });
})


app.post("/update-streamer", verifyJwt, async (req: any, res) => {
  const updatableFields = ["handle", "notificationsound"]; // TODO: add preference values like textToSpeech and notificationsound
  const { update } : { update: any } = req.body;

  if (!update) return res.status(400).json({
    success: false,
    message: "No update value is received"
  });

  interface RuleInterface {
    validation: Boolean,
    reason?: string
  }

  const rules: any = {
    // Changing handles are not possible but I'll keep that -->
    "handle": (handle: string): RuleInterface => {
      if (handle.length < 3 || handle.length > 32) return {
        validation: false,
        reason: "Handle length must be between 3 and 32 characters"
      };

      // Check if only numbers and alphanumberic chars
      if (!/^[A-Za-z0-9]*$/.test(handle)) return {
        validation: false,
        reason: "Handle must contain letters and numbers"
      };

      return { validation: true }
    },
    "notificationsound": (s: Boolean): RuleInterface => {
      if (typeof s !== "boolean") return {
        validation: false,
        reason: "Invalid input"
      };
      return { validation: true };
    }
  }

  const db = await connectDatabase();

  for (let field of updatableFields) {
    try {
      if (update[field] === undefined) continue;

      // Validate each data field
      let ruleResult = rules[field](update[field]);
      if (!ruleResult.validation)
        return res.status(400).send({ success: false, message: ruleResult.reason })

      // Update database
      const updateQuery: typeof update = {};
      updateQuery[field] = update[field];

      await db.update(users)
        .set(updateQuery)
        .where(eq(users.secret, req.user.secret));

    } catch(e) {
      console.error(e);
      return res.status(400).json({
        sucess: false,
        message: "An unexpected error has occured"
      });
    }
  }

  return res.json({ success: true });
})

app.post("/streamer-exists", async (req: any, res) => {
  const { streamer } = req.body;

  if (!streamer) return res.send({ status: false });

  const db = await connectDatabase();
  const user_from_db = await db.query.users.findMany({
    where: (users, { eq }) => eq(users.preferred_username, streamer),
  });

  if (!user_from_db?.length) return res.send({ status: false });
  return res.send({ status: true });
})

app.get("/get-streamer", async (req: any, res) => {
  const username = req.query.username;
  
  if (!username) return res.send({ user: null });

  const db = await connectDatabase();
  const user_from_db = await db.select().from(users).where(eq(users.preferred_username, username));

  if (!user_from_db?.length) return res.send({ user: null });
  const user = user_from_db[0];

  return res.send({user: {
    suins: user.suins,
    tns: user.tns,
    preferred_username: user.preferred_username,
    evm_streamer_address: user.evm_streamer_address,
    streamer_address: user.streamer_address,
    notificationsound: user?.notificationsound || false,
    textToSpeech: user?.textToSpeech || false,
    signature: user?.signature || null
  }});
})

app.get("/check-streamer", verifyJwt, async (req: any, res) => {
  if (req?.user) return res.send({ user: {
    suins: req.user.suins,
    tns: req.user?.tns,
    preferred_username: req.user.preferred_username,
    streamer_address: req.user.streamer_address,
    notificationsound: req.user?.notificationsound || false,
    textToSpeech: req.user?.textToSpeech || false,
    signature: req.user?.signature || null,
  }});
  return res.status(401);
})

app.post('/verifySignedAddress', async (req, res) => {
  let body : SignedAddress = req.body
  //TODO: VERIFY signature

  const db = await connectDatabase();
  const update = await db.update(users)
    .set({signature: body.signature, evm_streamer_address: body.address})
    .where(eq(users.preferred_username, body.streamer))

  if (update) return res.json({status: true});
  return res.json({status: false})
})








// Middleware -->
function verifyJwt(req: any, res: any, next: any) {
  try {
    const token = req?.headers?.["access-token"];
    req.user = null;

    if (!process.env.JWT_SECRET) return res.status(401);

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, async (err: any, decoded: any) => {
        if (!err) {
          let secret = decoded.secret;

          // Check user login
          const db = await connectDatabase();

          const user_from_db = await db.query.users.findMany({
            where: (users, { eq }) => eq(users.secret, secret),
          });

          if (!user_from_db?.length) return res.status(401);

          req.user = user_from_db[0];

          next();
        } else {
          console.log(err);
          return res.status(401);
        }
      });
    } else return res.status(401);
  } catch (e) {
    console.error(e);
    return res.status(401);
  }
}

// Verify function -->
function verifyJwtFunc(token: string) {
  return new Promise(async (resolve, reject) => {
      if (!token) return resolve(null);

      if (!process.env.JWT_SECRET) return resolve(null);

      jwt.verify(token, process.env.JWT_SECRET, async (err, decoded: any) => {
          if (err) {
              console.log(err);
              return resolve(null);
          }

          let secret = decoded.secret;

          // Check user login
          const db = await connectDatabase();
          const user_from_db = await db.query.users.findMany({
            where: (users, { eq }) => eq(users.secret, secret),
          });

          if (!user_from_db?.length) return resolve(null);
          return resolve(user_from_db[0]);
      });
  })
}

