
const api = `https://api.blockvision.org/v2/sui/account/activities`
const pageIndex = 2
const pageLength = 50 

export async function RetrieveAccountActivity() {
    try {
        console.log('test')
        let res = await fetch(`${api}?address=0x7049901babe076fd05d88f93d3504b6025dab5b15b98fdca921f9ca8e3b52bfb`, {
            headers: {
                "x-api-key": process.env.BLOCKVISION_API_KEY ?? "",
            }
        });
        if (!res.ok) console.log(res.status, res.statusText)
        res = await res.json()
        console.log(res) //@ts-ignore
        await RecordDataCache(res.result.data ?? { null: null })  //@ts-ignore
    } catch (error) { //@ts-ignore
        console.log(error?.message)
    }
    
    // return res?.result.data
}
async function RecordDataCache(res:any) {

    if (res.length > 0) {
        console.log(res[0].coinChanges[0].amount)
        console.log(res, res.length)
    }

}