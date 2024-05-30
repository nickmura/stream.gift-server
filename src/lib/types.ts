export type Donation = {
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