import React,{useMemo,useState} from "react";
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer} from "recharts";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {vs} from "react-syntax-highlighter/dist/esm/styles/prism";
import {api} from "./api";
import "./App.css";

const COLS=6;

const modules=[
["dashboard","⌂","Dashboard"],
["learning","◈","Learn Quantum"],
["designer","⌬","Circuit Builder"],
["algorithms","◇","Algorithms"],
["visualization","◉","Visualization"],
["ai","✦","AI Tutor"],
["assessment","✓","Assessment"],
["platform","⚙","Platform"]
];

const lessons=[
["01","Qubits","The basic unit of quantum information.","A qubit can be represented by |0⟩, |1⟩, or a superposition of both.","Q"],
["02","Superposition","A quantum state can contain amplitudes for multiple basis states.","The Hadamard gate transforms |0⟩ into an equal superposition of |0⟩ and |1⟩.","H"],
["03","Entanglement","Quantum correlations between systems.","A common Bell-state circuit is H followed by CNOT.","E"],
["04","Grover's Algorithm","Search an unstructured space with quadratic query speedup.","Grover repeatedly amplifies the amplitude of the desired state.","G"],
["05","Deutsch-Jozsa","Distinguish constant and balanced functions under its promise.","The algorithm demonstrates a quantum query advantage for this promised problem.","D"]
];

const questions=[
["What is a qubit?",["A classical bit that is always 0","A quantum bit that can be in a superposition of 0 and 1","A type of gate","A measurement device"],1,"A qubit is the basic unit of quantum information."],
["What does H do to |0⟩?",["Flips to |1⟩","Creates equal superposition","Measures it","Deletes it"],1,"H|0⟩=(|0⟩+|1⟩)/√2."],
["What is entanglement?",["Two bits touching","A quantum correlation between systems","A classical error","A measurement"],1,"Entanglement is a quantum correlation that cannot be described as independent local states."],
["What does Grover address?",["Unstructured search","Only encryption","Sorting","Graphics"],0,"Grover provides a quadratic query speedup for unstructured search."],
["What does Deutsch-Jozsa distinguish?",["Constant and balanced functions","Prime and composite numbers","Sorting methods","Operating systems"],0,"Under its promise, the algorithm distinguishes constant and balanced functions."]
];

function App(){
 const [page,setPage]=useState("dashboard");
 const [n,setN]=useState(2),[grid,setGrid]=useState({}),[result,setResult]=useState(null),[bloch,setBloch]=useState(null);
 const [chat,setChat]=useState(""),[reply,setReply]=useState("Hi! I'm QuantumTutor. Ask me about qubits, gates, algorithms, or your circuit.");
 const [qi,setQi]=useState(0),[score,setScore]=useState(0),[selected,setSelected]=useState(null),[answered,setAnswered]=useState(false),[done,setDone]=useState(false);
 const key=(q,c)=>`${q}-${c}`;
 const gates=useMemo(()=>{
   const a=[];
   for(let c=0;c<COLS;c++)for(let q=0;q<n;q++){const x=grid[key(q,c)];if(!x)continue;
     if(["h","x","z"].includes(x.type))a.push({gate:x.type,qubit:q});
     if(x.type==="cnot"&&x.role==="control")a.push({gate:"cx",control:q,target:x.pair});
   } return a;
 },[grid,n]);

 const qiskit=useMemo(()=>{
   let s=`from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(${n}, ${n})\n`;
   for(const g of gates){if(g.gate==="cx")s+=`qc.cx(${g.control}, ${g.target})\n`;else s+=`qc.${g.gate}(${g.qubit})\n`;}
   return s+`qc.measure(range(${n}), range(${n}))`;
 },[gates,n]);

 const drop=(e,q,c)=>{
   e.preventDefault(); const t=e.dataTransfer.getData("gateType"); if(!t)return;
   if(t==="cnot"){if(n<2)return alert("CNOT needs at least 2 qubits.");
     const target=Number.parseInt(window.prompt(`CNOT control is q${q}. Target (0-${n-1}):`),10);
     if(Number.isNaN(target)||target===q||target<0||target>=n)return alert("Invalid target.");
     setGrid(g=>({...g,[key(q,c)]:{type:"cnot",role:"control",pair:target},[key(target,c)]:{type:"cnot",role:"target",pair:q}}));
   }else setGrid(g=>({...g,[key(q,c)]:{type:t}}));
 };
 const remove=(q,c)=>setGrid(g=>{const x=g[key(q,c)];if(!x)return g;const z={...g};delete z[key(q,c)];if(x.type==="cnot")delete z[key(x.pair,c)];return z});
 const clear=()=>{setGrid({});setResult(null);setBloch(null)};
 const symbol=x=>!x?"":x.type==="h"?"H":x.type==="x"?"X":x.type==="z"?"Z":x.role==="control"?"●":"⊕";
 const simulate=async()=>{try{setResult(await api.simulate(n,gates));setPage("visualization")}catch(e){alert(e.message)}};
 const showBloch=async()=>{try{setBloch((await api.bloch(n,gates)).bloch_vectors);setPage("visualization")}catch(e){alert(e.message)}};
 const ask=async()=>{if(!chat.trim())return;try{const d=await api.chat(chat,{num_qubits:n,grid});setReply(d.reply);setChat("")}catch(e){setReply(e.message)}};
 const runAlgo=async(fn)=>{try{setResult(await fn())}catch(e){alert(e.message)}};

 const pageContent=()=>{
  if(page==="dashboard")return <Dashboard go={setPage}/>;
  if(page==="learning")return <Learning go={setPage}/>;
  if(page==="designer")return <Designer n={n} setN={x=>{setN(x);setGrid({});setResult(null);setBloch(null)}} grid={grid} drop={drop} remove={remove} clear={clear} simulate={simulate} showBloch={showBloch} qiskit={qiskit}/>;
  if(page==="algorithms")return <Algorithms result={result} run={runAlgo}/>;
  if(page==="visualization")return <Visualization result={result} bloch={bloch} n={n} grid={grid}/>;
  if(page==="ai")return <Tutor chat={chat} setChat={setChat} reply={reply} ask={ask}/>;
  if(page==="assessment")return <Quiz qi={qi} score={score} selected={selected} answered={answered} done={done} setQi={setQi} setScore={setScore} setSelected={setSelected} setAnswered={setAnswered} setDone={setDone}/>;
  return <Platform/>;
 };

 return <div className="shell">
  <aside className="side">
   <div className="brand" onClick={()=>setPage("dashboard")}><b>Q</b><span><strong>ResQbit</strong><small>C → Q</small></span></div>
   {["LEARN","CREATE","EXPLORE"].map((g,i)=><div className="navgroup" key={g}><label>{g}</label>{modules.slice(i===0?0:i===1?2:4,i===0?2:i===1?4:7).map(([id,ic,name])=><button className={page===id?"active":""} onClick={()=>setPage(id)} key={id}><i>{ic}</i>{name}</button>)}</div>)}
   <div className="sidebottom"><button className={page==="platform"?"active":""} onClick={()=>setPage("platform")}><i>⚙</i>Platform</button><div className="profile"><b>S</b><span><strong>Student</strong><small>Quantum Learner</small></span></div></div>
  </aside>
  <main className="main">
   <header><span className="crumb">ResQbit / <b>Quantum Learning</b></span><div className="headright"><input placeholder="Search topics, algorithms..." onChange={e=>{const v=e.target.value.toLowerCase();if(v.includes("circuit"))setPage("designer");else if(v.includes("algorithm"))setPage("algorithms");else if(v.includes("ai")||v.includes("tutor"))setPage("ai");else if(v.includes("quiz"))setPage("assessment");else if(v.includes("learn")||v.includes("qubit"))setPage("learning")}}/><button>?</button><b className="topavatar">S</b></div></header>
   <div className="content">{pageContent()}</div>
  </main>
 </div>
}

function Intro({tag,title,text}){return <div className="intro"><small>{tag}</small><h1>{title}</h1><p>{text}</p></div>}

function Dashboard({go}){return <><section className="hero"><div><small>YOUR QUANTUM JOURNEY</small><h1>Turn classical thinking into quantum thinking.</h1><p>Learn quantum concepts, build circuits, run algorithms and ask QuantumTutor whenever you get stuck.</p><div><button className="primary" onClick={()=>go("learning")}>Start Learning →</button><button className="secondary" onClick={()=>go("designer")}>Open Circuit Builder</button></div></div><div className="orb"><em/><em/><b>Q</b></div></section><h2 className="sectiontitle">Everything you need to learn quantum</h2><div className="cards"><Card icon="◈" title="Learn Quantum" text="Master qubits, superposition, entanglement and core concepts." go={()=>go("learning")}/><Card icon="⌬" title="Circuit Builder" text="Build circuits using H, X, Z and CNOT gates." go={()=>go("designer")}/><Card icon="◇" title="Algorithms" text="Experiment with Grover and Deutsch-Jozsa." go={()=>go("algorithms")}/><Card icon="✦" title="AI Tutor" text="Ask questions and get beginner-friendly explanations." go={()=>go("ai")}/></div><div className="lower"><section className="panel"><small>YOUR PROGRESS</small><h3>Quantum Foundations <b>42%</b></h3><div className="progress"><i style={{width:"42%"}}/></div><span>2 of 5 modules completed</span></section><section className="panel"><small>QUICK ACCESS</small><h3>Pick up where you left off</h3><button className="quick" onClick={()=>go("designer")}>H · Build a Bell State →</button><button className="quick" onClick={()=>go("assessment")}>✓ · Take the concept quiz →</button></section></div></>}

function Card({icon,title,text,go}){return <button className="card" onClick={go}><b>{icon}</b><h3>{title}</h3><p>{text}</p><span>↗</span></button>}

function Learning({go}){const [sel,setSel]=useState(0);const l=lessons[sel];return <><Intro tag="LEARN" title="Quantum Foundations" text="Build your understanding one concept at a time."/><div className="learning"><aside className="panel modulelist"><small>MODULES</small>{lessons.map((x,i)=><button className={i===sel?"chosen":""} onClick={()=>setSel(i)} key={x[0]}><b>{x[0]}</b><span><strong>{x[1]}</strong><em>{x[2]}</em></span></button>)}</aside><section className="panel lesson"><b className="lessonicon">{l[4]}</b><small>MODULE {l[0]}</small><h2>{l[1]}</h2><p>{l[3]}</p><div className="tip"><strong>Try it yourself</strong><p>Open the circuit builder and experiment with this concept.</p><button className="primary" onClick={()=>go("designer")}>Open Circuit Builder →</button></div><div className="tip"><strong>💡 Learning tip</strong><p>Ask QuantumTutor to explain this topic with a simple example.</p></div></section></div></>}

function Designer({n,setN,grid,drop,remove,clear,simulate,showBloch,qiskit}){return <><Intro tag="CREATE" title="Circuit Builder" text="Build a circuit visually and send it to the Qiskit simulator."/><div className="builder"><section className="panel circuit"><div className="row"><div><small>QUANTUM CIRCUIT</small><h2>Design your circuit</h2></div><div className="selector">{[1,2,3].map(x=><button className={n===x?"sel":""} onClick={()=>setN(x)} key={x}>{x} qubit{x>1?"s":""}</button>)}</div></div><div className="toolbar"><small>GATES</small>{["h","x","z","cnot"].map(x=><div draggable onDragStart={e=>e.dataTransfer.setData("gateType",x)} key={x}>{x.toUpperCase()}</div>)}</div><div className="workspace">{Array.from({length:n}).map((_,q)=><div className="qrow" key={q}><b>q{q}</b><div className="wirearea"><i/>{Array.from({length:COLS}).map((_,c)=><button onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,q,c)} onClick={()=>remove(q,c)} className={grid[`${q}-${c}`]?"filled":""} key={c}>{symbol(grid[`${q}-${c}`])}</button>)}</div></div>)}</div><div className="actions"><button className="secondary" onClick={clear}>Clear</button><button className="primary" onClick={simulate}>Run Simulation →</button><button className="secondary" onClick={showBloch}>Bloch Vectors</button></div></section><section className="panel code"><div className="row"><div><small>QISKIT</small><h2>Generated code</h2></div><b>Python</b></div><SyntaxHighlighter language="python" style={vs}>{qiskit}</SyntaxHighlighter></section></div></>}

function Algorithms({result,run}){return <><Intro tag="EXPLORE" title="Quantum Algorithms" text="Run small demonstrations and inspect their measurement results."/><div className="algo"><section className="panel"><small>01</small><h2>Grover's Algorithm</h2><p>Search an unstructured space with quadratic query speedup.</p><button className="primary" onClick={()=>run(api.grover)}>Run Grover →</button></section><section className="panel"><small>02</small><h2>Deutsch-Jozsa</h2><p>Run the constant-oracle case.</p><button className="primary" onClick={()=>run(()=>api.dj(true))}>Run Constant →</button></section><section className="panel"><small>03</small><h2>Deutsch-Jozsa Balanced</h2><p>Run the balanced-oracle case.</p><button className="primary" onClick={()=>run(()=>api.dj(false))}>Run Balanced →</button></section></div>{result?.counts&&<section className="panel result"><small>LATEST RESULT</small><h2>Measurement counts</h2><div className="counts">{Object.entries(result.counts).map(([k,v])=><div key={k}><span>|{k}⟩</span><b>{v}</b><small>shots</small></div>)}</div></section>}</>}

function Visualization({result,bloch,n,grid}){const data=result?.counts?Object.entries(result.counts).map(([state,count])=>({state,count})):[];return <><Intro tag="EXPLORE" title="Visualization" text="Inspect measurement results and Bloch vectors."/>{!result&&!bloch?<section className="panel empty"><h2>No results yet</h2><p>Run a circuit or algorithm first.</p></section>:<div className="visual"><section className="panel chart"><small>MEASUREMENTS</small><h2>Measurement histogram</h2><ResponsiveContainer width="100%" height={300}><BarChart data={data}><XAxis dataKey="state"/><YAxis/><Tooltip/><Bar dataKey="count"/></BarChart></ResponsiveContainer></section>{bloch&&<section className="panel"><small>QUANTUM STATE</small><h2>Bloch vectors</h2><div className="blochs">{bloch.map(v=><Bloch key={v.qubit} v={v}/>)}</div></section>}<section className="panel"><small>CIRCUIT</small><h2>Current circuit</h2><p>{n} qubits · {Object.keys(grid).length} occupied cells</p></section></div>}</>}

function Bloch({v}){const s=170,c=85,r=65,x=c+v.x*r,y=c-v.z*r;return <div className="bloch"><svg width={s} height={s}><circle cx={c} cy={c} r={r} fill="none" stroke="#bcc5d5"/><line x1={c} y1="15" x2={c} y2="155" stroke="#d9dfe8"/><line x1="15" y1={c} x2="155" y2={c} stroke="#d9dfe8"/><line x1={c} y1={c} x2={x} y2={y} stroke="#5666f2" strokeWidth="3"/><circle cx={x} cy={y} r="6" fill="#5666f2"/></svg><b>Qubit {v.qubit}</b><small>x {v.x.toFixed(2)} · y {v.y.toFixed(2)} · z {v.z.toFixed(2)}</small></div>}

function Tutor({chat,setChat,reply,ask}){return <><Intro tag="AI TUTOR" title="Meet QuantumTutor" text="Ask questions in plain language and get step-by-step explanations."/><div className="tutor"><section className="panel chat"><div className="aihead"><b>✦</b><div><h2>QuantumTutor</h2><small>Beginner-friendly quantum assistant</small></div></div><div className="reply">✦ <span>{reply}</span></div><div className="examples">{["What is a qubit?","Why does H create superposition?","Explain CNOT simply."].map(x=><button onClick={()=>setChat(x)} key={x}>{x}</button>)}</div><div className="chatinput"><input value={chat} onChange={e=>setChat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} placeholder="Ask a quantum question..."/><button className="primary" onClick={ask}>Ask</button></div></section><section className="panel tips"><small>TRY ASKING</small><h3>Useful questions</h3><ul><li>Why does H create superposition?</li><li>What happens after H + CNOT?</li><li>What does a Bloch sphere represent?</li><li>How does Grover work?</li></ul></section></div></>}

function Quiz({qi,score,selected,answered,done,setQi,setScore,setSelected,setAnswered,setDone}){const q=questions[qi];if(done)return <><Intro tag="ASSESSMENT" title="Quiz Complete" text="Here is your quantum foundations result."/><section className="panel score"><b>{score}/{questions.length}</b><h2>Nice work!</h2><p>You answered {score} out of {questions.length} correctly.</p><button className="primary" onClick={()=>{setQi(0);setScore(0);setSelected(null);setAnswered(false);setDone(false)}}>Retake Quiz →</button></section></>;return <><Intro tag="ASSESSMENT" title="Quantum Foundations Quiz" text="Check your understanding of the core concepts."/><section className="panel quiz"><small>QUESTION {qi+1} OF {questions.length}</small><div className="progress"><i style={{width:`${((qi+1)/questions.length)*100}%`}}/></div><h2>{q[0]}</h2>{q[1].map((o,i)=><button disabled={answered} className={`option ${answered&&i===q[2]?"correct":""} ${answered&&i===selected&&i!==q[2]?"wrong":""}`} onClick={()=>{if(answered)return;setSelected(i);setAnswered(true);if(i===q[2])setScore(score+1)}} key={o}>{String.fromCharCode(65+i)} · {o}</button>)}{answered&&<div className="explain"><b>{selected===q[2]?"Correct!":"Not quite."}</b><p>{q[4]}</p><button className="primary" onClick={()=>{if(qi+1<questions.length){setQi(qi+1);setSelected(null);setAnswered(false)}else setDone(true)}}>{qi+1<questions.length?"Next Question →":"See Score →"}</button></div>}</section></>}

function Platform(){return <><Intro tag="PLATFORM" title="About ResQbit C → Q" text="Interactive learning, circuit construction, simulation, visualization and AI tutoring in one application."/><div className="tech"><section className="panel"><small>FRONTEND</small><h2>React</h2><p>Dashboard, circuit designer, learning modules and charts.</p></section><section className="panel"><small>BACKEND</small><h2>Flask + Qiskit</h2><p>REST endpoints for simulation and algorithm demos.</p></section><section className="panel"><small>QUANTUM ENGINE</small><h2>Qiskit Aer</h2><p>Statevector and shot-based simulation.</p></section><section className="panel"><small>AI</small><h2>Gemini</h2><p>QuantumTutor explains quantum computing concepts.</p></section></div></>}

export default App;
