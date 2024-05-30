export type Donation = {
    digest: string,
    sender: string,
    sender_suins: string,
    recipient: string,
    message:string|undefined,
    amount: number
}