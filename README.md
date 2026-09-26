# ResQbit C → Q

Interactive AI-based quantum learning platform.

## Features
- Modern React dashboard
- Quantum learning modules
- Drag/drop H, X, Z and CNOT circuit builder
- Qiskit code generation
- Qiskit Aer simulation
- Measurement histogram
- Bloch-vector visualization
- Grover and Deutsch-Jozsa demos
- Gemini AI tutor
- Quantum concepts quiz

## Run backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python app.py
```

## Run frontend
```powershell
cd frontend
npm install
npm start
```

Backend: http://127.0.0.1:5000
Frontend: http://localhost:3000
