import { Request, Response } from "express"
import zernio from "../config/zernio.js";
import { User } from "../models/user.js";
import { Account } from "../models/account.js";
import { AuthRequest } from "../middleware/authMiddleware.js";


const getOrCreateZernioProfile = async (user: any): Promise<string> => {
    try {
        const result = await zernio.profiles.listProfiles();
        const data = result.data as any;
        const profiles: any[] = Array.isArray(data) ? data : data?.profiles || data?.data || [];
        if (profiles.length > 0) {
            const pid = profiles[0]._id || profiles[0].id
            await User.findByIdAndUpdate(user._id, { zernioProfileId: pid });
            return pid;

        }

        const createResult = await zernio.profiles.createProfile({
            body: { name: `${user.name || user.email}'s workspace` } as any,
        })
        const created = (createResult.data as any)?.profile || createResult.data;

        const pid = created?._id || created?.id;

        if (!pid) {
            throw new Error("Failed to Create Zernio profile- no ID returned")
        }
        await User.findByIdAndUpdate(user._id, { zernioProfileId: pid });

        return pid
    } catch (error: any) {
        console.error("getOrCreateZernioProfile Error:", error?.message || error);
        throw error;
    }
}


// Gnereate OAuth Authorization
// GET  /api/auth/:platform 

export const generateAuthUrl = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { platform } = req.params;
        // return "Rohit";
        const profileId = await getOrCreateZernioProfile(req.user);
        const origin = req.headers.origin;
        const redirectUrl = `${origin}/accounts`
        const result = await zernio.connect.getConnectUrl({
            path: { platform: platform as any },
            query: {
                profileId,
                redirect_url: redirectUrl
            }
        })
        const data = result.data as any;
        console.log("getConnectUrl responce:", JSON.stringify(data, null, 2));
        const authUrl = data.authUrl;
        if (!authUrl) {
            throw new Error(`Zernio returned no authUrl.Full responce:${JSON.stringify(data)}`);

        }

        res.json({
            url: authUrl
        })

    } catch (error: any) {
        // return "Rohit"
        res.status(500).json({ message: error?.message || "Server Error" })

    }
}

// Sync connected accounts from Zernio into Mongodb 
// GET /api/auth/sync 

export const syncAccount= async (req: AuthRequest, res: Response):Promise<void>=>{
    try {
        
   
    const profileId = await getOrCreateZernioProfile(req.user);
    const result = await zernio.accounts.listAccounts({
        query:{profileId}as any 

    })
    const data = result.data as any ;
    const zernioAccounts :any[]= data?.accounts || (Array.isArray(data)?data:[]);
    const supportedPlatform =["twitter","linkedin","facebook","instagram"];
    const syncedAccounts=[];
    for (const zAccount of zernioAccounts){
        const zid = zAccount._id || zAccount.id;
        if (!zid) {
            console.log("Skipping account with no Ids",zAccount);
            continue;

        }
        const rawplatform = (zAccount.platform||zAccount.type||"").toLowerCase();
         const normaliedPlatform = supportedPlatform.find((p)=>rawplatform.includes(p));
         if(!normaliedPlatform){
            console.log("Skipping unsupported Platform:", rawplatform);
            continue;

         }
         const account = await Account.findOneAndUpdate({zernioAccountId:zid},{
            user:req.user._id,
            platform :normaliedPlatform,
            handle :zAccount.username || zAccount.name || zAccount.handle ||"Unknown",
            zernioAccountId:zid,
            avatarUrl:zAccount.avatarUrl||zAccount.picture ||zAccount.profile_image_url,
            },
        {upsert:true ,returnDocument:'after'}
        )
         syncedAccounts.push(account);

    }
    res.json(syncedAccounts)
 } catch (error:any) {
        res.status(500).json({message:error?.message||"server Error"});
        
    }

}