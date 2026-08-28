import {createClient} from "@supabase/supabase-js";

function monthBounds(value){
  const[y,m]=value.split("-").map(Number);
  const s=new Date(y,m-1,1),e=new Date(y,m,1);
  return{start:s.toISOString(),end:e.toISOString()};
}

function escapeHtml(value=""){
  return String(value).replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
}

export async function POST(request){
  try{
    const auth=request.headers.get("authorization")||"";
    const token=auth.startsWith("Bearer ")?auth.slice(7):"";
    if(!token)return Response.json({error:"로그인이 필요합니다."},{status:401});

    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if(!url||!key)return Response.json({error:"Supabase 설정을 확인해 주세요."},{status:500});

    const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
    const{data:{user},error:userError}=await supabase.auth.getUser(token);
    if(userError||!user)return Response.json({error:"로그인이 만료되었습니다."},{status:401});

    const body=await request.json();
    const companyId=body?.companyId;
    const month=body?.month;
    const pdfBase64=body?.pdfBase64;
    const recipient=(body?.recipient||"").trim();
    if(!companyId||!/^[0-9]{4}-[0-9]{2}$/.test(month||""))return Response.json({error:"정산 정보가 올바르지 않습니다."},{status:400});

    const{data:member}=await supabase.from("restaurant_members").select("restaurant_id").eq("user_id",user.id).limit(1).maybeSingle();
    if(!member?.restaurant_id)return Response.json({error:"식당 정보를 찾을 수 없습니다."},{status:403});

    const{start,end}=monthBounds(month);
    const[{data:restaurant,error:restaurantError},{data:company,error:companyError},{data:records,error:recordsError}]=await Promise.all([
      supabase.from("restaurants").select("id,name,phone").eq("id",member.restaurant_id).single(),
      supabase.from("companies").select("id,restaurant_id,name,company_no,contact_name,contact_email,lunch_price,dinner_price").eq("id",companyId).eq("restaurant_id",member.restaurant_id).single(),
      supabase.from("meal_records").select("meal_type,headcount,unit_price,occurred_at,cancelled_at").eq("restaurant_id",member.restaurant_id).eq("company_id",companyId).is("cancelled_at",null).gte("occurred_at",start).lt("occurred_at",end)
    ]);
    if(restaurantError||companyError||recordsError||!restaurant||!company)return Response.json({error:"정산 데이터를 불러오지 못했습니다."},{status:400});

    const to=recipient||company.contact_email||"";
    if(!/^\S+@\S+\.\S+$/.test(to))return Response.json({error:"받는 이메일 주소를 확인해 주세요."},{status:400});

    let lunch=0,dinner=0,amount=0;
    for(const r of records||[]){
      const count=Number(r.headcount||0);
      const fallback=r.meal_type==="lunch"?Number(company.lunch_price||0):Number(company.dinner_price||0);
      const unit=Number(r.unit_price||fallback);
      if(r.meal_type==="lunch")lunch+=count;else if(r.meal_type==="dinner")dinner+=count;
      amount+=count*unit;
    }
    const total=lunch+dinner;
    const monthText=`${month.slice(0,4)}년 ${Number(month.slice(5,7))}월`;
    const subject=`${restaurant.name} ${monthText} 식대 정산서`;
    const html=`<div style="font-family:Arial,'Noto Sans KR',sans-serif;line-height:1.7;color:#172033"><p>${escapeHtml(company.name)} 담당자님, 안녕하세요.</p><p>${escapeHtml(monthText)} 식대 정산내역을 보내드립니다.</p><table style="border-collapse:collapse;margin:18px 0"><tr><td style="padding:7px 18px 7px 0">중식</td><td style="font-weight:700">${lunch.toLocaleString()}명</td></tr><tr><td style="padding:7px 18px 7px 0">석식</td><td style="font-weight:700">${dinner.toLocaleString()}명</td></tr><tr><td style="padding:7px 18px 7px 0">총 식수</td><td style="font-weight:700">${total.toLocaleString()}명</td></tr><tr><td style="padding:7px 18px 7px 0">청구금액</td><td style="font-weight:700">${amount.toLocaleString()}원</td></tr></table><p>상세 내역은 첨부된 PDF 정산서를 확인해 주세요.</p><p>감사합니다.<br>${escapeHtml(restaurant.name)}${restaurant.phone?`<br>${escapeHtml(restaurant.phone)}`:""}</p></div>`;

    const apiKey=process.env.RESEND_API_KEY;
    if(!apiKey)return Response.json({error:"이메일 발송 설정이 아직 연결되지 않았습니다. RESEND_API_KEY를 설정해 주세요.",code:"EMAIL_NOT_CONFIGURED"},{status:503});
    const from=process.env.RESEND_FROM_EMAIL||"한끼장부 <onboarding@resend.dev>";
    const payload={from,to:[to],subject,html};
    if(pdfBase64){payload.attachments=[{filename:`${company.name}_${month}_식대정산서.pdf`,content:pdfBase64}];}

    const resendResponse=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const result=await resendResponse.json().catch(()=>({}));
    if(!resendResponse.ok)return Response.json({error:result?.message||"이메일 발송에 실패했습니다.",details:result},{status:502});
    return Response.json({ok:true,id:result?.id,to});
  }catch(error){
    return Response.json({error:error?.message||"이메일 발송 중 오류가 발생했습니다."},{status:500});
  }
}
