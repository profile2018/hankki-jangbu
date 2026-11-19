import {NextResponse} from "next/server";
import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
import {randomUUID} from "node:crypto";
export async function POST(request){
 const store=await cookies();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.json({error:"서버 인증 설정 오류"},{status:503});
 const db=createServerClient(url,key,{cookies:{getAll(){return store.getAll()},setAll(){}}});
 const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"로그인이 필요합니다."},{status:401});
 const {data:member}=await db.from("restaurant_members").select("restaurant_id").eq("user_id",user.id).limit(1).maybeSingle();
 if(!member)return NextResponse.json({error:"식당 관리자 계정이 필요합니다."},{status:403});
 const {plan}=await request.json().catch(()=>({}));
 if(!["basic","plus"].includes(plan))return NextResponse.json({error:"요금제 오류"},{status:400});
 if(!process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.startsWith("test_ck_")||!process.env.TOSS_SECRET_KEY?.startsWith("test_sk_"))return NextResponse.json({error:"테스트 키 설정을 확인해 주세요."},{status:503});
 const customerKey="hk_"+randomUUID().replaceAll("-","");
 const state=randomUUID();
 const {error}=await db.from("billing_registrations").insert({restaurant_id:member.restaurant_id,user_id:user.id,customer_key:customerKey,state,plan,status:"pending"});
 if(error)return NextResponse.json({error:"카드 등록 저장소가 준비되지 않았습니다. 관리자에게 문의해 주세요."},{status:503});
 return NextResponse.json({customerKey,state,clientKey:process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY});
}