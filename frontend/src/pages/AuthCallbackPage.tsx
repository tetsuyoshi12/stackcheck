import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('処理中...')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('トークンがありません。トップに戻ります...')
      setTimeout(() => navigate('/'), 1500)
      return
    }

    setStatus('ログイン処理中...')
    login(token)
      .then(() => {
        setStatus('ログイン成功！リダイレクト中...')
        navigate('/')
      })
      .catch((err) => {
        setStatus(`エラー: ${err?.message || '不明なエラー'}`)
        setTimeout(() => navigate('/'), 2000)
      })
  }, [])

  return (
    <div className="flex flex-col justify-center items-center min-h-screen gap-3">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">{status}</p>
    </div>
  )
}
