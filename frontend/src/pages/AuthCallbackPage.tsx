import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      login(token)
        .then(() => navigate('/'))
        .catch(() => navigate('/'))
    } else {
      navigate('/')
    }
  }, [])

  return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-500">ログイン処理中...</p>
    </div>
  )
}
