from flask import Flask, request, jsonify
from flask_cors import CORS
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
from qiskit.quantum_info import Statevector, partial_trace, DensityMatrix
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()
app=Flask(__name__)
CORS(app)

KEY=os.getenv("GEMINI_API_KEY")
MODEL=os.getenv("GEMINI_MODEL","gemini-3.8-flash")
client=genai.Client(api_key=KEY) if KEY else None

def build_circuit(n,gates):
    qc=QuantumCircuit(n,n)
    for g in gates:
        if g["gate"]=="h": qc.h(g["qubit"])
        elif g["gate"]=="x": qc.x(g["qubit"])
        elif g["gate"]=="z": qc.z(g["qubit"])
        elif g["gate"]=="cx": qc.cx(g["control"],g["target"])
    return qc

@app.get("/health")
def health(): return jsonify({"status":"ok"})

@app.post("/simulate")
def simulate():
    d=request.get_json() or {}
    n=int(d.get("num_qubits",2)); gates=d.get("gates",[])
    qc=build_circuit(n,gates)
    sv=Statevector.from_instruction(qc)
    probs={str(k):float(v) for k,v in sv.probabilities_dict().items()}
    m=qc.copy(); m.measure(range(n),range(n))
    counts=AerSimulator().run(m,shots=1000).result().get_counts()
    return jsonify({"probabilities":probs,"counts":counts})

@app.post("/bloch")
def bloch():
    d=request.get_json() or {}
    n=int(d.get("num_qubits",2)); qc=build_circuit(n,d.get("gates",[]))
    sv=Statevector.from_instruction(qc); vectors=[]
    for q in range(n):
        others=[i for i in range(n) if i!=q]
        reduced=partial_trace(sv,others) if others else DensityMatrix(sv)
        rho=reduced.data
        vectors.append({"qubit":q,"x":float(2*rho[0,1].real),"y":float(-2*rho[0,1].imag),"z":float((rho[0,0]-rho[1,1]).real)})
    return jsonify({"bloch_vectors":vectors})

@app.post("/grover-simple")
def grover():
    qc=QuantumCircuit(2,2)
    qc.h([0,1]); qc.cz(0,1); qc.h([0,1]); qc.x([0,1]); qc.h(1); qc.cx(0,1); qc.h(1); qc.x([0,1]); qc.h([0,1]); qc.measure([0,1],[0,1])
    counts=AerSimulator().run(qc,shots=1000).result().get_counts()
    return jsonify({"counts":counts,"target":"11"})

@app.post("/deutsch-jozsa")
def deutsch_jozsa():
    d=request.get_json() or {}; constant=bool(d.get("is_constant",True))
    qc=QuantumCircuit(2,1); qc.x(1); qc.h([0,1])
    if not constant: qc.cx(0,1)
    qc.h(0); qc.measure(0,0)
    counts=AerSimulator().run(qc,shots=1000).result().get_counts()
    return jsonify({"counts":counts,"oracle_type":"constant" if constant else "balanced"})

@app.post("/chat")
def chat():
    d=request.get_json() or {}; msg=d.get("message","").strip()
    if not msg:return jsonify({"reply":"Please enter a question."}),400
    if not client:return jsonify({"reply":"Add GEMINI_API_KEY to backend/.env and restart the backend."})
    circuit=d.get("circuit")
    prompt=f"""You are QuantumTutor, a beginner-friendly quantum computing tutor.
Explain clearly and accurately. Use simple language first and technical detail when useful.
If a circuit is supplied, explain it gate by gate.

User question:
{msg}

Current circuit context:
{circuit}
"""
    try:
        response=client.models.generate_content(model=MODEL,contents=prompt)
        return jsonify({"reply":response.text})
    except Exception as e:
        return jsonify({"reply":f"AI tutor error: {e}"}),500

if __name__=="__main__":
    app.run(debug=True,port=5000)
