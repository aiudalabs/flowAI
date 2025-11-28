# 🐛 Debug WebSocket Issue

## El Problema

- Ejecución termina en backend ✅
- Panel de logs aparece ✅
- Pero dice "No logs yet" ❌
- WebSocket no está recibiendo mensajes

## 🔍 Cómo Debuggear

### 1. Reinicia el Backend

El código del WebSocket cambió, necesitas reiniciar:

```bash
# En la terminal del backend, presiona Ctrl+C
# Luego:
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### 2. Refresca el Frontend

```bash
# En el navegador
Cmd + Shift + R (Mac)
Ctrl + Shift + R (Windows)
```

### 3. Ejecuta el Workflow de Nuevo

1. Click en **"Execute"**
2. **Abre la consola del navegador** (F12)
3. Mira los logs

### 4. Qué Deberías Ver

**En la consola del navegador:**
```
Connecting to WebSocket: ws://localhost:8000/api/v1/executions/ws/xxx
✅ WebSocket connected to: ws://...
📨 WebSocket message received: {"type":"status",...}
📦 Parsed data: {type: "status", ...}
📊 Status update: running
📨 WebSocket message received: {"type":"log",...}
📝 Log received: {node_id: "node_0", message: "..."}
...
```

**En la terminal del backend:**
```
🔌 WebSocket connection request for execution: xxx
✅ WebSocket accepted for execution: xxx
📊 Execution status: completed
📝 Found 10 logs for execution xxx
📤 Sent log: Workflow execution started...
📤 Sent log: Executing node: trigger...
...
✅ Execution already completed, sending complete message
🔒 Closing WebSocket for completed execution
```

## 🚨 Si NO Ves Esto

### Problema 1: WebSocket No Se Conecta

**Síntoma:** Console muestra error de WebSocket

**Solución:**
```bash
# Verifica que el backend esté corriendo
curl http://localhost:8000/api/v1/health

# Debería responder:
{"status":"healthy","database":"connected","redis":"connected"}
```

### Problema 2: Backend No Imprime Logs de WebSocket

**Síntoma:** No ves los emojis 🔌 ✅ 📊 en la terminal del backend

**Solución:**
1. Backend no se reinició - hazlo de nuevo
2. WebSocket está en ruta diferente - verifica la URL

### Problema 3: Frontend Recibe Mensajes Pero No Los Muestra

**Síntoma:** Consola muestra logs pero el panel sigue vacío

**Solución:**
Verifica que `addLog` se esté llamando:

```javascript
// En consola del navegador, ejecuta:
window.location.reload()
```

## 🧪 Test Manual del WebSocket

Puedes probar el WebSocket directamente desde el navegador:

```javascript
// En la consola del navegador (F12):

// 1. Obtén un execution_id de una ejecución reciente
// Mira los logs de backend o la consola

// 2. Prueba la conexión
const ws = new WebSocket('ws://localhost:8000/api/v1/executions/ws/TU-EXECUTION-ID-AQUI')

ws.onopen = () => console.log('✅ Connected!')
ws.onmessage = (e) => console.log('📨 Message:', JSON.parse(e.data))
ws.onerror = (e) => console.error('❌ Error:', e)
ws.onclose = () => console.log('🔒 Closed')
```

**Deberías ver:**
```
✅ Connected!
📨 Message: {type: "status", status: "completed", execution_id: "..."}
📨 Message: {type: "log", log: {message: "Workflow execution started", ...}}
📨 Message: {type: "log", log: {message: "Executing node: trigger", ...}}
...
📨 Message: {type: "complete", status: "completed", output: {...}}
🔒 Closed
```

## 🎯 Solución Rápida

Si nada funciona, haz un reset completo:

```bash
# 1. Para todo
pkill -f uvicorn
# Ctrl+C en terminal de frontend

# 2. Reinicia infraestructura
docker-compose restart

# 3. Espera 5 segundos
sleep 5

# 4. Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# 5. En otra terminal - Frontend
cd frontend
npm run dev

# 6. Refresca navegador (Cmd+Shift+R)

# 7. Ejecuta de nuevo
```

## 📝 Checklist de Debug

- [ ] Backend reiniciado después del cambio de código
- [ ] Frontend refrescado (hard refresh)
- [ ] Consola del navegador abierta (F12)
- [ ] Terminal del backend visible
- [ ] Workflow guardado antes de ejecutar
- [ ] Click en Execute
- [ ] Verificar logs en ambos lados (navegador + terminal)

## 💡 Lo Que Cambié

1. **Backend WebSocket ahora:**
   - Imprime logs detallados con emojis
   - Envía TODOS los logs inmediatamente al conectar
   - Maneja el caso de "ya completado"
   - Solo envía logs nuevos en cada poll

2. **Frontend ahora:**
   - Imprime cada mensaje WebSocket en consola
   - Muestra qué tipo de mensaje recibió
   - Más fácil de debuggear

## 🚀 Después de Arreglar

Una vez que veas los logs en el panel:
- Los nodos se iluminarán (amarillo → verde)
- El panel mostrará todos los logs
- Verás exactamente qué hizo cada nodo

¡Pruébalo de nuevo después de reiniciar todo!
