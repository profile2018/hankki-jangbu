import {NextResponse} from "next/server";
import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
export const dynamic="force-dynamic";
export async function GET(){
 const cookieStore=await cookies();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!anon)return NextResponse.json({ready:false,message:"인증 서버 설정을 확인해 주세요."},{status:503});
 const supabase=createServerClient(url,anon,{cookies:{getAll(){return cookieStore.getAll()},setAll(){}}});
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({ready:false,message:"로그인이 필요합니다."},{status:401});
 const {data:member}=await supabase.from("restaurant_members").select("restaurant_id").eq("user_id",user.id).limit(1).maybeSingle();
 if(!member)return NextResponse.json({ready:false,message:"식당 관리자 계정이 필요합니다."},{status:403});
 const clientKey=process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY||"";
 const secretKey=process.env.TOSS_SECRET_KEY||"";
 const configured=clientKey.startsWith("test_ck_")&&secretKey.startsWith("test_sk_");
 return NextResponse.json({ready:configured,mode:"test",message:configured?"테스트 API 키가 설정되었습니다. 카드 등록과 자동결제는 아직 활성화되지 않았습니다.":"테스트 클라이언트 키 또는 시크릿 키를 확인해 주세요."},{headers:{"Cache-Control":"no-store"}});
}
