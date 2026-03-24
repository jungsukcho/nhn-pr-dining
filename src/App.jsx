import { useState, useEffect } from "react";
import { db } from "./supabaseClient";

const PRESET_REGIONS = ["판교","광화문","종로","서대문","여의도","강남역","삼성역","홍대입구","합정역"];
const REGION_GROUPS = {
  "강북": ["광화문","종로","서대문","홍대입구","합정역","용산/한남","여의도","공덕","서촌"],
  "강남": ["강남역","삼성역","양재"],
  "경기·인천": ["판교","정자동"],
};
const RANKS   = ["임원급 (국장/부국장)","데스크급 (50대+)","일반기자 (20~30대)"];
const SIZES   = ["1:1 단독","소그룹 (2~4인)","단체 (5인 이상)"];
const GENDERS = ["남성","여성","혼성"];
const MEAL_TIMES  = ["오찬","석식"];
const ALCOHOL_OPTS = ["무주류","소맥","와인","위스키","사케"];
const CORKAGE_OPTS = ["가능","불가","조건부"];
const CORKAGE_STYLE = {
  "가능":  { color:"#1a5a2a", bg:"#eaf5ec", border:"#6abf7a" },
  "불가":  { color:"#6a1010", bg:"#fceaea", border:"#d07070" },
  "조건부":{ color:"#6a4a00", bg:"#fff5e0", border:"#d4a030" },
};
const CUISINES = ["한식","일식","중식","양식","이탈리안","고깃집","해산물","퓨전","와인바","이자카야","기타"];
const PRICE_LEVELS = ["3만원 이하","3~5만원","5만원 이상"];
const PRICE_STYLE = {
  "3만원 이하": { color:"#2e6e3a", bg:"#eaf5ec", border:"#6abf7a" },
  "3~5만원":   { color:"#0a4888", bg:"#e6f0ff", border:"#6699dd" },
  "5만원 이상": { color:"#8a4200", bg:"#fff2e0", border:"#d4a030" },
};
const MOOD_OPTS = ["대화가 중요한 미팅","조용한 룸 식당","캐주얼한 점심 미팅용","격식있는 술자리","편안한 가성비 술자리"];
const FACILITY_OPTS = ["프라이빗룸","단체석","주차 편리","야외 테라스"];

const RANK_STYLE = {
  "임원급 (국장/부국장)": { label:"임원급",   dot:"#6a22a0", bg:"#f4eefb" },
  "데스크급 (50대+)":     { label:"데스크",   dot:"#b04a00", bg:"#fff2e6" },
  "일반기자 (20~30대)":   { label:"일반기자", dot:"#0d52a0", bg:"#e6f0ff" },
};
const MEAL_STYLE = {
  "오찬": { icon:"☀", color:"#7a5800", bg:"#fffbec", border:"#f0d050" },
  "석식": { icon:"◑", color:"#1e2e68", bg:"#edf0ff", border:"#8899dd" },
};
const ALCOHOL_STYLE = {
  "무주류":  { color:"#666",    bg:"#f2f2f2",  border:"#ccc" },
  "소맥":   { color:"#8a5a00", bg:"#fff8e0",  border:"#e0b840" },
  "와인":   { color:"#7a1840", bg:"#fdeef4",  border:"#d070a0" },
  "위스키": { color:"#6a3800", bg:"#fff2e0",  border:"#c08040" },
  "사케":   { color:"#3a5a30", bg:"#eef7ec",  border:"#80b070" },
};

const Stars = ({ value, onChange }) => (
  <span style={{display:"flex",gap:"2px"}}>
    {[1,2,3,4,5].map(i=>(
      <span key={i} onClick={()=>onChange&&onChange(i)}
        style={{fontSize:"15px",cursor:onChange?"pointer":"default",
          color:i<=value?"#c8900a":"#d8d0c4",transition:"color .12s"}}>★</span>
    ))}
  </span>
);

const Tag = ({label,bg="#ede9e0",color="#6a5e4e",border,small=false})=>(
  <span style={{background:bg,color,fontSize:small?"10px":"11px",fontWeight:600,
    padding:small?"2px 6px":"3px 9px",borderRadius:"20px",whiteSpace:"nowrap",lineHeight:1.4,
    border:`1px solid ${border||bg}`}}>{label}</span>
);

export default function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [extraRegions, setExtraRegions] = useState([]);
  const [view, setView]       = useState("list");
  const [selected, setSelected] = useState(null);
  const [form, setForm]       = useState(null);
  const [toast, setToast]     = useState("");
  const [toastType, setToastType] = useState("ok");
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [visitModal, setVisitModal]   = useState(null);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [fRegion,  setFRegion]  = useState("전체");
  const [fRank,    setFRank]    = useState("");
  const [fSize,    setFSize]    = useState("");
  const [fGender,  setFGender]  = useState("");
  const [fMeal,    setFMeal]    = useState("");
  const [fAlcohol, setFAlcohol] = useState("");
  const [fSearch,  setFSearch]  = useState("");

  useEffect(()=>{
    loadAll();
    const saved = localStorage.getItem("pdp_extra_regions");
    if(saved) setExtraRegions(JSON.parse(saved));
  },[]);

  const loadAll = async () => {
    setLoading(true);
    try { const data = await db.getAll(); setRestaurants(data); }
    catch(e) { pop("데이터 불러오기 실패: " + e.message, "err"); }
    finally { setLoading(false); }
  };

  const allRegions  = [...PRESET_REGIONS,...extraRegions.filter(r=>!PRESET_REGIONS.includes(r))];
  const usedRegions = [...new Set(restaurants.map(r=>r.region))];
  const regionList  = [...new Set([...allRegions,...usedRegions])];
  const pop = (msg, type="ok") => { setToast(msg); setToastType(type); setTimeout(()=>setToast(""), 2500); };

  const filtered = restaurants.filter(r=>{
    if(fRegion!=="전체" && r.region!==fRegion) return false;
    if(fRank    && !r.ranks?.includes(fRank))    return false;
    if(fSize    && !r.sizes?.includes(fSize))    return false;
    if(fGender  && !r.genders?.includes(fGender))return false;
    if(fMeal    && !r.mealTimes?.includes(fMeal))return false;
    if(fAlcohol && fMeal==="석식" && !r.alcohols?.includes(fAlcohol)) return false;
    if(showFavOnly && !r.favorite) return false;
    if(fSearch){
      const q=fSearch.toLowerCase();
      const logText=(r.visitLogs||[]).map(l=>l.comment).join(" ");
      if(![r.name,r.notes,r.cuisine,logText].some(f=>f?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const toggleFav = async (id) => {
    const target = restaurants.find(r=>r.id===id); if(!target) return;
    try {
      const saved = await db.update(id, {...target, favorite:!target.favorite});
      const up = restaurants.map(r=>r.id===id?saved:r);
      setRestaurants(up); if(selected?.id===id) setSelected(saved);
    } catch(e) { pop("저장 실패: "+e.message,"err"); }
  };

  const deleteR = async (id) => {
    if(!confirm("삭제하시겠습니까?")) return;
    try {
      await db.delete(id);
      setRestaurants(prev=>prev.filter(r=>r.id!==id));
      setView("list"); setSelected(null); pop("삭제됐습니다");
    } catch(e) { pop("삭제 실패: "+e.message,"err"); }
  };

  const openVisitModal = (id) => setVisitModal({ id, date:new Date().toISOString().split("T")[0], rating:5, comment:"" });

  const submitVisitLog = async () => {
    if(!visitModal) return;
    const { id, date, rating, comment } = visitModal;
    const target = restaurants.find(r=>r.id===id); if(!target) return;
    const log = { date, rating, comment:comment.trim(), ts:Date.now() };
    const logs = [log,...(target.visitLogs||[])];
    const avgRating = Math.round(logs.reduce((s,l)=>s+l.rating,0)/logs.length*10)/10;
    try {
      const saved = await db.update(id, {...target,visitLogs:logs,visitCount:(target.visitCount||0)+1,lastVisit:date,rating:avgRating});
      const up = restaurants.map(r=>r.id===id?saved:r);
      setRestaurants(up); if(selected?.id===id) setSelected(saved);
      setVisitModal(null); pop("방문 기록 저장됨 ✓");
    } catch(e) { pop("저장 실패: "+e.message,"err"); }
  };

  const deleteLog = async (restId, ts) => {
    const target = restaurants.find(r=>r.id===restId); if(!target) return;
    const logs = (target.visitLogs||[]).filter(l=>l.ts!==ts);
    const avgRating = logs.length ? Math.round(logs.reduce((s,l)=>s+l.rating,0)/logs.length*10)/10 : target.rating;
    try {
      const saved = await db.update(restId, {...target,visitLogs:logs,visitCount:Math.max(0,(target.visitCount||1)-1),lastVisit:logs.length?logs[0].date:target.lastVisit,rating:avgRating});
      const up = restaurants.map(r=>r.id===restId?saved:r);
      setRestaurants(up); if(selected?.id===restId) setSelected(saved);
    } catch(e) { pop("삭제 실패: "+e.message,"err"); }
  };

  const openAdd = (existing=null) => {
    setForm(existing?{...existing}:{
      name:"",region:fRegion!=="전체"?fRegion:"",cuisine:"",price:"3~5만원",
      ranks:[],sizes:[],genders:[],mealTimes:[],alcohols:[],ambiance:[],
      naverUrl:"",rating:4,reservationRequired:false,reservationTip:"",corkage:"",
      notes:"",favorite:false,visitCount:0,lastVisit:new Date().toISOString().split("T")[0],visitLogs:[],
    });
    setView("add");
  };

  const submitForm = async () => {
    if(!form.name.trim()||!form.region.trim()) return alert("이름과 지역은 필수입니다.");
    try {
      if(form.id) {
        const saved = await db.update(form.id, form);
        setRestaurants(prev=>prev.map(r=>r.id===form.id?saved:r)); pop("수정됐습니다 ✓");
      } else {
        const saved = await db.insert(form);
        setRestaurants(prev=>[...prev,saved]); pop("추가됐습니다 ✓");
      }
      setView("list"); setForm(null);
    } catch(e) { pop("저장 실패: "+e.message,"err"); }
  };

  const toggleArr = (field,val) => {
    const arr=form[field]||[];
    setForm({...form,[field]:arr.includes(val)?arr.filter(x=>x!==val):[...arr,val]});
  };

  const saveExtraRegion = (name) => {
    if(!name?.trim()||allRegions.includes(name.trim())) return;
    const up=[...extraRegions,name.trim()];
    setExtraRegions(up); localStorage.setItem("pdp_extra_regions",JSON.stringify(up));
  };

  const K = { ink:"#12100e",paper:"#f6f2eb",card:"#fff",muted:"#8a7e6e",accent:"#b82800",gold:"#b87a00",night:"#1a1e3a",border:"#ddd4c4" };
  const FF = "Pretendard,'Apple SD Gothic Neo','Noto Sans KR',sans-serif";
  const priceColor={"3만원 이하":"#2e6e3a","3~5만원":"#0a4888","5만원 이상":"#8a4200"};

  const chip=(active,ac=K.night)=>({padding:"5px 11px",borderRadius:"20px",fontSize:"12px",fontWeight:600,border:active?`1.5px solid ${ac}`:`1px solid #c0b8a8`,background:active?ac:"#fff",color:active?"#f0ece4":K.muted,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",transition:"all .12s"});
  const mChip=(on)=>({padding:"5px 11px",borderRadius:"20px",fontSize:"12px",fontWeight:600,border:on?`1.5px solid ${K.gold}`:`1.5px solid #d0c8b8`,background:on?K.night:"#fff",color:on?K.gold:K.muted,cursor:"pointer",fontFamily:"inherit"});
  const alcChip=(type,on)=>({padding:"5px 12px",borderRadius:"20px",fontSize:"12px",fontWeight:600,border:on?`1.5px solid ${ALCOHOL_STYLE[type]?.color||"#888"}`:`1px solid #c0b8a8`,background:on?ALCOHOL_STYLE[type]?.bg||"#eee":"#fff",color:on?ALCOHOL_STYLE[type]?.color||"#444":K.muted,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"});
  const mealBtn=(m,on)=>({flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",padding:"9px 0",borderRadius:"8px",fontSize:"13px",fontWeight:700,border:on?`2px solid ${MEAL_STYLE[m].border}`:`1px solid ${K.border}`,background:on?MEAL_STYLE[m].bg:"#fff",color:on?MEAL_STYLE[m].color:K.muted,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"});
  const regionChip=(on)=>({padding:"5px 10px",borderRadius:"6px",fontSize:"12px",fontWeight:600,border:on?`2px solid ${K.gold}`:`1px solid #c0b8a8`,background:on?K.night:"#fff",color:on?K.gold:K.muted,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"});

  const sec={background:K.card,margin:"10px 12px",borderRadius:"12px",padding:"15px",border:`1px solid ${K.border}`};
  const fInput={width:"100%",padding:"9px 12px",border:`1.5px solid #d0c8b8`,borderRadius:"8px",background:"#faf8f4",fontSize:"14px",fontFamily:"inherit",outline:"none",color:K.ink,boxSizing:"border-box",marginBottom:"10px"};
  const fLabel={fontSize:"11px",color:"#5a4e3a",fontWeight:700,marginBottom:"5px",display:"block",letterSpacing:".05em"};
  const dLabel={fontSize:"10px",color:K.muted,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:"3px"};
  const row={display:"flex",gap:"5px",flexWrap:"wrap"};

  const Toast = () => (
    <div style={{position:"fixed",bottom:"20px",left:"50%",transform:"translateX(-50%)",
      background:toastType==="err"?"#6a1010":"#1a3a20",color:"#fff",
      padding:"9px 22px",borderRadius:"20px",fontSize:"13px",fontWeight:600,
      opacity:toast?1:0,transition:"opacity .3s",pointerEvents:"none",zIndex:999,whiteSpace:"nowrap"}}>
      {toast}
    </div>
  );

  if(loading) return (
    <div style={{fontFamily:FF,display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",minHeight:"100vh",background:K.paper,color:K.muted,gap:"16px"}}>
      <div style={{fontSize:"32px"}}>🍽</div>
      <div style={{fontSize:"14px",fontWeight:600}}>데이터 불러오는 중...</div>
    </div>
  );

  if(view==="detail" && selected){
    const r=selected;
    return(
      <div style={{fontFamily:FF,background:K.paper,minHeight:"100vh",color:K.ink,maxWidth:"500px",margin:"0 auto"}}>
        <div style={{background:K.night,color:"#eeeae2",padding:"14px 16px",display:"flex",alignItems:"center",gap:"12px",borderBottom:`3px solid ${K.accent}`}}>
          <button onClick={()=>setView("list")} style={{background:"none",border:"none",color:K.accent,cursor:"pointer",fontSize:"22px",padding:0,lineHeight:1,fontFamily:"inherit"}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:"18px",fontWeight:800,letterSpacing:"-.02em"}}>{r.name}</div>
            <div style={{fontSize:"11px",color:K.accent}}>{r.region} · {r.cuisine} · <span style={{color:priceColor[r.price]||K.gold,fontWeight:700}}>{r.price}</span></div>
          </div>
          <button onClick={()=>toggleFav(r.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:"20px",color:r.favorite?"#e02020":"#555",padding:0}}>♥</button>
        </div>
        <div style={sec}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
            <Stars value={r.rating}/>
            <div style={{display:"flex",gap:"6px"}}>
              {r.reservationRequired&&<Tag label="예약필수" bg="#5a1010" color="#fff" border="#5a1010"/>}
              {r.favorite&&<Tag label="★ 즐겨찾기" bg="#b87a00" color="#fff" border="#b87a00"/>}
            </div>
          </div>
          {r.mealTimes?.length>0&&<div style={{display:"flex",gap:"7px",marginBottom:"10px"}}>{r.mealTimes.map(m=>(<span key={m} style={{background:MEAL_STYLE[m].bg,color:MEAL_STYLE[m].color,padding:"4px 13px",borderRadius:"20px",fontSize:"12px",fontWeight:700,border:`1px solid ${MEAL_STYLE[m].border}`}}>{MEAL_STYLE[m].icon} {m}</span>))}</div>}
          {r.alcohols?.length>0&&<div style={{marginBottom:"10px"}}><div style={{...dLabel,marginBottom:"6px"}}>주류 옵션</div><div style={{...row,alignItems:"center"}}>{r.alcohols.map(a=>(<span key={a} style={{background:ALCOHOL_STYLE[a]?.bg||"#eee",color:ALCOHOL_STYLE[a]?.color||"#444",padding:"4px 11px",borderRadius:"20px",fontSize:"12px",fontWeight:600,border:`1px solid ${ALCOHOL_STYLE[a]?.border||"#ccc"}`}}>{a}</span>))}{r.corkage&&<span style={{background:CORKAGE_STYLE[r.corkage]?.bg,color:CORKAGE_STYLE[r.corkage]?.color,padding:"4px 11px",borderRadius:"20px",fontSize:"12px",fontWeight:700,border:`1.5px solid ${CORKAGE_STYLE[r.corkage]?.border}`,marginLeft:"2px"}}>🍾 콜키지 {r.corkage==="가능"?"✓ 가능":r.corkage==="불가"?"✗ 불가":"△ 조건부"}</span>}</div></div>}
          <div style={{...row,marginBottom:"6px"}}>{r.ranks?.map(rk=>(<Tag key={rk} label={RANK_STYLE[rk]?.label||rk} bg={RANK_STYLE[rk]?.bg||"#eee"} color={RANK_STYLE[rk]?.dot||"#444"} border={RANK_STYLE[rk]?.dot+"40"}/>))}{r.sizes?.map(sz=><Tag key={sz} label={sz}/>)}{r.genders?.map(g=><Tag key={g} label={g}/>)}</div>
          <div style={row}>{r.ambiance?.map(a=><Tag key={a} label={a} bg="#ede9e0"/>)}</div>
        </div>
        <div style={sec}>
          {r.naverUrl&&<><div style={dLabel}>🗺 네이버 플레이스</div><a href={r.naverUrl} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"7px",background:"#03C75A",color:"#fff",padding:"9px 16px",borderRadius:"9px",fontSize:"13px",fontWeight:700,textDecoration:"none",marginBottom:"12px"}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M13.6 10.4L10.2 5H5v14h5.4l3.4-5.5V19H19V5h-5.4v5.4z" fill="white"/></svg>네이버 플레이스에서 보기</a></>}
          {r.reservationRequired&&r.reservationTip&&<><div style={dLabel}>🗓 예약 팁</div><div style={{background:"#fff8ec",padding:"9px 11px",borderRadius:"8px",borderLeft:`3px solid ${K.gold}`,fontSize:"13px",marginBottom:"11px"}}>{r.reservationTip}</div></>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"11px"}}>
            <div><div style={dLabel}>🍽 방문 횟수</div><div style={{fontSize:"22px",fontWeight:700}}>{r.visitCount||0}<span style={{fontSize:"13px",color:K.muted}}>회</span></div></div>
            <div><div style={dLabel}>⭐ 평균 별점</div><div style={{fontSize:"22px",fontWeight:700}}>{r.visitLogs?.length?(r.visitLogs.reduce((s,l)=>s+l.rating,0)/r.visitLogs.length).toFixed(1):r.rating}<span style={{fontSize:"13px",color:K.muted}}> / 5</span></div></div>
          </div>
          {r.notes&&<><div style={dLabel}>📌 기본 메모</div><div style={{background:"#faf7f2",padding:"10px 12px",borderRadius:"8px",borderLeft:`3px solid ${K.gold}`,lineHeight:1.75,fontSize:"13px"}}>{r.notes}</div></>}
        </div>
        <div style={{...sec,padding:"0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 15px 10px"}}>
            <div style={{fontSize:"13px",fontWeight:700}}>방문 기록{r.visitLogs?.length>0&&<span style={{marginLeft:"6px",fontSize:"11px",color:K.muted,fontWeight:400}}>{r.visitLogs.length}건</span>}</div>
            <button onClick={()=>openVisitModal(r.id)} style={{background:K.night,color:K.gold,border:"none",borderRadius:"7px",padding:"7px 13px",fontSize:"12px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ 방문 기록 추가</button>
          </div>
          {(!r.visitLogs||r.visitLogs.length===0)?<div style={{padding:"20px 15px 22px",textAlign:"center",color:K.muted,fontSize:"13px"}}>아직 방문 기록이 없습니다</div>:(
            <>{(showAllLogs?r.visitLogs:r.visitLogs.slice(0,3)).map((log,i)=>(
              <div key={log.ts||i} style={{padding:"11px 15px",borderTop:`1px solid ${K.border}`,background:i%2===0?"#fff":"#fdfaf5"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"5px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <span style={{fontSize:"11px",color:K.muted,fontWeight:600}}>{log.date}</span>
                    <span style={{display:"flex",gap:"1px"}}>{[1,2,3,4,5].map(s=><span key={s} style={{fontSize:"13px",color:s<=log.rating?"#c8900a":"#ddd"}}>★</span>)}</span>
                  </div>
                  <button onClick={()=>deleteLog(r.id,log.ts)} style={{background:"none",border:"none",cursor:"pointer",color:"#ccc",fontSize:"15px",padding:"0 2px"}}>×</button>
                </div>
                {log.comment&&<div style={{fontSize:"13px",color:K.ink,lineHeight:1.65,paddingLeft:"4px",borderLeft:`2px solid ${K.border}`}}>{log.comment}</div>}
              </div>
            ))}
            {r.visitLogs.length>3&&<div style={{padding:"10px 15px",borderTop:`1px solid ${K.border}`,textAlign:"center"}}><button onClick={()=>setShowAllLogs(!showAllLogs)} style={{background:"none",border:"none",cursor:"pointer",fontSize:"12px",color:K.muted,fontFamily:"inherit",fontWeight:600}}>{showAllLogs?`▲ 접기`:`▼ 전체 ${r.visitLogs.length}건 보기`}</button></div>}
            </>
          )}
        </div>
        <div style={{display:"flex",gap:"8px",margin:"10px 12px 24px"}}>
          <button onClick={()=>openAdd(r)} style={{flex:1,padding:"12px",borderRadius:"10px",border:"none",fontFamily:"inherit",fontWeight:700,fontSize:"13px",cursor:"pointer",background:K.night,color:K.gold}}>✏ 음식점 정보 수정</button>
          <button onClick={()=>deleteR(r.id)} style={{flex:"0 0 70px",padding:"12px",borderRadius:"10px",border:"none",fontFamily:"inherit",fontWeight:700,fontSize:"13px",cursor:"pointer",background:"#5a1010",color:"#fff"}}>삭제</button>
        </div>
        {visitModal&&visitModal.id===r.id&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200}}>
            <div style={{background:"#fff",width:"100%",maxWidth:"500px",borderRadius:"18px 18px 0 0",padding:"22px 18px 32px",fontFamily:FF}}>
              <div style={{fontSize:"15px",fontWeight:700,marginBottom:"16px"}}>방문 기록 추가</div>
              <div style={{...dLabel,marginBottom:"5px"}}>날짜</div>
              <input type="date" value={visitModal.date} onChange={e=>setVisitModal({...visitModal,date:e.target.value})} style={{...fInput}}/>
              <div style={{...dLabel,marginBottom:"8px"}}>별점</div>
              <div style={{display:"flex",gap:"6px",marginBottom:"14px",alignItems:"center"}}>
                {[1,2,3,4,5].map(s=>(<button key={s} onClick={()=>setVisitModal({...visitModal,rating:s})} style={{fontSize:"28px",background:"none",border:"none",cursor:"pointer",color:s<=visitModal.rating?"#c8900a":"#ddd",transform:s<=visitModal.rating?"scale(1.1)":"scale(1)",transition:"all .12s"}}>★</button>))}
                <span style={{fontSize:"13px",color:K.muted,marginLeft:"4px"}}>{["","너무 별로","별로","보통","좋음","최고!"][visitModal.rating]}</span>
              </div>
              <div style={{...dLabel,marginBottom:"5px"}}>의견 메모</div>
              <textarea value={visitModal.comment} onChange={e=>setVisitModal({...visitModal,comment:e.target.value})} placeholder="예) 오늘은 와인 페어링이 특히 좋았음." style={{...fInput,minHeight:"80px",resize:"vertical",marginBottom:"16px"}}/>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>setVisitModal(null)} style={{flex:1,padding:"12px",borderRadius:"10px",border:`1px solid ${K.border}`,background:"#fff",color:K.muted,fontFamily:"inherit",fontWeight:700,fontSize:"14px",cursor:"pointer"}}>취소</button>
                <button onClick={submitVisitLog} style={{flex:2,padding:"12px",borderRadius:"10px",border:"none",background:K.night,color:K.gold,fontFamily:"inherit",fontWeight:700,fontSize:"14px",cursor:"pointer"}}>저장</button>
              </div>
            </div>
          </div>
        )}
        <Toast/>
      </div>
    );
  }

  if(view==="add" && form){
    const isDinner=form.mealTimes?.includes("석식");
    return(
      <div style={{fontFamily:FF,background:K.paper,minHeight:"100vh",color:K.ink,maxWidth:"500px",margin:"0 auto"}}>
        <div style={{background:K.night,color:"#eeeae2",padding:"14px 16px",display:"flex",alignItems:"center",gap:"12px",borderBottom:`3px solid ${K.accent}`}}>
          <button onClick={()=>{setView("list");setForm(null);}} style={{background:"none",border:"none",color:K.accent,cursor:"pointer",fontSize:"22px",padding:0,lineHeight:1,fontFamily:"inherit"}}>←</button>
          <div style={{flex:1,fontSize:"17px",fontWeight:700}}>{form.id?"음식점 수정":"새 음식점 추가"}</div>
        </div>
        <div style={sec}>
          <label style={fLabel}>음식점 이름 *</label>
          <input style={fInput} value={form.name} placeholder="예) 류경 한정식" onChange={e=>setForm({...form,name:e.target.value})}/>
          <label style={fLabel}>지역 *</label>
          <div style={{...row,marginBottom:"8px"}}>
            {regionList.map(r=>(<button key={r} style={mChip(form.region===r)} onClick={()=>setForm({...form,region:r})}>{r}</button>))}
            <button style={{...mChip(false),borderStyle:"dashed"}} onClick={()=>{const c=prompt("새 지역 이름:");if(c?.trim()){setForm({...form,region:c.trim()});saveExtraRegion(c.trim());}}}>+ 직접 입력</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            <div><label style={fLabel}>음식 종류</label><select style={{...fInput,marginBottom:0}} value={form.cuisine} onChange={e=>setForm({...form,cuisine:e.target.value})}><option value="">선택</option>{CUISINES.map(c=><option key={c}>{c}</option>)}</select></div>
            <div>
              <label style={fLabel}>가격대 (인당)</label>
              <div style={{display:"flex",gap:"5px"}}>
                {PRICE_LEVELS.map(p=>(<button key={p} onClick={()=>setForm({...form,price:p})} style={{flex:1,padding:"8px 2px",borderRadius:"8px",fontSize:"11px",fontWeight:700,fontFamily:"inherit",cursor:"pointer",transition:"all .12s",textAlign:"center",border:form.price===p?`2px solid ${PRICE_STYLE[p].color}`:`1px solid #d0c8b8`,background:form.price===p?PRICE_STYLE[p].bg:"#fff",color:form.price===p?PRICE_STYLE[p].color:K.muted}}>{p}</button>))}
              </div>
            </div>
          </div>
        </div>
        <div style={sec}>
          <label style={fLabel}>식사 시간</label>
          <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>{MEAL_TIMES.map(m=>(<button key={m} style={mealBtn(m,form.mealTimes?.includes(m))} onClick={()=>toggleArr("mealTimes",m)}><span style={{fontSize:"16px"}}>{MEAL_STYLE[m].icon}</span> {m}</button>))}</div>
          {isDinner&&<div style={{background:"#fdf8ee",borderRadius:"10px",padding:"12px",border:`1px dashed ${K.gold}50`,marginBottom:"14px"}}>
            <label style={{...fLabel,color:K.gold}}>석식 주류 옵션</label>
            <div style={row}>{ALCOHOL_OPTS.map(a=>(<button key={a} style={alcChip(a,form.alcohols?.includes(a))} onClick={()=>toggleArr("alcohols",a)}>{a}</button>))}</div>
            <div style={{marginTop:"10px"}}>
              <label style={{...fLabel,color:K.gold}}>콜키지</label>
              <div style={{display:"flex",gap:"6px"}}>{CORKAGE_OPTS.map(c=>(<button key={c} onClick={()=>setForm({...form,corkage:form.corkage===c?"":c})} style={{flex:1,padding:"7px 0",borderRadius:"8px",fontSize:"12px",fontWeight:700,fontFamily:"inherit",cursor:"pointer",transition:"all .12s",border:form.corkage===c?`2px solid ${CORKAGE_STYLE[c].color}`:`1px solid ${K.border}`,background:form.corkage===c?CORKAGE_STYLE[c].bg:"#fff",color:form.corkage===c?CORKAGE_STYLE[c].color:K.muted}}>{c==="가능"?"✓ 가능":c==="불가"?"✗ 불가":"△ 조건부"}</button>))}</div>
            </div>
          </div>}
          <label style={fLabel}>상대 직급</label>
          <div style={{...row,marginBottom:"12px"}}>{RANKS.map(r=>(<button key={r} style={mChip(form.ranks?.includes(r))} onClick={()=>toggleArr("ranks",r)}>{RANK_STYLE[r]?.label||r}</button>))}</div>
          <label style={fLabel}>미팅 규모</label>
          <div style={{...row,marginBottom:"12px"}}>{SIZES.map(sz=>(<button key={sz} style={mChip(form.sizes?.includes(sz))} onClick={()=>toggleArr("sizes",sz)}>{sz}</button>))}</div>
          <label style={fLabel}>성별 구성</label>
          <div style={row}>{GENDERS.map(g=>(<button key={g} style={mChip(form.genders?.includes(g))} onClick={()=>toggleArr("genders",g)}>{g}</button>))}</div>
        </div>
        <div style={sec}>
          <label style={fLabel}>미팅 분위기</label>
          <div style={{...row,marginBottom:"14px"}}>
            {MOOD_OPTS.map(a=>(<button key={a} style={mChip(form.ambiance?.includes(a))} onClick={()=>toggleArr("ambiance",a)}>{a}</button>))}
          </div>
          <label style={fLabel}>시설</label>
          <div style={{...row,marginBottom:"14px"}}>
            {FACILITY_OPTS.map(a=>(<button key={a} style={mChip(form.ambiance?.includes(a))} onClick={()=>toggleArr("ambiance",a)}>{a}</button>))}
          </div>
          <label style={fLabel}>별점</label>
          <div style={{marginBottom:"12px"}}><Stars value={form.rating} onChange={v=>setForm({...form,rating:v})}/></div>
          <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",color:"#5a4e3a",cursor:"pointer",marginBottom:"8px"}}>
            <input type="checkbox" checked={form.reservationRequired} onChange={e=>setForm({...form,reservationRequired:e.target.checked})}/> 예약 필수
          </label>
          {form.reservationRequired&&<><label style={fLabel}>예약 팁</label><input style={fInput} value={form.reservationTip||""} placeholder="예) 2주 전 개별룸 지정 요청" onChange={e=>setForm({...form,reservationTip:e.target.value})}/></>}
        </div>
        <div style={sec}>
          <label style={fLabel}>네이버 플레이스 URL</label>
          <div style={{position:"relative",marginBottom:"10px"}}>
            <input style={{...fInput,marginBottom:0,paddingRight:"80px"}} value={form.naverUrl||""} placeholder="https://map.naver.com/p/entry/place/..." onChange={e=>setForm({...form,naverUrl:e.target.value})}/>
            {form.naverUrl&&<a href={form.naverUrl} target="_blank" rel="noopener noreferrer" style={{position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",background:"#03C75A",color:"#fff",fontSize:"11px",fontWeight:700,padding:"4px 9px",borderRadius:"6px",textDecoration:"none",whiteSpace:"nowrap"}}>미리보기 ↗</a>}
          </div>
          <div style={{fontSize:"11px",color:K.muted,marginBottom:"12px",lineHeight:1.6}}>네이버 지도에서 음식점 검색 후 공유 링크를 붙여넣으세요.</div>
          <label style={fLabel}>메모</label>
          <textarea value={form.notes||""} placeholder="예) 편집국장 방문 시 1호 룸 지정." onChange={e=>setForm({...form,notes:e.target.value})} style={{...fInput,minHeight:"72px",resize:"vertical",marginBottom:0}}/>
        </div>
        <div style={{margin:"10px 12px 28px"}}>
          <button onClick={submitForm} style={{width:"100%",padding:"14px",borderRadius:"10px",border:"none",fontFamily:"inherit",fontWeight:700,fontSize:"14px",cursor:"pointer",background:K.night,color:K.gold}}>{form.id?"수정 완료":"추가 완료"}</button>
        </div>
        <Toast/>
      </div>
    );
  }

  const totalVisits = restaurants.reduce((a,r)=>a+(r.visitCount||0),0);
  return(
    <div style={{fontFamily:FF,background:K.paper,minHeight:"100vh",color:K.ink,maxWidth:"500px",margin:"0 auto"}}>
      <div style={{background:K.night,borderBottom:`3px solid ${K.accent}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"15px 16px 12px"}}>
          <div style={{cursor:"pointer"}} onClick={()=>{setView("list");setSelected(null);setForm(null);setFRegion("전체");setFRank("");setFSize("");setFGender("");setFMeal("");setFAlcohol("");setFSearch("");setShowFavOnly(false);}}>
            <div onClick={()=>{setView("list");setSelected(null);setForm(null);setFRegion("전체");setFRank("");setFSize("");setFGender("");setFMeal("");setFAlcohol("");setFSearch("");setShowFavOnly(false);}style={{fontSize:"22px",fontWeight:800,color:"#eeeae2",letterSpacing:"-.02em",fontFamily:FF,cursor:"pointer"}}>NHN PR 다이닝</div>
<div onClick={()=>{setView("list");setSelected(null);setForm(null);setFRegion("전체");setFRank("");setFSize("");setFGender("");setFMeal("");setFAlcohol("");setFSearch("");setShowFavOnly(false);}}style={{fontSize:"10px",color:K.accent,letterSpacing:".16em",textTransform:"uppercase",marginTop:"3px",cursor:"pointer"}}>NHN PR Dining Planner</div>
          </div>
          <button onClick={()=>openAdd()} style={{background:K.accent,color:"#fff",border:"none",borderRadius:"7px",padding:"9px 14px",fontWeight:700,cursor:"pointer",fontSize:"13px",fontFamily:"inherit"}}>+ 추가</button>
        </div>
      </div>
      <div style={{display:"flex",background:"#fff",borderBottom:`1px solid ${K.border}`}}>
        {[[restaurants.length,"등록"],[totalVisits,"방문"],[restaurants.filter(r=>r.favorite).length,"즐겨찾기"],[new Set(restaurants.map(r=>r.region)).size,"지역"]].map(([n,l],i)=>(
          <div key={l} style={{flex:1,textAlign:"center",padding:"10px 4px",borderRight:i<3?`1px solid ${K.border}`:undefined}}>
            <div style={{fontSize:"20px",fontWeight:700,lineHeight:1}}>{n}</div>
            <div style={{fontSize:"10px",color:K.muted,marginTop:"2px",letterSpacing:".06em"}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{background:"#ede9e0",borderBottom:`1px solid ${K.border}`,padding:"12px 14px"}}>
        <input value={fSearch} onChange={e=>setFSearch(e.target.value)} placeholder="🔍  이름, 메모, 음식 종류 검색..." style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${K.border}`,borderRadius:"8px",background:"#fff",fontSize:"14px",fontFamily:"inherit",outline:"none",color:K.ink,boxSizing:"border-box",marginBottom:"10px"}}/>

        {/* 1. 지역 */}
        <div style={{marginBottom:"10px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
            <div style={{fontSize:"10px",color:K.muted,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600}}>지역</div>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              {(fRank||fSize||fGender||fMeal||fAlcohol||showFavOnly)&&(
                <button onClick={()=>{setFRank("");setFSize("");setFGender("");setFMeal("");setFAlcohol("");setShowFavOnly(false);}} style={{fontSize:"11px",color:K.accent,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>필터 초기화</button>
              )}
              <button onClick={()=>setShowFavOnly(!showFavOnly)} style={{background:showFavOnly?K.accent:"none",color:showFavOnly?"#fff":K.muted,border:`1.5px solid ${showFavOnly?K.accent:"#c0b8a8"}`,borderRadius:"20px",padding:"3px 10px",fontSize:"11px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>♥ 즐겨찾기</button>
            </div>
          </div>
          <div style={{...row,marginBottom:"6px"}}>
            <button style={regionChip(fRegion==="전체")} onClick={()=>setFRegion("전체")}>전체 ({restaurants.length})</button>
          </div>
          {Object.entries(REGION_GROUPS).map(([groupName,groupRegions])=>{
            const groupInList=regionList.filter(r=>groupRegions.includes(r));
            return(
              <div key={groupName} style={{marginBottom:"7px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"4px"}}>
                  <div style={{fontSize:"10px",color:K.gold,fontWeight:700,letterSpacing:".06em"}}>{groupName}</div>
                  <button onClick={()=>{const c=prompt(`${groupName}에 추가할 지역 이름:`);if(c?.trim()) saveExtraRegion(c.trim());}}
                    style={{fontSize:"10px",color:K.muted,background:"none",border:`1px dashed #c0b8a8`,borderRadius:"20px",padding:"1px 8px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>+ 추가</button>
                </div>
                {groupInList.length>0&&(
                  <div style={row}>
                    {groupInList.map(r=>{
                      const cnt=restaurants.filter(x=>x.region===r).length;
                      return(<button key={r} style={regionChip(fRegion===r)} onClick={()=>setFRegion(r)}>{r}{cnt>0?` (${cnt})`:""}</button>);
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {(()=>{
            const allGrouped=Object.values(REGION_GROUPS).flat();
            const others=regionList.filter(r=>!allGrouped.includes(r));
            if(others.length===0) return null;
            return(
              <div style={{marginBottom:"6px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"4px"}}>
                  <div style={{fontSize:"10px",color:K.gold,fontWeight:700,letterSpacing:".06em"}}>기타</div>
                  <button onClick={()=>{const c=prompt("기타 지역 이름:");if(c?.trim()) saveExtraRegion(c.trim());}}
                    style={{fontSize:"10px",color:K.muted,background:"none",border:`1px dashed #c0b8a8`,borderRadius:"20px",padding:"1px 8px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>+ 추가</button>
                </div>
                <div style={row}>
                  {others.map(r=>{
                    const cnt=restaurants.filter(x=>x.region===r).length;
                    return(<button key={r} style={regionChip(fRegion===r)} onClick={()=>setFRegion(r)}>{r}{cnt>0?` (${cnt})`:""}</button>);
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* 2. 식사 시간 */}
        <div style={{marginBottom:"10px"}}>
          <div style={{fontSize:"10px",color:K.muted,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:"6px"}}>식사 시간</div>
          <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
            {MEAL_TIMES.map(m=>(<button key={m} style={{...mealBtn(m,fMeal===m),flex:"0 0 auto",padding:"8px 20px"}} onClick={()=>{setFMeal(fMeal===m?"":m);if(fMeal===m)setFAlcohol("");}}><span style={{fontSize:"14px"}}>{MEAL_STYLE[m].icon}</span> {m}</button>))}
            {(fMeal||fAlcohol)&&<button onClick={()=>{setFMeal("");setFAlcohol("");}} style={{padding:"7px 12px",borderRadius:"8px",border:`1px solid ${K.border}`,background:"#fff",color:K.muted,cursor:"pointer",fontFamily:"inherit",fontSize:"12px",fontWeight:600}}>✕ 해제</button>}
          </div>
        </div>
        {fMeal==="석식"&&(
          <div style={{background:"#fdf8ee",borderRadius:"10px",padding:"10px 12px",border:`1px dashed ${K.gold}60`,marginBottom:"10px"}}>
            <div style={{fontSize:"10px",color:K.gold,letterSpacing:".1em",textTransform:"uppercase",fontWeight:700,marginBottom:"6px"}}>🍾 주류 종류</div>
            <div style={row}>{ALCOHOL_OPTS.map(a=>(<button key={a} style={alcChip(a,fAlcohol===a)} onClick={()=>setFAlcohol(fAlcohol===a?"":a)}>{a}</button>))}</div>
          </div>
        )}

        {/* 3. 미팅 상대 */}
        <div style={{marginBottom:"9px"}}>
          <div style={{fontSize:"10px",color:K.muted,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:"5px"}}>미팅 상대</div>
          <div style={row}>{RANKS.map(r=>(<button key={r} style={chip(fRank===r,RANK_STYLE[r]?.dot||K.night)} onClick={()=>setFRank(fRank===r?"":r)}>{RANK_STYLE[r]?.label||r}</button>))}</div>
        </div>

        {/* 4. 미팅 규모 + 5. 성별 구성 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
          <div>
            <div style={{fontSize:"10px",color:K.muted,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:"5px"}}>미팅 규모</div>
            <div style={row}>{SIZES.map(sz=>(<button key={sz} style={chip(fSize===sz)} onClick={()=>setFSize(fSize===sz?"":sz)}>{sz}</button>))}</div>
          </div>
          <div>
            <div style={{fontSize:"10px",color:K.muted,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:"5px"}}>성별 구성</div>
            <div style={row}>{GENDERS.map(g=>(<button key={g} style={chip(fGender===g)} onClick={()=>setFGender(fGender===g?"":g)}>{g}</button>))}</div>
          </div>
        </div>
      </div>

      <div style={{padding:"8px 14px 2px",fontSize:"12px",color:K.muted,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>{filtered.length!==restaurants.length?<><strong style={{color:K.ink}}>{filtered.length}곳</strong> 검색됨</>:`전체 ${restaurants.length}곳`}</span>
        {(fMeal||fAlcohol)&&<span style={{fontSize:"11px",fontWeight:700,color:fMeal?MEAL_STYLE[fMeal].color:K.muted}}>{fMeal&&`${MEAL_STYLE[fMeal].icon} ${fMeal}`}{fAlcohol&&` · ${fAlcohol}`}</span>}
      </div>

      <div style={{paddingBottom:"28px"}}>
        {filtered.length===0?<div style={{textAlign:"center",padding:"56px 20px",color:K.muted}}><div style={{fontSize:"36px",marginBottom:"10px"}}>🍽</div><div style={{fontSize:"15px",fontWeight:700,marginBottom:"6px"}}>조건에 맞는 음식점이 없습니다</div><div style={{fontSize:"13px",marginBottom:"16px"}}>필터를 변경하거나 새 음식점을 추가해 보세요</div><button onClick={()=>openAdd()} style={{background:K.night,color:K.gold,border:"none",borderRadius:"8px",padding:"10px 20px",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ 음식점 추가</button></div>
        :filtered.map(r=>(
          <div key={r.id} onClick={()=>{setSelected(r);setView("detail");setShowAllLogs(false);}} onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 5px 16px rgba(0,0,0,.10)";}} onMouseOut={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 2px 6px rgba(0,0,0,.06)";}} style={{background:K.card,margin:"10px 12px",borderRadius:"12px",overflow:"hidden",border:`1px solid ${K.border}`,boxShadow:"0 2px 6px rgba(0,0,0,.06)",cursor:"pointer",transition:"transform .15s, box-shadow .15s"}}>
            <div style={{padding:"13px 13px 7px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"16px",fontWeight:800,marginBottom:"3px",lineHeight:1.2,letterSpacing:"-.01em"}}>{r.name}</div>
                <div style={{fontSize:"12px",color:K.muted,display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
                  <span>{r.region}</span><span>·</span><span>{r.cuisine}</span><span>·</span>
                  <span style={{color:priceColor[r.price]||K.gold,fontWeight:700}}>{r.price}</span>
                  {r.reservationRequired&&<span style={{background:"#5a1010",color:"#fff",fontSize:"10px",fontWeight:600,padding:"1px 6px",borderRadius:"20px"}}>예약필수</span>}
                </div>
              </div>
              <button onClick={e=>{e.stopPropagation();toggleFav(r.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:"19px",color:r.favorite?"#d02020":"#ccc",padding:0,lineHeight:1}}>♥</button>
            </div>
            <div style={{padding:"0 13px 7px",display:"flex",gap:"4px",flexWrap:"wrap"}}>
              {r.mealTimes?.map(m=>(<span key={m} style={{background:MEAL_STYLE[m].bg,color:MEAL_STYLE[m].color,fontSize:"11px",fontWeight:700,padding:"2px 8px",borderRadius:"20px",border:`1px solid ${MEAL_STYLE[m].border}`}}>{MEAL_STYLE[m].icon} {m}</span>))}
              {r.alcohols?.map(a=>(<span key={a} style={{background:ALCOHOL_STYLE[a]?.bg||"#eee",color:ALCOHOL_STYLE[a]?.color||"#444",fontSize:"11px",fontWeight:600,padding:"2px 8px",borderRadius:"20px",border:`1px solid ${ALCOHOL_STYLE[a]?.border||"#ccc"}`}}>{a}</span>))}
              {r.corkage&&<span style={{background:CORKAGE_STYLE[r.corkage]?.bg,color:CORKAGE_STYLE[r.corkage]?.color,fontSize:"11px",fontWeight:700,padding:"2px 8px",borderRadius:"20px",border:`1px solid ${CORKAGE_STYLE[r.corkage]?.border}`}}>🍾 {r.corkage==="가능"?"콜키지 ✓":r.corkage==="불가"?"콜키지 ✗":"콜키지 △"}</span>}
            </div>
            <div style={{padding:"0 13px 10px",display:"flex",gap:"4px",flexWrap:"wrap"}}>
              {r.ranks?.map(rk=>(<Tag key={rk} label={RANK_STYLE[rk]?.label||rk} bg={RANK_STYLE[rk]?.bg||"#eee"} color={RANK_STYLE[rk]?.dot||"#444"} border={RANK_STYLE[rk]?.dot+"40"} small/>))}
              {r.sizes?.map(sz=><Tag key={sz} label={sz} small/>)}
              {r.ambiance?.slice(0,3).map(a=><Tag key={a} label={a} bg="#ede9e0" color="#6a5e4e" small/>)}
            </div>
            {r.visitLogs?.length>0&&r.visitLogs[0].comment&&<div style={{padding:"0 13px 8px"}}><div style={{fontSize:"12px",color:K.muted,background:"#faf7f2",padding:"6px 10px",borderRadius:"7px",lineHeight:1.5,borderLeft:`2px solid ${K.gold}`,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{fontSize:"11px",color:K.gold,fontWeight:700,marginRight:"5px"}}>{r.visitLogs[0].date}</span>{r.visitLogs[0].comment}</div></div>}
            <div style={{padding:"7px 13px",background:"#faf7f2",borderTop:`1px solid ${K.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <Stars value={r.rating}/>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"11px",color:K.muted}}>방문 {r.visitCount||0}회 · {r.lastVisit||"—"}</span>
                {r.naverUrl&&<a href={r.naverUrl} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{display:"inline-flex",alignItems:"center",gap:"4px",background:"#03C75A",color:"#fff",fontSize:"11px",fontWeight:700,padding:"4px 9px",borderRadius:"6px",textDecoration:"none",whiteSpace:"nowrap"}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M13.6 10.4L10.2 5H5v14h5.4l3.4-5.5V19H19V5h-5.4v5.4z" fill="white"/></svg>N</a>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Toast/>
    </div>
  );
}
