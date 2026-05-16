import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Treemap, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell, LabelList,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { getDashboard } from '../api/client'
import type { DashboardData } from '../api/client'

// ヒートマップ用カラー
const heatColor = (count: number) => {
  if (count === 0) return '#ebedf0'
  if (count === 1) return '#9be9a8'
  if (count === 2) return '#40c463'
  if (count >= 3) return '#216e39'
  return '#ebedf0'
}

// 正答率ラベル
const accuracyLabel = (accuracy: number) => {
  if (accuracy >= 0.8) return '✅ 習熟'
  if (accuracy >= 0.5) return '📚 もう少し'
  return '⚠️ 要強化'
}

// ツリーマップのカスタムコンテンツ
const TreemapContent = (props: {
  x?: number; y?: number; width?: number; height?: number;
  name?: string; mastery_rate?: number; mastered_count?: number; total_count?: number
}) => {
  const { x = 0, y = 0, width = 0, height = 0, name, mastered_count, total_count } = props
  if (width < 30 || height < 20) return null
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="#dbeafe" stroke="#93c5fd" strokeWidth={1} rx={4} />
      {width > 60 && height > 30 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#1e40af" fontSize={11} fontWeight="600">
            {name}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#3b82f6" fontSize={10}>
            {mastered_count}/{total_count}
          </text>
        </>
      )}
    </g>
  )
}

export default function DashboardPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    getDashboard(token)
      .then(setData)
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [token])

  // 未ログイン
  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <p className="text-2xl">📊</p>
        <p className="text-gray-700 font-semibold">ダッシュボードを見るにはログインが必要です</p>
        <p className="text-gray-400 text-sm">Googleアカウントでログインすると学習データが記録されます</p>
        <button
          onClick={() => navigate('/')}
          className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          トップページへ
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-red-500">{error || 'データがありません'}</p>
      </div>
    )
  }

  // ヒートマップ用：90日を週ごとに分割
  const weeks: { date: string; count: number }[][] = []
  for (let i = 0; i < data.daily_activity.length; i += 7) {
    weeks.push(data.daily_activity.slice(i, i + 7))
  }

  // ツリーマップ用データ（recharts形式）
  const treemapData = data.skill_map.map((d) => ({
    name: d.category_name,
    size: Math.max(d.total_count, 1),
    mastered_count: d.mastered_count,
    total_count: d.total_count,
    mastery_rate: d.mastery_rate,
  }))

  // 横棒グラフ用データ（正答率%に変換）
  const barData = data.category_accuracy.map((d) => ({
    name: d.category_name,
    accuracy: Math.round(d.accuracy * 100),
    label: accuracyLabel(d.accuracy),
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
      <div>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4"
        >
          ← トップに戻る
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">ダッシュボード</h1>
        <p className="text-gray-400 text-sm">{user.name} さんの学習状況</p>
      </div>

      {/* ストリーク */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
        <span className="text-4xl">🔥</span>
        <div>
          <p className="text-3xl font-bold text-orange-500">
            {data.streak >= 90 ? '90日以上' : `${data.streak}日`}
          </p>
          <p className="text-gray-500 text-sm">連続学習ストリーク</p>
          {data.streak === 0 && (
            <p className="text-gray-400 text-xs mt-0.5">今日クイズを解いてストリークを始めよう！</p>
          )}
        </div>
      </div>

      {/* ① スキルマップ */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-1">スキルマップ</h2>
        <p className="text-xs text-gray-400 mb-4">ブロックの大きさ = カテゴリ内のトピック数 / 数字 = 習熟済み/全トピック</p>
        {treemapData.length === 0 ? (
          <p className="text-gray-400 text-sm">データがありません。クイズを解いてみましょう！</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <Treemap
              data={treemapData}
              dataKey="size"
              content={<TreemapContent />}
            />
          </ResponsiveContainer>
        )}
      </section>

      {/* ② カテゴリ別正答率 */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-1">カテゴリ別正答率</h2>
        <p className="text-xs text-gray-400 mb-4">正答率の高い順</p>
        {barData.length === 0 ? (
          <p className="text-gray-400 text-sm">データがありません。クイズを解いてみましょう！</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(barData.length * 44, 120)}>
            <BarChart data={barData} layout="vertical" margin={{ left: 16, right: 60 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}%`, '正答率']} />
              <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                {barData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.accuracy >= 80 ? '#22c55e' : entry.accuracy >= 50 ? '#f59e0b' : '#ef4444'}
                  />
                ))}
                <LabelList
                  dataKey="label"
                  position="right"
                  style={{ fontSize: 11, fill: '#6b7280' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* ③ 学習継続グラフ */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">学習継続グラフ（直近90日）</h2>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count}セッション`}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: heatColor(day.count) }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <span>少ない</span>
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="w-3 h-3 rounded-sm" style={{ backgroundColor: heatColor(n) }} />
          ))}
          <span>多い</span>
        </div>
      </section>
    </div>
  )
}
