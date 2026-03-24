{/* 지역 — 최상단, 그룹별 구분 */}
        <div style={{marginBottom:"10px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
            <div style={{fontSize:"10px",color:K.muted,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600}}>지역</div>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              {(fRank||fSize||fGender||fMeal||fAlcohol||showFavOnly)&&(
                <button onClick={()=>{setFRank("");setFSize("");setFGender("");setFMeal("");setFAlcohol("");setShowFavOnly(false);}}
                  style={{fontSize:"11px",color:K.accent,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>필터 초기화</button>
              )}
              <button onClick={()=>setShowFavOnly(!showFavOnly)}
                style={{background:showFavOnly?K.accent:"none",color:showFavOnly?"#fff":K.muted,
                  border:`1.5px solid ${showFavOnly?K.accent:"#c0b8a8"}`,borderRadius:"20px",
                  padding:"3px 10px",fontSize:"11px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
                ♥ 즐겨찾기
              </button>
            </div>
          </div>
          <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"6px"}}>
            <button style={regionChip(fRegion==="전체")} onClick={()=>setFRegion("전체")}>전체 ({restaurants.length})</button>
          </div>
          {Object.entries(REGION_GROUPS).map(([groupName,groupRegions])=>{
            const groupInList=regionList.filter(r=>groupRegions.includes(r));
            if(groupInList.length===0) return null;
            return(
              <div key={groupName} style={{marginBottom:"6px"}}>
                <div style={{fontSize:"10px",color:K.gold,fontWeight:700,letterSpacing:".06em",marginBottom:"4px"}}>{groupName}</div>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                  {groupInList.map(r=>{
                    const cnt=restaurants.filter(x=>x.region===r).length;
                    return(<button key={r} style={regionChip(fRegion===r)} onClick={()=>setFRegion(r)}>{r}{cnt>0?` (${cnt})`:""}</button>);
                  })}
                </div>
              </div>
            );
          })}
          {(()=>{
            const allGrouped=Object.values(REGION_GROUPS).flat();
            const others=regionList.filter(r=>!allGrouped.includes(r));
            if(others.length===0) return null;
            return(
              <div style={{marginBottom:"6px"}}>
                <div style={{fontSize:"10px",color:K.gold,fontWeight:700,letterSpacing:".06em",marginBottom:"4px"}}>기타</div>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                  {others.map(r=>{
                    const cnt=restaurants.filter(x=>x.region===r).length;
                    return(<button key={r} style={regionChip(fRegion===r)} onClick={()=>setFRegion(r)}>{r}{cnt>0?` (${cnt})`:""}</button>);
                  })}
                </div>
              </div>
            );
          })()}
          <button style={{...regionChip(false),borderStyle:"dashed",marginTop:"2px"}}
            onClick={()=>{const c=prompt("새 지역 이름:");if(c?.trim()) saveExtraRegion(c.trim());}}>+ 지역 추가</button>
        </div>

        {/* 식사 시간 */}
        <div style={{marginBottom:"10px"}}>
          <div style={{fontSize:"10px",color:K.muted,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:"6px"}}>식사 시간</div>
          <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
            {MEAL_TIMES.map(m=>(
              <button key={m} style={{...mealBtn(m,fMeal===m),flex:"0 0 auto",padding:"8px 20px"}}
                onClick={()=>{setFMeal(fMeal===m?"":m);if(fMeal===m)setFAlcohol("");}}>
                <span style={{fontSize:"14px"}}>{MEAL_STYLE[m].icon}</span> {m}
              </button>
            ))}
            {(fMeal||fAlcohol)&&<button onClick={()=>{setFMeal("");setFAlcohol("");}} style={{padding:"7px 12px",borderRadius:"8px",border:`1px solid ${K.border}`,background:"#fff",color:K.muted,cursor:"pointer",fontFamily:"inherit",fontSize:"12px",fontWeight:600}}>✕ 해제</button>}
          </div>
        </div>

        {fMeal==="석식"&&(
          <div style={{background:"#fdf8ee",borderRadius:"10px",padding:"10px 12px",border:`1px dashed ${K.gold}60`,marginBottom:"10px"}}>
            <div style={{fontSize:"10px",color:K.gold,letterSpacing:".1em",textTransform:"uppercase",fontWeight:700,marginBottom:"6px"}}>🍾 주류 종류</div>
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
              {ALCOHOL_OPTS.map(a=>(<button key={a} style={alcChip(a,fAlcohol===a)} onClick={()=>setFAlcohol(fAlcohol===a?"":a)}>{a}</button>))}
            </div>
          </div>
        )}

        {/* 미팅 상대 */}
        <div style={{marginBottom:"9px"}}>
          <div style={{fontSize:"10px",color:K.muted,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:"5px"}}>미팅 상대</div>
          <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
            {RANKS.map(r=>(<button key={r} style={chip(fRank===r,RANK_STYLE[r]?.dot||K.night)} onClick={()=>setFRank(fRank===r?"":r)}>{RANK_STYLE[r]?.label||r}</button>))}
          </div>
        </div>

        {/* 미팅 규모 + 성별 구성 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
          <div>
            <div style={{fontSize:"10px",color:K.muted,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:"5px"}}>미팅 규모</div>
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
              {SIZES.map(sz=>(<button key={sz} style={chip(fSize===sz)} onClick={()=>setFSize(fSize===sz?"":sz)}>{sz}</button>))}
            </div>
          </div>
          <div>
            <div style={{fontSize:"10px",color:K.muted,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginBottom:"5px"}}>성별 구성</div>
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
              {GENDERS.map(g=>(<button key={g} style={chip(fGender===g)} onClick={()=>setFGender(fGender===g?"":g)}>{g}</button>))}
            </div>
          </div>
        </div>
