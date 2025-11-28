# 🔧 Fix: Save/Update Workflow Error

## 🐛 El Problema Reportado

```
PUT http://localhost:8000/api/v1/workflows/4c274df7-431f-47b3-89e9-387e4eaf912d 400 (Bad Request)
```

Cuando intentabas guardar (actualizar) un workflow existente, fallaba con error 400.

---

## ✅ Cambios Realizados

### 1. Backend: Mejor Manejo de `graph_data`

**Archivo:** `backend/app/api/endpoints/workflows.py`

**Problema anterior:**
```python
# ❌ Asumía que graph_data siempre era un modelo Pydantic
compiled_code = compiler.compile(update_data["graph_data"].model_dump())
update_data["graph_data"] = update_data["graph_data"].model_dump()
```

**Solución:**
```python
# ✅ Verifica si es modelo o dict
graph_dict = update_data["graph_data"]
if hasattr(graph_dict, 'model_dump'):
    graph_dict = graph_dict.model_dump()

compiled_code = compiler.compile(graph_dict)
update_data["graph_data"] = graph_dict
```

**Además agregué logging:**
```python
print(f"📝 Update data received: {update_data.keys()}")
print(f"📊 Compiling graph with {len(graph_dict.get('nodes', []))} nodes")
print(f"✅ Compilation successful")
# O si falla:
print(f"❌ Compilation failed: {str(e)}")
```

---

### 2. Frontend: Validación de Datos

**Archivo:** `frontend/src/components/Toolbar.tsx`

**Problema:** ReactFlow puede agregar campos extra que no cumplen el schema Pydantic.

**Solución:** Validar y limpiar los datos antes de enviar:

```typescript
// ✅ Validar nodos - solo campos requeridos
const validatedNodes = nodes.map(node => ({
  id: node.id,
  type: node.type,
  position: node.position || { x: 0, y: 0 },
  data: node.data || {}
}))

// ✅ Validar edges - solo campos requeridos
const validatedEdges = edges.map(edge => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
  sourceHandle: edge.sourceHandle || null,
  targetHandle: edge.targetHandle || null,
  type: edge.type || null
}))

const validatedGraphData = {
  nodes: validatedNodes,
  edges: validatedEdges
}
```

**Logging mejorado:**
```typescript
console.log('💾 Saving workflow with graph data:', graphData)
console.log('📊 Nodes being saved:', nodes)
console.log('🔗 Edges being saved:', edges)
console.log('✅ Validated graph data:', validatedGraphData)
```

**Mejor manejo de errores:**
```typescript
onError: (error: any) => {
  console.error('❌ Save failed:', error)
  console.error('Error response:', error.response?.data)
  const errorMsg = error.response?.data?.detail || error.message || 'Unknown error'
  alert('Failed to save workflow: ' + errorMsg)
}
```

---

## 🧪 Cómo Probar

### 1. Refresca el navegador
```bash
Cmd + Shift + R  # Mac
Ctrl + Shift + R  # Windows
```

### 2. Carga un workflow existente
- Click **"Load"**
- Selecciona cualquier workflow (ej: "1" con ID `4c274df7-431f-47b3-89e9-387e4eaf912d`)
- Debería cargar correctamente

### 3. Modifica el workflow
- Agrega un nuevo nodo
- Mueve nodos
- Cambia configuraciones
- Conecta nodos

### 4. Guarda los cambios
- Click **"Save"**
- Abre la **consola del navegador** (F12)
- Deberías ver:

**Frontend logs:**
```
💾 Saving workflow with graph data: {...}
📊 Nodes being saved: [...]
🔗 Edges being saved: [...]
✅ Validated graph data: {...}
Updating existing workflow: 4c274df7-431f-47b3-89e9-387e4eaf912d
```

**Backend logs (en la terminal del backend):**
```
📝 Update data received: dict_keys(['name', 'graph_data'])
📊 Compiling graph with 4 nodes
✅ Compilation successful
```

### 5. Verifica el éxito
- ✅ Alert: "Workflow saved successfully!"
- ✅ No error 400
- ✅ Recarga el workflow para verificar que los cambios se guardaron

---

## 🔍 Debugging Si Aún Falla

### Ver logs completos del frontend
1. Abre consola (F12)
2. Click "Save"
3. Busca en la consola:
   - `❌ Save failed:` - Error del cliente
   - `Error response:` - Respuesta del servidor

### Ver logs completos del backend
1. Mira la terminal donde corre `uvicorn`
2. Busca:
   - `📝 Update data received:` - Qué datos llegaron
   - `📊 Compiling graph with X nodes` - Cuántos nodos se están compilando
   - `❌ Compilation failed:` - Error en la compilación
   - `Traceback` - Stack trace completo

### Probar manualmente con curl
```bash
# Ver el workflow actual
curl http://localhost:8000/api/v1/workflows/4c274df7-431f-47b3-89e9-387e4eaf912d

# Intentar actualizar
curl -X PUT http://localhost:8000/api/v1/workflows/4c274df7-431f-47b3-89e9-387e4eaf912d \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Update",
    "graph_data": {
      "nodes": [
        {
          "id": "1",
          "type": "trigger",
          "position": {"x": 100, "y": 100},
          "data": {"label": "Start", "message": "Hello"}
        }
      ],
      "edges": []
    }
  }'
```

---

## 📊 Causas Comunes del Error 400

1. **Nodos sin `position`**
   - ✅ Ahora se asigna `{x: 0, y: 0}` por defecto

2. **Nodos sin `data`**
   - ✅ Ahora se asigna `{}` por defecto

3. **Edges con campos inválidos**
   - ✅ Ahora solo se envían los campos requeridos

4. **Campos extra de ReactFlow**
   - ✅ La validación elimina campos no necesarios

5. **Error en la compilación del workflow**
   - ✅ Ahora se muestra el error exacto en el alert

---

## 🎯 Resultado Esperado

**Ahora puedes:**

1. ✅ **Crear** nuevos workflows
2. ✅ **Guardar** workflows nuevos
3. ✅ **Cargar** workflows existentes
4. ✅ **Modificar** workflows cargados
5. ✅ **Guardar cambios** en workflows existentes (UPDATE) ← **FIXED!**
6. ✅ **Ver errores claros** si algo falla

---

## 💡 Próximos Pasos

Si aún fallas guardando:

1. **Mándame los logs** de consola (frontend)
2. **Mándame los logs** de terminal (backend)
3. **Dime qué workflow** estás intentando guardar
4. **Dime qué cambios** hiciste antes de guardar

Con eso puedo identificar el problema exacto! 🚀
