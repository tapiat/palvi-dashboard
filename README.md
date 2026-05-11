# Dashboard Ejecutivo de Métricas B2B SaaS

## Decisiones técnicas

### Stack elegido

### React + TypeScript + Vite

Elegí este stack porque permite desarrollar rápido y mantener el código ordenado.

React facilita construir componentes reutilizables, TypeScript ayuda a evitar errores durante el desarrollo y Vite hace que el entorno sea mucho más rápido y liviano al momento de trabajar.


### Tailwind CSS

Usé Tailwind porque permite construir interfaces rápido sin tener que crear muchos archivos CSS separados.

También ayuda a mantener un diseño consistente en todo el dashboard.

### Recharts

Elegí Recharts porque me permitió crear gráficos de forma rápida y mantener una integración sencilla con React.

Para este proyecto necesitaba enfocarme más en el análisis de métricas que en construir gráficos complejos desde cero.

### Enfoque del dashboard

**Prioridad: Accionabilidad sobre completitud**

El Jefe de Ventas tiene 5 minutos antes de su reunión. No necesita ver todas las métricas—necesita saber dónde poner foco HOY.

El dashboard implementa:

1. **Sistema de alertas visible** - Problemas críticos arriba, en rojo, con contexto numérico
2. **Métricas de últimos 7 días destacadas** - Ventana de acción inmediata
3. **Funnel de conversión (30 días)** - Para identificar cuellos de botella estructurales  
4. **4 gráficos de tendencia** - Leads, deals ganados, tiempo de respuesta, deals estancados

**Lo que dejé fuera intencionalmente:**
- Métricas de tráfico detalladas (no es responsabilidad del Jefe de Ventas)
- Granularidad por día individual en las tarjetas (ruido vs señal)
- Análisis de soporte profundo (merece dashboard separado)

### Lógica de detección de problemas

La función `calculateAggregates` y el componente `Dashboard` implementan reglas de negocio:

**Alertas críticas:**
- Tiempo de respuesta > 45 min → Warning (objetivo: <30 min)
- Win rate < 30% → Danger  
- Deals estancados > 100 → Warning

**Indicadores visuales en tarjetas:**
- Win rate >= 40% → Verde
- Tiempo respuesta < 30 min → Verde
- Deals estancados < 80 → Verde

Estas reglas son inferidas del glosario y práctica B2B estándar. En producción, deberían ser configurables.

### Navegación entre datasets

El selector de datasets está siempre visible arriba a la derecha. Al cambiar:
- Toda la vista se recalcula con los datos del nuevo dataset usando `useMemo`
- Las alertas, métricas y gráficos responden al comportamiento específico de cada dataset
- Los umbrales de detección de problemas se aplican consistentemente

Cada dataset (A, B, C, D) tiene comportamiento diferente:
- Dataset A: Win rate 40.8%, alerta por deals estancados
- Dataset B: Win rate 24.6%, alerta por win rate crítico
- Dataset C: Win rate 47.0%, sin alertas críticas
- Dataset D: Win rate 27.7%, dos alertas (win rate + tiempo de respuesta)

### Estructura del código

```
src/
  App.tsx                 # Componente principal con toda la lógica
  data/
    metrics.json          # Datos de métricas
  index.css               # Directivas de Tailwind
  main.tsx                # Entry point
```

**Por qué esta estructura:**
- `useMemo` con dependencia en `dataset` recalcula automáticamente cuando cambia
- Funciones helper `sum()` y `avg()` centralizan lógica de agregación
- Todo en un componente para facilitar comprensión (para escalar se separaría)
- Un solo archivo de datos → source of truth clara

## Segunda iteración

**Qué agregaría próximamente:**

1. **Comparación de períodos** - "¿Cómo va esta semana vs la anterior?" es la pregunta natural después de ver los números actuales

2. **Drill-down por categoría** - Click en "Win rate bajo" → ver distribución de deals perdidos por razón, tamaño, industria

3. **Exportar reporte** - PDF de una página con los highlights, para compartir en Slack/email antes de reuniones

4. **Predicción de fin de mes** - Con los datos actuales, proyectar si van a cumplir la meta mensual (regresión lineal simple)

5. **Persistencia de vista preferida** - LocalStorage para recordar el dataset que el usuario revisa más frecuentemente

**Por qué no están ahora:**
- Compromiso tiempo/valor: estas features requieren 2-3x más tiempo de implementación
- El core value está entregado: el Jefe de Ventas ya puede responder "¿dónde pongo foco hoy?"
- Necesitaría feedback real de usuarios para priorizar correctamente entre estas opciones

## Instalación

```bash
# Instalar dependencias
npm install

# Correr en desarrollo
npm run dev
```

La aplicación corre en `http://localhost:5173`

Para producción:
```bash
npm run build
npm run preview
```

## Navegación

Usa los botones en la esquina superior derecha para cambiar entre datasets A, B, C y D.
Cada dataset muestra comportamiento diferente en las métricas y alertas.
