import { exec } from "child_process"
import { promisify } from "util"
const execAsync = promisify(exec)

export async function testVPS(video_url:string) { 
  console.log(123) //@ts-ignore
  const download = await execAsync(`node --version`, (stderr, stdout) => {
      if (stdout == 'v20.14.0') {
        
      }
  })

  console.log(download)
} testVPS(``)


export async function testCompression() {

}