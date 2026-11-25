// FILE: frontend/src/pages/Simulation.js
// RIGHT +100 = BEST (green) | CENTER 0 = neutral | LEFT -100 = WORST (red)
import React, { useState } from "react";
import { useApp, COUNTRIES, INDIA_STATES } from "../context/AppContext";
import MetricCard     from "../components/MetricCard";
import LoadingOverlay from "../components/LoadingOverlay";
import { getRiskColor, sliderValueColor, sliderImpactLabel,
         tempStatus, aqiStatus, waterStatus, forestStatus } from "../utils/helpers";
import { LineChart, Line, XAxis, YAxis, CartesianGrid,
         Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./Simulation.css";

// Slider LABELS describe the OUTCOME being controlled, not a literal
// percentage. Right (+100) = best outcome for that factor.
// Left (-100) = worst outcome for that factor.
const SLIDERS = [
  { key:"populationGrowth", label:"Population Pressure Control"  },
  { key:"industrialGrowth", label:"Industrial Sustainability"    },
  { key:"pollutionControl", label:"Pollution Control Level"      },
  { key:"waterUsage",       label:"Water Use Efficiency"         },
  { key:"greenCover",       label:"Reforestation Level"          },
];

const SEV = {
  critical:{ border:"rgba(239,68,68,0.5)",   bg:"rgba(239,68,68,0.07)",   tag:"rgba(239,68,68,0.15)",   tagText:"#ef4444", label:"CRITICAL"  },
  high:    { border:"rgba(249,115,22,0.45)", bg:"rgba(249,115,22,0.06)",  tag:"rgba(249,115,22,0.15)",  tagText:"#f97316", label:"HIGH"      },
  medium:  { border:"rgba(251,191,36,0.4)",  bg:"rgba(251,191,36,0.05)",  tag:"rgba(251,191,36,0.15)",  tagText:"#fbbf24", label:"MEDIUM"    },
  low:     { border:"rgba(148,163,184,0.3)", bg:"rgba(148,163,184,0.04)", tag:"rgba(148,163,184,0.15)", tagText:"#94a3b8", label:"INFO"      },
  positive:{ border:"rgba(0,255,136,0.35)",  bg:"rgba(0,255,136,0.05)",   tag:"rgba(0,255,136,0.15)",   tagText:"#00ff88", label:"POSITIVE"  },
};
const TYPE_ACCENT={ warning:"#ef4444", improvement:"#00ff88", suggestion:"#00d4ff", trend:"#fbbf24" };

function InsightCard({ insight }) {
  const [open,setOpen]=useState(false);
  const sty=SEV[insight.severity]||SEV.low;
  const accent=TYPE_ACCENT[insight.type]||"#94a3b8";
  return (
    <div onClick={()=>setOpen(v=>!v)} style={{
      display:"flex",gap:"0.75rem",padding:"0.75rem 0.9rem",marginBottom:"0.5rem",
      background:sty.bg,cursor:"pointer",border:`1px solid ${sty.border}`,
      borderLeft:`3px solid ${accent}`,borderRadius:"var(--radius-sm)",transition:"var(--transition)",
    }}>
      <div style={{fontSize:"1.3rem",flexShrink:0,lineHeight:1.2}}>{insight.icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.25rem",flexWrap:"wrap"}}>
          <span style={{fontSize:"0.82rem",fontWeight:700,color:"var(--text-primary)"}}>{insight.title}</span>
          <span style={{fontSize:"0.58rem",fontWeight:700,background:sty.tag,color:sty.tagText,
            borderRadius:"4px",padding:"1px 6px",textTransform:"uppercase",letterSpacing:"0.1em"}}>{sty.label}</span>
          <span style={{fontSize:"0.58rem",color:"var(--text-muted)",marginLeft:"auto",
            textTransform:"uppercase",letterSpacing:"0.06em"}}>{insight.type} {open?"▲":"▼"}</span>
        </div>
        <div style={{fontSize:"0.76rem",color:"var(--text-secondary)",lineHeight:1.55,
          overflow:open?"visible":"hidden",display:open?"block":"-webkit-box",
          WebkitLineClamp:open?"unset":2,WebkitBoxOrient:"vertical"}}>
          {insight.message}
        </div>
      </div>
    </div>
  );
}

function InsightPanel({ insights }) {
  const [filter,setFilter]=useState("all");
  const TABS=[
    {key:"all",label:"All",color:"var(--text-secondary)"},
    {key:"warning",label:"⚠️ Warnings",color:"#ef4444"},
    {key:"improvement",label:"✅ Improved",color:"#00ff88"},
    {key:"suggestion",label:"💡 Actions",color:"#00d4ff"},
    {key:"trend",label:"📊 Trends",color:"#fbbf24"},
  ];
  const counts=insights.reduce((a,i)=>{a[i.type]=(a[i.type]||0)+1;return a;},{});
  const visible=filter==="all"?insights:insights.filter(i=>i.type===filter);
  return (
    <div>
      <div style={{display:"flex",gap:"0.35rem",flexWrap:"wrap",marginBottom:"0.75rem"}}>
        {TABS.map(t=>{
          const n=t.key==="all"?insights.length:(counts[t.key]||0);
          if(t.key!=="all"&&n===0)return null;
          const on=filter===t.key;
          return(
            <button key={t.key} onClick={()=>setFilter(t.key)} style={{
              fontSize:"0.7rem",fontWeight:700,padding:"0.25rem 0.65rem",borderRadius:"100px",
              cursor:"pointer",transition:"var(--transition)",
              border:`1px solid ${on?t.color:"var(--border)"}`,
              background:on?`${t.color}18`:"transparent",color:on?t.color:"var(--text-muted)",
            }}>{t.label} ({n})</button>
          );
        })}
      </div>
      {visible.length===0
        ?<div style={{fontSize:"0.78rem",color:"var(--text-muted)",textAlign:"center",padding:"1rem"}}>No insights here.</div>
        :visible.map((ins,i)=><InsightCard key={i} insight={ins}/>)
      }
      <div style={{fontSize:"0.65rem",color:"var(--text-muted)",marginTop:"0.5rem",textAlign:"right"}}>Click to expand</div>
    </div>
  );
}

function DeltaBadge({before,after,lowerIsBetter=false}){
  if(before==null||after==null)return null;
  const diff=after-before;
  if(Math.abs(diff)<0.05)return<span style={{fontSize:"0.65rem",color:"var(--text-muted)"}}>—</span>;
  const isGood=lowerIsBetter?diff<0:diff>0;
  return(
    <span style={{fontSize:"0.65rem",fontWeight:700,marginTop:"2px",
      color:isGood?"var(--risk-low)":"var(--risk-high)"}}>
      {diff>0?"▲":"▼"} {Math.abs(diff).toFixed(1)}
    </span>
  );
}

export default function Simulation() {
  const {
    country,setCountry,state,setState,year,setYear,
    prediction,trendData,loading,error,
    simFactors,setSimFactors,simResult,report,
    runPrediction,runSimulation,resetSimFactors,
  }=useApp();
  const p=prediction, s=simResult, r=report;

  const chartData=trendData?[
    ...trendData.historical.slice(-5).map(d=>({year:parseInt(d.year),without:parseFloat(d.risk_score)||null,with:parseFloat(d.risk_score)||null})),
    ...trendData.predicted.map(d=>({
      year:parseInt(d.year),
      without:parseFloat(d.risk_score)||null,
      with:s?Math.max(0,Math.min(100,parseFloat(d.risk_score)-(p.risk_score-s.risk_score)*0.7)):null,
    })),
  ]:[];

  const insights=(r?.ai_insights||[]).map(i=>
    typeof i==="string"?{type:"suggestion",severity:"low",icon:i.slice(0,2),title:"AI Insight",message:i.slice(2).trim()}:i
  );

  function handleApply(){
  runSimulation();
}

  return (
    <div className="simulation">
      {loading&&<LoadingOverlay/>}
      <div className="page-title">🎮 Simulation</div>
      <div className="page-subtitle" style={{display:"flex",gap:"1.5rem",alignItems:"center"}}>
      </div>

      <div className="sim-top">
        {/* B: Sliders */}
        <div className="section-card sim-sliders">
          <div className="section-card-header">
            <span className="section-card-title"> SIMULATION (WHAT-IF)</span>
          </div>

          {/* Gradient bar showing direction */}
          <div style={{
            height:"6px",borderRadius:"3px",marginBottom:"0.75rem",
            background:"linear-gradient(to right, #ef4444 0%, #f97316 25%, #fbbf24 50%, #88cc00 75%, #00ff88 100%)",
          }}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.65rem",marginBottom:"0.5rem"}}>
            <span style={{color:"#ef4444",fontWeight:700}}>−100 WORST</span>
            <span style={{color:"#94a3b8"}}>0 Neutral</span>
            <span style={{color:"#00ff88",fontWeight:700}}>+100 BEST</span>
          </div>
          <div style={{
            fontSize:"0.82rem", color:"#94a3b8", marginBottom:"0.75rem",
            background:"rgba(255,255,255,0.03)", padding:"0.4rem 0.6rem", borderRadius:"6px",
            lineHeight:1.5, fontStyle:"italic",
          }}>
            ℹ️ Each slider sets how <b>good or bad</b> that factor's outcome is —
            it's not a literal percentage. Moving LEFT simulates a worse real-world
            scenario for that factor (e.g. overpopulation, heavy pollution).
            Moving RIGHT simulates an improved scenario (e.g. population control, clean industry).
          </div>

          {SLIDERS.map(sl=>{
            const val=simFactors[sl.key];
            const col=sliderValueColor(val);
            const hint=sliderImpactLabel(sl.key,val);
            return(
              <div key={sl.key} className="slider-row">
                <div className="slider-header">
                  <span className="slider-label">{sl.label}</span>
                  <span className="slider-val" style={{color:col,fontWeight:700}}>
                    {val>0?"+":""}{val}
                  </span>
                </div>
                <input
                  type="range" min={-100} max={100} step={1}
                  value={val}
                  onChange={e=>setSimFactors(prev=>({...prev,[sl.key]:parseInt(e.target.value)}))}
                  style={{width:"100%"}}
                />
                <div style={{fontSize:"0.70rem",color:"#94a3b8",marginTop:"1px",fontStyle:"italic",lineHeight:1.4}}>
                  {hint}
                </div>
              </div>
            );
          })}

         <div style={{display:"flex", gap:"0.5rem", marginTop:"1rem"}}>
  <button 
    className="btn-primary" 
    onClick={handleApply}
  >
    Apply Simulation
  </button>

  <button 
    className="btn-primary"   // 🔥 changed from btn-secondary
    onClick={resetSimFactors}
  >
    Reset
  </button>
</div>

          <div className="sim-how-it-works">
            <div style={{fontSize:"0.80rem",fontWeight:700,color:"var(--accent-green)",marginBottom:"0.4rem"}}>Expected Results</div>
            <div style={{fontSize:"0.70rem",color:"#94a3b8",lineHeight:1.7}}>
              <span style={{color:"#ef4444"}}>All −100</span> → Risk ≈ 100 (🔴 High)<br/>
              <span style={{color:"var(--text-muted)"}}>All 0   </span> → Risk = AI baseline<br/>
              <span style={{color:"#00ff88"}}>All +100</span> → Risk ≈ 0   (🟢 Low)
            </div>
          </div>
        </div>
      </div>

      {/* C: Results */}
      {s&&(
        <div className="section-card" style={{marginTop:"1rem"}}>
          <div className="section-card-header">
            <span className="section-card-title">C. SIMULATION RESULTS</span>
            <span className="section-card-sub">After applying slider inputs</span>
          </div>
          <div className="grid-5" style={{gap:"0.5rem",marginBottom:"1rem"}}>
            <div className="metric-card" style={{textAlign:"center"}}>
              <div style={{fontSize:"1.2rem"}}>🌡️</div>
              <div className="metric-value" style={{color:tempStatus(s.temperature).color}}>{s.temperature?.toFixed(1)} <span style={{fontSize:"0.75rem"}}>°C</span></div>
              <div className="metric-label">Temperature</div>
              <div className="metric-sub" style={{color:tempStatus(s.temperature).color}}>{tempStatus(s.temperature).label}</div>
              <DeltaBadge before={p.temperature} after={s.temperature} lowerIsBetter/>
            </div>
            <div className="metric-card" style={{textAlign:"center"}}>
              <div style={{fontSize:"1.2rem"}}>🌫️</div>
              <div className="metric-value" style={{color:aqiStatus(s.aqi).color}}>{s.aqi?.toFixed(0)}</div>
              <div className="metric-label">AQI</div>
              <div className="metric-sub" style={{color:aqiStatus(s.aqi).color}}>{aqiStatus(s.aqi).label}</div>
              <DeltaBadge before={p.aqi} after={s.aqi} lowerIsBetter/>
            </div>
            <div className="metric-card" style={{textAlign:"center"}}>
              <div style={{fontSize:"1.2rem"}}>💧</div>
              <div className="metric-value" style={{color:waterStatus(s.water).color}}>{s.water?.toFixed(0)} <span style={{fontSize:"0.75rem"}}>%</span></div>
              <div className="metric-label">Water</div>
              <div className="metric-sub" style={{color:waterStatus(s.water).color}}>{waterStatus(s.water).label}</div>
              <DeltaBadge before={p.water} after={s.water} lowerIsBetter={false}/>
            </div>
            <div className="metric-card" style={{textAlign:"center"}}>
              <div style={{fontSize:"1.2rem"}}>🌳</div>
              <div className="metric-value" style={{color:forestStatus(s.forest).color}}>{s.forest?.toFixed(0)} <span style={{fontSize:"0.75rem"}}>%</span></div>
              <div className="metric-label">Forest</div>
              <div className="metric-sub" style={{color:forestStatus(s.forest).color}}>{forestStatus(s.forest).label}</div>
              <DeltaBadge before={p.forest} after={s.forest} lowerIsBetter={false}/>
            </div>
            <div className="metric-card" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div style={{fontSize:"0.62rem",color:"#e0f7faad",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"0.3rem"}}>Risk Score</div>
              <div style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",fontWeight:900,color:getRiskColor(s.risk_score)}}>
                {s.risk_score?.toFixed(0)}<span style={{fontSize:"0.8rem",color:"#e0f7faad"}}>/100</span>
              </div>
              <div style={{fontSize:"0.72rem",color:getRiskColor(s.risk_score),fontWeight:700}}>{s.risk_level} Risk</div>
              <div style={{fontSize:"0.65rem",marginTop:"4px",fontWeight:700,
                color:s.risk_score<p.risk_score?"var(--risk-low)":s.risk_score>p.risk_score?"var(--risk-high)":"var(--text-muted)"}}>
                {s.risk_score<p.risk_score?`▼ −${(p.risk_score-s.risk_score).toFixed(1)} improved`
                  :s.risk_score>p.risk_score?`▲ +${(s.risk_score-p.risk_score).toFixed(1)} worsened`:"No change"}
              </div>
            </div>
          </div>

          <div style={{display:"flex", flexDirection:"column", gap:"1rem"}}>
            <div>
              <div className="predict-results-label">Before vs After (Risk Score 0–100)</div>
              <ResponsiveContainer width="80%" height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                  <XAxis dataKey="year" tick={{fill:"var(--text-secondary)",fontSize:9}} tickLine={false} interval={2}/>
                  <YAxis domain={[0,100]} tick={{fill:"var(--text-secondary)",fontSize:9}} tickLine={false} axisLine={false}/>
                  <Tooltip contentStyle={{background:"var(--bg-secondary)",border:"1px solid var(--border)",borderRadius:"8px",fontSize:"0.75rem"}}
                    formatter={(v,n)=>[v!=null?v.toFixed(1):"—",n]}/>
                  <Legend wrapperStyle={{fontSize:"0.72rem"}}/>
                  <Line type="monotone" dataKey="without" name="Without Simulation" stroke="var(--risk-high)" dot={false} strokeWidth={2} connectNulls/>
                  <Line type="monotone" dataKey="with" name="With Simulation" stroke="var(--accent-green)" dot={false} strokeWidth={2} connectNulls/>
                </LineChart>
              </ResponsiveContainer>
              <div style={{display:"flex",gap:"1rem",marginTop:"0.5rem",fontSize:"0.68rem",color:"#ffffffa2"}}>
                <span>🟢 Low: 0–40</span><span>🟡 Medium: 41–70</span><span>🔴 High: 71–100</span>
              </div>
            </div>
            <div>
              <div className="predict-results-label">🧠 AI Insights ({insights.length})</div>
              {insights.length>0
                ?<InsightPanel insights={insights}/>
                :<div style={{fontSize:"0.78rem",color:"var(--text-muted)",padding:"1rem",textAlign:"center"}}>Run simulation to generate insights.</div>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}