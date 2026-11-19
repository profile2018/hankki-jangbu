import {NextResponse} from "next/server";
import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
export async function POST(request){
 const store=await cookies(),url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.json({error:"서버 인증 설정 오류"},{status:503});
 const db=createServerClient(url,key,{cookies:{getAll(){return store.getAll()},setAll(){}}});
 const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"로그인이 필요합니다."},{status:401});
 const {authKey,customerKey,state}=await request.json().catch(()=>({}));
 if(typeof authKey!=="string"||authKey.length>500||!authKey||typeof customerKey!=="string"||typeof state!=="string")return NextResponse.json({error:"카드 인증 정보가 올바르지 않습니다."},{status:400});
 const {data:registration,error:lookupError}=await db.from("billing_registrations").select("id,restaurant_id,customer_key,status").eq("state",state).eq("customer_key",customerKey).eq("user_id",user.id).maybeSingle();
 if(lookupError||!registration||registration.status!=="pending")return NextResponse.json({error:"만료되었거나 이미 처리된 카드 등록 요청입니다."},{status:409});
 const secret=process.env.TOSS_SECRET_KEY;
 if(!secret?.startsWith("test_sk_"))return NextResponse.json({error:"테스트 결제 설정 오류"},{status:503});
 let response,payload;
 try{response=await fetch("https://api.tosspayments.com/v1/billing/authorizations/issue",{method:"POST",headers:{"Authorization":"Basic "+Buffer.from(secret+":").toString("base64"),"Content-Type":"application/json"},body:JSON.stringify({authKey,customerKey}),cache:"no-store"});payload=await response.json();}catch{return NextResponse.json({error:"토스페이먼츠 서버에 연결할 수 없습니다."},{status:502});}
 if(!response.ok||!payload.billingKey)return NextResponse.json({error:payload.message||"빌링키 발급에 실패했습니다."},{status:400});
 const {data:updated,error:saveError}=await db.from("billing_registrations").update({billing_key:payload.billingKey,status:"registered",card_company:payload.card?.company||null,card_number:payload.card?.number||null,registered_at:new Date().toISOString()}).eq("id",registration.id).eq("status","pending").select("id");
 if(saveError||!updated?.length)return NextResponse.json({error:"카드 등록 결과 저장에 실패했습니다. 고객센터에 문의해 주세요."},{status:503});
 return NextResponse.json({success:true,message:"테스트 카드가 등록되었습니다. 자동결제는 아직 실행되지 않습니다."});
}