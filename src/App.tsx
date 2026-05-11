import { useState, useMemo } from 'react'
import metricsData from './data/metrics.json'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function App() {
  const [selectedDataset, setSelectedDataset] = useState('A')

  const dataset = metricsData[selectedDataset as keyof typeof metricsData]

  // Calcular métricas agregadas de últimos 7 y 30 días
  const metrics = useMemo(() => {
    const last7Days = dataset.days.slice(-7)
    const last30Days = dataset.days.slice(-30)

    // Helper para sumar métricas
    const sum = (days: any[], key: string) => 
      days.reduce((acc, d) => acc + (d.metrics[key] || 0), 0)

    // Helper para promediar métricas (ignorando nulls)
    const avg = (days: any[], key: string) => {
      const values = days
        .map(d => d.metrics[key])
        .filter(v => v !== null && v !== undefined)
      return values.length > 0 
        ? values.reduce((a, b) => a + b, 0) / values.length 
        : 0
    }

    // === MÉTRICAS DE ÚLTIMOS 7 DÍAS ===
    const dealsWon7 = sum(last7Days, 'deals_won')
    const dealsLost7 = sum(last7Days, 'deals_lost')
    const totalClosed7 = dealsWon7 + dealsLost7
    const winRate7 = totalClosed7 > 0 ? (dealsWon7 / totalClosed7) * 100 : 0

    const leadsCreated7 = sum(last7Days, 'leads_created')
    const leadsQualified7 = sum(last7Days, 'leads_qualified')
    const qualificationRate7 = leadsCreated7 > 0 
      ? (leadsQualified7 / leadsCreated7) * 100 
      : 0

    const avgResponseTime7 = avg(last7Days, 'avg_response_time_min')
    const staleDeals = last7Days[last7Days.length - 1]?.metrics.stale_deals || 0

    const supportTickets7 = sum(last7Days, 'support_tickets_opened')
    const avgResolution7 = avg(last7Days, 'support_avg_resolution_hours')

    // === MÉTRICAS DE ÚLTIMOS 30 DÍAS (FUNNEL) ===
    const traffic30 = sum(last30Days, 'traffic')
    const leadsCreated30 = sum(last30Days, 'leads_created')
    const leadsQualified30 = sum(last30Days, 'leads_qualified')
    const dealsCreated30 = sum(last30Days, 'deals_created')
    const dealsWon30 = sum(last30Days, 'deals_won')
    const dealsLost30 = sum(last30Days, 'deals_lost')

    const qualificationRate30 = leadsCreated30 > 0 
      ? (leadsQualified30 / leadsCreated30) * 100 
      : 0
    const conversionRate30 = leadsQualified30 > 0 
      ? (dealsCreated30 / leadsQualified30) * 100 
      : 0
    const winRate30 = dealsWon30 + dealsLost30 > 0 
      ? (dealsWon30 / (dealsWon30 + dealsLost30)) * 100 
      : 0

    // === SISTEMA DE ALERTAS ===
    const alerts = []

    if (avgResponseTime7 > 45) {
      alerts.push({
        type: 'warning',
        message: `⚠️ Tiempo de respuesta alto: ${avgResponseTime7.toFixed(1)} min (objetivo: <30 min)`
      })
    }

    if (winRate7 < 30) {
      alerts.push({
        type: 'danger',
        message: `🚨 Win rate crítico: ${winRate7.toFixed(1)}% (requiere atención inmediata)`
      })
    }

    if (staleDeals > 100) {
      alerts.push({
        type: 'warning',
        message: `⚠️ ${staleDeals} deals estancados >60 días (revisar pipeline)`
      })
    }

    return {
      last7: {
        winRate: winRate7,
        dealsWon: dealsWon7,
        dealsLost: dealsLost7,
        leadsCreated: leadsCreated7,
        leadsQualified: leadsQualified7,
        qualificationRate: qualificationRate7,
        avgResponseTime: avgResponseTime7,
        staleDeals,
        supportTickets: supportTickets7,
        avgResolution: avgResolution7,
      },
      last30: {
        traffic: traffic30,
        leadsCreated: leadsCreated30,
        leadsQualified: leadsQualified30,
        dealsCreated: dealsCreated30,
        dealsWon: dealsWon30,
        dealsLost: dealsLost30,
        qualificationRate: qualificationRate30,
        conversionRate: conversionRate30,
        winRate: winRate30,
      },
      alerts
    }
  }, [dataset])

  // Datos para gráficos (últimos 30 días solamente)
  const chartData = useMemo(() => {
    return dataset.days.slice(-30).map((day) => ({
      date: new Date(day.date).toLocaleDateString('es-CL', { 
        month: 'short', 
        day: 'numeric' 
      }),
      leads: day.metrics.leads_created,
      deals_won: day.metrics.deals_won,
      response_time: day.metrics.avg_response_time_min,
      stale_deals: day.metrics.stale_deals,
    }))
  }, [dataset])

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-5xl font-bold text-blue-600 mb-2">
              Reporte Ejecutivo de Ventas
            </h1>
            <p className="text-gray-500 text-lg">
              {new Date(dataset.metadata.start_date).toLocaleDateString('es-CL')} - {' '}
              {new Date(dataset.metadata.end_date).toLocaleDateString('es-CL')} • {' '}
              {dataset.metadata.days} días
            </p>
          </div>

          {/* Dataset Selector */}
          <div className="flex gap-4">
            {Object.keys(metricsData).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedDataset(key)}
                className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 shadow-sm ${
                  selectedDataset === key
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
              >
                Dataset {key}
              </button>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <p className="text-sm text-blue-900">
            <strong>Vista rápida:</strong> Este dashboard prioriza métricas de acción inmediata. 
            Las alertas en rojo requieren atención hoy.
          </p>
        </div>
      </div>

      {/* Sistema de Alertas Críticas */}
      {metrics.alerts.length > 0 && (
        <div className="mb-10 bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
          <h3 className="font-bold text-red-900 mb-3 text-xl">
            🚨 Requiere Atención Inmediata
          </h3>
          <ul className="space-y-2">
            {metrics.alerts.map((alert, i) => (
              <li key={i} className="text-red-800 font-medium text-lg">
                {alert.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Métricas Clave - Últimos 7 días */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          📊 Métricas Clave (últimos 7 días)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Win Rate */}
          <div
            className={`rounded-2xl shadow p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
              metrics.last7.winRate >= 40
                ? 'bg-green-50'
                : metrics.last7.winRate >= 30
                ? 'bg-yellow-50'
                : 'bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm text-gray-600 font-medium">
                Win Rate
              </h2>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                metrics.last7.winRate >= 40
                  ? 'bg-green-200 text-green-800'
                  : 'bg-red-200 text-red-800'
              }`}>
                {metrics.last7.winRate >= 40 ? '✓ Bueno' : '⚠ Bajo'}
              </span>
            </div>
            <p className="text-4xl font-bold text-gray-800 mb-3">
              {metrics.last7.winRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">
              {metrics.last7.dealsWon} ganados / {metrics.last7.dealsWon + metrics.last7.dealsLost} cerrados
            </p>
          </div>

          {/* Leads Calificados */}
          <div className="bg-white rounded-2xl shadow p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm text-gray-600 font-medium">
                Leads Calificados
              </h2>
            </div>
            <p className="text-4xl font-bold text-gray-800 mb-3">
              {metrics.last7.leadsQualified}
            </p>
            <p className="text-sm text-gray-600">
              {metrics.last7.qualificationRate.toFixed(0)}% de {metrics.last7.leadsCreated} leads creados
            </p>
          </div>

          {/* Tiempo de Respuesta */}
          <div
            className={`rounded-2xl shadow p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
              metrics.last7.avgResponseTime < 30
                ? 'bg-green-50'
                : metrics.last7.avgResponseTime < 45
                ? 'bg-yellow-50'
                : 'bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm text-gray-600 font-medium">
                Tiempo de Respuesta
              </h2>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                metrics.last7.avgResponseTime < 30
                  ? 'bg-green-200 text-green-800'
                  : metrics.last7.avgResponseTime < 45
                  ? 'bg-yellow-200 text-yellow-800'
                  : 'bg-red-200 text-red-800'
              }`}>
                {metrics.last7.avgResponseTime < 30 ? '✓ Rápido' : '⚠ Lento'}
              </span>
            </div>
            <p className="text-4xl font-bold text-gray-800 mb-3">
              {metrics.last7.avgResponseTime.toFixed(0)} <span className="text-xl">min</span>
            </p>
            <p className="text-sm text-gray-600">
              Promedio de respuesta a leads
            </p>
          </div>

          {/* Deals Estancados */}
          <div
            className={`rounded-2xl shadow p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
              metrics.last7.staleDeals < 80
                ? 'bg-green-50'
                : metrics.last7.staleDeals < 100
                ? 'bg-yellow-50'
                : 'bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm text-gray-600 font-medium">
                Deals Estancados
              </h2>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                metrics.last7.staleDeals < 80
                  ? 'bg-green-200 text-green-800'
                  : 'bg-red-200 text-red-800'
              }`}>
                {metrics.last7.staleDeals < 80 ? '✓ Bajo' : '⚠ Alto'}
              </span>
            </div>
            <p className="text-4xl font-bold text-gray-800 mb-3">
              {metrics.last7.staleDeals}
            </p>
            <p className="text-sm text-gray-600">
              &gt;60 días sin cerrar
            </p>
          </div>
        </div>
      </div>

      {/* Funnel de Conversión - Últimos 30 días */}
      <div className="bg-white rounded-2xl shadow p-6 mb-10">
        <h2 className="text-2xl font-bold mb-6">
          🎯 Funnel de Conversión (últimos 30 días)
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700 text-lg">Tráfico</span>
            <span className="text-3xl font-bold text-gray-900">
              {metrics.last30.traffic.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between pl-6 border-l-4 border-blue-300">
            <span className="font-semibold text-gray-700 text-lg">→ Leads creados</span>
            <span className="text-3xl font-bold text-blue-600">
              {metrics.last30.leadsCreated}
            </span>
          </div>

          <div className="flex items-center justify-between pl-12 border-l-4 border-blue-400">
            <span className="font-semibold text-gray-700 text-lg">→ Leads calificados</span>
            <span className="text-3xl font-bold text-blue-700">
              {metrics.last30.leadsQualified}{' '}
              <span className="text-sm text-gray-500">
                ({metrics.last30.qualificationRate.toFixed(0)}%)
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between pl-16 border-l-4 border-purple-400">
            <span className="font-semibold text-gray-700 text-lg">→ Deals creados</span>
            <span className="text-3xl font-bold text-purple-600">
              {metrics.last30.dealsCreated}{' '}
              <span className="text-sm text-gray-500">
                ({metrics.last30.conversionRate.toFixed(0)}%)
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between pl-20 border-l-4 border-green-400">
            <span className="font-semibold text-gray-700 text-lg">→ Deals ganados</span>
            <span className="text-3xl font-bold text-green-600">
              {metrics.last30.dealsWon}{' '}
              <span className="text-sm text-gray-500">
                ({metrics.last30.winRate.toFixed(0)}% win rate)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos de Tendencias - Últimos 30 días */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">
          📈 Tendencias (últimos 30 días)
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Leads Creados */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">
              Leads Creados
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }} 
                    stroke="#6b7280"
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Leads"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deals Ganados */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">
              Deals Ganados
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }} 
                    stroke="#6b7280"
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="deals_won"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Deals ganados"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tiempo de Respuesta */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">
              Tiempo de Respuesta
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }} 
                    stroke="#6b7280"
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="response_time"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    dot={{ fill: '#F59E0B', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Minutos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deals Estancados */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">
              Deals Estancados (&gt;60 días)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }} 
                    stroke="#6b7280"
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="stale_deals"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={{ fill: '#EF4444', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Estancados"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Soporte - Últimos 7 días */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-6">
          🎧 Soporte (últimos 7 días)
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-xl p-5">
            <p className="text-sm text-blue-600 mb-2 font-medium">
              Tickets Abiertos
            </p>
            <p className="text-3xl font-bold text-blue-700">
              {metrics.last7.supportTickets}
            </p>
          </div>

          <div className="bg-purple-50 rounded-xl p-5">
            <p className="text-sm text-purple-600 mb-2 font-medium">
              Tiempo Promedio de Resolución
            </p>
            <p className="text-3xl font-bold text-purple-700">
              {metrics.last7.avgResolution.toFixed(1)} hrs
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
