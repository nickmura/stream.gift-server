

export interface BalanceChangesResponse {
    TxHash: String,
    BalanceChanges: BalanceChange[]
  
  }
  
export type BalanceChange = {
    address: string,
    token_type: number,
    is_negative: boolean,
    delta: number // Amount in WEI
    tfuel: string // delta in denominated form
  }
export type Donation = { //TODO UPDATES THESE TYPES
    digest: string,
    sender: string,
    sender_suins: string,
    recipient: string,
    message:string|undefined,
    amount: number
}

export type CollectionItem ={ 
    
        objectId: string
        name: string
        image: string
        description: string
        collection: '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0::suins_registration::SuinsRegistration',
        lastPrice: string
      
}


export type SignedAddress = { 
    address:string,
    signature: string,
    streamer: string,
}

export type TNSResponseThetaboard = {
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