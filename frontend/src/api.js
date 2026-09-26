const BASE=process.env.REACT_APP_API_URL||"http://127.0.0.1:5000";
async function req(path,options={}){const r=await fetch(BASE+path,{headers:{"Content-Type":"application/json"},...options});const d=await r.json();if(!r.ok)throw Error(d.reply||"Request failed");return d}
export const api={
simulate:(num_qubits,gates)=>req("/simulate",{method:"POST",body:JSON.stringify({num_qubits,gates})}),
bloch:(num_qubits,gates)=>req("/bloch",{method:"POST",body:JSON.stringify({num_qubits,gates})}),
grover:()=>req("/grover-simple",{method:"POST",body:JSON.stringify({target:"11"})}),
dj:(constant)=>req("/deutsch-jozsa",{method:"POST",body:JSON.stringify({is_constant:constant})}),
chat:(message,circuit)=>req("/chat",{method:"POST",body:JSON.stringify({message,circuit})})
};
