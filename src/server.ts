
import express, { Express, Request, Response } from "express";
import { urlencoded } from "body-parser";
import { jwtDecode } from "jwt-decode";
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from "dotenv";
import cors from 'cors';

import { getFullnodeUrl, SuiClient, SuiHTTPTransport } from "@mysten/sui.js/client";
import { fetchIncomingTxBlock, validateValues, insertDonationData } from "./lib/api/incoming";
import { connectDatabase } from "./db/config";
import { donations, users } from "./db/schema";
import { eq, sql, and } from "drizzle-orm";
import { checkSUINS } from "./lib/api/check";

dotenv.config();

// Package is on Testnet.
const devnet_client = new SuiClient({
    // The typescript definitions may not match perfectly, casting to never avoids these minor incompatibilities
      url: getFullnodeUrl('devnet'),
      // The typescript definitions may not match perfectly, casting to never avoids these minor incompatibilities
});

const mainnet_client = new SuiClient({
  // The typescript definitions may not match perfectly, casting to never avoids these minor incompatibilities
    url: getFullnodeUrl('mainnet'),
    // The typescript definitions may not match perfectly, casting to never avoids these minor incompatibilities
});

const app: Express = express();
const server = require('http').createServer(app);
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
  let sender = req.query?.sender
  let message = req.query?.message
  let signature = req.query?.signature

 
  console.log(streamer)
  if (!String(message)) {
    let tx_block = await fetchIncomingTxBlock(devnet_client, String(digest)) 
    if (tx_block) {
      console.log('no message submitted')
      let donation = await validateValues(mainnet_client, tx_block, String(sender),  String(streamer), undefined)
      console.log('Donation', donation) //@ts-ignore
      if (donation) await insertDonationData(donation)
        return res.json({status: 'success', tx: digest})
    } else {
      res.json({status: 'invalid'})
    }
  } else {
    console.log('message submitted...')
    let tx_block = await fetchIncomingTxBlock(devnet_client, String(digest)) 
    if (tx_block) {
      let donation = await validateValues(devnet_client, tx_block, String(sender), String(streamer), String(message) ?? undefined) // to get SUINS
      console.log('Donation', donation) //@ts-ignore
      if (donation) await insertDonationData(donation)
        return res.json({status: 'success', tx: digest})
    } else {
      res.json({status: 'invalid'})
    }
  }
})


app.get('/check_suins', async (req, res) => {
  const address = req.query?.address  
  const suins = await checkSUINS(String(address))
  if (suins) res.json(suins)
  else res.json({status: 'null'})
})


app.get('/check_new_donations', async (req, res) => {
  let streamer_address = req.query?.streamer_address
  console.log(streamer_address)
  let db = await connectDatabase()

  let select = await db.select().from(donations).where(and(sql`recipient = ${streamer_address}`, eq(donations.completed, !true))) ;
  console.log(select)
  if (select) {
    //TODO changed to completed donation\
    let update = await db.update(donations).set({completed: true}).where(and(sql`recipient = ${streamer_address}`, eq(donations.completed, !true))).returning();
    console.log
    // let select = await db.update(donations).where(and(sql`recipient = ${streamer_address}`, eq(donations.completed, !true))) ;
    res.json(select)
  } else {
    res.json([])
  }
  return select
})

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
  const updatableFields = ["handle", "notificationSound"]; // TODO: add preference values like textToSpeech and notificationSound
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
    "notificationSound": (s: Boolean): RuleInterface => {
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
  
  if (!username) return res.send({ status: false });

  const db = await connectDatabase();
  const user_from_db = await db.select().from(users).where(eq(users.preferred_username, username));

  if (!user_from_db?.length) return res.send({ status: false });
  return res.send({ status: true });
})

app.get("/check-streamer", verifyJwt, async (req: any, res) => {
  if (req?.user) return res.send({ user: {
    username: req.user.preferred_username,
    handle: req.user.handle,
    notificationSound: req.user.notificationSound,
    textToSpeech: req.user.textToSpeech,
  }});
  return res.status(401);
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

// Listener
server.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});