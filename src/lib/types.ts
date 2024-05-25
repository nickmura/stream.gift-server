export type Donation = {
    digest: string
    sender: string,
    recipient: string,
    message:string|undefined,
    amount: number
}